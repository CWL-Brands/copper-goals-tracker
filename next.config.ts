import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ensure node_modules packages with modern syntax are transpiled for the client bundle
  transpilePackages: ['undici'],
  webpack: (config, { isServer }) => {
    // Avoid bundling Node-only 'undici' into the client (browser has native fetch)
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        undici: false,
      };
    }
    return config;
  },
};

export default nextConfig;
