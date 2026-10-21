import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8000/api/v1/:path*',
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/stock/:ticker*',
        destination: '/stocks/:ticker*',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
