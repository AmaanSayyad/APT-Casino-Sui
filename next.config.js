/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'build',
  transpilePackages: ['three'],
  images: {
    domains: ['images.unsplash.com'],
  },
  // Increase chunk loading timeout to 60 seconds
  experimental: {
    pageLoadTimeout: 60, // 60 seconds
  },
  // Performance optimizations
  poweredByHeader: false,
  reactStrictMode: false, // Disable strict mode to prevent double-renders and potential issues
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    
    // Polyfill Node.js modules that Uniswap's dependencies require
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      path: false,
      stream: false,
      zlib: false,
      http: false,
      https: false,
      crypto: false,
      os: false,
    };

    // Optimize chunking for better loading performance
    if (!isServer && !dev) {
      // Combine smaller chunks to reduce network requests
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        maxSize: 200000,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@react|react|react-dom|next|scheduler)[\\/]/,
            priority: 40,
            enforce: true,
          },
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 20,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
              return `npm.${packageName.replace('@', '')}`;
            },
            priority: 10,
            minChunks: 1,
          },
        },
      };
    }
    
    return config;
  },
  eslint: {
    // Exclude web3-contracts during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore type checking during build
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig
