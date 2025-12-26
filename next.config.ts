import { NextConfig } from 'next';

const config: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'gsap'],
  },
  // Otimizações de performance
  poweredByHeader: false,
  compress: true,
  // Cache otimizado
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            // Protege contra Clickjacking
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Evita que o navegador "adivinhe" tipos de arquivo (segurança básica)
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Força HTTPS (Strict-Transport-Security)
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // Protege contra vazamento de dados ao clicar em links saindo do site
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

export default config