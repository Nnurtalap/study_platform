from typing import List

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import Subject, Topic
from core.schemas.subject import SubjectCreate, TopicCreate

async def create_subject(session: AsyncSession, data: SubjectCreate) -> Subject:
    subject = Subject(name=data.name, slug=data.slug)
    session.add(subject)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Subject with this name or slug already exists")
    await session.refresh(subject)
    return subject

async def list_subjects(session: AsyncSession) -> List[Subject]:
    result = await session.execute(select(Subject).order_by(Subject.name))
    return list[result.scalars().all()]

async def get_subject_or_404(session: AsyncSession, subject_id: int) -> Subject:
    result = await session.execute(select(Subject).where(Subject.id == subject_id))
    subject = result.scalar_one_or_none()
    if subject is None:
        raise  HTTPException(status.HTTP_404_NOT_FOUND, detail="Subject not found")
    return subject

async def create_topic(session: AsyncSession, subject_id: int, data: TopicCreate) -> Topic:
    await get_subject_or_404(subject_id)

    topic = Topic(subject_id=subject_id, name=data.name)
    session.add(topic)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise  HTTPException(status.HTTP_409_CONFLICT, detail="Topic with this name already exists in this subject")
    await session.refresh(topic)
    return topic

async def list_topics(session: AsyncSession, subject_id: int) -> List[Topic]:
    result = await session.execute(select(Topic).where(Topic.subject_id == subject_id).order_by(Topic.name))
    return list(result.scalars().all())