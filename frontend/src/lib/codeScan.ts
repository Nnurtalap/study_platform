import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export type CodeFile = {
  /** Путь от корня репозитория: 'frontend/src/components/app/ui.tsx' */
  path: string;
  /** Каталог файла, тоже от корня: 'frontend/src/components/app' */
  dir: string;
  name: string;
  ext: string;
  lines: number;
  bytes: number;
  source: string;
};

export type CodeScan = {
  root: string;
  files: CodeFile[];
};

// Каталоги со сборкой, зависимостями и кешами: кода там нет, а файлов десятки тысяч
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  '.next',
  '__pycache__',
  '.venv',
  'venv',
  'dist',
  'build',
  'out',
  'coverage',
  '.idea',
  '.vscode',
  '.claude',
  '.pytest_cache',
  '.mypy_cache',
]);

const CODE_EXTS = new Set(['ts', 'tsx', 'py', 'css', 'mjs', 'cjs', 'js', 'jsx']);

// Отсекает сгенерированное: лок-файлы и бандлы кодом не считаем, даже если расширение подходит
const MAX_BYTES = 200_000;

async function isDir(target: string): Promise<boolean> {
  try {
    return (await stat(target)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Корень репозитория — каталог, в котором лежат и backend, и frontend.
 * `next dev` запускается с cwd = frontend/, но подъём по маркеру не зависит
 * от того, откуда именно позвали, поэтому путь не приходится зашивать.
 */
async function findRepoRoot(start: string): Promise<string> {
  let dir = start;

  for (let depth = 0; depth < 8; depth += 1) {
    const [hasBackend, hasFrontend] = await Promise.all([
      isDir(path.join(dir, 'backend')),
      isDir(path.join(dir, 'frontend')),
    ]);
    if (hasBackend && hasFrontend) return dir;

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return start;
}

function countLines(source: string): number {
  if (source.length === 0) return 0;
  // Завершающий перевод строки не считаем за отдельную строку
  return source.replace(/\n$/, '').split('\n').length;
}

async function walk(root: string, dir: string, out: CodeFile[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) return;
        await walk(root, full, out);
        return;
      }

      if (!entry.isFile()) return;

      const ext = path.extname(entry.name).slice(1).toLowerCase();
      if (!CODE_EXTS.has(ext)) return;

      const info = await stat(full);
      if (info.size > MAX_BYTES) return;

      const source = await readFile(full, 'utf8');
      const relative = path.relative(root, full);

      out.push({
        path: relative,
        dir: path.dirname(relative),
        name: entry.name,
        ext,
        lines: countLines(source),
        bytes: info.size,
        source,
      });
    }),
  );
}

export async function scanRepo(): Promise<CodeScan> {
  const root = await findRepoRoot(process.cwd());
  const files: CodeFile[] = [];

  await walk(root, root, files);
  // Порядок обхода зависит от файловой системы, а город должен быть одинаковым
  files.sort((a, b) => a.path.localeCompare(b.path));

  return { root, files };
}
