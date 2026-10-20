'use client';

import { useState } from 'react';
import { createTest, getTest, type Test } from '@/api/tests';
import { FormError } from '@/components/auth/AuthUI';
import { MONO_LABEL } from '@/components/ui/styles';
import { useMutation } from '@/hooks/useMutation';
import { useQuery } from '@/hooks/useQuery';
import { useRecentIds } from '@/hooks/useRecentIds';
import { ActionButton, Field, Textarea } from '../form';
import { Empty, Eyebrow, Notice, PageTitle, plural, RetryNotice, Section, SkeletonRows } from '../ui';
import { DeadRow, loadMany, OpenByIdForm, RecentRow, StorageNotice, type RecentEntry } from './recent';

export default function TestsIndex() {
  const { ids, remember, forget, isPersistent } = useRecentIds('tests');
  const { data, error, isLoading, reload } = useQuery<RecentEntry<Test>[]>(
    `tests:${ids.join(',')}`,
    () => loadMany(ids, getTest),
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const create = useMutation(createTest);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const test = await create.run(title.trim(), description.trim());
    if (!test) return;

    setTitle('');
    setDescription('');
    remember(test.id);
  }

  const entries = data ?? [];

  return (
    <div className="auth-enter space-y-14">
      <header>
        <Eyebrow>03 / Тесты</Eyebrow>
        <PageTitle>
          Тесты<span className="text-signal">.</span>
        </PageTitle>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
          Тест — набор заданий с позициями и баллами. Сначала собирается состав, затем тест
          назначается группе или студенту. После назначения состав менять нельзя.
        </p>
      </header>

      {!isPersistent && <StorageNotice />}

      <Section index="01" title="Ваши тесты" aside={ids.length > 0 ? 'в этом браузере' : undefined}>
        {error && !data ? (
          <RetryNotice error={error} onRetry={reload} />
        ) : ids.length === 0 ? (
          <Empty title="Тестов пока нет">
            Создайте тест ниже — его номер запомнится в этом браузере.
          </Empty>
        ) : isLoading && !data ? (
          <SkeletonRows rows={2} />
        ) : (
          <ul>
            {entries.map((entry) =>
              entry.data ? (
                <RecentRow
                  key={entry.id}
                  href={`/tests/${entry.id}`}
                  title={entry.data.title}
                  aside={`№ ${entry.id}`}
                >
                  {entry.data.test_tasks.length}{' '}
                  {plural(entry.data.test_tasks.length, 'задание', 'задания', 'заданий')}
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
        <Section index="02" title="Новый тест">
          <form onSubmit={handleCreate} className="space-y-6">
            <Field
              index="01"
              label="Название"
              placeholder="Контрольная по алгебре"
              required
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <Textarea
              index="02"
              label="Описание"
              rows={3}
              maxLength={2000}
              placeholder="Что проверяет тест — увидит студент"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />

            {create.error && <FormError>{create.error}</FormError>}

            <ActionButton
              label="Создать тест"
              loadingLabel="Создаём"
              isLoading={create.isLoading}
              disabled={!title.trim()}
            />
          </form>
        </Section>

        <Section index="03" title="Открыть по номеру">
          <p className={`mb-6 text-ink-soft ${MONO_LABEL}`}>Если тест создан в другом браузере</p>
          <OpenByIdForm label="Номер теста" hrefPrefix="/tests" />
        </Section>
      </div>

      <Notice mark="soft">
        Список тестов хранится только в этом браузере: у API нет эндпоинта, который вернул бы
        все ваши тесты. Сами тесты живут на сервере — их можно открыть по номеру.
      </Notice>
    </div>
  );
}
