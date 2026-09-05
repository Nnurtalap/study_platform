from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper, User
from core.schemas.group import GroupCreate, GroupRead, GroupWithStudentsRead, EnrollmentCreate
from core.services.group_service import create_group, enroll_student, get_group_with_students
from api.api_v1.dependencies.authentification.roles import get_current_teacher

router = APIRouter(prefix="/groups", tags=["Groups"])


@router.post("", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
async def create_groups(
    data: GroupCreate,
    teacher: Annotated[User, Depends(get_current_teacher)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await create_group(session, teacher, data)


@router.get("/{group_id}", response_model=GroupWithStudentsRead)
async def get_group(
    group_id: int,
    teacher: Annotated[User, Depends(get_current_teacher)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_group_with_students(session, group_id, teacher)


@router.post("/{group_id}/enrollments", status_code=status.HTTP_201_CREATED)
async def enroll_students(
    group_id: int,
    data: EnrollmentCreate,
    teacher: Annotated[User, Depends(get_current_teacher)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    await enroll_student(session, group_id, teacher, data)
    return {"detail": "Student enrolled"}