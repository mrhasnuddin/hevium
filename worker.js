const CANONICAL_BASE = 'https://hevium.xyz/';
const CANONICAL_ORIGIN = 'https://hevium.xyz';

// Dynamically rewrites Open Graph / Twitter share URLs to the active request origin
// (e.g. *.workers.dev / *.pages.dev preview URLs) while leaving https://hevium.xyz/ untouched.
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return response;

    const url = new URL(request.url);
    if (url.origin === CANONICAL_ORIGIN) return response;

    const activeBase = `${url.origin}/`;
    const rewriteAttr = (attr) => ({
      element(el) {
        const val = el.getAttribute(attr);
        if (val && val.startsWith(CANONICAL_BASE)) {
          el.setAttribute(attr, activeBase + val.slice(CANONICAL_BASE.length));
        }
      },
    });

    return new HTMLRewriter()
      .on('meta[property="og:image"], meta[property="og:image:secure_url"], meta[property="og:url"], meta[name="twitter:image"]', rewriteAttr('content'))
      .on('link[rel="canonical"]', rewriteAttr('href'))
      .transform(response);
  },
};
