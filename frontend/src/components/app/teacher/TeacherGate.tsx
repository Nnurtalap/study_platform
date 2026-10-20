'use client';

import { TextLink } from '@/components/auth/AuthUI';
import { useIsTeacher } from '../session';
import { Empty, Eyebrow } from '../ui';

// Реальный гейт — на бэкенде (403 у каждого эндпоинта). Здесь мы лишь не монтируем
// страницу, чтобы студент не отправлял заведомо отклоняемый запрос.
// Без редиректа: он воевал бы с кнопкой «назад» и скрывал причину.
export default function TeacherGate({ children }: { children: React.ReactNode }) {
  const isTeacher = useIsTeacher();

  if (!isTeacher) {
    return (
      <div className="auth-enter space-y-8">
        <Eyebrow>403 / Доступ</Eyebrow>
        <Empty title="Раздел для преподавателей">
          Этот раздел доступен только преподавателям.{' '}
          <TextLink href="/dashboard">В кабинет →</TextLink>
        </Empty>
      </div>
    );
  }

  return <>{children}</>;
}
