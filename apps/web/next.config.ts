import type { NextConfig } from "next";
import { validateEnv } from "./lib/env";

validateEnv();

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@riven/ui", "@riven/hooks", "@riven/utils"],
};

export default nextConfig;
