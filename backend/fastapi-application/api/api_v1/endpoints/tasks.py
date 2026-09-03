from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper, User
from core.schemas.task import TaskCreate, TaskRead
from core.services.task_service import create_task, list_tasks, get_task_or_404
from api.api_v1.dependencies.authentification.roles import get_current_teacher

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post('', response_model=TaskCreate, status_code=status.HTTP_201_CREATED)
async def task_create(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    teacher: Annotated[User, Depends(get_current_teacher)],
    data: TaskCreate
):
    return await create_task(session, teacher, data)

@router.get("", response_model=List[TaskRead])
async def list_tasks(
    _teacher: Annotated[User, Depends(get_current_teacher)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    topic_id: Optional[int] = None,
):
    return await list_tasks(session, topic_id)


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(
    task_id: int,
    _teacher: Annotated[User, Depends(get_current_teacher)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_task_or_404(session, task_id)