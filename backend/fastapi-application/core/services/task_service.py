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

