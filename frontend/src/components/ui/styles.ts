export const MONO_LABEL = 'font-mono text-[11px] uppercase tracking-[0.16em]';

// Общая основа тёмной кнопки: цвет, фокус, обрезка «заливки» при наведении.
// Различаются только размер и поведение в disabled, поэтому варианта два.
const BUTTON_SHELL =
  'group relative cursor-pointer items-center justify-between overflow-hidden bg-ink text-left text-paper outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-4 focus-visible:ring-offset-paper';

// Компактная — внутри страниц кабинета
export const BUTTON_PRIMARY = `${BUTTON_SHELL} inline-flex gap-6 px-5 py-3 disabled:cursor-not-allowed disabled:opacity-40`;

// Во всю ширину — главное действие форм авторизации и постеров
export const BUTTON_WIDE = `${BUTTON_SHELL} flex w-full px-6 py-5 disabled:cursor-wait`;

export const BUTTON_TEXT =
  'cursor-pointer font-medium text-ink decoration-signal decoration-2 underline-offset-[6px] outline-none hover:underline focus-visible:underline';

export const NAV_LINK = `${MONO_LABEL} text-ink-soft underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:text-ink focus-visible:underline`;
