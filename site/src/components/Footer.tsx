'use client';

import { PixelWordmark } from '@/components/PixelArt';
import { SITE, asset } from '@/config/site';
import type { Copy } from '@/content/copy';
import { useWords } from '@/components/Words';
import styles from './Footer.module.css';

type FooterLink = { label: string; href: string; external?: true };
type FooterGroup = { heading: string; links: FooterLink[] };

// The two groups of links, named in the page's language.
const groups = ({ ENGINES, UI }: Copy): FooterGroup[] => [
  {
    heading: UI.product,
    links: [...ENGINES.map(({ label, href }) => ({ label, href })), { label: UI.chains, href: '#chains' }],
  },
  {
    heading: UI.resources,
    links: [
      { label: UI.docs, href: SITE.docs, external: true },
      { label: UI.mcpServer, href: SITE.mcp, external: true },
      { label: UI.faq, href: '#faq' },
      { label: UI.trust, href: '#trust' },
      { label: UI.brandKit, href: SITE.brand, external: true },
    ],
  },
];

// Three-band editorial footer: top split (statement left, Product & Resources columns right), centre
// full-width star-pixel Hevium wordmark over a soft mint floor wash, and a single quiet bottom bar with
// the lockup, risk notice, optional legal links, and minimal icons.
export function Footer() {
  const words = useWords().copy;
  const { FOOTER, RISK_LINE, UI } = words;
  return (
    <footer className={styles.footer} data-footer>
      <div className={styles.seam} aria-hidden="true" />

      <div className={`container ${styles.inner}`}>
        <div className={styles.top}>
          <p className={styles.statement} data-statement>
            {FOOTER.headline}
          </p>

          <div className={styles.columns} data-footer-links>
            {groups(words).map((group) => (
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
            <a className={styles.logo} href="#top" aria-label={UI.backToTop}>
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
                    {UI.terms}
                  </a>
                )}
                {SITE.legal.privacy && (
                  <a className={styles.legalLink} href={SITE.legal.privacy} target="_blank" rel="noopener">
                    {UI.privacy}
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
            <a className={styles.iconLink} href={SITE.threads} target="_blank" rel="noopener" aria-label="Threads (@hevium.xyz)">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path fill="currentColor" d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" />
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
