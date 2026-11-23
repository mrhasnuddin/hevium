const TURN = { right: 0, up: -90, left: 180, out: -45 } as const;

// A drawn arrow, at the weight of the page's other drawn lines. It points right; `to` turns it, and `out`
// is the up-and-right one on a link that leaves the page. It is decoration: the link or button names itself.
export function Arrow({ to = 'right', className }: { to?: keyof typeof TURN; className?: string }) {
  return (
    <svg className={className ? `icon ${className}` : 'icon'} viewBox="0 0 16 16" aria-hidden="true" style={TURN[to] ? { rotate: `${TURN[to]}deg` } : undefined}>
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
    </svg>
  );
}
