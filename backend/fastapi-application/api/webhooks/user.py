from fastapi import APIRouter

from core.schemas.user import UserRegisterNotification

router = APIRouter()

@router.post('user-created')
def notify_user_created(info: UserRegisterNotification):
     """
     a user created
     """