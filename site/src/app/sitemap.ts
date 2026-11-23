import type { MetadataRoute } from 'next';
import { LANGS } from '@/content/langs';
import { pageUrl } from '@/lib/seo';

export const dynamic = 'force-static';

// The page in each of its languages, each naming the others.
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { ...Object.fromEntries(LANGS.map(({ code, tag }) => [tag, pageUrl(code)])), 'x-default': pageUrl('en') };
  return LANGS.map(({ code }) => ({ url: pageUrl(code), changeFrequency: 'weekly', priority: code === 'en' ? 1 : 0.8, alternates: { languages } }));
}
