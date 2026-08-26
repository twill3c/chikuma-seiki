/**
 * 社章。写真素材を持たない(N-02)ので、ロゴも SVG で組む。
 * 「千」の字の三本の横棒を、基板のランドとビアに見立てた形。
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label="千曲精機の社章"
    >
      <rect
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        rx="3"
        fill="none"
        stroke="var(--color-suji)"
        strokeWidth="1.5"
      />
      {/* 三本の配線。上ほど細く、下が電源線 */}
      <path
        d="M7 12 L20 12 L26 18 L33 18"
        fill="none"
        stroke="var(--color-do)"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
      <path
        d="M7 20 L33 20"
        fill="none"
        stroke="var(--color-hanare)"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
      <path
        d="M7 28 L14 28 L20 28 L20 34"
        fill="none"
        stroke="var(--color-do)"
        strokeWidth="2.6"
        strokeLinecap="square"
      />
      {/* ビア */}
      <circle cx="20" cy="20" r="3" fill="var(--color-tetsu)" stroke="var(--color-hanare)" strokeWidth="1.4" />
      <circle cx="26" cy="18" r="1.6" fill="var(--color-do)" />
      <circle cx="20" cy="28" r="1.6" fill="var(--color-do)" />
    </svg>
  );
}
