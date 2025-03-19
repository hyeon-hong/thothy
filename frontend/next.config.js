/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/langgraph/:path*',
        destination: 'https://thothy-main-1-de5fb55cbe095927b7558bbdb47d8a8d.us.langgraph.app/:path*',
      },
    ]
  },
}

module.exports = nextConfig 