'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthPoster, { type AuthVariant } from './AuthPoster';

const VARIANTS: Partial<Record<string, AuthVariant>> = {
  '/login': 'login',
  '/register': 'register',
  '/forgot-password': 'forgot',
  '/reset-password': 'reset',
  '/verify': 'verify',
  '/logout': 'logout',
};

const TABS = [
  { href: '/login', index: '01', label: 'Вход' },
  { href: '/register', index: '02', label: 'Регистрация' },
] as const;

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const variant = VARIANTS[pathname] ?? 'login';
  const isPrimary = variant === 'login' || variant === 'register';
  const back = variant === 'logout' ? { href: '/', label: 'На главную' } : { href: '/login', label: 'Ко входу' };

  return (
    <div className="grid flex-1 bg-paper text-ink lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <AuthPoster variant={variant} />

      <main className="flex flex-col px-6 py-8 sm:px-12 lg:min-h-dvh lg:px-16 xl:px-24">
        {isPrimary ? (
          <nav aria-label="Авторизация" className="grid grid-cols-2 border-t-2 border-ink">
            {TABS.map((tab) => {
              const isActive = pathname === tab.href;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group relative flex items-baseline gap-3 pt-3 pb-1 outline-none transition-colors focus-visible:text-signal-deep ${
                    isActive ? 'text-ink' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute -top-0.5 left-0 h-0.5 bg-signal transition-[width] duration-700 ease-swiss ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-6'
                    }`}
                  />
                  <span className="font-mono text-[11px] tracking-[0.16em]">{tab.index}</span>
                  <span className="text-sm font-medium">{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : (
          <nav
            aria-label="Навигация"
            className="relative flex items-baseline justify-between gap-4 border-t-2 border-ink pt-3 pb-1"
          >
            <span aria-hidden className="absolute -top-0.5 left-0 h-0.5 w-6 bg-signal" />
            <Link
              href={back.href}
              className="group flex items-baseline gap-2 text-sm font-medium outline-none hover:text-signal-deep focus-visible:text-signal-deep"
            >
              <span aria-hidden className="transition-transform duration-500 ease-swiss group-hover:-translate-x-1">
                ←
              </span>
              {back.label}
            </Link>
          </nav>
        )}

        <div className="flex flex-1 items-center py-14 lg:py-16">
          <div className="w-full max-w-md">{children}</div>
        </div>

        <footer className="flex justify-between border-t border-ink/15 pt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
          <span>© 2026</span>
          <span>Учебная платформа</span>
        </footer>
      </main>
    </div>
  );
}
