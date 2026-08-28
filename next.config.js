/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export estático — compatível com Netlify (https://eccalimentodoamor.netlify.app)
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
