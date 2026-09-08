import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: { optimizePackageImports: [] },
};

export default nextConfig;
