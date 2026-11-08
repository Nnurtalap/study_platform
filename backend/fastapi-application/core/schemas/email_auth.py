from typing import Annotated

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    SecretStr,
)


Code = Annotated[
    str, 
    Field(
        min_length=6,
        max_length=6,
        pattern=r'^[0-9]{6}$'
    )
]

Password = Annotated[
    SecretStr, 
    Field(min_length=15, max_length=128)
]

CurrentPassword = Annotated[
    SecretStr, 
    Field(min_length=1, max_length=128)
]

class Input(BaseModel):
    model_config = ConfigDict(extra='forbid')

class EmailRequest(Input):
    email: EmailStr

class CodePassword(EmailRequest):
    code: Code
    password: Password

class EmailChange(EmailRequest):
    current_password: CurrentPassword

class PasswordChange(Input):
    current_password: CurrentPassword
    password: Password
    
class EmailChangeConfirm(EmailChange):
    code: Code


class Accepted(BaseModel):
    message: str = (
        "Если операция доступна, письмо с кодом будет отправлено."
    )
