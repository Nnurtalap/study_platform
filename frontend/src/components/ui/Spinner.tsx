// Три мигающих квадрата — тот же индикатор, что в кнопках форм входа
export default function Spinner({ className = 'bg-current' }: { className?: string }) {
  return (
    <span aria-hidden className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`loader-tick size-1.5 ${className}`}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}
