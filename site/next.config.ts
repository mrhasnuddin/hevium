import type { NextConfig } from 'next';

// A fully static site served at root on hevium.xyz (NEXT_PUBLIC_BASE_PATH defaults to '').
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
};

export default config;
