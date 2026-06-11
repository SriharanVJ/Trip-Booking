/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable SWC minification for faster builds
  swcMinify: true,

  // Optimize images
  images: {
    domains: ['localhost', 'images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Production optimizations
  productionBrowserSourceMaps: false,

  // Compression
  compress: true,

  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Headers for caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:all*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Simplified webpack config
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    config.resolve.fallback = { ...config.resolve.fallback, fs: false }
    return config
  },
}

module.exports = nextConfig
