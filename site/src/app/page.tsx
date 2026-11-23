import { Away } from '@/components/Away';
import { Entrance } from '@/components/Entrance';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { Agents } from '@/components/sections/Agents';
import { Chains } from '@/components/sections/Chains';
import { Earn } from '@/components/sections/Earn';
import { Engines } from '@/components/sections/Engines';
import { Final } from '@/components/sections/Final';
import { Hero } from '@/components/sections/Hero';
import { Launch } from '@/components/sections/Launch';
import { Stocks } from '@/components/sections/Stocks';
import { Trust } from '@/components/sections/Trust';
import { WhatIs } from '@/components/sections/WhatIs';
import { SECTIONS } from '@/content/sections';
import { STRUCTURED } from '@/lib/seo';

export default function Home() {
  return (
    <>
      <Entrance />
      <Nav />
      <main>
        <Hero />
        <WhatIs />
        <Engines after={{ label: SECTIONS.chains.eyebrow, href: '#chains' }}>
          <Stocks />
          <Launch />
          <Agents />
          <Earn />
        </Engines>
        <Chains />
        <Trust />
        <Final />
      </main>
      <Footer />
      <Away />
      {/* who Hevium is and the questions it answers, for search and answer engines (lib/seo.ts) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED).replace(/</g, '\\u003c') }} />
    </>
  );
}
