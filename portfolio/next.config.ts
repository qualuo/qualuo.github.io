import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // For GitHub Pages deployment at root domain (qualuo.github.io)
  basePath: "",
  assetPrefix: "",
  trailingSlash: true,
};

export default nextConfig;
