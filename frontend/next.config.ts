import type { NextConfig } from "next";

const downloadHeaders = [
  {
    source: "/downloads/navia-x-sbp-macos-apple-silicon.zip",
    headers: [
      {
        key: "Content-Type",
        value: "application/zip",
      },
      {
        key: "Content-Disposition",
        value:
          'attachment; filename="Navia-X-SBP-macOS-Apple-Silicon-0.1.0.zip"',
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ],
  },
  {
    source: "/downloads/navia-x-sbp-windows-installer.exe",
    headers: [
      {
        key: "Content-Type",
        value: "application/octet-stream",
      },
      {
        key: "Content-Disposition",
        value: 'attachment; filename="Navia-X-SBP-Setup-0.1.0.exe"',
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ],
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return downloadHeaders;
  },
};

export default nextConfig;
