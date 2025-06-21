/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Development-specific settings
  ...(process.env.NODE_ENV === 'development' && {
    // Disable caching in development
    generateEtags: false,
    // Force reload of API routes
    experimental: {
      serverComponentsExternalPackages: [],
    },
    // Improve hot reloading
    webpack: (config, { dev }) => {
      if (dev) {
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        }
      }
      return config
    },
  }),
}

export default nextConfig