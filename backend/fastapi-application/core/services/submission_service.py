from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from fastapi import Depends, HTTPException, status
from typing import (
    Annotated,
)


from core.models import Submission, TestTask, TestAssignment, User, AssignmentStudent, SubmissionGrade
from core.types.assignment_status import AssignmentStatus
from core.types.submission_status import SubmissionStatus
from core.schemas.submission import SubmissionCreate, SubmissionGradeCreate
from datetime import datetime, timezone
from api.api_v1.dependencies.authentification.roles import (
    get_current_teacher,
)
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
        student_id,
        assignment.id,
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
    await session.refresh(submission, attribute_names=["analys", "grade"])
    return submission

async def get_student_submission(
        session: AsyncSession,
        student_id: int, 
        submission_id: int
) -> Submission:
    result = await session.execute(
        select(Submission)
        .options(selectinload(Submission.analys),
                 selectinload(Submission.grade))
        .where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()

    if submission is None or submission.student_id != student_id:
        raise  HTTPException(status.HTTP_404_NOT_FOUND, detail="Submission not found")
    
    return submission

async def get_answer_and_check_owner(
        session: AsyncSession, 
        assignment_id: int, 
        teacher_id: int,
        limit: int = 50,
        offset: int = 0
) -> list[Submission]:
    assignment = await session.scalar(
        select(TestAssignment)
        .where(
            TestAssignment.assigned_by_id == teacher_id,
            TestAssignment.id == assignment_id
        )
    )

    if assignment is None:
        raise HTTPException(status_code=404, detail='assignment is not found')
    
    answers = await session.scalars(
        select(Submission)
        .options(selectinload(Submission.grade))
        .where(Submission.test_assignment_id == assignment.id)
        .limit(limit)
        .offset(offset)
        .order_by(Submission.id)
    )

    return list(answers)

async def grade_submission(
        session: AsyncSession, 
        submission_id: int, 
        teacher_id: int, 
        data: SubmissionGradeCreate
) -> SubmissionGrade: 
    submission = await session.scalar(
        select(Submission)
        .where(Submission.id == submission_id)
        .with_for_update()
    )

    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='submission not found'
        )

    test_assignment = await session.scalar(
        select(TestAssignment)
        .where(
            TestAssignment.id == submission.test_assignment_id,
            TestAssignment.assigned_by_id == teacher_id
        )
    )

    if test_assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='submission not found'
        )

    test_task = await session.scalar(
        select(TestTask)
        .where(
            TestTask.task_id == submission.task_id,
            TestTask.test_id == test_assignment.test_id
        )
    )

    if test_task is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Submission task is not part of the assigned test"
        )

    if test_task.points < data.score:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Score exceeds maximum points"
        )

    submission_grade = await session.scalar(
        select(SubmissionGrade)
        .where(SubmissionGrade.submission_id == submission_id)
    )

    if submission_grade is None:
        submission_grade = SubmissionGrade(
            submission_id=submission_id
        )
        session.add(submission_grade)
    
    submission_grade.score=data.score
    submission_grade.feedback=data.feedback
    submission_grade.graded_by_id=teacher_id
    submission_grade.graded_at=datetime.now(timezone.utc)
    submission.status=SubmissionStatus.GRADED

    try:
        await session.commit()            
    except Exception:
        await session.rollback()
        raise 
    
    await session.refresh(submission_grade)

    return submission_grade