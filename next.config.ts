import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/CPAM.github.io/",
  assetPrefix: "/CPAM.github.io/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
