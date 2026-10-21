'use client';

import { useEffect, useRef, useState } from 'react';
import type { CodeFile } from '@/lib/codeScan';
import { ZONE_LABEL, buildCity, type Zone } from '@/lib/cityLayout';
import { MONO_LABEL } from '@/components/ui/styles';
import { createCityScene, hasWebGL2, type HoverInfo, type SceneHandle } from './scene';

const ZONE_SWATCH: Record<Zone, string> = {
  backend: 'bg-cobalt',
  components: 'bg-signal',
  app: 'bg-ochre',
  shared: 'bg-ink/30',
};

const PANEL = 'border border-ink/15 bg-paper/92 backdrop-blur-sm';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function formatNumber(value: number): string {
  // Узкий пробел между разрядами — так же, как в кабинете
  return value.toLocaleString('ru-RU').replace(/ /g, ' ');
}

export default function CodeCity({ files }: { files: CodeFile[] }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  // Выбор и фильтр, выставленные до того, как сцена догрузила three
  const pendingRef = useRef<{ selected: number | null; matches: Set<number> | null }>({
    selected: null,
    matches: null,
  });

  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const listed = files
    .map((file, index) => ({ file, index }))
    .filter(({ file }) => needle === '' || file.path.toLowerCase().includes(needle));

  const selectedFile = selected === null ? null : files[selected];
  const totalLines = files.reduce((sum, file) => sum + file.lines, 0);
  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);

  useEffect(() => {
    const root = rootRef.current;
    const mount = canvasRef.current;
    if (!root || !mount) return;

    if (!hasWebGL2()) {
      // Без WebGL2 сцену не строим: страница остаётся списком файлов
      root.dataset.webgl = 'off';
      return;
    }

    let handle: SceneHandle | null = null;
    let cancelled = false;

    const city = buildCity(files);

    createCityScene(mount, city, files, `${MONO_LABEL} text-ink-soft`, {
      onHover: setHover,
      onSelect: setSelected,
    })
      .then((created) => {
        if (cancelled) {
          created.dispose();
          return;
        }
        handle = created;
        sceneRef.current = created;
        created.setFilter(pendingRef.current.matches);
        if (pendingRef.current.selected !== null) {
          created.setSelected(pendingRef.current.selected);
        }
      })
      .catch(() => {
        root.dataset.webgl = 'off';
      });

    return () => {
      cancelled = true;
      handle?.dispose();
      sceneRef.current = null;
    };
  }, [files]);

  useEffect(() => {
    pendingRef.current.selected = selected;
    sceneRef.current?.setSelected(selected);
  }, [selected]);

  useEffect(() => {
    const matches =
      needle === ''
        ? null
        : new Set(
            files.flatMap((file, index) =>
              file.path.toLowerCase().includes(needle) ? [index] : [],
            ),
          );

    pendingRef.current.matches = matches;
    sceneRef.current?.setFilter(matches);
  }, [files, needle]);

  return (
    <div
      ref={rootRef}
      className="group relative h-dvh w-full overflow-hidden bg-paper text-ink"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setSelected(null);
      }}
    >
      <div
        ref={canvasRef}
        role="application"
        aria-label="Трёхмерная карта исходников проекта"
        tabIndex={0}
        className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-inset"
      />

      {/* Без WebGL2 полотно остаётся пустым, поэтому говорим об этом прямо */}
      <p
        className={`absolute inset-x-6 top-1/2 hidden -translate-y-1/2 border-t-2 border-ink pt-3 text-sm text-ink-soft group-data-[webgl=off]:block`}
      >
        Браузер не поддерживает WebGL2 — город не построить. Список файлов справа работает как есть.
      </p>

      <header className="pointer-events-none absolute top-0 left-0 p-6 sm:p-8">
        <p className={`flex items-center gap-3 text-ink-soft ${MONO_LABEL}`}>
          <span aria-hidden className="size-2 bg-signal" />
          Исходники проекта
        </p>
        <h1 className="mt-4 text-[clamp(2rem,4vw,3.5rem)] leading-[0.95] font-semibold tracking-[-0.045em]">
          Город кода<span className="text-signal">.</span>
        </h1>
        <dl className="mt-6 flex gap-8">
          {[
            { label: 'Файлов', value: formatNumber(files.length) },
            { label: 'Строк', value: formatNumber(totalLines) },
            { label: 'Объём', value: formatBytes(totalBytes) },
          ].map((item) => (
            <div key={item.label} className="border-t border-ink/20 pt-2">
              <dt className={`text-ink-soft ${MONO_LABEL}`}>{item.label}</dt>
              <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <aside className={`absolute top-6 right-6 flex w-72 flex-col sm:top-8 sm:right-8 ${PANEL}`}>
        <div className="border-b border-ink/15 p-4">
          <ul className="grid grid-cols-2 gap-y-2">
            {(Object.keys(ZONE_SWATCH) as Zone[]).map((zone) => (
              <li key={zone} className={`flex items-center gap-2 text-ink-soft ${MONO_LABEL}`}>
                <span aria-hidden className={`size-2 ${ZONE_SWATCH[zone]}`} />
                {ZONE_LABEL[zone]}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4">
          <label className={`block text-ink-soft ${MONO_LABEL}`} htmlFor="city-search">
            Поиск по пути
          </label>
          <input
            id="city-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="models, teacher, .py"
            className="mt-2 w-full border-b-2 border-ink bg-transparent pb-2 font-mono text-xs outline-none placeholder:text-ink-soft/60 focus:border-signal"
          />
        </div>

        <ul className="max-h-[32vh] overflow-y-auto border-t border-ink/15">
          {listed.map(({ file, index }) => (
            <li key={file.path}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-current={selected === index}
                className={`flex w-full cursor-pointer items-baseline justify-between gap-3 px-4 py-2 text-left font-mono text-[11px] outline-none hover:bg-ink/[0.05] focus-visible:bg-ink/[0.08] ${
                  selected === index ? 'bg-ink text-paper' : 'text-ink-soft'
                }`}
              >
                <span className="truncate" title={file.path}>
                  {file.path}
                </span>
                <span className="shrink-0 tabular-nums opacity-70">{file.lines}</span>
              </button>
            </li>
          ))}
          {listed.length === 0 && (
            <li className="px-4 py-3 text-xs text-ink-soft">Ничего не нашлось</li>
          )}
        </ul>
      </aside>

      {hover && selected !== hover.index && (
        <div
          aria-hidden
          className={`pointer-events-none absolute z-10 -translate-y-full px-3 py-2 font-mono text-[11px] whitespace-nowrap ${PANEL}`}
          style={{ left: `${hover.x + 14}px`, top: `${hover.y - 8}px` }}
        >
          <span className="text-ink">{hover.path}</span>
          <span className="ml-3 text-ink-soft">
            {hover.lines} стр · {formatBytes(hover.bytes)}
          </span>
        </div>
      )}

      {selectedFile && (
        <section
          aria-live="polite"
          className={`absolute inset-y-0 right-0 flex w-full max-w-[36rem] flex-col border-l-2 border-ink bg-paper`}
        >
          <div className="relative flex items-start justify-between gap-4 border-b border-ink/15 p-6">
            <span aria-hidden className="absolute top-0 left-0 h-0.5 w-6 bg-signal" />
            <div className="min-w-0">
              <p className={`truncate text-ink-soft ${MONO_LABEL}`} title={selectedFile.dir}>
                {selectedFile.dir}
              </p>
              <h2 className="mt-2 font-mono text-lg font-medium break-all">{selectedFile.name}</h2>
              <p className={`mt-3 flex gap-4 text-ink-soft ${MONO_LABEL}`}>
                <span>{selectedFile.ext}</span>
                <span>{formatNumber(selectedFile.lines)} строк</span>
                <span>{formatBytes(selectedFile.bytes)}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className={`shrink-0 cursor-pointer text-ink-soft underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:text-ink focus-visible:underline ${MONO_LABEL}`}
            >
              Закрыть
            </button>
          </div>

          <div className="flex-1 overflow-auto bg-ink">
            <pre className="flex min-h-full font-mono text-[11px] leading-[1.6] text-paper/85">
              <span aria-hidden className="shrink-0 border-r border-paper/15 px-3 py-4 text-right text-paper/30 tabular-nums select-none">
                {selectedFile.source
                  .replace(/\n$/, '')
                  .split('\n')
                  .map((_, i) => `${i + 1}\n`)
                  .join('')}
              </span>
              <code className="flex-1 px-4 py-4 whitespace-pre">{selectedFile.source}</code>
            </pre>
          </div>
        </section>
      )}

      <p
        className={`pointer-events-none absolute bottom-6 left-6 text-ink-soft sm:bottom-8 sm:left-8 ${MONO_LABEL}`}
      >
        Перетащить — повернуть · Колесо — приблизить · Клик — открыть файл
      </p>
    </div>
  );
}
