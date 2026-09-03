import { ApiError } from '@/api/config';

export function translateError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Что то пошло не так, попробуйте позже.';
  }

  if (error.detail === 'REGISTER_USER_ALREADY_EXISTS') {
    return 'Пользователь с такой почтой уже зарегистрирован';
  }

  if (error.detail === 'LOGIN_BAD_CREDENTIALS') {
    return 'Неверная почта или пароль';
  }

  if (error.detail === 'LOGIN_USER_NOT_VERIFIED') {
    return 'Почта не подтверждена';
  }

  if (error.status === 0) {
    return 'Сервер недоступен';
  }

  return error.message;
}
