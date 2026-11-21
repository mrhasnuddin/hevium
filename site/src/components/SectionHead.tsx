import type { SectionCopy } from '@/content/sections';

// The head of a section, holding its only h2. `highlight` is the one phrase set in the accent colour.
export function SectionHead({ id, eyebrow, title, highlight, lead }: SectionCopy & { id: string }) {
  const at = title.indexOf(highlight);
  return (
    <div className="block-head">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="display-lg" id={`${id}-title`}>
        {title.slice(0, at)}
        <span className="hl">{highlight}</span>
        {title.slice(at + highlight.length)}
      </h2>
      {lead && <p className="lead">{lead}</p>}
    </div>
  );
}
