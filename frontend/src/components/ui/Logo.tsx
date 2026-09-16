import Link from 'next/link';

export default function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md text-[15px] font-semibold tracking-tight text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span aria-hidden className="grid size-6 place-items-center rounded-md bg-ink">
        <span className="size-2 rounded-full bg-paper" />
      </span>
      Study Platform
    </Link>
  );
}
