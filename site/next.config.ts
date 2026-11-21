import type { NextConfig } from 'next';

// A fully static site. Production builds set NEXT_PUBLIC_BASE_PATH=/home, where the page is served.
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
};

export default config;
