import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // From our previous config
  
  // Skip ESLint during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // From our previous config to allow external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },

  // Your new properties
  experimental: {
    // Skip prerendering for specific routes
  },
  // Add these pages to skip static generation
  async rewrites() {
    return [];
  },
};

export default nextConfig;