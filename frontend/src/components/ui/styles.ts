const BUTTON_BASE =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50';

export const BUTTON_PRIMARY = `${BUTTON_BASE} h-10 bg-ink text-paper hover:bg-ink/85`;

export const BUTTON_SECONDARY = `${BUTTON_BASE} h-10 border border-line bg-surface text-ink hover:bg-line/50`;

export const BUTTON_GHOST = `${BUTTON_BASE} h-9 text-ink-soft hover:bg-line/60 hover:text-ink`;

export const LINK =
  'rounded-sm font-medium text-ink underline decoration-line decoration-1 underline-offset-4 outline-none transition-colors hover:decoration-ink focus-visible:ring-2 focus-visible:ring-accent';

export const CARD = 'rounded-xl border border-line bg-surface';

export const INPUT =
  'block w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-soft/60 focus:border-accent focus:ring-3 focus:ring-accent/15 aria-invalid:border-danger aria-invalid:focus:ring-danger/15';
