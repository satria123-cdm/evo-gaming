import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating "back to home" button owns the bottom-left corner in dev too.
  devIndicators: { position: "bottom-right" },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
