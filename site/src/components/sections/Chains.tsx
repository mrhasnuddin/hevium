'use client';

import { AppLink } from '@/components/AppLink';
import { SectionHead } from '@/components/SectionHead';
import { useWords } from '@/components/Words';
import { ChainRoute } from './ChainRoute';
import styles from './Chains.module.css';

// Five chains: the head, the three steps as pills, one piece (the hub with a lane to each chain), and the
// button into the app. The page's "How it works" is those three steps, so the hero's button of that name
// lands here: the empty anchor at the top holds the name `how`.
export function Chains() {
  const { CHAIN_STEPS, SECTIONS, UI } = useWords().copy;
  return (
    <section className={`section ${styles.section}`} id="chains" aria-labelledby="chains-title">
      <span className={styles.anchor} id="how" />
      <div className="container">
        <SectionHead id="chains" {...SECTIONS.chains} />
        <ol className={`pill-row ${styles.steps}`} data-steps>
          {CHAIN_STEPS.map((step, i) => (
            <li key={step}>
              <span className="pill" data-pill>
                <span className="pill-n" data-n aria-hidden="true">
                  0{i + 1}
                </span>
                <span data-step>{step}</span>
              </span>
            </li>
          ))}
        </ol>
        <ChainRoute />
        <div className="section-foot">
          <AppLink className="btn btn-tonal" target="app" placement="chains">
            {UI.startTrading}
          </AppLink>
        </div>
      </div>
    </section>
  );
}
