"""backfill legacy assignment students

Revision ID: 833a991a2e1a
Revises: 2ee893b10b66
Create Date: 2026-09-12 16:20:19.237236

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '833a991a2e1a'
down_revision: Union[str, None] = '2ee893b10b66'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            WITH legacy_assignments AS (
                SELECT a.*
                FROM test_assignments AS a
                WHERE a.id IN (1, 2, 3)
                  AND NOT EXISTS (
                      SELECT 1
                      FROM assignment_students AS p
                      WHERE p.assignment_id = a.id
                  )
            ),
            participants AS (
                -- Личные назначения.
                SELECT
                    a.id AS assignment_id,
                    a.student_id
                FROM legacy_assignments AS a
                WHERE a.student_id IS NOT NULL

                UNION

                -- Участники старого группового назначения.
                SELECT
                    a.id AS assignment_id,
                    e.student_id
                FROM legacy_assignments AS a
                JOIN enrollments AS e
                    ON e.group_id = a.group_id

                UNION

                -- Сохраняем доступ авторов существующих ответов,
                -- даже если они уже вышли из группы.
                SELECT
                    a.id AS assignment_id,
                    s.student_id
                FROM legacy_assignments AS a
                JOIN submissions AS s
                    ON s.test_assignment_id = a.id
            )
            INSERT INTO assignment_students (
                assignment_id,
                student_id,
                status,
                started_at,
                completed_at
            )
            SELECT
                p.assignment_id,
                p.student_id,
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM submissions AS s
                        WHERE s.test_assignment_id = p.assignment_id
                          AND s.student_id = p.student_id
                    )
                    THEN 'in_progress'::assignment_status
                    ELSE 'assigned'::assignment_status
                END,
                NULL,
                NULL
            FROM participants AS p
            ON CONFLICT (assignment_id, student_id)
            DO NOTHING
            """
        )
    )


def downgrade() -> None:
    raise RuntimeError(
        "This data migration cannot be reversed automatically. "
        "Restored participants may already have new activity."
    )