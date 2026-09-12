from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from core.models import Submission, TestTask, TestAssignment, User
from core.types.assignment_status import AssignmentStatus
from core.types.submission_status import SubmissionStatus
from core.schemas.submission import SubmissionCreate
from datetime import datetime, timezone

from core.services.student_assignment_service import (
    get_progress,
    require_open,
)

async def create_student_submition(
        session: AsyncSession,
        student_id: int, 
        assignment: TestAssignment,
        submission_in: SubmissionCreate
) -> Submission:
    assignment, progress = await get_progress(
        session,
        assignment.id,
        student_id,
        lock=True,
    )

    require_open(assignment, progress)

    task_in_test = await session.execute(
        select(TestTask).where(
            TestTask.test_id == assignment.test_id,
            TestTask.task_id == submission_in.task_id,
        )
    )

    if task_in_test.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, \
            detail="This task is not part of the assigned test",
        )

    existing = await session.execute(
        select(Submission).where(
            Submission.test_assignment_id == assignment.id, 
            Submission.task_id == submission_in.task_id,
            Submission.student_id == student_id
        )
    )

    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already submitted an answer for this task",
        )

    submission = Submission(
        student_id=student_id,
        answer_text=submission_in.answer_text,
        status=SubmissionStatus.PENDING,
        task_id=submission_in.task_id,
        test_assignment_id=assignment.id
    )

    session.add(submission)

    if progress.status == AssignmentStatus.ASSIGNED:
        progress.status = AssignmentStatus.IN_PROGRESS
        progress.started_at = datetime.now(timezone.utc)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()

        original = getattr(exc.orig, "__cause__", None)
        constraint_name = getattr(
            original,
            "constraint_name",
            None,
        )

        if constraint_name != (
            "uq_submission_student_assignment_task"
        ):
            raise

        raise HTTPException(
            status_code=409,
            detail="You have already submitted an answer for this task",
        ) from exc
    await session.refresh(submission)
    await session.refresh(submission, attribute_names=["analys"])
    return submission

async def get_student_submission(
        session: AsyncSession,
        student_id: int, 
        submission_id: int
) -> Submission:
    result = await session.execute(
        select(Submission)
        .options(selectinload(Submission.analys))
        .where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()

    if submission is None or submission.student_id != student_id:
        raise  HTTPException(status.HTTP_404_NOT_FOUND, detail="Submission not found")

    return submission