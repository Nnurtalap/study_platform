from email.message import EmailMessage
from email.utils import formatdate
from pathlib import Path 
import smtplib
import ssl

from jinja2 import (
    Environment,
    FileSystemLoader,
    StrictUndefined,
    select_autoescape
)

from core.authentication.code_settings import code_settings as cfg

templates = Environment(
    loader=FileSystemLoader(
        Path(__file__).resolve().parents[1] / "templates" / "email"
    ),
    autoescape=select_autoescape(['html', 'xml']),
    undefined=StrictUndefined,
)

CONTENT = {
    "register": (
        "Подтвердите почту",
        "Введите код на странице регистрации, затем задайте пароль.",
    ),
    "reset": (
        "Восстановление пароля",
        "Введите код на странице восстановления и задайте новый пароль.",
    ),
    "email_change": (
        "Подтвердите новый email",
        "Введите код в настройках аккаунта, чтобы изменить email.",
    ),
    "welcome": (
        "Аккаунт готов",
        "Почта подтверждена. Теперь вы можете войти в свой аккаунт.",
    ),
    "password_changed": (
        "Пароль изменён",
        "Пароль обновлён. Предыдущие сессии завершены. Войдите заново.",
    ),
    "email_changed": (
        "Email изменён",
        "Адрес аккаунта изменён. Предыдущие сессии завершены.",
    ),
}

def build_message(payload: dict, message_id: str) -> EmailMessage:
    title, description = CONTENT[payload['kind']]

    context = {
        "brand": cfg.brand,
        "title": title,
        "description": description,
        "code": payload.get('code'),
        "minutes": cfg.code_ttl_seconds // 60,
        "support_email": str(cfg.support_email)
    }

    message = EmailMessage()

    message['From'] = str(cfg.sender)
    message['To'] = payload['recipient']
    message['Subject'] = f'{title} - {cfg.brand}'
    message['Date'] = formatdate(localtime=False)

    domain = str(cfg.sender).rsplit('@', 1)[1]
    message['Message-ID'] = f"<{message_id}@{domain}>"

    text_body = templates.get_template('account.txt').render(**context)
    html_body = templates.get_template('account.html').render(**context)

    message.set_content(text_body)
    message.add_alternative(html_body, subtype='html')

    return message

def send_message(payload: dict, message_id: str) -> None:
    message = build_message(payload, message_id)
    context = ssl.create_default_context()

    if cfg.smtp_mode == 'ssl':
        client = smtplib.SMTP_SSL(
            cfg.smtp_host,
            cfg.smtp_port,
            timeout=10, 
            context=context
        )
    else:
        client = smtplib.SMTP(
            cfg.smtp_host,
            cfg.smtp_port,
            timeout=10,
        )

    with client as smtp:
        if cfg.smtp_mode == "starttls":
            smtp.ehlo()
            smtp.starttls(context=context)
            smtp.ehlo()

        if cfg.smtp_username:
            smtp.login(
                cfg.smtp_username,
                cfg.smtp_password.get_secret_value()
            )

        smtp.send_message(message)
