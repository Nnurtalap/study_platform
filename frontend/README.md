# Study Platform — фронтенд

Next.js 16 (App Router) + React 19 + Tailwind 4. Весь интерфейс на русском.

## Запуск

```bash
npm install
npm run dev          # http://localhost:3000
```

Адрес API задаётся в `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Бэкенд поднимается из каталога `../backend` через `docker compose up -d` — compose
публикует API на порту 8080. Если запускать бэкенд напрямую (`run_main.py`), он
слушает 8000, и переменную нужно поправить.

## Проверки

```bash
npx tsc --noEmit     # типы
npx eslint src       # линт
npm run build        # сборка
```

## Структура

```
src/api/          слой запросов: apiFetch, authApi, модули по доменам
src/app/          роуты: (auth) — вход/регистрация, (app) — кабинет
src/components/   auth/ home/ app/ — экраны, ui/ — общие примитивы
src/hooks/        useQuery, useMutation, useIsSignedIn, useRecentIds
src/lib/          хранилище браузера (индекс тестов и групп)
```

Дизайн-токены (paper/ink/signal/cobalt/ochre) и анимации — в `src/app/globals.css`.
