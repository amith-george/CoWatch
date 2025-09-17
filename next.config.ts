// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Add the Twitch thumbnail hostname to this array
    domains: [
      "i.pravatar.cc", 
      "i.ytimg.com", 
      "static-cdn.jtvnw.net"
    ],
  },
};

export default nextConfig;