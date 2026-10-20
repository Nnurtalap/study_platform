import type { CSSProperties } from 'react';

// Шесть фигур, из которых собраны и постер авторизации, и цикл на главной.
// Разметка одна, различаются только значения в layout — их держат вызывающие файлы.
export type Shape = 'sun' | 'bar' | 'arc' | 'ring' | 'dot' | 'line';
export type ShapeLayout = Record<Shape, CSSProperties>;

export default function ShapeComposition({
  layout,
  className = '',
}: {
  layout: ShapeLayout;
  className?: string;
}) {
  return (
    <div aria-hidden className={className}>
      <span className="shape aspect-square rounded-full bg-signal" style={layout.sun} />
      <span className="shape bg-cobalt" style={layout.bar} />
      <span className="shape aspect-[2/1] rounded-t-full bg-ochre" style={layout.arc} />
      <span className="shape aspect-square" style={layout.ring}>
        <span className="ring-spin block size-full rounded-full border border-dashed border-paper/50" />
      </span>
      <span className="shape aspect-square bg-paper" style={layout.dot} />
      <span className="shape h-px bg-paper/70" style={layout.line} />
    </div>
  );
}
