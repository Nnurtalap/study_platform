'use client';

import { register } from '@/api/auth/auth';
import { useState } from 'react';
import { translateError } from './translateError';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsloading(true);

    try {
      const user = await register({ email, password });
      setIsDone(true);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setIsloading(false);
    }
  }

  if (isDone) return <p>Регистрация завершена. Теперь можно войти.</p>;

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

      {error && <p className="text-red">{error}</p>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Регистрируем' : 'Зарегистрироваться'}
      </button>
    </form>
  );
}
