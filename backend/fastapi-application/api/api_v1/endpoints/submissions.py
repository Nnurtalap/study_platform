from typing import Annotated

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper, User, TestAssignment, Submission
from core.schemas.submission import SubmissionCreate, SubmissionGradeCreate, SubmissionGradeRead, SubmissionRead, StudentAnswerResponse
from api.api_v1.dependencies.authentification.roles import get_current_student, get_current_teacher
from api.api_v1.dependencies.assignments import get_eligible_assigment
from core.services.submission_service import get_student_submission, create_student_submition, get_answer_and_check_owner, grade_submission

router = APIRouter(tags=['Submission'])


@router.post(
    '/test-assignment/{assignment_id}/submissions',
    response_model=SubmissionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_submission(
    submission_in: SubmissionCreate,
    assignment: Annotated[TestAssignment, Depends(get_eligible_assigment)],
    student: Annotated[User, Depends(get_current_student)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)]
) -> SubmissionRead:
    submission = await create_student_submition(
        session=session,
        student_id=student.id,
        assignment=assignment,
        submission_in=submission_in
    )

    # TODO (Фаза 4): поставить submission.id в очередь (RabbitMQ) на ИИ-оценку

    return submission

@router.get('/submission/{submission_id}')
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

@router.get('/test-assignment/{assignment_id}/submissions', response_model=list[StudentAnswerResponse])
async def get_teacher_submissions(
    teacher: Annotated[User, Depends(get_current_teacher)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    assignment_id: int, 
    limit: Annotated[int, Query(gt=0, le=100)] = 50,
    offset: Annotated[int, Query(ge=0, le=10000)] = 0,
):
    return await get_answer_and_check_owner(
        session, 
        teacher_id=teacher.id, 
        assignment_id=assignment_id,
        limit=limit, 
        offset=offset
    )

@router.post('/submission/{submission_id}/grade', response_model=SubmissionGradeRead, status_code=200)
async def grade_student_submission(
    data: SubmissionGradeCreate,
    submission_id: int,
    teacher: Annotated[User, Depends(get_current_teacher)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)]

):
    return await grade_submission(session, submission_id, teacher_id=teacher.id, data=data)