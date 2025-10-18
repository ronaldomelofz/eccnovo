/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removido 'output: export' para permitir API routes funcionarem
  // Funciona nativamente no Vercel com SSR/API routes
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig 