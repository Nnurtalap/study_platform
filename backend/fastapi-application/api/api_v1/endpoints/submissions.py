from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper, User, TestAssignment, Submission
from core.schemas.submission import SubmissionCreate, SubmissionRead
from api.api_v1.dependencies.authentification.roles import get_current_student
from api.api_v1.dependencies.assignments import get_eligible_assigment
from core.services.submission_service import get_student_submission, create_student_submition

router = APIRouter(tags=['Submission'])


@router.post(
    '/test-assignment/{assigment_id}/submissions',
    response_model=SubmissionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_submission(
    submission_in: SubmissionCreate,
    assigment: Annotated[TestAssignment, Depends(get_eligible_assigment)],
    student: Annotated[User, Depends(get_current_student)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)]
) -> SubmissionRead:
    submission = await create_student_submition(
        session=session,
        student_id=student.id,
        assignment=assigment,
        submission_in=submission_in
    )

    # TODO (Фаза 4): поставить submission.id в очередь (RabbitMQ) на ИИ-оценку

    return submission

@router.get('submission/{submission_id}')
async def get_submission(
    submission_id: int, 
    student: Annotated[User, Depends(get_current_student)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)]
) -> SubmissionRead:
    return await get_student_submission(
        session=session,
        student_id = student.id,
        submission_id=submission_id
    )
