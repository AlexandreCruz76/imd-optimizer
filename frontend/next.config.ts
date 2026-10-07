import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.18.8",
    "192.168.15.118",
  ],
  // Resolve o workspace root pro frontend (evita lockfile do repo pai/
  // D:\imd\ na inferência do Turbopack — causa de lentidão no dev)
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
