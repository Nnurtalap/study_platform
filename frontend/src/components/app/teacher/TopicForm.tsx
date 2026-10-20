'use client';

import { useState } from 'react';
import { createTopic, type Topic } from '@/api/library';
import { FormError } from '@/components/auth/AuthUI';
import { useMutation } from '@/hooks/useMutation';
import { ActionButton, Field } from '../form';

export default function TopicForm({
  subjectId,
  onCreated,
}: {
  subjectId: number;
  onCreated: (topic: Topic) => void;
}) {
  const [name, setName] = useState('');
  const { run, isLoading, error } = useMutation(createTopic);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const topic = await run(subjectId, name.trim());
    if (!topic) return;

    setName('');
    onCreated(topic);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field
        index="01"
        label="Новая тема"
        placeholder="Квадратные уравнения"
        required
        maxLength={160}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      {error && <FormError>{error}</FormError>}

      <ActionButton
        label="Добавить тему"
        loadingLabel="Добавляем"
        isLoading={isLoading}
        disabled={!name.trim()}
      />
    </form>
  );
}
