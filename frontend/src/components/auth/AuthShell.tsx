'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Logo from '@/components/ui/Logo';
import { useIsSignedIn } from '@/hooks/useIsSignedIn';

const TABS = [
  { href: '/login', label: 'Вход' },
  { href: '/register', label: 'Регистрация' },
] as const;

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isSignedIn = useIsSignedIn();
  const isPrimary = pathname === '/login' || pathname === '/register';

  // Уже вошедшему пользователю формы входа не нужны — сразу в кабинет
  useEffect(() => {
    if (isPrimary && isSignedIn) router.replace('/dashboard');
  }, [isPrimary, isSignedIn, router]);

  return (
    <div className="flex min-h-dvh flex-1 flex-col px-4 py-6 sm:px-6">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Logo />
        <Link
          href="/"
          className="rounded-md px-2 py-1 text-sm text-ink-soft outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
        >
          На главную
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm">
          {isPrimary && (
            <nav
              aria-label="Авторизация"
              className="mb-6 grid grid-cols-2 rounded-lg border border-line bg-surface p-1"
            >
              {TABS.map((tab) => {
                const isActive = pathname === tab.href;

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`rounded-md py-1.5 text-center text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
                      isActive ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-8">
            {children}
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-ink-soft">© 2026 Study Platform</footer>
    </div>
  );
}
