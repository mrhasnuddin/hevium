'use client';

import { Eyebrow } from '@/components/Eyebrow';
import { SectionHead } from '@/components/SectionHead';
import { useWords } from '@/components/Words';
import { TrustBento } from './TrustBento';
import styles from './Trust.module.css';

// Trust and FAQ: one section in two parts, so the page has fewer stops. First the
// four guarantees and the audit as an animated bento (TrustBento). Then the questions: plain `details`, one open at a time, on the canvas with no boxes or lines. The
// nav bar's FAQ link lands on the questions. The questions need no script.
export function Trust() {
  const { FAQ, SECTIONS, UI } = useWords().copy;
  const at = UI.faqTitle.indexOf(UI.faqHighlight);
  return (
    <section className={`section ${styles.trust}`} id="trust" aria-labelledby="trust-title">
      <div className="container">
        <SectionHead id="trust" {...SECTIONS.trust} />
        <TrustBento />

        <div className={styles.faq} id="faq">
          <div className={styles.aside}>
            <Eyebrow>{UI.faq}</Eyebrow>
            <h3 className="display-md" id="faq-title">
              {UI.faqTitle.slice(0, at)}
              <span className="hl">{UI.faqHighlight}</span>
              {UI.faqTitle.slice(at + UI.faqHighlight.length)}
            </h3>
          </div>
          <div>
            {FAQ.map((item, i) => (
              // one name for all of them: the browser keeps a single one open
              <details key={item.q} className={styles.item} name="faq" open={i === 0}>
                <summary>
                  <span data-question>{item.q}</span>
                  <span className={styles.plus} data-plus aria-hidden="true" />
                </summary>
                <p data-answer>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
