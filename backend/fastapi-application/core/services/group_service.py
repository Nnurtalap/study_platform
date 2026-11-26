from typing import List
from datetime import datetime 

from fastapi import HTTPException, status, Query
from sqlalchemy import select, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.models import Group, Enrollment, User, TestTask, TestAssignment, AssignmentStudent
from core.models.user import UserRole
from core.models.organization_membership import OrganizationMembership 
from core.schemas.group import GroupCreate, OrganizationGroupCreate, EnrollmentCreate, GroupWithStudentsRead, StudentRead
from core.services.organization_service import get_organization_context
from core.schemas.organization import OrganizationRole
from core.services.test_service import lock_owned_test

async def create_group(session: AsyncSession, data: GroupCreate, teacher: User) -> Group:
    group = Group(name=data.name, teacher_id=teacher.id)
    session.add(group)
    await session.commit()
    await session.refresh(group)
    return group

async def get_group_owned_by_or_404(session: AsyncSession, group_id: int, teacher: User) -> Group:
    result = await session.execute(
        select(Group)
        .options(selectinload(Group.enrollments).selectinload(Enrollment.student))
        .where(
            Group.id == group_id,
            Group.organization_id == None
        )
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

async def create_organization_group(
        session: AsyncSession, 
        data: OrganizationGroupCreate, 
        user_id: int, 
        organization_id: int,
) -> Group:
    organization, member = await get_organization_context(session, organization_id, user_id)

    if member.role not in (OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.TEACHER):
        raise HTTPException(
            status_code=403
        )

    if (
            member.role == OrganizationRole.TEACHER
            and data.teacher_id != user_id
        ):
            raise HTTPException(status_code=403)
    
    _, teacher_member = await get_organization_context(
        session,
        organization_id,
        data.teacher_id,
    )

    teacher_user = await session.scalar(
    select(User)
    .where(
            User.id == data.teacher_id,
            User.is_active.is_(True),
            User.is_verified.is_(True),
        )
    )  

    if teacher_user is None:
        raise HTTPException(status_code=404)

    if teacher_member.user_id != data.teacher_id:
        raise HTTPException(
            status_code=404
        )

    if teacher_member.role not in (OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.TEACHER):
            raise HTTPException(
                status_code=404
            )

    

    if not organization.is_active:
        raise HTTPException(
            status_code=404
        ) 

    group = Group(
        name=data.name, 
        teacher_id=data.teacher_id, 
        organization_id=organization_id
    )

    session.add(group)

    try: 
        await session.commit()
    except Exception:
        await session.rollback()
        raise

    await session.refresh(group)
    return group

async def list_organization_groups(
        session: AsyncSession,
        organization_id: int, 
        user_id: int,
        limit: int,
        offset: int 
) -> list:
    organization, member = await get_organization_context(session, organization_id, user_id)

    if organization is None:
        raise HTTPException(
            status_code=404
        )

    if member.role not in (OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.TEACHER):
            raise HTTPException(
                status_code=403
            )

    groups = (
             select(Group)
             .where(
                  Group.organization_id == organization_id
                )
            .order_by(Group.id.desc())
            .limit(limit)
            .offset(offset)
        )
    
    if member.role == OrganizationRole.TEACHER:
          groups = (
                select(Group)
               .where(
                    Group.organization_id == organization_id,
                    Group.teacher_id == user_id 
                  )
                .order_by(Group.id.desc())
                .limit(limit)
                .offset(offset)
          )

    

    
    result = await session.scalars(groups)
    return result.all()

async def add_student_group(
    session: AsyncSession,
    organization_id: int, 
    student_id: int,
    user_id: int ,
    group_id: int
):
    organization, member = await get_organization_context(session, organization_id, user_id)

    if organization is None:
        raise HTTPException(
            status_code=404
        )
     
    if member.role not in (OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.TEACHER):
        raise HTTPException(
            status_code=403
        )

    group = await session.scalar(
         select(Group)
         .where(
              Group.organization_id == organization_id,
              Group.id == group_id
         )
    )

    if member.role == OrganizationRole.TEACHER:
         group = await session.scalar(
            select(Group)
              .where(
                Group.organization_id == organization_id,
                Group.id == group_id,
                Group.teacher_id == member.user_id
            )
        )

    if group is None:
        raise HTTPException(
             status_code=404
        )

    student = await session.scalar(
         select(User)
         .join(
              OrganizationMembership, 
              OrganizationMembership.user_id == User.id 
            )
         .where(
              User.id == student_id,
              User.is_active == True,
              User.is_verified == True, 
              OrganizationMembership.organization_id == organization_id,
              OrganizationMembership.is_active.is_(True),
              OrganizationMembership.role == OrganizationRole.STUDENT, 
            )
    )

    if student is None:
        raise HTTPException(
             status_code=404
        )

    check_enrollment = await session.scalar(
         select(Enrollment)
         .where(Enrollment.student_id == student_id, Enrollment.group_id == group_id)
    )

    if check_enrollment: 
         raise HTTPException(
              status_code=409
         )

    enroll_organization_student = Enrollment(
        student_id=student_id,
        group_id=group_id
    )

    session.add(enroll_organization_student)
    
    try: 
         await session.commit()
    except IntegrityError as exc:
        await session.rollback()

        db_error = exc.orig.__cause__

        if (
             getattr(db_error, 'sqlstate', None) == '23505'
             and getattr(db_error, 'constraint_name', None) == 'uq_enrollment_student_group'
        ): 
             raise HTTPException(
                status_code=409, 
                detail='student is alredy enrolled'
             ) from exc

        raise

    except Exception:
         await session.rollback()
         raise 

    await session.refresh(enroll_organization_student)
    return enroll_organization_student

    
async def list_organization_group_students(
        session: AsyncSession,
        organization_id: int, 
        group_id: int, 
        user_id: int, 
        limit: int, 
        offset: int
):
    organization, member = await get_organization_context(session, organization_id, user_id)
     
    if organization is None:
        raise HTTPException(
            status_code=404
        )
          
    if member.role not in (OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.TEACHER):
        raise HTTPException(
            status_code=403
        )

    group = await session.scalar(
         select(Group.id)
         .where(
              Group.id == group_id,
              Group.organization_id == organization_id,
            )
    )

    if member.role == OrganizationRole.TEACHER:
         group = await session.scalar(
            select(Group.id)
            .where(
                Group.id == group_id,
                Group.organization_id == organization_id,
                Group.teacher_id == member.user_id
            )
        )

    if group is None:
        raise HTTPException(
            status_code=404
        )

    students = await session.scalars(
         select(User)
         .join(
              Enrollment,
              Enrollment.student_id == User.id
         )
         .join(
              OrganizationMembership,
              OrganizationMembership.user_id == User.id
         )
         .where(
              Enrollment.group_id == group_id,
              OrganizationMembership.organization_id == organization_id,
              OrganizationMembership.is_active.is_(True), 
              OrganizationMembership.role == OrganizationRole.STUDENT,
              User.is_active.is_(True),
              User.is_verified.is_(True)
         )
         .order_by(User.id.asc())
         .limit(limit)
         .offset(offset)
    )
    
    return students.all()


async def remove_organization_group_student(
    session: AsyncSession, 
    user_id: int, 
    student_id: int, 
    group_id: int, 
    organization_id: int,
):
    organization, member = await get_organization_context(session, organization_id, user_id)

    if organization is None:
        raise HTTPException(
            status_code=404
        )
               
    if member.role not in (OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.TEACHER):
        raise HTTPException(
            status_code=403
        )

    group = await session.scalar(
             select(Group.id)
             .where(
                  Group.id == group_id,
                  Group.organization_id == organization_id,
                )
        )
    
    if member.role == OrganizationRole.TEACHER:
        group = await session.scalar(
            select(Group.id)
            .where(
                Group.id == group_id,
                Group.organization_id == organization_id,
                Group.teacher_id == member.user_id
            )
        )
    
    if group is None:
        raise HTTPException(
            status_code=404
        )

    try: 
        delete_student = await session.scalar(
                     delete(Enrollment)
                     .where(
                          Enrollment.group_id == group_id,
                          Enrollment.student_id == student_id,
                     ).returning(Enrollment.id)   
                )
        
        if delete_student is None:
            raise HTTPException(
                status_code=404
            )
        await session.commit()
        return delete_student
    except Exception:
        await session.rollback()
        raise 

# если студент есть то назначае тест только ему а если группа то группе и каждому студенту
# учитель может назначить только своей группе 
# админ и оунер может всем , студент никому 
# 
#


async def create_test_to_group(
    session: AsyncSession, 
    organization_id: int, 
    user: User,
    test_id: int,
    group_id: int , 
    due_date: datetime | None = None,
):
    organization, member = await get_organization_context(session, organization_id, user.id)

    if organization is None:
            raise HTTPException(
                status_code=404
            )
                   
    if member.role not in (OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.TEACHER):
        raise HTTPException(
            status_code=403
        )
    
    group = await session.scalar(
                select(Group)
                .where(
                    Group.id == group_id,
                    Group.organization_id == organization_id,
                )
            )

    if member.role == OrganizationRole.TEACHER:
            group = await session.scalar(
                select(Group)
                .where(
                    Group.id == group_id,
                    Group.organization_id == organization_id,
                    Group.teacher_id == member.user_id
                )
            )        

    if not group:
        raise HTTPException(
            status_code=404
        )

    
    await lock_owned_test(session, test_id, user)
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

    result = await session.scalars(
        select(User.id)
        .join(Enrollment, Enrollment.student_id == User.id)
        .join(OrganizationMembership, OrganizationMembership.user_id == User.id)
        .where(
            Enrollment.group_id == group_id,
            OrganizationMembership.organization_id == organization_id,
            OrganizationMembership.role == OrganizationRole.STUDENT,
            OrganizationMembership.is_active.is_(True),
            User.is_active.is_(True),
            User.is_verified.is_(True)
        )
    )

    if not result:
         raise HTTPException(
              status_code=404
         )
    
    student_ids = list(result.all())

    if not student_ids:
         raise HTTPException(
              status_code=400
         )
                    
    assignment = TestAssignment(
        test_id=test_id,
        assigned_by_id=user.id,
        student_id=None,
        group_id=group_id,
        due_date=due_date,
    )

    

    

    try:
         session.add(assignment)
         await session.flush()
         for student_id in student_ids:
                  session.add(
                       AssignmentStudent(
                            assignment_id=assignment.id, 
                            student_id=student_id
                       )
                  ) 

        
         await session.commit()
    except Exception:
        await session.rollback()
        raise

    await session.refresh(assignment)
    return assignment




    
