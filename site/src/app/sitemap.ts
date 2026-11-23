import type { MetadataRoute } from 'next';
import { HOME } from '@/lib/seo';

export const dynamic = 'force-static';

// One page. It is served under a path of the app's own site, so that site's robots.txt is the one to name this file.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: HOME, changeFrequency: 'weekly', priority: 1 }];
}
