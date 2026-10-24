import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Temporarily disable the React Compiler on memory-constrained builders
  reactCompiler: false,

  // 2. Prevent TS and ESLint from running during deployment builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // 3. Keep memory overhead low
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;