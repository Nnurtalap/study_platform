from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.api_v1.dependencies.authentification.roles import (
    get_current_student,
)
from core.models import User, db_helper
from core.schemas.student_assignment import (
    StudentAssignmentDetail,
    StudentAssignmentRead,
)
from core.services import student_assignment_service as service

router = APIRouter(
    prefix='/me/assignments',
    tags=['Student Assignments']
)

Session = Annotated[
    AsyncSession, Depends(db_helper.session_getter)
]

Student = Annotated[
    User, Depends(get_current_student)
]

@router.get('', response_model=list[StudentAssignmentRead])
async def list_assignment(
    session: Session, 
    student: Student
):
    return await service.list_student_assignments(
        session, student.id
    )

@router.get(
    '/{assignment_id}',
    response_model=StudentAssignmentDetail
)
async def get_assignment(
    assignment_id: int, 
    session: Session, 
    student: Student
):
    return service.get_student_assignment(
        session, assignment_id, student.id
    )

@router.post(
    "/{assignment_id}/complete",
    response_model=StudentAssignmentRead,
)
async def complete(
    assignment_id: int,
    session: Session,
    student: Student,
):
    return await service.complete_assignment(
        session, assignment_id, student.id
    )