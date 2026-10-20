'use client';

import { useState } from 'react';
import { createSubject, type Subject } from '@/api/library';
import { FormError } from '@/components/auth/AuthUI';
import { MONO_LABEL } from '@/components/ui/styles';
import { useMutation } from '@/hooks/useMutation';
import { ActionButton, Field } from '../form';

export default function SubjectForm({ onCreated }: { onCreated: (subject: Subject) => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const { run, isLoading, error } = useMutation(createSubject);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = await run(name.trim(), slug.trim());
    if (!subject) return;

    setName('');
    setSlug('');
    onCreated(subject);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field
        index="01"
        label="Название"
        placeholder="Алгебра"
        required
        maxLength={120}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Field
        index="02"
        label="Код"
        placeholder="algebra"
        required
        maxLength={60}
        autoCapitalize="off"
        spellCheck={false}
        value={slug}
        onChange={(event) => setSlug(event.target.value)}
        hint={
          <p className={`${MONO_LABEL} text-ink-soft`}>Латиницей, без пробелов — виден в списке</p>
        }
      />

      {error && <FormError>{error}</FormError>}

      <ActionButton
        label="Создать предмет"
        loadingLabel="Создаём"
        isLoading={isLoading}
        disabled={!name.trim() || !slug.trim()}
      />
    </form>
  );
}
