from fastapi import Depends, HTTPException, status
from core.models.user import User
from core.models.user import UserRole
from core.authentication.fastapi_users import current_active_user  

class RoleChecker:
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles


    def __call__(self, user: User = Depends(current_active_user)) -> User:
        if user.role not in self.allowed_roles and not user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="У вас недостаточно прав для выполнения этого действия"
            )
        return user

require_teacher = RoleChecker([UserRole.TEACHER])
require_student = RoleChecker([UserRole.STUDENT])