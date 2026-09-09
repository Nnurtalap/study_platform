from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.models import Test, TestTask, Task, User
from core.schemas.test import TestCreate, TestTaskCreate
from core.models.test_assignment import TestAssignment

async def create_test(session: AsyncSession, teacher: User, data: TestCreate) -> Test:
    test = Test(title=data.title, description=data.description, created_by_id=teacher.id)
    session.add(test)
    await session.commit()
    await session.refresh(test)
    await session.refresh(test, attribute_names=["tasks"])
    return test

async def get_test_owned_by_or_404(session: AsyncSession, test_id: int, teacher: User) -> Test:
    result = await session.execute(
        select(Test).options(selectinload(Test.tasks)).where(Test.id == test_id)
    )
    test = result.scalar_one_or_none()
    if test is None or test.created_by_id != teacher.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Test not found")
    return test

async def add_task_to_test(
    session: AsyncSession, test_id: int, teacher: User, data: TestTaskCreate
) -> TestTask:
    await lock_owned_test(session, test_id, teacher)
    assignment_id = await session.scalar(
        select(TestAssignment.id)
        .where(TestAssignment.test_id == test_id)
        .limit(1)
    )

    if assignment_id is not None:
        raise HTTPException(
            status_code=409,
            detail="Assigned test cannot be modified",
        )

    task_result = await session.execute(
        select(Task).where(
            Task.id == data.task_id,
            Task.created_by_id == teacher.id,
        )
    )

    task = task_result.scalar_one_or_none()

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task does not exist",
        )

    test_task = TestTask(
        test_id=test_id,
        task_id=data.task_id,
        position=data.position,
        points=data.points,
    )

    session.add(test_task)
    
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, detail="This task is already in the test")
    await session.refresh(test_task)
    return test_task

async def lock_owned_test(
        session: AsyncSession, 
        test_id: int, 
        teacher: User
) -> Test:
    test = await session.scalar(
        select(Test)
        .where(
            Test.id == test_id,
            Test.created_by_id == teacher.id
        )
        .with_for_update()
    )

    if test is None:
        raise HTTPException(
            status_code=404,
            detail="Test not found",
        )

    return test 
