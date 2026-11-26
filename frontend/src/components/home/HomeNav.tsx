'use client';

import Link from 'next/link';
import { NAV_LINK } from '@/components/ui/styles';
import { useIsHydrated } from '@/hooks/useIsHydrated';
import { useIsSignedIn } from '@/hooks/useIsSignedIn';

export default function HomeNav() {
  const isHydrated = useIsHydrated();
  const isSignedIn = useIsSignedIn();

  // Токен виден только в браузере: до гидрации держим место, но не показываем
  // гостевые ссылки вошедшему пользователю — иначе они на миг мелькают
  const links = !isHydrated
    ? []
    : isSignedIn
      ? [
          { href: '/dashboard', label: 'Кабинет' },
          { href: '/logout', label: 'Выйти' },
        ]
      : [
          { href: '/login', label: 'Вход' },
          { href: '/register', label: 'Регистрация' },
        ];

  return (
    <nav aria-label="Аккаунт" className="flex min-h-5 items-baseline gap-6">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={NAV_LINK}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
