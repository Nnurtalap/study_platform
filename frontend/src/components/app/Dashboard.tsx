'use client';

import { TextLink } from '@/components/auth/AuthUI';
import { useUser } from './session';
import StudentOverview from './StudentOverview';
import TeacherOverview from './TeacherOverview';
import { Empty, Eyebrow, Notice, PageTitle } from './ui';

export default function Dashboard() {
  const user = useUser();
  const name = user.email.split('@')[0];
  const isTeacher = user.role === 'teacher' || user.is_superuser;
  const isStudent = user.role === 'student' && !isTeacher;

  return (
    <div className="auth-enter space-y-14">
      <header>
        <Eyebrow>00 / Кабинет</Eyebrow>
        <PageTitle>
          Привет, {name}
          <span className="text-signal">.</span>
        </PageTitle>
        <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
          {isTeacher
            ? 'Библиотека предметов и заданий для ваших тестов.'
            : 'Здесь собраны тесты, которые вам назначили.'}
        </p>
      </header>

      {!user.is_verified && (
        <Notice>
          <span>Почта ещё не подтверждена.</span>
          <TextLink href="/verify">Подтвердить →</TextLink>
        </Notice>
      )}

      {isTeacher && <TeacherOverview />}
      {isStudent && <StudentOverview />}
      {!isTeacher && !isStudent && (
        <Empty title="Раздел администратора в разработке">
          Для этой роли пока нет доступных разделов.
        </Empty>
      )}
    </div>
  );
}
