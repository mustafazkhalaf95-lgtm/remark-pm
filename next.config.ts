import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/work/workflow',
  typescript: {
    ignoreBuildErrors: false,
  },
  output: 'standalone',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/work/workflow',
  },
};

export default nextConfig;
