import { SITE, type AppTarget } from '@/config/site';

// A referral code is copied from the visitor's address bar into every link to the app,
// so nothing but this shape is ever let through.
const REF = /^[A-Za-z0-9_-]{1,64}$/;

/** The referral code in a query string, or null if there is none or it is not a plain code. */
export function readRef(search: string): string | null {
  const ref = new URLSearchParams(search).get(SITE.refParam);
  return ref !== null && REF.test(ref) ? ref : null;
}

/** A link into the app, carrying the visitor's referral code when present. */
export function appUrl(target: AppTarget, { ref }: { ref?: string | null; placement?: string } = {}): string {
  const url = new URL(SITE.appPaths[target], SITE.app);
  if (ref && REF.test(ref)) url.searchParams.set(SITE.refParam, ref);
  return url.href;
}
