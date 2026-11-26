from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from core.schemas.organization import (
    OrganizationRead,
    OrganizationCreate,
    OrganizationMemberStatusUpdate, 
    MyOrganizationRead, 
    OrganizationMemberRead, 
    OrganizationMemberRoleUpdate,
    OrganizationMemberCreate, 
)
from core.schemas.group import (
    OrganizationGroupCreate, 
    OrganizationGroupRead,
    EnrollmentRead,
    OrganizationEnnrolmentCreate,
    StudentRead
)
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import db_helper
from core.services.organization_service import (
    create_organization,
    update_organization_member_status,
    list_user_organizations, 
    list_organization_members, 
    add_organization_member,
    update_organization_member_role,
)
from core.services.group_service import (
    add_student_group,
    create_organization_group, 
    list_organization_groups,
    list_organization_group_students,
    remove_organization_group_student,
    create_test_to_group
)
from core.models.organization import Organization
from core.authentication.fastapi_users import current_active_user
from core.models import User
from core.schemas.test_assignment import TestAssignmentRead
from core.schemas.test_assignment import OrganizationGroupAssignmentCreate

router = APIRouter(
    prefix='/organizations',
    tags=['Organization']
)

@router.post(
    '',
    response_model=OrganizationRead,
    status_code=201
)
async def create_organization_endpoint(
    data: OrganizationCreate,
    user: Annotated[User, Depends(current_active_user)], 
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
) -> Organization:
    return await create_organization(session, user.id, data)

@router.get(
    '',
    response_model=list[MyOrganizationRead],
    status_code=200
)
async def get_list(
    user: Annotated[User, Depends(current_active_user)], 
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    limit: int = Query(default=50, gt=0, le=100),
    offset: int = Query(default=0, ge=0, le=10000),
) -> list[dict]:
    return await list_user_organizations(session, user.id, limit, offset)

@router.get(
    '/{organization_id}/members',
    response_model=list[OrganizationMemberRead],
    status_code=200
)
async def get_organization_info(
    user: Annotated[User, Depends(current_active_user)], 
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    organization_id: int,
    limit: int = Query(default=50, gt=0, le=100),
    offset: int = Query(default=0, ge=0, le=10000),
) -> list[dict]:
    return await list_organization_members(
        session,organization_id, user.id, limit, offset
    )

@router.post(
    '/{organization_id}/members',
    status_code=201, 
    response_model=OrganizationMemberRead
)
async def add_member_to_organaxation(
    user: Annotated[User, Depends(current_active_user)], 
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    organization_id: int,
    data: OrganizationMemberCreate
):
    return await add_organization_member(session, user.id, organization_id, data)

@router.patch(
    '/{organization_id}/members/{membership_id}',
    response_model=OrganizationMemberRead,
    status_code=200
)
async def update_member_status(
    user: Annotated[User, Depends(current_active_user)], 
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    organization_id: int,
    membership_id: int,
    data: OrganizationMemberStatusUpdate
) -> dict:
    return await update_organization_member_status(session, organization_id, data, membership_id, user.id )

@router.patch(
        '/{organization_id}/members/{membership_id}/role',
        response_model=OrganizationMemberRead,
        status_code=200
)
async def update_member_role(
    user: Annotated[User, Depends(current_active_user)], 
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    organization_id: int,
    membership_id: int,
    data: OrganizationMemberRoleUpdate  
) -> dict:
    return await update_organization_member_role(session, organization_id, data, membership_id, user.id)

@router.post(
    '/{organization_id}/groups', 
    response_model=OrganizationGroupRead, 
    status_code=201
)
async def create_organization_groups(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    user: Annotated[User, Depends(current_active_user)], 
    data: OrganizationGroupCreate,
    organization_id: int,
):
    return await create_organization_group(session, data, user.id, organization_id)

@router.get(
    '/{organization_id}/groups',
    response_model=list[OrganizationGroupRead],
    status_code=200
)
async def get_groups_by_organization_id(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    user: Annotated[User, Depends(current_active_user)],
    organization_id: int, 
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0, le=10000),
) -> list:
    return await list_organization_groups(session, organization_id, user.id, limit, offset)

@router.post(
    '/{organization_id}/groups/{group_id}/enrollments',
    response_model=EnrollmentRead,
    status_code=201
)
async def add_student_to_group(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    user: Annotated[User, Depends(current_active_user)],
    organization_id: int,
    group_id: int, 
    data: OrganizationEnnrolmentCreate
):
    return await add_student_group(session, organization_id, data.student_id, user.id, group_id)

@router.get(
    '/{organization_id}/groups/{group_id}/students',
    response_model=list[StudentRead],
    status_code=200
)
async def get_group_students(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    user: Annotated[User, Depends(current_active_user)],
    organization_id: int, 
    group_id: int,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0, le=10000)
):
    return await list_organization_group_students(session, organization_id,group_id, user.id, limit, offset)


@router.delete(
    '/{organization_id}/groups/{group_id}/students/{student_id}',
    status_code=204
)
async def delete_student(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    user: Annotated[User, Depends(current_active_user)],
    organization_id: int, 
    group_id: int,
    student_id: int
):
    await remove_organization_group_student(session, user.id, student_id, group_id, organization_id )
    return Response(status_code=204)

@router.post(
    '/{organization_id}/groups/{group_id}/assignments',
    status_code=201, 
    response_model=TestAssignmentRead
)
async def add_test_to_group(
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    user: Annotated[User, Depends(current_active_user)],
    organization_id: int, 
    group_id: int,
    data: OrganizationGroupAssignmentCreate
):
    return await create_test_to_group(session, organization_id, user, data.test_id, group_id, data.due_date)