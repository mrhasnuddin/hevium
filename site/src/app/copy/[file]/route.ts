import { getCopy } from '@/content/copy';
import { LANGS, isLang } from '@/content/langs';

export const dynamic = 'force-static';
export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map(({ code }) => ({ file: `${code}.json` }));

// The page's words in one language (/copy/ja.json), for changing language without loading the page again:
// components/Words.tsx fetches the one the visitor picks.
export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const code = (await params).file.replace(/\.json$/, '');
  return isLang(code) ? Response.json(getCopy(code)) : new Response('', { status: 404 });
}
