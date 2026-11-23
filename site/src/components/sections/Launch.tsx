'use client';

import { AppLink } from '@/components/AppLink';
import { PixelArt } from '@/components/PixelArt';
import { SectionHead } from '@/components/SectionHead';
import { asset } from '@/config/site';
import { useWords } from '@/components/Words';
import styles from './Launch.module.css';

// The section's one piece: a coin press under a dome, drawn in star pixels across the whole width
// (the `press` scene in lib/pixelScenes.ts). It strikes a coin while a counter runs to fifteen, and the
// coin splits as it leaves: four parts to the first bin, one to the second, none to the third. The bins stand
// in thirds, and their figures are real text, one per third: under the bins on a small screen, inside them
// where the section is one screen.
export function Launch() {
  const { LAUNCH_PRESS, LAUNCH_SPLIT, SECTIONS, UI } = useWords().copy;
  return (
    <section className="section" id="launch" aria-labelledby="launch-title">
      <div className="container">
        <SectionHead id="launch" {...SECTIONS.launch} />
        <figure className={`section-piece ${styles.figure}`}>
          <PixelArt scene="press" fallback={asset('/art/launch-press.svg')} className={styles.scene} />
          <dl className={styles.split}>
            {LAUNCH_SPLIT.map((part) => (
              <div key={part.label}>
                <dt>{part.label}</dt>
                <dd>{part.value}</dd>
              </div>
            ))}
          </dl>
          <figcaption className="sr-only">{LAUNCH_PRESS}</figcaption>
        </figure>
        <div className="section-foot">
          <AppLink className="btn btn-tonal" target="launch" placement="launch">
            {UI.launchToken}
          </AppLink>
        </div>
      </div>
    </section>
  );
}
