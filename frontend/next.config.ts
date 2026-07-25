import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Environment variables will be set by Vercel automatically
  // Development: uses http://localhost:8000 (default)
  // Production: uses NEXT_PUBLIC_API_URL from Vercel env vars
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  // Custom offline page for PWA
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
