import type { ReactNode } from 'react';

type Props = {
  /** `h2` where the eyebrow is the section's own heading, as on What is Hevium. */
  as?: 'p' | 'h2';
  id?: string;
  className?: string;
  children: ReactNode;
};

// The design system's eyebrow: the small pill that opens a section, led by the Hevium star
// (see `.eyebrow` in globals.css). A section head writes it for you: see SectionHead.
export function Eyebrow({ as: Tag = 'p', id, className = '', children }: Props) {
  return (
    <Tag className={`eyebrow ${className}`.trim()} id={id}>
      {children}
    </Tag>
  );
}
