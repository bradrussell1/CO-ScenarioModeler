import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/docx/[id]": ["./templates/**"],
  },
};

export default nextConfig;
