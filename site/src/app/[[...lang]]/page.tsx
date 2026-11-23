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
import { WordsProvider } from '@/components/Words';
import { getCopy } from '@/content/copy';
import { structured } from '@/lib/seo';
import { langFrom } from './layout';

export default async function Home({ params }: PageProps<'/[[...lang]]'>) {
  const lang = langFrom((await params).lang);
  // The page is drawn in this language, and the visitor can change it without loading the page again: every
  // part reads its words from this store (components/Words.tsx).
  return (
    <WordsProvider lang={lang} copy={getCopy(lang)}>
      <Entrance />
      <Nav />
      <main>
        <Hero />
        <WhatIs />
        <Engines>
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured(lang)).replace(/</g, '\\u003c') }} />
    </WordsProvider>
  );
}
