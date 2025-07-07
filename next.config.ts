import type { NextConfig } from 'next';

// Detectar el entorno de deployment
const isFirebase =
  process.env.BUILD_TARGET === 'firebase' ||
  process.env.FIREBASE_CLI === 'true' ||
  process.env.npm_lifecycle_event === 'build:firebase';

console.log('🚀 Build environment:', {
  isFirebase,
  BUILD_TARGET: process.env.BUILD_TARGET,
  npm_lifecycle_event: process.env.npm_lifecycle_event,
});

const nextConfig: NextConfig = {
  // Solo usar export para Firebase
  ...(isFirebase && { output: 'export' }),

  reactStrictMode: true,
  // Consistent con firebase.json
  trailingSlash: false,

  images: {
    // Firebase necesita imágenes sin optimizar, Vercel maneja las imágenes mejor
    unoptimized: isFirebase,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
      },
    ],
  },
};

export default nextConfig;
