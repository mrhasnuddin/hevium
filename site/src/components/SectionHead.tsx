import { Eyebrow } from '@/components/Eyebrow';
import type { SectionCopy } from '@/content/sections';

// How every section opens: an eyebrow, the headline, and one supporting line, centred (see `.section-head`
// in globals.css). The section's one component or asset follows it. It holds the section's only h2.
// `highlight` is the one phrase set in the accent colour.
export function SectionHead({ id, eyebrow, title, highlight, lead }: SectionCopy & { id: string }) {
  const at = title.indexOf(highlight);
  return (
    <header className="section-head">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="display-md" id={`${id}-title`}>
        {title.slice(0, at)}
        <span className="hl">{highlight}</span>
        {title.slice(at + highlight.length)}
      </h2>
      {lead && <p className="lead">{lead}</p>}
    </header>
  );
}
