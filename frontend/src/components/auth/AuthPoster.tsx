import type { CSSProperties } from 'react';

export type AuthVariant = 'login' | 'register' | 'forgot' | 'reset' | 'verify' | 'logout';
type Shape = 'sun' | 'bar' | 'arc' | 'ring' | 'dot' | 'line';

// Одна и та же композиция перестраивается при переходе между страницами:
// фигуры плавно меняют положение, размер и поворот.
const COMPOSITION: Record<AuthVariant, Record<Shape, CSSProperties>> = {
  login: {
    sun: { left: '4%', top: '4%', width: '48%' },
    bar: { left: '60%', top: '0%', width: '11%', height: '74%' },
    arc: { left: '32%', top: '56%', width: '32%', transform: 'rotate(0deg)' },
    ring: { left: '72%', top: '46%', width: '24%' },
    dot: { left: '82%', top: '8%', width: '6%', transform: 'rotate(0deg)' },
    line: { left: '-10%', top: '46%', width: '120%', transform: 'rotate(-22deg)' },
  },
  register: {
    sun: { left: '60%', top: '2%', width: '32%' },
    bar: { left: '0%', top: '48%', width: '66%', height: '10%' },
    arc: { left: '6%', top: '6%', width: '38%', transform: 'rotate(180deg)' },
    ring: { left: '34%', top: '60%', width: '30%' },
    dot: { left: '76%', top: '66%', width: '9%', transform: 'rotate(45deg)' },
    line: { left: '-10%', top: '46%', width: '120%', transform: 'rotate(58deg)' },
  },
  forgot: {
    sun: { left: '18%', top: '26%', width: '20%' },
    bar: { left: '48%', top: '0%', width: '7%', height: '62%' },
    arc: { left: '56%', top: '34%', width: '36%', transform: 'rotate(90deg)' },
    ring: { left: '6%', top: '2%', width: '44%' },
    dot: { left: '86%', top: '82%', width: '6%', transform: 'rotate(0deg)' },
    line: { left: '-10%', top: '66%', width: '120%', transform: 'rotate(0deg)' },
  },
  reset: {
    sun: { left: '52%', top: '18%', width: '40%' },
    bar: { left: '6%', top: '6%', width: '40%', height: '20%' },
    arc: { left: '6%', top: '58%', width: '40%', transform: 'rotate(0deg)' },
    ring: { left: '40%', top: '4%', width: '20%' },
    dot: { left: '22%', top: '36%', width: '8%', transform: 'rotate(45deg)' },
    line: { left: '-10%', top: '50%', width: '120%', transform: 'rotate(-45deg)' },
  },
  verify: {
    sun: { left: '32%', top: '10%', width: '36%' },
    bar: { left: '47%', top: '56%', width: '6%', height: '44%' },
    arc: { left: '4%', top: '62%', width: '28%', transform: 'rotate(-90deg)' },
    ring: { left: '22%', top: '-4%', width: '56%' },
    dot: { left: '80%', top: '66%', width: '7%', transform: 'rotate(0deg)' },
    line: { left: '-10%', top: '44%', width: '120%', transform: 'rotate(0deg)' },
  },
  logout: {
    sun: { left: '58%', top: '50%', width: '32%' },
    bar: { left: '0%', top: '72%', width: '100%', height: '5%' },
    arc: { left: '8%', top: '8%', width: '30%', transform: 'rotate(180deg)' },
    ring: { left: '50%', top: '4%', width: '26%' },
    dot: { left: '30%', top: '46%', width: '6%', transform: 'rotate(45deg)' },
    line: { left: '-10%', top: '40%', width: '120%', transform: 'rotate(-8deg)' },
  },
};

export const POSTER_COPY: Record<AuthVariant, { index: string; label: string; lines: string[] }> = {
  login: { index: '01', label: 'Вход', lines: ['Учись', 'по системе,', 'а не наугад.'] },
  register: { index: '02', label: 'Регистрация', lines: ['Начни', 'с чистого', 'листа.'] },
  forgot: { index: '03', label: 'Восстановление', lines: ['Забыть —', 'не страшно.', 'Восстановим.'] },
  reset: { index: '04', label: 'Новый пароль', lines: ['Новый', 'пароль —', 'новый ключ.'] },
  verify: { index: '05', label: 'Подтверждение', lines: ['Одна почта,', 'один шаг', 'до старта.'] },
  logout: { index: '06', label: 'Выход', lines: ['До', 'скорой', 'встречи.'] },
};

const PILLARS = ['Задания', 'Тесты', 'Разбор решений'];

export default function AuthPoster({ variant }: { variant: AuthVariant }) {
  const layout = COMPOSITION[variant];
  const copy = POSTER_COPY[variant];

  return (
    <aside className="poster-grid relative isolate flex min-h-[19rem] flex-col overflow-hidden bg-ink p-6 text-paper sm:min-h-[26rem] sm:p-10 lg:sticky lg:top-0 lg:h-dvh lg:p-12">
      <div className="relative z-10 flex items-start justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.16em] text-paper/60">
        <span className="flex items-center gap-2.5 font-sans text-sm font-semibold normal-case tracking-tight text-paper">
          <span aria-hidden className="size-3 bg-signal" />
          Study Platform
        </span>
        <span className="hidden sm:block">
          № {copy.index} — {copy.label}
        </span>
        <span>2026</span>
      </div>

      <div aria-hidden className="relative my-6 flex-1">
        <span className="shape aspect-square rounded-full bg-signal" style={layout.sun} />
        <span className="shape bg-cobalt" style={layout.bar} />
        <span className="shape aspect-[2/1] rounded-t-full bg-ochre" style={layout.arc} />
        <span className="shape aspect-square" style={layout.ring}>
          <span className="ring-spin block size-full rounded-full border border-dashed border-paper/50" />
        </span>
        <span className="shape aspect-square bg-paper" style={layout.dot} />
        <span className="shape h-px bg-paper/70" style={layout.line} />
      </div>

      <div className="relative z-10">
        <p
          key={variant}
          className="text-[clamp(2.25rem,5.4vw,6rem)] font-semibold leading-[0.92] tracking-[-0.045em]"
        >
          {copy.lines.map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.08em]">
              <span className="poster-line block" style={{ animationDelay: `${i * 90}ms` }}>
                {line}
              </span>
            </span>
          ))}
        </p>

        <ul className="mt-10 hidden grid-cols-3 gap-6 border-t border-paper/20 pt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-paper/60 lg:grid">
          {PILLARS.map((item, i) => (
            <li key={item} className="flex flex-col gap-1">
              <span className="text-signal">{String(i + 1).padStart(2, '0')}</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
