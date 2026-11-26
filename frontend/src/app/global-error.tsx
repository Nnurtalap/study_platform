'use client';

import './globals.css';

// Последняя граница: падение в корневом layout, поэтому html/body рендерим сами
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <div className="flex flex-1 flex-col bg-paper px-6 py-8 text-ink sm:px-12 lg:min-h-dvh lg:px-16">
          <header className="relative border-t-2 border-ink pt-3 pb-1">
            <span aria-hidden className="absolute -top-0.5 left-0 h-0.5 w-6 bg-signal" />
            <span className="flex items-center gap-2.5 text-sm font-semibold tracking-tight">
              <span aria-hidden className="size-3 bg-signal" />
              Study Platform
            </span>
          </header>

          <main role="alert" className="flex flex-1 flex-col justify-center py-16">
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
              <span aria-hidden className="size-2 bg-signal" />
              500 / Сбой
            </p>
            <h1 className="mt-6 text-[clamp(2.5rem,6vw,6rem)] leading-[0.9] font-semibold tracking-[-0.05em]">
              Приложение не загрузилось
              <span className="text-signal">.</span>
            </h1>
            <button
              type="button"
              onClick={reset}
              className="mt-10 cursor-pointer self-start bg-ink px-5 py-3 text-paper"
            >
              Попробовать снова
            </button>
          </main>
        </div>
      </body>
    </html>
  );
}
