from typing import Annotated, List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper, User
from core.schemas.test_assignment import TestAssignmentCreate, TestAssignmentRead
from core.services.test_assignment import create_assignment
from api.api_v1.dependencies.authentification.roles import get_current_teacher, get_current_student

from core.schemas.student_assignment import (
    StudentAssignmentResult,
    TeacherStudentAssignmentResult,
)

from core.services import student_assignment_service as service
from .student_assignments import Session, Teacher

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


@router.get(
    '/test-assignment/{assignment_id}/students/{student_id}/results',
    response_model=StudentAssignmentResult
)
async def get_result_by_assignment_id(
    session: Session, 
    student_id: int, 
    teacher: Teacher,
    assignment_id: int
):
    return await service.get_teacher_student_assignment_result(
        session, 
        student_id, 
        assignment_id,
        teacher.id
    )

@router.get(
    '/test-assignment/{assignment_id}/results',
    response_model=list[TeacherStudentAssignmentResult]
)
async def get_results_teacher_assignment_results(
    assignment_id: int,
    session: Session,
    teacher: Teacher,
    limit: int = Query(default=50, gt=0, le=100),
    offset: int = Query(default=0, ge=0, le=10000)
):
    return await service.get_teacher_assignment_results(
        session, assignment_id, teacher.id, limit, offset
    )