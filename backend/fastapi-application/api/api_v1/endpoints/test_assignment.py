from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper, User
from core.schemas.test_assignment import TestAssignmentCreate, TestAssignmentRead
from core.services.test_assignment import create_assignment, list_assignments_for_students
from api.api_v1.dependencies.authentification.roles import get_current_teacher, get_current_student

router = APIRouter(tags=["Test Assignments"])


@router.post(
    "/tests/{test_id}/assignments",
    response_model=TestAssignmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def assignment_create(
    test_id: int,
    data: TestAssignmentCreate,
    teacher: Annotated[User, Depends(get_current_teacher)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await create_assignment(session, test_id, teacher, data)


@router.get("/me/assignments", response_model=List[TestAssignmentRead])
async def list_my_assignments(
    student: Annotated[User, Depends(get_current_student)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await list_assignments_for_students(session, student)