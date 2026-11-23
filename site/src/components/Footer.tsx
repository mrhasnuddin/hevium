import { PixelWordmark } from '@/components/PixelArt';
import { SITE, asset } from '@/config/site';
import { FOOTER, RISK_LINE } from '@/content/meta';
import styles from './Footer.module.css';

type FooterLink = { label: string; href: string; external?: true };
type FooterGroup = { heading: string; links: FooterLink[] };

const GROUPS: FooterGroup[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Stocks', href: '#stocks' },
      { label: 'Launch', href: '#launch' },
      { label: 'Agents', href: '#agents' },
      { label: 'Earn', href: '#earn' },
      { label: 'Five chains', href: '#chains' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Docs', href: SITE.docs, external: true },
      { label: 'MCP server', href: SITE.mcp, external: true },
      { label: 'FAQ', href: '#faq' },
      { label: 'Trust', href: '#trust' },
      { label: 'Brand kit', href: SITE.brand, external: true },
    ],
  },
];

// Three-band editorial footer: top split (statement left, Product & Resources columns right), centre
// full-width star-pixel Hevium wordmark over a soft mint floor wash, and a single quiet bottom bar with
// the lockup, risk notice, optional legal links, and minimal icons.
export function Footer() {
  return (
    <footer className={styles.footer} data-footer>
      <div className={styles.seam} aria-hidden="true" />

      <div className={`container ${styles.inner}`}>
        <div className={styles.top}>
          <p className={styles.statement} data-statement>
            {FOOTER.headline}
          </p>

          <div className={styles.columns} data-footer-links>
            {GROUPS.map((group) => (
              <div key={group.heading} className={styles.group}>
                <h3 className={styles.heading}>{group.heading}</h3>
                <ul className={styles.list}>
                  {group.links.map(({ label, href, external }) => (
                    <li key={label}>
                      <a
                        className={styles.link}
                        href={href}
                        {...(external && { target: '_blank', rel: 'noopener' })}
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.wordmark} data-wordmark aria-hidden="true">
          <PixelWordmark src={asset('/brand/hevium-wordmark-white.svg')} />
        </div>

        <div className={styles.bottom}>
          <div className={styles.bottomLeft}>
            <a className={styles.logo} href="#top" aria-label="Hevium, back to top">
              {/* eslint-disable-next-line @next/next/no-img-element -- static export uses plain <img> */}
              <img src={asset('/brand/hevium-logo-dark.svg')} alt="" width={92} height={25} />
            </a>
            <p className={styles.risk} data-risk>
              {RISK_LINE}
            </p>
            {(SITE.legal.terms || SITE.legal.privacy) && (
              <div className={styles.legal}>
                {SITE.legal.terms && (
                  <a className={styles.legalLink} href={SITE.legal.terms} target="_blank" rel="noopener">
                    Terms
                  </a>
                )}
                {SITE.legal.privacy && (
                  <a className={styles.legalLink} href={SITE.legal.privacy} target="_blank" rel="noopener">
                    Privacy
                  </a>
                )}
              </div>
            )}
          </div>

          <div className={styles.bottomRight}>
            <span className={styles.copy}>{FOOTER.copyright}</span>
            <a
              className={styles.iconLink}
              href={SITE.x}
              target="_blank"
              rel="noopener"
              aria-label="X (@heviumxyz)"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                />
              </svg>
            </a>
            <a className={styles.iconLink} href="#top" aria-label={FOOTER.backToTop}>
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 13V3.5M4 7.5 8 3.5l4 4"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
