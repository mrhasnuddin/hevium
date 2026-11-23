import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LANGS, isLang, langOf, type Lang } from '@/content/langs';
import { pageMetadata } from '@/lib/seo';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import '@/styles/tokens.css';
import '../globals.css';
import '../entrances.css';
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

// English is at the site's root and each other language under its own segment: /, /ms/, /ja/ and so on.
// Nothing else is a page.
export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map(({ code }) => ({ lang: code === 'en' ? [] : [code] }));

/** The language an address names: none for English, one known segment for any other. */
export function langFrom(segments: string[] | undefined): Lang {
  const [code = 'en', ...more] = segments ?? [];
  if (more.length || !isLang(code) || (code === 'en' && segments?.length)) notFound();
  return code;
}

export async function generateMetadata({ params }: LayoutProps<'/[[...lang]]'>): Promise<Metadata> {
  return pageMetadata(langFrom((await params).lang));
}

export default async function RootLayout({ children, params }: LayoutProps<'/[[...lang]]'>) {
  const lang = langFrom((await params).lang);
  return (
    // the script below marks <html> before the page's own script runs, which is not a mismatch to report
    <html lang={langOf(lang).tag} className={`${jakarta.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: EARLY }} />
        {children}
      </body>
    </html>
  );
}
