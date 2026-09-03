from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import Task, Topic, User
from core.schemas.task import TaskCreate

async def create_task(session: AsyncSession, teacher: User, data: TaskCreate) -> Task:
    topic_result = await session.execute(select(Topic).where(Topic.id == data.topic_id))
    if topic_result.scalar_one_or_none() is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Topic does not exist")

    task = Task(
        title=data.title,
        body=data.body,
        topic_id=data.topic_id,
        task_type=data.task_type,
        difficulty=data.difficulty,
        correct_answer=data.correct_answer,
        created_by_id=teacher.id,
    )

    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task

async def list_tasks(session: AsyncSession, topic_id: Optional[int] = None) -> List[Task]:
    smtp = select(Task)
    if topic_id is not None:
        smtp = smtp.where(Task.topic_id == topic_id)
    result = await session.execute(smtp.order_by(Task.id))
    return list(result.scalars().all())

async def get_task_or_404(session: AsyncSession, task_id: int) -> Task:
    result = await session.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task