import Logo from '@/components/ui/Logo';
import HeroActions from './home/HeroActions';
import HomeNav from './home/HomeNav';

const STEPS = [
  { title: 'Предметы и темы', text: 'Задания собраны в одну библиотеку по темам.' },
  { title: 'Тесты', text: 'Преподаватель собирает тест и назначает его группе.' },
  { title: 'Решения', text: 'Студенты отвечают — работы уходят на проверку.' },
  { title: 'Разбор', text: 'Балл, комментарий и слабые темы — каждому.' },
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col px-4 sm:px-6">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between">
        <Logo />
        <HomeNav />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-16 sm:py-24">
        <section className="fade-in max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-soft">
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            Учебная платформа
          </p>

          <h1 className="mt-6 text-4xl leading-[1.05] font-semibold tracking-tight text-balance text-ink sm:text-6xl">
            Учёба, собранная в&nbsp;систему
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
            Преподаватель собирает тесты из заданий, группа решает, а разбор показывает каждому его
            слабые темы.
          </p>

          <div className="mt-8">
            <HeroActions />
          </div>
        </section>

        <ol className="fade-in mt-20 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="bg-surface p-5">
              <span className="font-mono text-xs text-ink-soft">0{i + 1}</span>
              <p className="mt-3 text-sm font-medium text-ink">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl justify-between border-t border-line py-5 text-xs text-ink-soft">
        <span>© 2026 Study Platform</span>
        <span>Задания · Тесты · Разбор</span>
      </footer>
    </div>
  );
}
