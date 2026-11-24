import type { Metadata } from 'next';
import { SITE } from '@/config/site';
import { getCopy } from '@/content/copy';
import { LANGS, langOf, langPath, type Lang } from '@/content/langs';

/** The site's address, and each language's page under it. */
export const HOME = `${SITE.origin}${SITE.path}`;
export const pageUrl = (lang: Lang) => `${HOME}${langPath(lang)}`;
const SHARE = { url: `${HOME}og.png`, width: 1200, height: 630, type: 'image/png' };

// Each page names the others as the same page in another language, and English as the one to fall back on.
const ALTERNATES = { ...Object.fromEntries(LANGS.map(({ code, tag }) => [tag, pageUrl(code)])), 'x-default': HOME };

/** What a search engine and a link preview are given for a language's page. */
export function pageMetadata(lang: Lang): Metadata {
  const { META, UI } = getCopy(lang);
  const url = pageUrl(lang);
  return {
    metadataBase: new URL(HOME),
    title: META.title,
    description: META.description,
    alternates: { canonical: url, languages: ALTERNATES },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE.name,
      title: META.title,
      description: META.description,
      locale: langOf(lang).og,
      alternateLocale: LANGS.filter(({ code }) => code !== lang).map(({ og }) => og),
      images: [{ ...SHARE, alt: UI.ogAlt }],
    },
    twitter: { card: 'summary_large_image', site: '@heviumxyz', title: META.title, description: META.description, images: [SHARE.url] },
  };
}

// Who Hevium is and what the page answers, for search and answer engines, in the page's own language. The
// questions are the FAQ's own, word for word: structured data that says more than the page shows is ignored,
// or held against it.
export function structured(lang: Lang) {
  const { FAQ, META } = getCopy(lang);
  const url = pageUrl(lang);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${HOME}#organization`, name: SITE.name, url: HOME, logo: `${HOME}icon.svg`, sameAs: [SITE.x, SITE.threads] },
      { '@type': 'WebSite', '@id': `${HOME}#website`, name: SITE.name, url: HOME, inLanguage: LANGS.map(({ tag }) => tag), publisher: { '@id': `${HOME}#organization` } },
      { '@type': 'WebPage', '@id': `${url}#page`, url, name: META.title, description: META.description, inLanguage: langOf(lang).tag, isPartOf: { '@id': `${HOME}#website` }, about: { '@id': `${HOME}#organization` } },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        inLanguage: langOf(lang).tag,
        mainEntity: FAQ.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
      },
    ],
  };
}

// llms.txt: the page in plain text, from the same copy the page shows, so the two cannot drift apart. It is in
// English, and names where the page is in each other language.
export function llmsTxt() {
  const { CHAINS, FACTS, FAQ, GUARANTEES, META } = getCopy('en');
  return [
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
    `- [Website](${HOME})`,
    `- [App](${SITE.app})`,
    `- [Docs](${SITE.docs})`,
    `- [MCP server](${SITE.mcp})`,
    `- [Brand kit](${SITE.brand})`,
    `- [X](${SITE.x})`,
    `- [Threads](${SITE.threads})`,
    '',
    '## Languages',
    '',
    ...LANGS.map(({ code, name }) => `- [${name}](${pageUrl(code)})`),
    '',
  ].join('\n');
}
