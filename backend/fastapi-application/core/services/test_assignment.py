from typing import List
from fastapi import HTTPException, status 
from sqlalchemy import select, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import TestAssignment, Group, Enrollment, User
from core.schemas.test_assignment import TestAssignmentCreate
from core.services.test_service import get_test_owned_by_or_404
from core.models.user import UserRole
from core.models import AssignmentStudent, TestTask
from core.services.test_service import lock_owned_test

async def create_assignment(
        session: AsyncSession, test_id: int, teacher: User, data: TestAssignmentCreate
) -> TestAssignment:
    await lock_owned_test(session, test_id, teacher)

    task_id = await session.scalar(
        select(TestTask.task_id)
        .where(TestTask.test_id == test_id)
        .limit(1)
    )

    if task_id is None:
        raise HTTPException(
            status_code=400,
            detail="Cannot assign an empty test",
        )

    if data.student_id is not None:
        student_result = await session.execute(select(User).where(data.student_id == User.id))
        student = student_result.scalar_one_or_none()
        if student is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Student does not exist")
        if student.role != UserRole.STUDENT:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="This user is not a student",
            )
        if not student.is_active:
            raise HTTPException(
                status_code=400,
                detail='Student is inactive'
            )
        student_ids = [student.id] 
    else:
        group_result = await session.execute(
            select(Group)
            .where(
                data.group_id == Group.id,  
                Group.teacher_id == teacher.id,
            )
        )
        if group_result.scalar_one_or_none() is None:
                    raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Group does not exist or is not yours")
        

        result = await session.scalars(
            select(User.id)
            .join(Enrollment, Enrollment.student_id == User.id)
            .where(
                Enrollment.group_id == data.group_id,
                User.role == UserRole.STUDENT,
                User.is_active.is_(True)
            )
        )

        student_ids = list(result.all())

        if not student_ids:
             raise HTTPException(
                status_code=400,
                detail="Group has no active students",
            )

        
    assignment = TestAssignment(
        test_id=test_id,
        assigned_by_id=teacher.id,
        student_id=data.student_id,
        group_id=data.group_id,
        due_date=data.due_date,
    )
    session.add(assignment)
    try:
        await session.flush()
        session.add_all(
            [ 
                AssignmentStudent(
                    assignment_id=assignment.id,
                    student_id=student_id
            )
                for student_id in student_ids
        ]
    )
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid assignment target")
    await session.refresh(assignment)
    return assignment

async def get_assignment_or_404(session: AsyncSession, assignment_id: int) -> TestAssignment:
    result = await session.execute(select(TestAssignment).where(TestAssignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if assignment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return assignment

async def is_assignment_is_accessible_to_student(
        session: AsyncSession, assignment: TestAssignment, student: User
) -> bool:
    if assignment.student_id == student.id:
        return True
    if assignment.group_id is not None:
        result = await session.execute(
            select(Enrollment).where(
                Enrollment.group_id == assignment.group_id,
                Enrollment.student_id == student.id
            )
        )
        return result.scalar_one_or_none() is not None
    return False 

async def list_assignments_for_students(
        session: AsyncSession, student: User
) -> List[TestAssignment]:
    group_ids_subquery = select(Enrollment.group_id).where(Enrollment.student_id == student.id)
    result = await session.execute(
        select(TestAssignment).where(
            or_(
                TestAssignment.student_id == student.id, 
                TestAssignment.group_id.in_(group_ids_subquery)
            )
        )
    )
    return list(result.scalars().all())