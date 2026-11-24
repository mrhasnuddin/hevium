'use client';

import { Card } from '@/components/Card';
import { Eyebrow } from '@/components/Eyebrow';
import { PixelArt } from '@/components/PixelArt';
import { CHAIN_LOGOS, asset } from '@/config/site';
import type { SectionCopy } from '@/content/sections';
import { useWords } from '@/components/Words';
import type { SceneName } from '@/lib/pixelScenes';
import styles from './Problem.module.css';

// One moving object per wall, in the walls' order: a coin behind bars, a robot head with a crosshair for
// an eye, and a pointer pressing a button by hand.
const ART: SceneName[] = ['vault', 'bot', 'click'];

// How a part of the What is Hevium section opens: as a section does, with the eyebrow pill, and a heading
// one level down.
function PartHead({ id, eyebrow, title, highlight, lead }: SectionCopy & { id: string }) {
  const at = title.indexOf(highlight);
  return (
    <header className="section-head">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h3 className="display-md" id={`${id}-title`}>
        {title.slice(0, at)}
        <span className="hl">{highlight}</span>
        {title.slice(at + highlight.length)}
      </h3>
      {lead && <p className="lead">{lead}</p>}
    </header>
  );
}

function Wall({ index, className }: { index: number; className?: string }) {
  const wall = useWords().copy.PROBLEMS[index];
  return (
    <Card as="article" className={className}>
      <div className={styles.thumb}>
        <PixelArt scene={ART[index]} fallback={asset(`/art/problem-${ART[index]}.svg`)} />
      </div>
      <div className="card-text">
        <h4 className="card-title">{wall.title}</h4>
        <p>{wall.body}</p>
      </div>
    </Card>
  );
}

// The second part of the What is Hevium section: the three walls as cards, laid out after OriginKit's
// features-04: a fact over a card, a card over a fact, and one tall card. Each card's object is drawn in
// star pixels: it moves, and it leans toward the pointer.
export function Problem() {
  const { PROBLEM_FACTS, SECTIONS } = useWords().copy;
  return (
    <div className={styles.part} id="problem">
      <PartHead id="problem" {...SECTIONS.problem} />
      <div className={styles.grid}>
        <div className={styles.column}>
          <Card variant="stat">
            <span className={styles.chains}>
              {CHAIN_LOGOS.map((chain) => (
                // eslint-disable-next-line @next/next/no-img-element -- the app's own logo, served by the app
                <img key={chain.name} src={chain.src} alt={chain.name} width={28} height={28} loading="lazy" decoding="async" />
              ))}
            </span>
            {PROBLEM_FACTS[0]}
          </Card>
          <Wall index={0} />
        </div>
        <div className={styles.column}>
          <Wall index={1} />
          <Card variant="stat">
            <span className={styles.ring} aria-hidden="true" />
            {PROBLEM_FACTS[1]}
          </Card>
        </div>
        <Wall index={2} className={styles.tall} />
      </div>
    </div>
  );
}
