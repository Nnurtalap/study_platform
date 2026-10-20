'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { getGroup } from '@/api/groups';
import { ApiError } from '@/api/config';
import { TextLink } from '@/components/auth/AuthUI';
import { MONO_LABEL } from '@/components/ui/styles';
import { useQuery } from '@/hooks/useQuery';
import { useRecentIds } from '@/hooks/useRecentIds';
import { Empty, Eyebrow, PageTitle, plural, RetryNotice, Section, SkeletonRows } from '../ui';
import AssignForm from './AssignForm';
import EnrollForm from './EnrollForm';

export default function GroupView({ id }: { id: number | null }) {
  const { data, error, isLoading, reload } = useQuery(id === null ? null : `group:${id}`, () =>
    getGroup(id!),
  );
  const { remember } = useRecentIds('groups');

  // Открытие по номеру наполняет индекс: группа точно существует и принадлежит вам
  useEffect(() => {
    if (data) remember(data.id);
  }, [data, remember]);

  const isNotFound = id === null || (error instanceof ApiError && error.status === 404);

  return (
    <div className="auth-enter space-y-12">
      <Link
        href="/groups"
        className="group inline-flex items-baseline gap-2 text-sm font-medium outline-none hover:text-signal-deep focus-visible:text-signal-deep"
      >
        <span aria-hidden className="transition-transform duration-500 ease-swiss group-hover:-translate-x-1">
          ←
        </span>
        Все группы
      </Link>

      {isNotFound ? (
        <Empty title="Группа не найдена">
          Возможно, номер неверен или группа создана другим преподавателем.{' '}
          <TextLink href="/groups">Ко всем группам →</TextLink>
        </Empty>
      ) : error && !data ? (
        <RetryNotice error={error} onRetry={reload} />
      ) : isLoading && !data ? (
        <SkeletonRows rows={3} />
      ) : data ? (
        <>
          {error ? <RetryNotice error={error} onRetry={reload} /> : null}

          <header>
            <Eyebrow>Группа № {data.id}</Eyebrow>
            <PageTitle>{data.name}</PageTitle>
            <p className={`mt-5 text-ink-soft ${MONO_LABEL}`}>
              {data.students.length}{' '}
              {plural(data.students.length, 'студент', 'студента', 'студентов')}
            </p>
          </header>

          <div className="grid gap-14 lg:grid-cols-12 lg:gap-x-12">
            <div className="lg:col-span-7">
              <Section
                index="01"
                title="Состав"
                aside={String(data.students.length).padStart(2, '0')}
              >
                {data.students.length === 0 ? (
                  <Empty title="В группе пока никого нет">
                    Добавьте студента по почте — справа.
                  </Empty>
                ) : (
                  <ul>
                    {data.students.map((student) => (
                      <li
                        key={student.id}
                        className="flex items-baseline justify-between gap-4 border-b border-ink/15 py-3"
                      >
                        <span className="min-w-0 truncate font-medium">{student.email}</span>
                        <span className={`shrink-0 text-ink-soft ${MONO_LABEL}`}>
                          № {student.id}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>

            <div className="lg:col-span-5">
              <Section index="02" title="Добавить студента">
                <EnrollForm groupId={data.id} onEnrolled={reload} />
              </Section>
            </div>
          </div>

          <Section index="03" title="Назначить тест">
            <AssignForm group={data} />
          </Section>
        </>
      ) : null}
    </div>
  );
}
