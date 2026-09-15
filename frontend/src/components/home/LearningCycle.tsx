'use client';

import { useState, type CSSProperties } from 'react';

type Shape = 'sun' | 'bar' | 'arc' | 'ring' | 'dot' | 'line';

// Цикл платформы: каждая стадия — своя композиция из одних и тех же фигур
const STAGES: {
  index: string;
  label: string;
  text: string;
  layout: Record<Shape, CSSProperties>;
}[] = [
  {
    index: '01',
    label: 'Предметы',
    text: 'Темы и задания собраны в одну библиотеку.',
    layout: {
      sun: { left: '0%', top: '0%', width: '46%' },
      bar: { left: '56%', top: '0%', width: '44%', height: '14%' },
      arc: { left: '56%', top: '24%', width: '44%', transform: 'rotate(0deg)' },
      ring: { left: '0%', top: '56%', width: '44%' },
      dot: { left: '72%', top: '72%', width: '12%', transform: 'rotate(0deg)' },
      line: { left: '-20%', top: '50%', width: '140%', transform: 'rotate(0deg)' },
    },
  },
  {
    index: '02',
    label: 'Тесты',
    text: 'Преподаватель собирает тест и назначает его группе.',
    layout: {
      sun: { left: '30%', top: '30%', width: '40%' },
      bar: { left: '-20%', top: '88%', width: '140%', height: '8%' },
      arc: { left: '0%', top: '2%', width: '40%', transform: 'rotate(180deg)' },
      ring: { left: '52%', top: '-4%', width: '50%' },
      dot: { left: '84%', top: '62%', width: '9%', transform: 'rotate(45deg)' },
      line: { left: '-20%', top: '50%', width: '140%', transform: 'rotate(-45deg)' },
    },
  },
  {
    index: '03',
    label: 'Решения',
    text: 'Студенты отвечают — работы приходят на проверку.',
    layout: {
      sun: { left: '62%', top: '62%', width: '34%' },
      bar: { left: '8%', top: '-20%', width: '14%', height: '88%' },
      arc: { left: '34%', top: '12%', width: '48%', transform: 'rotate(90deg)' },
      ring: { left: '0%', top: '62%', width: '36%' },
      dot: { left: '44%', top: '74%', width: '10%', transform: 'rotate(0deg)' },
      line: { left: '-20%', top: '46%', width: '140%', transform: 'rotate(68deg)' },
    },
  },
  {
    index: '04',
    label: 'Разбор',
    text: 'Балл, комментарий и слабые темы — каждому.',
    layout: {
      sun: { left: '6%', top: '58%', width: '24%' },
      bar: { left: '40%', top: '28%', width: '11%', height: '72%' },
      arc: { left: '56%', top: '72%', width: '44%', transform: 'rotate(0deg)' },
      ring: { left: '46%', top: '-2%', width: '54%' },
      dot: { left: '6%', top: '8%', width: '16%', transform: 'rotate(45deg)' },
      line: { left: '-20%', top: '36%', width: '140%', transform: 'rotate(18deg)' },
    },
  },
];

export default function LearningCycle() {
  const [active, setActive] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const stage = STAGES[active];

  function select(index: number) {
    setActive(index);
    setIsAutoplay(false);
  }

  return (
    <>
      <div
        aria-hidden
        className="poster-grid relative isolate aspect-square w-full self-center overflow-hidden bg-ink text-paper [background-size:12.5%_12.5%] lg:col-span-5 lg:col-start-8 lg:row-start-1"
      >
        <div className="absolute inset-x-5 top-5 z-10 flex justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-paper/60 sm:inset-x-7 sm:top-6">
          <span>
            № {stage.index} — {stage.label}
          </span>
          <span>Цикл</span>
        </div>

        <div className="absolute inset-[12%]">
          <span className="shape aspect-square rounded-full bg-signal" style={stage.layout.sun} />
          <span className="shape bg-cobalt" style={stage.layout.bar} />
          <span className="shape aspect-[2/1] rounded-t-full bg-ochre" style={stage.layout.arc} />
          <span className="shape aspect-square" style={stage.layout.ring}>
            <span className="ring-spin block size-full rounded-full border border-dashed border-paper/50" />
          </span>
          <span className="shape aspect-square bg-paper" style={stage.layout.dot} />
          <span className="shape h-px bg-paper/70" style={stage.layout.line} />
        </div>
      </div>

      <ol className="stage-strip grid grid-cols-2 gap-x-6 gap-y-8 self-end lg:col-span-12 lg:row-start-2 lg:grid-cols-4 lg:gap-x-12">
        {STAGES.map((item, i) => {
          const isActive = i === active;

          return (
            <li key={item.index} className="border-t-2 border-ink">
              <button
                type="button"
                onClick={() => select(i)}
                aria-pressed={isActive}
                className="group relative flex w-full cursor-pointer flex-col items-start pt-3 text-left outline-none"
              >
                <span aria-hidden className="absolute -top-0.5 left-0 h-0.5 w-full">
                  {isActive && isAutoplay ? (
                    <span
                      key={active}
                      className="stage-fill block h-full bg-signal"
                      onAnimationEnd={() => setActive((active + 1) % STAGES.length)}
                    />
                  ) : (
                    <span
                      className={`block h-full bg-signal transition-[width] duration-700 ease-swiss ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-6 group-focus-visible:w-6'
                      }`}
                    />
                  )}
                </span>

                <span className="flex items-baseline gap-3">
                  <span
                    className={`font-mono text-[11px] tracking-[0.16em] ${
                      isActive ? 'text-signal-deep' : 'text-ink-soft'
                    }`}
                  >
                    {item.index}
                  </span>
                  <span
                    className={`text-sm font-medium transition-colors group-focus-visible:text-signal-deep ${
                      isActive ? 'text-ink' : 'text-ink-soft group-hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </span>
                </span>
                <span className="mt-2 max-w-[17rem] text-sm leading-snug text-ink-soft">
                  {item.text}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}
