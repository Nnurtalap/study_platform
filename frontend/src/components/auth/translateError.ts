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

  // Ошибки кабинета: бэкенд пока отдаёт их английским текстом
  'Assignment not found': 'Тест не найден или не назначен вам',
  'Assignment already completed': 'Тест уже завершён',
  'Assignment deadline has passed': 'Срок сдачи теста истёк',
  'Answer all tasks before completing the test': 'Ответьте на все задания, чтобы завершить тест',
  'This task is not part of the assigned test': 'Это задание не входит в тест',
  'You have already submitted an answer for this task': 'Ответ на это задание уже отправлен',
  'Submission not found': 'Ответ не найден',

  // Библиотека преподавателя
  'Subject with this name or slug already exists': 'Предмет с таким названием или кодом уже существует',
  'Subject not found': 'Предмет не найден',
  'Topic with this name already exists in this subject': 'Тема с таким названием уже есть в этом предмете',
  'Topic does not exist': 'Тема не найдена — выберите другую',
  'Task not found': 'Задание не найдено',
  'Task does not exist': 'Задание не найдено или создано другим преподавателем',

  // Тесты и назначения
  'Test not found': 'Тест не найден или создан другим преподавателем',
  'This task is already in the test': 'Это задание уже есть в тесте',
  'Assigned test cannot be modified': 'Тест уже назначен — состав заданий менять нельзя',
  'Cannot assign an empty test': 'Нельзя назначить пустой тест — сначала добавьте задания',
  'Student does not exist': 'Студент с таким номером не найден',
  'This user is not a student': 'Этот пользователь не студент',
  'Student is inactive': 'Аккаунт студента отключён',
  'Invalid assignment target': 'Не удалось назначить тест — проверьте получателя',

  // Группы
  'Group not found': 'Группа не найдена или принадлежит другому преподавателю',
  'Group does not exist or is not yours': 'Группа не найдена или принадлежит другому преподавателю',
  'Group has no active students': 'В группе нет активных студентов — сначала добавьте студентов',
  'User with this email not found': 'Пользователь с такой почтой не найден',
  'Student is already enrolled in this group': 'Студент уже в этой группе',
};

// Ошибки валидации pydantic приходят массивом [{ msg }], а не строкой-кодом,
// поэтому их узнаём по подстроке в уже склеенном сообщении
const VALIDATION_MESSAGES: [needle: string, message: string][] = [
  ['Specify exactly one of student_id or group_id', 'Выберите одного получателя: группу или студента'],
  ['Input should be greater than 0', 'Значение должно быть больше нуля'],
  ['valid email address', 'Укажите корректный адрес почты'],
  ['Input should be a valid datetime', 'Укажите дату и время'],
];

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

  // Конкретное сообщение бэкенда всегда важнее общей формулировки по статусу
  const code = getErrorCode(error);
  if (typeof code === 'string' && Object.hasOwn(MESSAGES, code)) {
    return MESSAGES[code];
  }

  if (error.status === 401) {
    return 'Сессия истекла, войдите снова';
  }

  if (error.status === 403) {
    // detail у ролевых проверок уже на русском — показываем его, если он есть
    return typeof error.detail === 'string' ? error.detail : 'Недостаточно прав для этого действия';
  }

  if (error.status === 404) {
    return 'Не найдено';
  }

  if (error.status === 422) {
    const match = VALIDATION_MESSAGES.find(([needle]) => error.message.includes(needle));
    return match ? match[1] : 'Проверьте правильность заполнения полей';
  }

  return error.message;
}
