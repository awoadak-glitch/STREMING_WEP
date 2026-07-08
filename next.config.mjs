/** @type {import('next').NextConfig} */
const nextConfig = {
  // تفعيل static export إذا كنت سترفعه على GitHub Pages فقط
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
