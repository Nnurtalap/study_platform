FROM python:3.12-slim

# Отключаем генерацию .pyc файлов и включем буферизацию вывода для логов
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    # Настройки Poetry:
    # Отключаем создание виртуального окружения в контейнере,
    # так как сам Docker-контейнер уже является изолированным окружением
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1 \
    POETRY_VERSION=1.8.3

# Устанавливаем poetry
RUN pip install --no-cache-dir "poetry==$POETRY_VERSION"

WORKDIR /app

# Шаг 1: Копируем только конфигурационные файлы зависимостей.
# Это позволяет Docker кэшировать установку пакетов, если зависимост
# не менялись.
COPY pyproject.toml poetry.lock* ./

# Шаг 2: Устанавливаем только продакшн-зависимости (без dev-пакетов типа pytest, ruff и т.д.)
RUN poetry install --no-root --without dev --no-cache

# Шаг 3: Копируем исходный код приложения
COPY . .

# Переходим в рабочую директорию приложения
WORKDIR /app/fastapi-application

EXPOSE 8000

# Запускаем Gunicorn напрямую (так как виртуальное окружение не создавалось)
CMD ["gunicorn", "main:main_app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]