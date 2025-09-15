/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure node_modules packages with modern syntax are transpiled for the client bundle
  transpilePackages: ['undici'],
  webpack: (config, { isServer }) => {
    // Avoid bundling Node-only 'undici' into the client (browser has native fetch)
    if (!isServer) {
      config.resolve = config.resolve || {};
      // Prefer browser builds when packages export multiple conditions
      config.resolve.conditionNames = [
        'browser',
        'import',
        'module',
        'default',
        ...(config.resolve.conditionNames || []),
      ];
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        undici: false,
        // Force Firebase Auth to use the browser ESM build to avoid Node-only deps like 'undici'
        '@firebase/auth': '@firebase/auth/dist/esm2017/index.js',
        'firebase/auth': 'firebase/auth/dist/index.mjs',
        '@firebase/auth/dist/node-esm/index.js': '@firebase/auth/dist/esm2017/index.js',
        '@firebase/auth/dist/node-esm': '@firebase/auth/dist/esm2017/index.js',
      };
    }
    return config;
  },
};

export default nextConfig;
