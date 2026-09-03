'use client';

import { login } from '@/api/auth/auth';
import { useState } from 'react';
import { translateError } from './translateError';

export default function Login() {
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
      const { access_token } = await login(email, password);
      localStorage.setItem('access_token', access_token);
      setIsDone(true);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setIsloading(false);
    }
  }

  if (isDone) {
    return <p>Добро пожаловать</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        autoComplete="email"
        required
        onChange={(e) => setEmail(e.target.value)}
        value={email}
      />
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        required
        onChange={(e) => setPassword(e.target.value)}
        value={password}
      />
      {error && <p className="text-red-600">{error}</p>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Выполняется вход' : 'Войти'}
      </button>
    </form>
  );
}
