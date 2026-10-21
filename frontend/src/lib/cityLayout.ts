import type { CodeFile } from '@/lib/codeScan';

// Районы: верхний уровень проекта, по которому красятся плиты кварталов
export type Zone = 'backend' | 'components' | 'app' | 'shared';

export const ZONE_LABEL: Record<Zone, string> = {
  backend: 'Бэкенд',
  components: 'Компоненты',
  app: 'Роуты',
  shared: 'Общее',
};

export type Rect = { x: number; z: number; w: number; d: number };

export type Building = Rect & {
  /** Индекс в исходном массиве файлов — по нему сцена достаёт код для фасада */
  index: number;
  path: string;
  name: string;
  ext: string;
  dir: string;
  lines: number;
  bytes: number;
  h: number;
  zone: Zone;
};

export type District = Rect & {
  path: string;
  label: string;
  depth: number;
  zone: Zone;
  files: number;
  lines: number;
};

export type City = {
  buildings: Building[];
  districts: District[];
  /** Сторона квадрата, в который вписан город: камеру и туман настраиваем по ней */
  size: number;
  totals: { files: number; lines: number; bytes: number; dirs: number };
};

const CITY_SIZE = 64;

// Улица между кварталами: у верхних районов проспект, внутри квартала — переулок
const STREET = 2.4;

// Шов между соседними плитами, чтобы границы районов читались
const PLATE_SEAM = 0.12;

// Зазор между домом и краем его участка: без него квартал выглядит монолитом
const BUILDING_GAP = 0.16;

// Пустой __init__.py имеет нулевой размер, но участок ему всё равно нужен
const MIN_WEIGHT = 220;

// Самый узкий дом, который ещё можно разглядеть и ткнуть мышью
const MIN_FOOTPRINT = 0.7;

const MIN_HEIGHT = 0.5;
const HEIGHT_K = 0.3;
const HEIGHT_POW = 0.72;

export function zoneOf(filePath: string): Zone {
  if (filePath.startsWith('backend/')) return 'backend';
  if (filePath.startsWith('frontend/src/components/')) return 'components';
  if (filePath.startsWith('frontend/src/app/')) return 'app';
  return 'shared';
}

export function buildingHeight(lines: number): number {
  return MIN_HEIGHT + HEIGHT_K * Math.pow(lines, HEIGHT_POW);
}

type TreeNode = {
  name: string;
  path: string;
  depth: number;
  dirs: Map<string, TreeNode>;
  files: { file: CodeFile; index: number }[];
  weight: number;
  lines: number;
  fileCount: number;
};

function makeNode(name: string, nodePath: string, depth: number): TreeNode {
  return {
    name,
    path: nodePath,
    depth,
    dirs: new Map(),
    files: [],
    weight: 0,
    lines: 0,
    fileCount: 0,
  };
}

function buildTree(files: CodeFile[]): TreeNode {
  const root = makeNode('', '', -1);

  files.forEach((file, index) => {
    const segments = file.dir === '.' ? [] : file.dir.split('/');
    let node = root;

    for (const segment of segments) {
      let next = node.dirs.get(segment);
      if (!next) {
        next = makeNode(segment, node.path ? `${node.path}/${segment}` : segment, node.depth + 1);
        node.dirs.set(segment, next);
      }
      node = next;
    }

    node.files.push({ file, index });
  });

  // Вес узла — суммарный размер поддерева; он же задаёт площадь квартала
  (function accumulate(node: TreeNode): void {
    let weight = 0;
    let lines = 0;
    let fileCount = 0;

    for (const child of node.dirs.values()) {
      accumulate(child);
      weight += child.weight;
      lines += child.lines;
      fileCount += child.fileCount;
    }
    for (const { file } of node.files) {
      weight += fileWeight(file.bytes);
      lines += file.lines;
      fileCount += 1;
    }

    node.weight = weight;
    node.lines = lines;
    node.fileCount = fileCount;
  })(root);

  return root;
}

/**
 * Площадь участка берём от корня размера файла, а не от самого размера.
 * Иначе один файл на 18 КБ занимает четверть города, а пустые __init__.py
 * сплющиваются в щепки: высота и так честно показывает масштаб файла.
 */
function fileWeight(bytes: number): number {
  return Math.sqrt(Math.max(bytes, MIN_WEIGHT));
}

function shrink(rect: Rect, by: number): Rect {
  // Съедаем не больше, чем участок может отдать, иначе получаются отрицательные стороны
  const dx = Math.min(by, rect.w * 0.3);
  const dz = Math.min(by, rect.d * 0.3);
  return { x: rect.x + dx, z: rect.z + dz, w: rect.w - dx * 2, d: rect.d - dz * 2 };
}

/** Растягивает участок от центра до минимальной стороны, если нарезка выдала щепку */
function atLeast(rect: Rect, min: number): Rect {
  const w = Math.max(rect.w, min);
  const d = Math.max(rect.d, min);
  return { x: rect.x - (w - rect.w) / 2, z: rect.z - (d - rect.d) / 2, w, d };
}

function worstRatio(areas: number[], thickness: number): number {
  let worst = 1;
  for (const area of areas) {
    const side = area / thickness;
    worst = Math.max(worst, thickness / side, side / thickness);
  }
  return worst;
}

/**
 * Squarified treemap (Bruls—Huizing—van Wijk): участки нарезаются полосами так,
 * чтобы отношение сторон было ближе к квадрату — иначе дома вырождаются в полоски.
 * Возвращает прямоугольники в порядке входных весов.
 */
function squarify(weights: number[], rect: Rect): Rect[] {
  const result: Rect[] = new Array(weights.length);
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  if (weights.length === 0) return result;
  if (total <= 0) {
    return weights.map(() => ({ x: rect.x, z: rect.z, w: 0, d: 0 }));
  }

  // Крупное — вперёд: squarified исходит из убывающего порядка
  const order = weights.map((_, i) => i).sort((a, b) => weights[b] - weights[a]);

  let free: Rect = { ...rect };
  let freeWeight = total;
  let cursor = 0;

  while (cursor < order.length) {
    const freeArea = free.w * free.d;
    const short = Math.min(free.w, free.d);

    let rowWeight = 0;
    let rowCount = 0;
    let bestWorst = Infinity;

    // Добираем в полосу, пока это улучшает худшее отношение сторон
    while (cursor + rowCount < order.length) {
      const candidateWeight = rowWeight + weights[order[cursor + rowCount]];
      const candidateArea = (candidateWeight / freeWeight) * freeArea;
      const thickness = candidateArea / short;
      const areas = [];
      for (let k = 0; k <= rowCount; k += 1) {
        areas.push((weights[order[cursor + k]] / candidateWeight) * candidateArea);
      }
      const worst = worstRatio(areas, thickness);

      if (rowCount > 0 && worst > bestWorst) break;

      bestWorst = worst;
      rowWeight = candidateWeight;
      rowCount += 1;
    }

    const fraction = rowWeight / freeWeight;

    if (free.w >= free.d) {
      const rowW = free.w * fraction;
      let z = free.z;
      for (let k = 0; k < rowCount; k += 1) {
        const index = order[cursor + k];
        const d = free.d * (weights[index] / rowWeight);
        result[index] = { x: free.x, z, w: rowW, d };
        z += d;
      }
      free = { x: free.x + rowW, z: free.z, w: free.w - rowW, d: free.d };
    } else {
      const rowD = free.d * fraction;
      let x = free.x;
      for (let k = 0; k < rowCount; k += 1) {
        const index = order[cursor + k];
        const w = free.w * (weights[index] / rowWeight);
        result[index] = { x, z: free.z, w, d: rowD };
        x += w;
      }
      free = { x: free.x, z: free.z + rowD, w: free.w, d: free.d - rowD };
    }

    freeWeight -= rowWeight;
    cursor += rowCount;
  }

  return result;
}

export function buildCity(files: CodeFile[]): City {
  const root = buildTree(files);
  const buildings: Building[] = [];
  const districts: District[] = [];

  const half = CITY_SIZE / 2;
  const area: Rect = { x: -half, z: -half, w: CITY_SIZE, d: CITY_SIZE };

  (function place(node: TreeNode, rect: Rect): void {
    if (node.depth >= 0) {
      const zone = zoneOf(`${node.path}/`);
      districts.push({
        ...shrink(rect, PLATE_SEAM),
        path: node.path,
        label: node.name,
        depth: node.depth,
        zone,
        files: node.fileCount,
        lines: node.lines,
      });
    }

    const items: (
      | { kind: 'dir'; node: TreeNode }
      | { kind: 'file'; entry: TreeNode['files'][number] }
    )[] = [];

    for (const child of node.dirs.values()) items.push({ kind: 'dir', node: child });
    for (const entry of node.files) items.push({ kind: 'file', entry });

    if (items.length === 0) return;

    // Улица тем уже, чем глубже вложенность: проспекты между районами, переулки внутри
    const street = STREET / (node.depth + 2);
    const inner = shrink(rect, street);

    const weights = items.map((item) =>
      item.kind === 'dir' ? item.node.weight : fileWeight(item.entry.file.bytes),
    );
    const rects = squarify(weights, inner);

    items.forEach((item, i) => {
      const cell = rects[i];
      if (!cell || cell.w <= 0 || cell.d <= 0) return;

      if (item.kind === 'dir') {
        place(item.node, cell);
        return;
      }

      const { file, index } = item.entry;
      const footprint = atLeast(shrink(cell, BUILDING_GAP), MIN_FOOTPRINT);
      buildings.push({
        ...footprint,
        index,
        path: file.path,
        name: file.name,
        ext: file.ext,
        dir: file.dir,
        lines: file.lines,
        bytes: file.bytes,
        h: buildingHeight(file.lines),
        zone: zoneOf(file.path),
      });
    });
  })(root, area);

  return {
    buildings,
    districts,
    size: CITY_SIZE,
    totals: {
      files: files.length,
      lines: files.reduce((sum, file) => sum + file.lines, 0),
      bytes: files.reduce((sum, file) => sum + file.bytes, 0),
      dirs: districts.length,
    },
  };
}
