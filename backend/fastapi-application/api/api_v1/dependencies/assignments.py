from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.api_v1.dependencies.authentification.roles import (
    get_current_student,
)
from core.models import TestAssignment, User, db_helper
from core.services.student_assignment_service import get_progress


async def get_eligible_assigment(
    assignment_id: int,
    student: Annotated[User, Depends(get_current_student)],
    session: Annotated[
        AsyncSession,
        Depends(db_helper.session_getter),
    ],
) -> TestAssignment:
    assignment, _ = await get_progress(
        session,
        assignment_id,
        student.id,
    )

    return assignment