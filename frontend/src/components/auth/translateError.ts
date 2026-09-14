import { ApiError } from '@/api/config';

const PASSWORD_LENGTH_MESSAGE = 'Пароль должен содержать от 12 до 128 символов';

// Коды ошибок fastapi-users: detail приходит строкой или объектом { code, reason }
const MESSAGES: Record<string, string> = {
  REGISTER_USER_ALREADY_EXISTS: 'Пользователь с такой почтой уже зарегистрирован',
  REGISTER_INVALID_PASSWORD: PASSWORD_LENGTH_MESSAGE,
  LOGIN_BAD_CREDENTIALS: 'Неверная почта или пароль',
  LOGIN_USER_NOT_VERIFIED: 'Почта не подтверждена',
  RESET_PASSWORD_BAD_TOKEN: 'Ссылка для сброса пароля недействительна или устарела',
  RESET_PASSWORD_INVALID_PASSWORD: PASSWORD_LENGTH_MESSAGE,
  VERIFY_USER_BAD_TOKEN: 'Ссылка подтверждения недействительна или устарела',
  VERIFY_USER_ALREADY_VERIFIED: 'Почта уже подтверждена',
};

export function getErrorCode(error: unknown): unknown {
  if (!(error instanceof ApiError)) return null;

  const { detail } = error;
  if (typeof detail === 'object' && detail !== null && 'code' in detail) {
    return (detail as { code: unknown }).code;
  }

  return detail;
}

export function translateError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Что-то пошло не так, попробуйте позже.';
  }

  if (error.status === 0) {
    return 'Сервер недоступен';
  }

  const code = getErrorCode(error);
  if (typeof code === 'string' && Object.hasOwn(MESSAGES, code)) {
    return MESSAGES[code];
  }

  if (error.status === 401) {
    return 'Сессия истекла, войдите снова';
  }

  if (error.status === 422) {
    return 'Проверьте правильность заполнения полей';
  }

  return error.message;
}
