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
      // Improve hot reloading
      optimizePackageImports: ['framer-motion', 'lucide-react'],
    },
    // Improve hot reloading and reduce restart frequency
    webpack: (config, { dev }) => {
      if (dev) {
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
          ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
        }
        // Reduce memory usage
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              default: false,
              vendors: false,
              // Bundle vendor libraries
              vendor: {
                name: 'vendor',
                chunks: 'all',
                test: /node_modules/,
                priority: 20,
              },
              // Bundle common components
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                priority: 10,
                reuseExistingChunk: true,
                enforce: true,
              },
            },
          },
        }
      }
      return config
    },
    // Improve development server stability
    onDemandEntries: {
      // Period (in ms) where the server will keep pages in the buffer
      maxInactiveAge: 25 * 1000,
      // Number of pages that should be kept simultaneously without being disposed
      pagesBufferLength: 2,
    },
  }),
}

export default nextConfig