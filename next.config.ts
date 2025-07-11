import type { NextConfig } from 'next';

// Detectar el entorno de deployment - En build time
const DEPLOY_TARGET = process.env.DEPLOY_TARGET;
const isFirebase = typeof window === 'undefined' && DEPLOY_TARGET === 'firebase';
if (isFirebase) console.log('🚀 DEPLOY_TARGET isFirebase 🔥');

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
