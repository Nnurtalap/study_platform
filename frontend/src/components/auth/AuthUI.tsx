import Link from 'next/link';
import type { ReactNode } from 'react';

const PRIMARY_BUTTON =
  'group relative flex w-full cursor-pointer items-center justify-between overflow-hidden bg-ink px-6 py-5 text-left text-paper outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-4 focus-visible:ring-offset-paper disabled:cursor-wait';

const TEXT_ACTION =
  'cursor-pointer font-medium text-ink decoration-signal decoration-2 underline-offset-[6px] outline-none hover:underline focus-visible:underline';

export function AuthHeading({
  index,
  eyebrow,
  title,
  children,
}: {
  index: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <header>
      <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
        <span aria-hidden className="size-2 bg-signal" />
        {index} / {eyebrow}
      </p>
      <h1 className="mt-5 text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
        {title}
      </h1>
      <p className="mt-5 max-w-sm text-base leading-relaxed text-ink-soft">{children}</p>
    </header>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex gap-4 border-l-4 border-signal bg-signal/8 px-4 py-3">
      <span className="pt-0.5 font-mono text-[11px] uppercase tracking-[0.16em] text-signal-deep">
        Ошибка
      </span>
      <p className="text-sm leading-snug text-ink">{children}</p>
    </div>
  );
}

export function LinkTokenNotice({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 border border-ink/15 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
      <span aria-hidden className="size-2 rounded-full bg-cobalt" />
      {children}
    </p>
  );
}

function ButtonContent({ label, isLoading = false }: { label: string; isLoading?: boolean }) {
  return (
    <>
      <span
        aria-hidden
        className="absolute inset-0 origin-left scale-x-0 bg-signal transition-transform duration-500 ease-swiss group-hover:scale-x-100 group-focus-visible:scale-x-100 group-disabled:scale-x-0"
      />
      <span className="relative text-lg font-medium tracking-tight">{label}</span>
      <span aria-hidden className="relative flex h-3 items-center">
        {isLoading ? (
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="loader-tick size-1.5 bg-paper"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </span>
        ) : (
          <svg
            width="28"
            height="12"
            viewBox="0 0 28 12"
            fill="none"
            className="transition-transform duration-500 ease-swiss group-hover:translate-x-1.5"
          >
            <path d="M0 6h26M21 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </span>
    </>
  );
}

export function SubmitButton({
  isLoading,
  label,
  loadingLabel,
}: {
  isLoading: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
    <button type="submit" disabled={isLoading} aria-busy={isLoading} className={PRIMARY_BUTTON}>
      <ButtonContent label={isLoading ? loadingLabel : label} isLoading={isLoading} />
    </button>
  );
}

export function PrimaryLink({
  href,
  label,
  className = '',
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`${PRIMARY_BUTTON} ${className}`}>
      <ButtonContent label={label} />
    </Link>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={TEXT_ACTION}>
      {children}
    </Link>
  );
}

type AuthSwitchProps = { question: string; label: string } & (
  | { href: string; onClick?: never }
  | { onClick: () => void; href?: never }
);

export function AuthSwitch({ question, label, href, onClick }: AuthSwitchProps) {
  return (
    <p className="mt-12 flex flex-wrap items-baseline justify-between gap-2 border-t border-ink/15 pt-5 text-sm text-ink-soft">
      <span>{question}</span>
      {href ? (
        <TextLink href={href}>{label} →</TextLink>
      ) : (
        <button type="button" onClick={onClick} className={TEXT_ACTION}>
          {label} →
        </button>
      )}
    </p>
  );
}

export function AuthSuccess({
  eyebrow,
  title,
  children,
  href,
  actionLabel,
  footer,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  href: string;
  actionLabel: string;
  footer?: ReactNode;
}) {
  return (
    <div role="status" className="auth-enter">
      <div aria-hidden className="relative mb-12 size-20">
        <span className="absolute inset-0 bg-ink" />
        <span className="success-disc absolute -top-4 -right-4 size-12 rounded-full bg-signal" />
      </div>
      <AuthHeading index="✓" eyebrow={eyebrow} title={title}>
        {children}
      </AuthHeading>
      <PrimaryLink href={href} label={actionLabel} className="mt-12" />
      {footer}
    </div>
  );
}
