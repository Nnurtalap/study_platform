from datetime import datetime, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper, User, TestAssignment, Enrollment
from core.types.assignment_status import AssignmentStatus
from api.api_v1.dependencies.authentification.roles import get_current_student


async def get_eligible_assigment(
        assignment_id: int, 
        student: Annotated[User, Depends(get_current_student)],
        session: Annotated[AsyncSession, Depends(db_helper.session_getter)]
) -> TestAssignment:
    result = await session.execute(
        select(TestAssignment).where(
            TestAssignment.id == assignment_id
        )
    )
    assignment = result.scalar_one_or_none()

    if assignment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    is_direct = assignment.student_id == student.id
    is_via_group = False
    if not is_direct and assignment.group_id is not None:
        enrolment_result = await session.execute(
            select(Enrollment).where(
                Enrollment.group_id == assignment.group_id,
                Enrollment.student_id == student.id
            )
        )
        is_via_group = enrolment_result.scalar_one_or_none() is not None

    if not (is_direct or is_via_group):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    if assignment.status == AssignmentStatus.COMPLETED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Assignment already completed")

    if assignment.due_date is not None and datetime.now(timezone.utc) > assignment.due_date:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Assignment deadline has passed")

    return assignment