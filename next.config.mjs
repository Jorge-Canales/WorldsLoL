/** @type {import('next').NextConfig} */
const nextConfig = {
  // La raíz "/" manda al idioma por defecto (español).
  async redirects() {
    return [{ source: "/", destination: "/es", permanent: false }];
  },
};

export default nextConfig;
