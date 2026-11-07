/** The product mark: a single flame in the one hot colour. */
export function FlameMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 2c1 6-4 8-4 13a4 4 0 0 0 8 0c0-2-1-3-1-5 4 3 6 6 6 10a9 9 0 0 1-18 0C7 12 16 10 16 2z"
        fill="var(--flame)"
      />
    </svg>
  );
}
