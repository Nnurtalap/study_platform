from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper, User
from core.schemas.subject import SubjectCreate, SubjectRead, TopicCreate, TopicRead
from core.services.subject_service import create_subject, list_subjects, get_subject_or_404, create_topic, list_topics
from api.api_v1.dependencies.authentification.roles import get_current_teacher

router = APIRouter(prefix='/subjects', tags=['Subjects'])

@router.post('', response_model=SubjectRead, status_code=status.HTTP_201_CREATED)
async def create_subjects(
    data: SubjectCreate,
    _teacher: Annotated[User, Depends(get_current_teacher)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)]
):
    return await create_subject(session, data)

@router.get('', response_model=List[SubjectRead])
async def list_subject(session: Annotated[AsyncSession, Depends(db_helper.session_getter)]):
    return await list_subjects(session)

@router.post('/{subject_id}/topics', response_model=TopicRead, status_code=status.HTTP_201_CREATED)
async def create_topic_by_subject_id(
    subject_id: int,
    data: TopicCreate,
    _teacher: Annotated[User, Depends(get_current_teacher)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await create_topic(session, subject_id, data)

@router.post('/{subject_service}/topics', response_model=List[TopicRead])
async def get_list_topics(
    subject_id: int,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    await get_subject_or_404(session, subject_id)
    return await list_topics(session, subject_id)