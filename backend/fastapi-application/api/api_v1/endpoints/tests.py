from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper, User
from core.schemas.test import TestCreate, TestRead, TestTaskCreate, TestTaskRead
from core.services.test_service import create_test, get_test_owned_by_or_404, add_task_to_test
from api.api_v1.dependencies.authentification.roles import get_current_teacher

router = APIRouter(prefix="/tests", tags=["Tests"])

@router.post('', response_model=TestRead, status_code=status.HTTP_201_CREATED)
async def create_new_test(
    data: TestCreate,
    teacher: Annotated[User, Depends(get_current_teacher)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await create_test(session, teacher, data)

@router.get('/{test_id}', response_model=TestRead)
async def get_test(
    test_id: int, 
    teacher: Annotated[User, Depends(get_current_teacher)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_test_owned_by_or_404(session, test_id, teacher)

@router.post('/{test_id}/tasks',  response_model=TestTaskRead, status_code=status.HTTP_201_CREATED)
async def add_task_to_test(
    test_id: int,
    data: TestTaskCreate,
    teacher: Annotated[User, Depends(get_current_teacher)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await add_task_to_test(session, test_id, teacher, data)