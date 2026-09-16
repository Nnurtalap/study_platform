'use client';

import { TextLink } from '@/components/auth/AuthUI';
import { useUser } from './session';
import StudentOverview from './StudentOverview';
import TeacherOverview from './TeacherOverview';
import { EmptyState, Notice, PageHeader } from './ui';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

export default function Dashboard() {
  const user = useUser();
  const name = user.email.split('@')[0];
  const isTeacher = user.role === 'teacher' || user.is_superuser;
  const isStudent = user.role === 'student' && !isTeacher;

  return (
    <div className="fade-in space-y-8">
      <PageHeader
        title={`${greeting()}, ${name}`}
        description={
          isTeacher
            ? 'Библиотека предметов и заданий для ваших тестов.'
            : 'Здесь собраны тесты, которые вам назначили.'
        }
      />

      {!user.is_verified && (
        <Notice>
          <span>Почта ещё не подтверждена — подтвердите её, чтобы не потерять доступ.</span>
          <TextLink href="/verify">Подтвердить</TextLink>
        </Notice>
      )}

      {isTeacher && <TeacherOverview />}
      {isStudent && <StudentOverview />}
      {!isTeacher && !isStudent && (
        <EmptyState title="Раздел администратора в разработке">
          Для этой роли пока нет доступных разделов.
        </EmptyState>
      )}
    </div>
  );
}
