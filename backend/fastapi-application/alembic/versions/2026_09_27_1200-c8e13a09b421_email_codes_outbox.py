"""Email codes, outbox, auth limits and unique emails."""

from alembic import op
import sqlalchemy as sa


revision = "c8e13a09b421"
down_revision = "833a991a2e1a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Проверяем существующих пользователей до создания индекса.
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT lower(email)
                FROM users
                GROUP BY lower(email)
                HAVING count(*) > 1
            ) THEN
                RAISE EXCEPTION
                    'Resolve users with duplicate case-insensitive emails before migration';
            END IF;
        END
        $$;
        """
    )

    op.create_index(
        "uq_users_email_lower",
        "users",
        [sa.text("lower(email)")],
        unique=True,
    )

    op.create_table(
        "email_challenges",
        sa.Column(
            "id",
            sa.Uuid(),
            primary_key=True,
        ),
        sa.Column(
            "slot",
            sa.String(64),
            nullable=False,
            unique=True,
        ),
        sa.Column("purpose", sa.String(24), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
        ),
        sa.Column("credential_tag", sa.String(64)),
        sa.Column("code_digest", sa.String(64), nullable=False),
        sa.Column("generation", sa.Integer(), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column("consumed_at", sa.DateTime(timezone=True)),
    )

    op.create_index(
        "ix_email_challenges_user_id",
        "email_challenges",
        ["user_id"],
    )
    op.create_index(
        "ix_email_challenges_expires_at",
        "email_challenges",
        ["expires_at"],
    )

    op.create_table(
        "email_outbox",
        sa.Column(
            "id",
            sa.Uuid(),
            primary_key=True,
        ),
        sa.Column(
            "challenge_id",
            sa.Uuid(),
            sa.ForeignKey(
                "email_challenges.id",
                ondelete="CASCADE",
            ),
        ),
        sa.Column("generation", sa.Integer()),
        sa.Column("encrypted_payload", sa.Text()),
        sa.Column("state", sa.String(16), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column(
            "available_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
        sa.Column("error_code", sa.String(64)),
    )

    op.create_index(
        "ix_email_outbox_challenge_id",
        "email_outbox",
        ["challenge_id"],
    )
    op.create_index(
        "ix_email_outbox_available_at",
        "email_outbox",
        ["available_at"],
    )

    op.create_table(
        "auth_rate_buckets",
        sa.Column(
            "key",
            sa.String(64),
            primary_key=True,
        ),
        sa.Column(
            "window",
            sa.BigInteger(),
            primary_key=True,
        ),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_auth_rate_buckets_expires_at",
        "auth_rate_buckets",
        ["expires_at"],
    )


def downgrade() -> None:
    op.drop_table("auth_rate_buckets")
    op.drop_table("email_outbox")
    op.drop_table("email_challenges")
    op.drop_index(
        "uq_users_email_lower",
        table_name="users",
    )