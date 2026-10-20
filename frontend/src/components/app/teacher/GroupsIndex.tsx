'use client';

import { useState } from 'react';
import { createGroup, getGroup, type GroupWithStudents } from '@/api/groups';
import { FormError } from '@/components/auth/AuthUI';
import { MONO_LABEL } from '@/components/ui/styles';
import { useMutation } from '@/hooks/useMutation';
import { useQuery } from '@/hooks/useQuery';
import { useRecentIds } from '@/hooks/useRecentIds';
import { ActionButton, Field } from '../form';
import { Empty, Eyebrow, Notice, PageTitle, RetryNotice, Section, SkeletonRows, plural } from '../ui';
import { DeadRow, loadMany, OpenByIdForm, RecentRow, StorageNotice, type RecentEntry } from './recent';

export default function GroupsIndex() {
  const { ids, remember, forget, isPersistent } = useRecentIds('groups');
  const key = ids.join(',');
  const { data, error, isLoading, reload } = useQuery<RecentEntry<GroupWithStudents>[]>(
    `groups:${key}`,
    () => loadMany(ids, getGroup),
  );

  const [name, setName] = useState('');
  const create = useMutation(createGroup);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const group = await create.run(name.trim());
    if (!group) return;

    setName('');
    remember(group.id);
  }

  const entries = data ?? [];

  return (
    <div className="auth-enter space-y-14">
      <header>
        <Eyebrow>02 / Группы</Eyebrow>
        <PageTitle>
          Группы<span className="text-signal">.</span>
        </PageTitle>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
          Группа — список студентов, которым можно назначить тест одним действием.
          Студент добавляется по почте его аккаунта.
        </p>
      </header>

      {!isPersistent && <StorageNotice />}

      <Section
        index="01"
        title="Ваши группы"
        aside={ids.length > 0 ? 'в этом браузере' : undefined}
      >
        {error && !data ? (
          <RetryNotice error={error} onRetry={reload} />
        ) : ids.length === 0 ? (
          <Empty title="Групп пока нет">
            Создайте группу ниже — её номер запомнится в этом браузере.
          </Empty>
        ) : isLoading && !data ? (
          <SkeletonRows rows={2} />
        ) : (
          <ul>
            {entries.map((entry) =>
              entry.data ? (
                <RecentRow
                  key={entry.id}
                  href={`/groups/${entry.id}`}
                  title={entry.data.name}
                  aside={`№ ${entry.id}`}
                >
                  {entry.data.students.length}{' '}
                  {plural(entry.data.students.length, 'студент', 'студента', 'студентов')}
                </RecentRow>
              ) : (
                <DeadRow
                  key={entry.id}
                  id={entry.id}
                  error={entry.error}
                  onForget={() => forget(entry.id)}
                />
              ),
            )}
          </ul>
        )}
      </Section>

      <div className="grid gap-14 lg:grid-cols-2 lg:gap-x-12">
        <Section index="02" title="Новая группа">
          <form onSubmit={handleCreate} className="space-y-6">
            <Field
              index="01"
              label="Название"
              placeholder="10-А"
              required
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

            {create.error && <FormError>{create.error}</FormError>}

            <ActionButton
              label="Создать группу"
              loadingLabel="Создаём"
              isLoading={create.isLoading}
              disabled={!name.trim()}
            />
          </form>
        </Section>

        <Section index="03" title="Открыть по номеру">
          <p className={`mb-6 text-ink-soft ${MONO_LABEL}`}>
            Если группа создана в другом браузере
          </p>
          <OpenByIdForm label="Номер группы" hrefPrefix="/groups" />
        </Section>
      </div>

      <Notice mark="soft">
        Список групп хранится только в этом браузере: у API нет эндпоинта, который вернул бы
        все ваши группы. Сами группы и их состав живут на сервере.
      </Notice>
    </div>
  );
}
