from typing import List

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.models import Group, Enrollment, User
from core.models.user import UserRole
from core.schemas.group import GroupCreate, EnrollmentCreate, GroupWithStudentsRead, StudentRead

async def create_group(session: AsyncSession, data: GroupCreate, teacher: User) -> Group:
    group = Group(name=data.name, teacher_id=teacher.id)
    session.add(group)
    await session.commit()
    await session.refresh(group)
    return group

async def get_group_owned_by_or_404(session: AsyncSession, group_id: int, teacher: User) -> Group:
    result = session.execute(
        select(Group)
        .options(selectinload(Group.enrollments).selectinload(Enrollment.student))
        .where(Group.id == group_id)
    )
    group = result.scalar_one_or_none()
    if group is None or group.teacher_id != teacher.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Group not found")
    return group

async def get_group_with_students(
    session: AsyncSession, 
    teacher: User, 
    group_id: int
) -> GroupWithStudentsRead:
    group = await get_group_owned_by_or_404(session, group_id, teacher)
    students: List[StudentRead] = [
        StudentRead.model_validate(enrollment.student) for enrollment in group.enrollments
    ]
    return GroupWithStudentsRead(id=group.id, name=group.name, students=students)

async def enroll_student(
    session: AsyncSession, group_id: int, teacher: User, data: EnrollmentCreate
) -> Enrollment:
    await get_group_owned_by_or_404(session, group_id, teacher)

    user_result = await session.execute(select(User).where(User.email == data.student_email))
    student = user_result.scalar_one_or_none()
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User with this email not found")
    if student.role != UserRole.STUDENT:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="This user is not a student")

    enrollment = Enrollment(student_id=student.id, group_id=group_id)
    session.add(enrollment)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Student is already enrolled in this group")
    await session.refresh(enrollment)
    return enrollment