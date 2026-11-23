import { SITE } from '@/config/site';
import { FACTS, META } from '@/content/meta';
import { CHAINS, FAQ, GUARANTEES } from '@/content/sections';

/** The page's one address. */
export const HOME = `${SITE.origin}${SITE.path}`;
export const SHARE_IMAGE = { url: `${HOME}og.png`, width: 1200, height: 630, alt: 'Hevium: the multi-chain stock and fair-launch terminal.' };

// Who Hevium is and what the page answers, for search and answer engines. The questions are the FAQ's own,
// word for word: structured data that says more than the page shows is ignored, or held against it.
export const STRUCTURED = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${SITE.app}#organization`, name: SITE.name, url: SITE.app, logo: `${HOME}icon.svg`, sameAs: [SITE.x] },
    { '@type': 'WebSite', '@id': `${HOME}#website`, name: SITE.name, url: HOME, publisher: { '@id': `${SITE.app}#organization` } },
    { '@type': 'WebPage', '@id': `${HOME}#page`, url: HOME, name: META.title, description: META.description, inLanguage: 'en', isPartOf: { '@id': `${HOME}#website` }, about: { '@id': `${SITE.app}#organization` } },
    {
      '@type': 'FAQPage',
      '@id': `${HOME}#faq`,
      mainEntity: FAQ.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
    },
  ],
};

// llms.txt: the page in plain text, from the same copy the page shows, so the two cannot drift apart.
export const LLMS_TXT = [
  `# ${SITE.name}`,
  '',
  `> ${META.whatIs}`,
  '',
  '## Facts',
  '',
  ...FACTS.map((fact) => `- ${fact.label}: ${fact.value}`),
  ...GUARANTEES.map((item) => `- ${item.title}: ${item.text}`),
  '',
  '## Chains',
  '',
  ...CHAINS.map((chain) => `- ${chain.name}: ${chain.suits}. Trades ${chain.trades.join(', ')}.`),
  '',
  '## Questions',
  '',
  ...FAQ.flatMap((item) => [`### ${item.q}`, '', item.a, '']),
  '## Links',
  '',
  `- [App](${SITE.app})`,
  `- [Docs](${SITE.docs})`,
  `- [MCP server](${SITE.mcp})`,
  `- [Brand kit](${SITE.brand})`,
  `- [X](${SITE.x})`,
  '',
].join('\n');
