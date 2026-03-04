import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress responses with gzip
  compress: true,

  // Strict mode catches potential issues early
  reactStrictMode: true,

  experimental: {
    // Optimise imports from large libraries — tree-shakes icon/component packs
    // so only used symbols are bundled
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-data-grid',
      '@mui/x-date-pickers',
      '@tanstack/react-query',
    ],
  },
};

export default nextConfig;
