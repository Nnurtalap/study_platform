from fastapi import Depends, HTTPException, status
from core.models.user import User
from core.models.user import UserRole
from core.authentication.fastapi_users import current_active_user  

def get_current_teacher(user: User = Depends(current_active_user)) -> User:
    """
    Зависимость для получения текущего пользователя-учителя.
    Superuser тоже имеет доступ.
    """
    if user.role != UserRole.TEACHER and not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Это действие доступно только учителям"
        )
    return user

def get_current_student(user: User = Depends(current_active_user)) -> User:
    """
    Зависимость для получения текущего пользователя-студента.
    Superuser тоже имеет доступ.
    """
    if user.role != UserRole.STUDENT and not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Это действие доступно только студентам"
        )
    return user

def get_current_admin(user: User = Depends(current_active_user)) -> User:
    """
    Зависимость для получения текущего пользователя-админа.
    Superuser тоже имеет доступ.
    """
    if user.role != UserRole.ADMIN and not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Это действие доступно только администраторам"
        )
    return user