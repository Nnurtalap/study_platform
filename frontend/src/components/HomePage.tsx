import Link from 'next/link';
import HeroActions from './home/HeroActions';
import HomeNav from './home/HomeNav';
import LearningCycle from './home/LearningCycle';

const HEADLINE = ['Учёба,', 'собранная', 'в систему'];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-paper px-6 py-8 text-ink sm:px-12 lg:min-h-dvh lg:px-16 xl:px-24">
      <header className="relative flex items-center justify-between gap-4 border-t-2 border-ink pt-3 pb-1">
        <span aria-hidden className="absolute -top-0.5 left-0 h-0.5 w-6 bg-signal" />
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-semibold tracking-tight outline-none focus-visible:text-signal-deep"
        >
          <span aria-hidden className="size-3 bg-signal" />
          Study Platform
        </Link>
        <HomeNav />
      </header>

      <main className="grid flex-1 gap-y-14 py-12 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-16 lg:py-14">
        <section className="auth-enter flex flex-col justify-center lg:col-span-7 lg:row-start-1">
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
            <span aria-hidden className="size-2 bg-signal" />
            00 / Учебная платформа
          </p>

          <h1 className="mt-6 text-[clamp(3rem,7.4vw,7.5rem)] leading-[0.9] font-semibold tracking-[-0.05em]">
            {HEADLINE.map((line, i) => (
              <span key={line} className="block">
                {line}
                {i === HEADLINE.length - 1 && <span className="text-signal">.</span>}
              </span>
            ))}
          </h1>

          <p className="mt-8 max-w-md text-base leading-relaxed text-ink-soft sm:text-lg">
            Преподаватель собирает тесты из заданий, группа решает, а разбор показывает каждому его
            слабые темы.
          </p>

          <div className="mt-10">
            <HeroActions />
          </div>
        </section>

        <LearningCycle />
      </main>

      <footer className="flex justify-between border-t border-ink/15 pt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
        <span>© 2026</span>
        <span>Задания · Тесты · Разбор</span>
      </footer>
    </div>
  );
}
