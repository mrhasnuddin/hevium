import { AppLink } from '@/components/AppLink';
import { SectionHead } from '@/components/SectionHead';
import { SECTIONS } from '@/content/sections';
import { ShareCards } from './ShareCards';

// Earn: the head, one piece (a stack of sample share cards to play with, beside the perks in words), and
// the button to the affiliate page.
export function Earn() {
  return (
    <section className="section" id="earn" aria-labelledby="earn-title">
      <div className="container">
        <SectionHead id="earn" {...SECTIONS.earn} />
        <ShareCards />
        <div className="section-foot">
          <AppLink className="btn btn-tonal" target="affiliate" placement="earn">
            Become an affiliate
          </AppLink>
        </div>
      </div>
    </section>
  );
}
