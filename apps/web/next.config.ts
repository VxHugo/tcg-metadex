import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@tcg-intelligence/market-engine"],
};

export default nextConfig;
