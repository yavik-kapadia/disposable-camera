import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow requests from Nginx Proxy Manager domain
  allowedDevOrigins: [
    'cam.local.yavik.dev',
    'https://cam.local.yavik.dev',
  ],
};

export default nextConfig;
