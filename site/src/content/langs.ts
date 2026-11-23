// The page's languages. `code` is the address segment (English has none), `tag` the language as HTML and
// search engines name it, `short` the label on the switch, `name` the language in its own words, `og` the
// locale a link preview is told. This file is read in the browser, so it holds no translations.
export const LANGS = [
  { code: 'en', tag: 'en', short: 'EN', name: 'English', og: 'en_US' },
  { code: 'ms', tag: 'ms', short: 'BM', name: 'Bahasa Melayu', og: 'ms_MY' },
  { code: 'id', tag: 'id', short: 'ID', name: 'Bahasa Indonesia', og: 'id_ID' },
  { code: 'vi', tag: 'vi', short: 'VN', name: 'Tiếng Việt', og: 'vi_VN' },
  { code: 'zh-cn', tag: 'zh-Hans', short: 'CN', name: '简体中文', og: 'zh_CN' },
  { code: 'zh-tw', tag: 'zh-Hant', short: 'TW', name: '繁體中文', og: 'zh_TW' },
  { code: 'ja', tag: 'ja', short: 'JP', name: '日本語', og: 'ja_JP' },
  { code: 'ko', tag: 'ko', short: 'KR', name: '한국어', og: 'ko_KR' },
] as const;
export type Lang = (typeof LANGS)[number]['code'];
export const isLang = (code: string): code is Lang => LANGS.some((lang) => lang.code === code);
export const langOf = (code: Lang) => LANGS.find((lang) => lang.code === code)!;
/** Where a language's page is, under the site's own path: '' for English, 'ms/' and so on for the rest. */
export const langPath = (code: Lang) => (code === 'en' ? '' : `${code}/`);

/** Fills the `{name}` places in a line. */
export const fill = (line: string, values: Record<string, string | number>) => line.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
