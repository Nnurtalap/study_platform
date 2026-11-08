from typing import Literal

from cryptography.fernet import Fernet
from pydantic import EmailStr, Field, SecretStr, model_validator, AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict

class CodeSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=('.env.template', '.env'),
        case_sensitive=False,
        extra='ignore',
        env_prefix='EMAIL_AUTH_'
    )

    environment: Literal["development", "production"] = "production"
    public_origin: AnyHttpUrl = "http://localhost:3000"
    
    smtp_host: str = 'smtp.gmail.com'
    smtp_port: int = Field(default=465, ge=1, le=65535)
    smtp_mode: Literal["ssl", "starttls"] = "ssl"

    broker_url: SecretStr
    smtp_username: str 
    smtp_password: SecretStr

    sender: EmailStr
    support_email: EmailStr
    code_ttl_seconds: int = Field(default=600, ge=120, le=1800)
    brand: str = 'Study platform'
    resend_seconds: int = Field(default=60, ge=30)
    max_code_attempts: int = Field(default=5, ge=1, le=10)

    check_breached_passwords: bool = True

    hmac_key: SecretStr
    encryption_key: SecretStr

    @model_validator(mode='after')
    def validate_security(self):
        if len(self.hmac_key.get_secret_value()) < 32:
            raise ValueError(
                "EMAIL_AUTH_HMAC_KEY must contain at least 32 characters"
            )
        Fernet(self.encryption_key.get_secret_value().encode('ascii'))
        
        origin = self.public_origin

        if (
            origin.username is not None
            or origin.password is not None
            or origin.path not in (None, "", "/")
            or origin.query is not None
            or origin.fragment is not None
        ):
            raise ValueError(
                "EMAIL_AUTH_PUBLIC_ORIGIN must contain only scheme, host and port"
            )

        if self.environment == "production":
            if origin.scheme != "https":
                raise ValueError(
                    "EMAIL_AUTH_PUBLIC_ORIGIN must use HTTPS in production"
                )

            if not self.check_breached_passwords:
                raise ValueError(
                    "Password breach checks must be enabled in production"
                )
        return self 
    
code_settings = CodeSettings()