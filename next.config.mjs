/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-leaflet', 'leaflet'],
  serverExternalPackages: ['mongoose'],
};

export default nextConfig;
