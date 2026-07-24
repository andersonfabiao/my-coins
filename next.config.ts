import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
    useLightningcss: true,
  },
};

export default nextConfig;
