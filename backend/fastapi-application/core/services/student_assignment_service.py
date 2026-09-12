from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import (
    AssignmentStudent,
    Submission,
    Task,
    Test,
    TestAssignment,
    TestTask,
)
from core.types.assignment_status import AssignmentStatus

async def get_progress(
        session: AsyncSession,
        student_id: int,
        assignment_id: int, 
        *,
        lock: bool = False
):
    statement = (
        select(TestAssignment, AssignmentStudent)
        .join(
            AssignmentStudent,
            AssignmentStudent.assignment_id == TestAssignment.id
        ).where(
            TestAssignment.id == assignment_id,
            AssignmentStudent.student_id == student_id
        )
    )

    if lock:
        statement = statement.with_for_update(
            of=AssignmentStudent
        ).execution_options(populate_existing=True)

    row = (await session.execute(statement)).one_or_none()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    return row[0], row[1]

def deadline_passed(assignment: TestAssignment) -> bool:
    return (
        assignment.due_date is not None
        and datetime.now(timezone.utc) > assignment.due_date
    )

def require_open(assignment, progress) -> None:
    if progress.status == AssignmentStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Assignment already completed",
        )

    if deadline_passed(assignment):
        raise HTTPException(
            status_code=400,
            detail="Assignment deadline has passed",
        )

def assignment_response(assignment, progress) -> dict:
    completed = progress.status == AssignmentStatus.COMPLETED
    overdue = deadline_passed(assignment)

    status = progress.status 
    if overdue and not completed:
        status = AssignmentStatus.OVERDUE

    return {
        "id": assignment.id,
        "test_id": assignment.test_id,
        "student_id": progress.student_id,
        "group_id": assignment.group_id,
        "due_date": assignment.due_date,
        "status": status,
        "can_submit": not completed and not overdue,
    }

async def list_student_assignments(
        session: AsyncSession, 
        student_id: int
):
    result = await session.execute(
        select(TestAssignment, AssignmentStudent)
        .join(
            AssignmentStudent,
            AssignmentStudent.assignment_id == TestAssignment.id
        )
        .where(AssignmentStudent.student_id == student_id)
        .order_by(AssignmentStudent.id.desc())
    )

    return [
        assignment_response(assignment, progress)
        for assignment, progress in result.all()
    ]

async def get_student_assignment(
        session: AsyncSession,
        assignment_id: int,
        student_id: int
):
    assignment, progress = await get_progress(
        session, student_id, assignment_id
    )

    test = await session.get(Test, assignment.test_id)

    task_rows = (
        await session.execute(
            select(TestTask, Task)
            .join(Task, TestTask.task_id == Task.id)
            .where(TestTask.test_id == assignment.test_id)
            .order_by(TestTask.position, TestTask.task_id)
        )
    ).all()

    submission_rows = (
        await session.execute(
            select(Submission.task_id, Submission.id).where(
                Submission.test_assignment_id == assignment_id,
                Submission.student_id == student_id
            )
        )
    ).all()

    submissions = dict(submission_rows)

    return {
        **assignment_response(assignment, progress),
        "title": test.title,
        "description": test.description,
        "tasks": [
            {
                "id": task.id,
                "title": task.title,
                "body": task.body,
                "task_type": task.task_type,
                "difficulty": task.difficulty,
                "position": test_task.position,
                "points": test_task.points,
                "submission_id": submissions.get(task.id),
            } for test_task, task in task_rows
        ] 
    }

async def complete_assignment(
        session: AsyncSession,
        student_id: int, 
        assignment_id: int
): 
    assignment, progress = await get_progress(
        session, student_id, assignment_id, lock=True
    )

    if progress.status == AssignmentStatus.COMPLETED:
        return assignment_response(assignment, progress)

    require_open(assignment, progress)

    required_ids = set(
        (
            await session.scalars(
                select(TestTask.task_id).where(
                    TestTask.test_id == assignment.test_id
                )
            )
        ).all()
    )

    answered_ids = set(
        (
            await session.scalars(select(Submission.task_id).where(
                Submission.test_assignment_id == assignment.id,
                Submission.student_id == student_id
            ))
        ).all()
    )

    if not required_ids or required_ids - answered_ids:
        raise HTTPException(
            status_code=400,
            detail="Answer all tasks before completing the test",
        )

    progress.status = AssignmentStatus.COMPLETED
    progress.completed_at = datetime.now(timezone.utc)

    await session.commit()

    return assignment_response(assignment, progress)