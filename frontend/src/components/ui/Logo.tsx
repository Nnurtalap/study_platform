import Link from 'next/link';

export default function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 text-sm font-semibold tracking-tight outline-none focus-visible:text-signal-deep"
    >
      <span aria-hidden className="size-3 bg-signal" />
      Study Platform
    </Link>
  );
}
