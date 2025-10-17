/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for API routes
  reactStrictMode: true,
  
  // Support for existing vanilla JS structure
  // Serve static files from admin, toko, ustadz, wali folders
  async rewrites() {
    return [
      // Keep existing vanilla JS apps accessible
      {
        source: '/admin/:path*',
        destination: '/admin/:path*',
      },
      {
        source: '/toko/:path*',
        destination: '/toko/:path*',
      },
      {
        source: '/ustadz/:path*',
        destination: '/ustadz/:path*',
      },
      {
        source: '/wali/:path*',
        destination: '/wali/:path*',
      },
    ]
  },
  
  // Allow serving HTML files
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'html'],
}

module.exports = nextConfig
