import type { CanvasTexture } from 'three';

type ThreeModule = typeof import('three');

export const INK = '#121212';
export const PAPER = '#f2eee6';

type Line = {
  text: string;
  indent: number;
  length: number;
  comment: boolean;
};

const COMMENT_PREFIXES = ['//', '#', '/*', '*', '"""', "'''"];

function parseLines(source: string): Line[] {
  const raw = source.replace(/\n$/, '').split('\n');

  return raw.map((text) => {
    // Табы растягиваем до четырёх пробелов, иначе отступ в «штрих-коде» врёт
    const expanded = text.replace(/\t/g, '    ');
    const trimmed = expanded.trimStart();

    return {
      text: expanded,
      indent: expanded.length - trimmed.length,
      length: expanded.length,
      comment: COMMENT_PREFIXES.some((prefix) => trimmed.startsWith(prefix)),
    };
  });
}

const lineCache = new WeakMap<object, Line[]>();
const lineCacheKeys = new Map<string, object>();

function linesOf(path: string, source: string): Line[] {
  let key = lineCacheKeys.get(path);
  if (!key) {
    key = { path };
    lineCacheKeys.set(path, key);
  }
  const cached = lineCache.get(key);
  if (cached) return cached;

  const parsed = parseLines(source);
  lineCache.set(key, parsed);
  return parsed;
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function finish(THREE: ThreeModule, canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Фасад смотрим под острыми углами — без анизотропии текст расплывается
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Дальний уровень детализации: каждая строка файла — штрих, длина которого
 * равна длине строки, а сдвиг — её отступу. Это всё ещё код, просто издали:
 * видно вложенность, длинные простыни и блоки комментариев.
 */
export function barcodeTexture(
  THREE: ThreeModule,
  path: string,
  source: string,
): CanvasTexture {
  const lines = linesOf(path, source);
  const width = 128;
  const height = Math.min(1024, Math.max(96, lines.length * 3));

  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (!ctx) return finish(THREE, canvas);

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, width, height);

  if (lines.length === 0) return finish(THREE, canvas);

  const columns = Math.max(40, ...lines.map((line) => line.length));
  const step = height / lines.length;
  const bar = Math.max(1, Math.min(step * 0.62, 3));
  const padding = 6;
  const usable = width - padding * 2;

  lines.forEach((line, i) => {
    if (line.length === 0) return;

    const x = padding + (line.indent / columns) * usable;
    const w = Math.max(1, ((line.length - line.indent) / columns) * usable);

    // Комментарии глуше кода: фасад сам показывает, где файл говорит, а где работает
    ctx.fillStyle = line.comment ? 'rgba(242, 238, 230, 0.26)' : 'rgba(242, 238, 230, 0.72)';
    ctx.fillRect(x, i * step, w, bar);
  });

  return finish(THREE, canvas);
}

const MAX_TEXTURE = 4096;
const PAD = 14;
const GUTTER = 34;
const MIN_FONT = 4.5;
const MAX_FONT = 22;
const LINE_RATIO = 1.3;

/**
 * Ближний уровень: настоящий текст файла моношириной. Пропорции канвы
 * повторяют пропорции фасада, поэтому буквы не растягиваются вместе с домом.
 */
export function codeTexture(
  THREE: ThreeModule,
  path: string,
  source: string,
  facadeAspect: number,
): CanvasTexture {
  const lines = linesOf(path, source);

  let width = 1024;
  let height = Math.round(width / Math.max(facadeAspect, 0.01));

  if (height > MAX_TEXTURE) {
    height = MAX_TEXTURE;
    width = Math.max(256, Math.round(height * facadeAspect));
  }
  height = Math.max(256, height);

  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (!ctx) return finish(THREE, canvas);

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, width, height);

  if (lines.length === 0) return finish(THREE, canvas);

  const available = height - PAD * 2;
  const font = Math.min(MAX_FONT, Math.max(MIN_FONT, available / lines.length / LINE_RATIO));
  const step = font * LINE_RATIO;
  const gutter = font > 7 ? GUTTER : 0;

  ctx.font = `${font}px ui-monospace, "JetBrains Mono", monospace`;
  ctx.textBaseline = 'top';

  // Сколько символов влезает в ширину — остальное обрезаем, перенос сломал бы нумерацию
  const charWidth = ctx.measureText('0'.repeat(10)).width / 10;
  const columns = Math.max(8, Math.floor((width - PAD * 2 - gutter) / charWidth));

  lines.forEach((line, i) => {
    const y = PAD + i * step;
    if (y > height - PAD) return;

    if (gutter > 0) {
      ctx.fillStyle = 'rgba(242, 238, 230, 0.3)';
      ctx.fillText(String(i + 1).padStart(4, ' '), PAD, y);
    }

    if (line.length === 0) return;

    ctx.fillStyle = line.comment ? 'rgba(242, 238, 230, 0.42)' : 'rgba(242, 238, 230, 0.88)';
    ctx.fillText(line.text.slice(0, columns), PAD + gutter, y);
  });

  return finish(THREE, canvas);
}

/**
 * Читаемые текстуры тяжёлые (до 4096 px), поэтому живьём держим только те,
 * к которым камера подошла близко. Вытесненные освобождают память GPU сразу.
 */
export class TextureCache {
  private readonly entries = new Map<string, CanvasTexture>();

  constructor(private readonly limit: number) {}

  get(key: string): CanvasTexture | undefined {
    const texture = this.entries.get(key);
    if (!texture) return undefined;

    // Повторная вставка двигает запись в конец — хвост Map и есть «давно не нужное»
    this.entries.delete(key);
    this.entries.set(key, texture);
    return texture;
  }

  set(key: string, texture: CanvasTexture): void {
    this.entries.set(key, texture);

    while (this.entries.size > this.limit) {
      const oldest = this.entries.keys().next();
      if (oldest.done) break;
      this.entries.get(oldest.value)?.dispose();
      this.entries.delete(oldest.value);
    }
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  dispose(): void {
    for (const texture of this.entries.values()) texture.dispose();
    this.entries.clear();
  }
}
