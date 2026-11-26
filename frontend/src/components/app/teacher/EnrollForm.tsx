'use client';

import { useState } from 'react';
import { enrollStudent } from '@/api/groups';
import { FormError } from '@/components/auth/AuthUI';
import { MONO_LABEL } from '@/components/ui/styles';
import { useMutation } from '@/hooks/useMutation';
import { ActionButton, Field } from '../form';

export default function EnrollForm({
  groupId,
  onEnrolled,
}: {
  groupId: number;
  onEnrolled: () => void;
}) {
  const [email, setEmail] = useState('');
  const { run, isLoading, error } = useMutation(enrollStudent);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await run(groupId, email.trim());
    if (!result) return;

    setEmail('');
    onEnrolled();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field
        index="01"
        label="Почта студента"
        type="email"
        inputMode="email"
        autoComplete="off"
        placeholder="name@example.com"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        hint={
          <p className={`${MONO_LABEL} text-ink-soft`}>
            У студента уже должен быть аккаунт на платформе
          </p>
        }
      />

      {error && <FormError>{error}</FormError>}

      <ActionButton
        label="Добавить в группу"
        loadingLabel="Добавляем"
        isLoading={isLoading}
        disabled={!email.trim()}
      />
    </form>
  );
}
