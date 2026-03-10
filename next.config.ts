import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack: {
    root: '/Users/mustafakhalaf/remark-pm/.claude/worktrees/serene-benz',
  },
};

export default nextConfig;
