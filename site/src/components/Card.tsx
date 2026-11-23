import type { ReactNode } from 'react';

type Props = {
  as?: 'div' | 'li' | 'article';
  /** `stat` is the one-line fact: a small mark, then the words. */
  variant?: 'feature' | 'stat';
  className?: string;
  children: ReactNode;
};

// The design system's card: an inner surface inside a thicker frame (see `.card` in globals.css).
// Put a `.card-text` block with a `.card-title` inside for the words.
export function Card({ as: Tag = 'div', variant = 'feature', className = '', children }: Props) {
  return (
    <Tag className={`card ${variant === 'stat' ? 'card-stat' : ''} ${className}`.trim()}>
      <div className="card-body">{children}</div>
    </Tag>
  );
}
