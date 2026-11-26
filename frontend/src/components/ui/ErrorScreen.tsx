'use client';

import Logo from '@/components/ui/Logo';
import { BUTTON_PRIMARY, MONO_LABEL } from '@/components/ui/styles';

// Один экран для всех error boundary: тот же разворот, что у 404.
export default function ErrorScreen({
  code,
  title,
  description,
  reset,
}: {
  code: string;
  title: string;
  description: string;
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col bg-paper px-6 py-8 text-ink sm:px-12 lg:min-h-dvh lg:px-16 xl:px-24">
      <header className="relative border-t-2 border-ink pt-3 pb-1">
        <span aria-hidden className="absolute -top-0.5 left-0 h-0.5 w-6 bg-signal" />
        <Logo />
      </header>

      <main role="alert" className="auth-enter flex flex-1 flex-col justify-center py-16">
        <p className={`flex items-center gap-3 text-ink-soft ${MONO_LABEL}`}>
          <span aria-hidden className="size-2 bg-signal" />
          {code}
        </p>
        <h1 className="mt-6 text-[clamp(2.5rem,6vw,6rem)] leading-[0.9] font-semibold tracking-[-0.05em] text-balance">
          {title}
          <span className="text-signal">.</span>
        </h1>
        <p className="mt-8 max-w-md text-base leading-relaxed text-ink-soft sm:text-lg">
          {description}
        </p>

        <button type="button" onClick={reset} className={`${BUTTON_PRIMARY} mt-10 sm:w-72`}>
          <span
            aria-hidden
            className="absolute inset-0 origin-left scale-x-0 bg-signal transition-transform duration-500 ease-swiss group-hover:scale-x-100"
          />
          <span className="relative text-lg font-medium tracking-tight">Попробовать снова</span>
          <svg
            aria-hidden
            width="28"
            height="12"
            viewBox="0 0 28 12"
            fill="none"
            className="relative transition-transform duration-500 ease-swiss group-hover:translate-x-1.5"
          >
            <path d="M0 6h26M21 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </main>

      <footer className={`flex justify-between border-t border-ink/15 pt-4 text-ink-soft ${MONO_LABEL}`}>
        <span>© 2026</span>
        <span>Учебная платформа</span>
      </footer>
    </div>
  );
}
