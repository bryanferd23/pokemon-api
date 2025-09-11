import type { NextConfig } from "next";
import createBundleAnalyzer from '@next/bundle-analyzer';

// Bundle analyzer configuration
const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  images: {
    // Enable modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Configure remote image sources
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/PokeAPI/sprites/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.pokemon.com',
        port: '',
        pathname: '**',
      },
    ],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for different breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimize layout shift with placeholder
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
  },
};

export default withBundleAnalyzer(nextConfig);
