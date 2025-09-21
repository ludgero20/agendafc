/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.thesportsdb.com', // Mantemos o antigo por segurança
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'r2.thesportsdb.com', // ADICIONAMOS O NOVO DOMÍNIO AQUI
        port: '',
        pathname: '/images/**',
      },
    ],
  },
};

module.exports = nextConfig;