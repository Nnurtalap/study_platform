from core.schemas.organization import OrganizationCreate, OrganizationMemberCreate, OrganizationMemberStatusUpdate, OrganizationMemberRoleUpdate, OrganizationMemberRead
from sqlalchemy.ext.asyncio import AsyncSession
from core.models.organization import Organization
from core.models.organization_membership import OrganizationMembership 
from core.types.organization_role import OrganizationRole
from sqlalchemy import select
from fastapi import HTTPException
from core.models.user import User
from sqlalchemy.exc import IntegrityError

async def create_organization(
    session: AsyncSession,
    user_id: int,
    data: OrganizationCreate,
) -> Organization:
    organization = Organization(
        name=data.name 
    )

    session.add(organization)
    
    try:
        await session.flush()

        organization_membership = OrganizationMembership(
                organization_id=organization.id, 
                user_id=user_id, 
                role=OrganizationRole.OWNER
            )
        
        session.add(organization_membership)
        await session.commit()
    except Exception:
        await session.rollback()
        raise 
    
    await session.refresh(organization)
    return organization 

async def list_user_organizations(
    session: AsyncSession, 
    user_id: int, 
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    result = await session.execute(
        select(Organization.id, Organization.name, Organization.created_at, Organization.is_active, OrganizationMembership.role)
        .select_from(Organization)
        .join(
            OrganizationMembership,
            Organization.id == OrganizationMembership.organization_id
        )
        .where(
            Organization.is_active == True, 
            OrganizationMembership.is_active == True, 
            OrganizationMembership.user_id == user_id
        )
        .order_by(Organization.id.desc())
        .limit(limit)
        .offset(offset)
    )

    return [dict(row) for row in result.mappings().all()]

async def get_organization_context(
    session: AsyncSession,
    organization_id: int,
    user_id: int,
) -> tuple[Organization, OrganizationMembership]:
    result = (
        select(Organization, OrganizationMembership)
        .join(
            OrganizationMembership,
            OrganizationMembership.organization_id == Organization.id
        )
        .where(
            Organization.id == organization_id, 
            OrganizationMembership.is_active == True, 
            Organization.is_active == True, 
            OrganizationMembership.user_id == user_id
        )
    )

    row = (await session.execute(result)).one_or_none()

    if row is None:
        raise HTTPException(
            status_code=404, 
            detail='Organization not found'
        )

    return (row[0], row[1])

async def list_organization_members(
    session: AsyncSession, 
    organization_id: int, 
    user_id: int, 
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    organization, member = await get_organization_context(session, organization_id, user_id)

    if member.role not in(
        OrganizationRole.OWNER,
        OrganizationRole.ADMIN,
    ):
        raise HTTPException(
            status_code=403, 
        )

    query = (
        select(
            OrganizationMembership.id,
            OrganizationMembership.role,
            OrganizationMembership.user_id, 
            OrganizationMembership.is_active, 
            OrganizationMembership.joined_at,
            User.email
        )
        .select_from(OrganizationMembership)
        .join(
            User, 
            User.id == OrganizationMembership.user_id
        )
        .where(
            OrganizationMembership.organization_id == organization_id
        )
        .order_by(OrganizationMembership.id)
        .limit(limit)
        .offset(offset)
    )

    result = await session.execute(query)
    rows = result.mappings().all()

    return [dict(row) for row in rows]

async def add_organization_member(
        session: AsyncSession, 
        user_id: int, 
        organization_id: int,
        data: OrganizationMemberCreate 
) -> dict:
    organization, member = await get_organization_context(session, organization_id, user_id)

    if member.role not in (
        OrganizationRole.ADMIN, 
        OrganizationRole.OWNER
    ):
        raise HTTPException(
            status_code=403
        )

    user = await session.scalar(
        select(User)
        .where(
            User.id == data.user_id,
            User.is_active == True,
            User.is_verified == True
        )
    )

    if not user:
        raise HTTPException(
            status_code = 404
        )

    member = await session.scalar(
        select(OrganizationMembership)
        .where(
            OrganizationMembership.user_id == data.user_id,
            OrganizationMembership.organization_id == organization_id
        )
    )

    if member:
        raise HTTPException(
            status_code=409
        )

    try:
        membership = OrganizationMembership(
            user_id=data.user_id, 
            role=data.role,
            organization_id=organization_id
        )
        session.add(membership)
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()

        db_error = exc.orig.__cause__

        if (
            getattr(db_error, "sqlstate", None) == '23505'
            and getattr(db_error, 'constraint_name', None) == 'uq_user_organization'
        ):
            raise HTTPException(
                status_code=409, 
                detail="User is already a member",
        ) from exc


        raise 
    except Exception:
        await session.rollback()
        raise 

    await session.refresh(membership)
    return {
        "id": membership.id,
        "user_id": membership.user_id,
        "email": user.email,
        "role": membership.role,
        "is_active": membership.is_active,
        "joined_at": membership.joined_at,
    }

async def update_organization_member_status(
    session: AsyncSession, 
    organization_id: int,
    data: OrganizationMemberStatusUpdate,
    membership_id: int,
    user_id: int 
) -> dict:
    organization, member = await get_organization_context(session, organization_id, user_id)

    if member.role not in(OrganizationRole.ADMIN, OrganizationRole.OWNER):
        raise HTTPException(status_code=403, detail="Access denied") 

    target_member = await session.scalar(
        select(OrganizationMembership)
        .where(
            OrganizationMembership.id == membership_id,
            OrganizationMembership.organization_id == organization_id,
        )
    )

    if target_member is None:
        raise HTTPException(status_code=404, detail="Member not found")


    if (target_member.user_id == user_id) or (target_member.role == OrganizationRole.OWNER) or (member.role == OrganizationRole.ADMIN and target_member.role not in (OrganizationRole.TEACHER, OrganizationRole.STUDENT)):
        raise HTTPException(status_code=403)

    target_user = await session.scalar(
        select(User)
        .where(User.id == target_member.user_id)
    )

    if data.is_active and (
        not target_user.is_active 
        or not target_user.is_verified
    ):
        
            raise HTTPException(
                status_code=409
            )

    target_member.is_active = data.is_active

    try: 
        await session.commit()
    except Exception as ext:
        await session.rollback()
        raise

    await session.refresh(target_member)
    return {
        "id": target_member.id,
        "user_id": target_member.user_id,
        "email": target_user.email,
        "role": target_member.role,
        "is_active": target_member.is_active,
        "joined_at": target_member.joined_at,
    } 

async def update_organization_member_role(
    session: AsyncSession, 
    organization_id: int,
    data: OrganizationMemberRoleUpdate,
    membership_id: int,
    user_id: int 
) -> dict:
    organization, member = await get_organization_context(session, organization_id, user_id)

    if member.role != OrganizationRole.OWNER:
        raise HTTPException(
            status_code=403
        ) 

    target_member = await session.scalar(
            select(OrganizationMembership)
            .where(
                OrganizationMembership.id == membership_id,
                OrganizationMembership.organization_id == organization_id,
            )
        )

    if target_member is None:
        raise HTTPException(
            status_code=404, 
            detail="Member not found",
        )

    if target_member.user_id == user_id:
        raise HTTPException(
            status_code=403
        ) 

    if target_member.role == OrganizationRole.OWNER:
        raise HTTPException(
            status_code=403
        ) 

    target_user = await session.scalar(
        select(User)
        .where(User.id == target_member.user_id)
    )

    target_member.role = data.role

    try:
        await session.commit()
    except Exception:
        await session.rollback()
        raise 
    
    await session.refresh(target_member)
    return {
        "id": target_member.id,
        "user_id": target_member.user_id,
        "email": target_user.email,
        "role": target_member.role,
        "is_active": target_member.is_active,
        "joined_at": target_member.joined_at,
    } 


