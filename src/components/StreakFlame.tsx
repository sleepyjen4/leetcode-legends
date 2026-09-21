export function StreakFlame({ streak }: { streak: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      <svg
        viewBox="0 0 24 24"
        className="flame-flicker h-5 w-5 fill-pending"
        aria-hidden="true"
      >
        <path d="M12 2c-1.3 3.4-5.5 5.8-5.5 10.2a5.5 5.5 0 0 0 11 0c0-2.1-1-3.6-2-5.3.1 2-1.1 2.9-2 2.9-1.2 0-2.1-1.1-1.3-2.9C13.2 5 12.8 3.6 12 2Z" />
      </svg>
      <span className="font-mono text-xs font-bold text-pending">{streak}</span>
    </span>
  );
}
