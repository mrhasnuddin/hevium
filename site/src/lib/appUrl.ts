import { SITE, type AppTarget } from '@/config/site';

// A referral code is copied from the visitor's address bar into every link to the app,
// so nothing but this shape is ever let through.
const REF = /^[A-Za-z0-9_-]{1,64}$/;

/** The referral code in a query string, or null if there is none or it is not a plain code. */
export function readRef(search: string): string | null {
  const ref = new URLSearchParams(search).get(SITE.refParam);
  return ref !== null && REF.test(ref) ? ref : null;
}

/** A link into the app, tagged with where on this page it sits and with the visitor's referral code. */
export function appUrl(target: AppTarget, { ref, placement }: { ref?: string | null; placement?: string } = {}): string {
  const url = new URL(SITE.appPaths[target], SITE.app);
  url.searchParams.set('utm_source', 'landing');
  url.searchParams.set('utm_medium', 'cta');
  url.searchParams.set('utm_campaign', 'home');
  if (placement) url.searchParams.set('utm_content', placement);
  if (ref && REF.test(ref)) url.searchParams.set(SITE.refParam, ref);
  return url.href;
}
