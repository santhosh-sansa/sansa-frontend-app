/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  transpilePackages: ['@sansa/ui'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.sansaai.in',
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Exclude canvas (fabric.js Node.js peer dep — not needed in browser)
  webpack: (config) => {
    // canvas is a native Node.js module used by fabric for SSR — not needed client-side
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : []),
      { canvas: 'commonjs canvas' },
    ];
    return config;
  },
  async redirects() {
    return [];
  },
};

export default nextConfig;
