// У бэкенда нет GET /tests и GET /groups — список можно собрать только из id,
// которые преподаватель уже создал или открывал. Это индекс-подсказка внутри
// одного браузера, а не источник истины: детали всегда перезапрашиваются по id.

export type RecentKind = 'tests' | 'groups';

// Событие `storage` приходит только в другие вкладки — текущую уведомляем сами
export const RECENT_CHANGE_EVENT = 'recent-ids-change';

const LIMIT = 50;

// Привязка к пользователю структурная: два аккаунта в одном браузере
// не должны видеть чужие id
function storageKey(userId: number, kind: RecentKind): string {
  return `teacher:${userId}:${kind}`;
}

function notify(): void {
  window.dispatchEvent(new Event(RECENT_CHANGE_EVENT));
}

export function isStorageAvailable(): boolean {
  try {
    const probe = '__probe__';
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function readRecentIds(userId: number, kind: RecentKind): number[] {
  try {
    const raw = localStorage.getItem(storageKey(userId, kind));
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Чужое или испорченное значение не должно ломать страницу
    return parsed.filter((id): id is number => Number.isInteger(id) && (id as number) > 0);
  } catch {
    return [];
  }
}

function write(userId: number, kind: RecentKind, ids: number[]): void {
  try {
    localStorage.setItem(storageKey(userId, kind), JSON.stringify(ids.slice(0, LIMIT)));
    notify();
  } catch {
    // приватный режим — список просто не сохранится
  }
}

export function rememberId(userId: number, kind: RecentKind, id: number): void {
  const current = readRecentIds(userId, kind);
  if (current[0] === id) return;
  write(userId, kind, [id, ...current.filter((item) => item !== id)]);
}

export function forgetId(userId: number, kind: RecentKind, id: number): void {
  const current = readRecentIds(userId, kind);
  if (!current.includes(id)) return;
  write(userId, kind, current.filter((item) => item !== id));
}
