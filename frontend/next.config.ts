import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Environment variables will be set by Vercel automatically
  // Development: uses http://localhost:8000 (default)
  // Production: uses NEXT_PUBLIC_API_BASE_URL from Vercel env vars
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
  },
};

export default nextConfig;
