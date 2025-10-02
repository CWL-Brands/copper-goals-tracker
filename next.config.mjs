/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      // Prefer browser conditions when packages export multiple entry points
      config.resolve.conditionNames = [
        'browser',
        'import',
        'module',
        'default',
        ...(config.resolve.conditionNames || []),
      ];
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        // Do not bundle Node's undici into the browser; browsers have native fetch
        undici: false,
        'undici/': false,
        // No Firebase Auth aliasing here; we use the compat build in client code
      };
      // Also ensure webpack will not try to polyfill/resolve 'undici'
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        undici: false,
      };

    }
    return config;
  },
};

export default nextConfig;
