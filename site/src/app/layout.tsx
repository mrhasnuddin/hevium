import type { Metadata } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { SITE } from '@/config/site';
import { META } from '@/content/meta';
import '@/styles/tokens.css';
import './globals.css';
import './entrances.css';
import { EARLY } from '@/components/Entrance';

// Both families are downloaded at build time and served from this site. tokens.css reads the two variables.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const HOME_URL = `${SITE.origin}${SITE.path}`;
const OG_ALT = 'Hevium: Multi-Chain Stock and Fair-Launch Terminal on Base, Robinhood Chain, BNB Chain, Solana and Elysium.';

export const metadata: Metadata = {
  metadataBase: new URL(HOME_URL),
  title: META.title,
  description: META.description,
  alternates: {
    canonical: HOME_URL,
  },
  openGraph: {
    type: 'website',
    url: HOME_URL,
    siteName: SITE.name,
    title: META.title,
    description: META.description,
    images: [
      {
        url: `${HOME_URL}og.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: OG_ALT,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@heviumxyz',
    title: META.title,
    description: META.description,
    images: [`${HOME_URL}og.png`],
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // the script below marks <html> before the page's own script runs, which is not a mismatch to report
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: EARLY }} />
        {children}
      </body>
    </html>
  );
}
