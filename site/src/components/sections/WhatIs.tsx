'use client';

import type { CSSProperties } from 'react';
import { Count } from '@/components/Count';
import { Eyebrow } from '@/components/Eyebrow';
import { PixelField } from '@/components/PixelArt';
import { useWords } from '@/components/Words';
import { Problem } from './Problem';
import styles from './WhatIs.module.css';

// How far through the statement a figure's words end, from 0 to 1.

// The plain statement of what Hevium is, standing straight on the canvas with no sheet or lines round it,
// under the page's eyebrow and over a field of its star pixels.
// It lights up as it is scrolled through. All of that is CSS (see the module), so the text is whole with scripts off.
// One more part follows it in the same section: the problem Hevium answers. The two are one section
// so the page has fewer stops. The solution comes next, as the head of the four engines' frame.
export function WhatIs() {
  const { FACTS, META, UI } = useWords().copy;
  const readBy = (words: string) => ((META.whatIs.indexOf(words) + words.length) / META.whatIs.length).toFixed(3);
  return (
    <section className={`section ${styles.about}`} id="about" aria-labelledby="about-title">
      <div className="container">
        <div className={styles.sheet}>
          <Eyebrow as="h2" id="about-title" className={styles.bar}>
            {UI.whatIs}
          </Eyebrow>
          <div className={styles.body}>
            <p className={`display-md ${styles.statement}`} id="what-is-hevium">
              <PixelField className={styles.field} />
              <span className={styles.ink}>{META.whatIs}</span>
            </p>
            <dl className={styles.facts}>
              {FACTS.map((fact) => (
                <div key={fact.words} style={{ '--at': readBy(fact.words) } as CSSProperties}>
                  <dt>{fact.label}</dt>
                  <dd>
                    <Count value={fact.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <Problem />
      </div>
    </section>
  );
}
