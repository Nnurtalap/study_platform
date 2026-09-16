import Link from 'next/link';
import type { ReactNode } from 'react';
import Spinner from '@/components/ui/Spinner';
import { BUTTON_PRIMARY, LINK } from '@/components/ui/styles';

export function AuthHeading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{children}</p>
    </header>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/25 bg-danger/5 px-3 py-2.5 text-sm leading-snug text-danger"
    >
      {children}
    </div>
  );
}

export function LinkTokenNotice({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-lg bg-accent-soft px-3 py-2.5 text-sm text-accent">
      <span aria-hidden className="size-1.5 rounded-full bg-accent" />
      {children}
    </p>
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
    <button
      type="submit"
      disabled={isLoading}
      aria-busy={isLoading}
      className={`${BUTTON_PRIMARY} w-full disabled:cursor-wait`}
    >
      {isLoading && <Spinner className="size-3.5" />}
      {isLoading ? loadingLabel : label}
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
    <Link href={href} className={`${BUTTON_PRIMARY} ${className}`}>
      {label}
    </Link>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={LINK}>
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
    <p className="mt-6 text-center text-sm text-ink-soft">
      {question}{' '}
      {href ? (
        <TextLink href={href}>{label}</TextLink>
      ) : (
        <button type="button" onClick={onClick} className={`${LINK} cursor-pointer`}>
          {label}
        </button>
      )}
    </p>
  );
}

export function AuthSuccess({
  title,
  children,
  href,
  actionLabel,
  footer,
}: {
  title: string;
  children: ReactNode;
  href: string;
  actionLabel: string;
  footer?: ReactNode;
}) {
  return (
    <div role="status" className="fade-in">
      <div
        aria-hidden
        className="mb-5 grid size-10 place-items-center rounded-full bg-success/10 text-success"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <AuthHeading title={title}>{children}</AuthHeading>
      <PrimaryLink href={href} label={actionLabel} className="mt-6 w-full" />
      {footer}
    </div>
  );
}
