'use client';

import { AppLink } from '@/components/AppLink';
import { SectionHead } from '@/components/SectionHead';
import { useWords } from '@/components/Words';
import { ShareCards } from './ShareCards';

// Earn: the head, one piece (a stack of sample share cards to play with, beside the perks in words), and
// the button to the affiliate page.
export function Earn() {
  const { SECTIONS, UI } = useWords().copy;
  return (
    <section className="section" id="earn" aria-labelledby="earn-title">
      <div className="container">
        <SectionHead id="earn" {...SECTIONS.earn} />
        <ShareCards />
        <div className="section-foot">
          <AppLink className="btn btn-tonal" target="affiliate" placement="earn">
            {UI.becomeAffiliate}
          </AppLink>
        </div>
      </div>
    </section>
  );
}
