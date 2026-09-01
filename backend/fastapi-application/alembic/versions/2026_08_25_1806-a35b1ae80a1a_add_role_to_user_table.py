"""add role to user table

Revision ID: a35b1ae80a1a
Revises: 9ed7bfe74e0e
Create Date: 2026-08-25 18:06:52.516938

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a35b1ae80a1a"
down_revision: Union[str, None] = "9ed7bfe74e0e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    user_role_enum = sa.Enum("STUDENT", "TEACHER", "ADMIN", name="user_role_enum")
    user_role_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "users",
        sa.Column(
            "role",
            user_role_enum,
            nullable=False,
            server_default="STUDENT",  # подставьте нужное значение по умолчанию
        ),
    )

    # если дефолт на уровне БД не нужен постоянно — уберите его после заполнения данных:
    op.alter_column("users", "role", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "role")
    sa.Enum(name="user_role_enum").drop(op.get_bind(), checkfirst=True)