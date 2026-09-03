/** @type {import('next').NextConfig} */

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "crests.football-data.org",
      },
      {
        protocol: "https",
        hostname: "a.espncdn.com",
      },
      {
        protocol: "https",
        hostname: "www.thesportsdb.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "r2.thesportsdb.com",
        pathname: "/images/**",
      },
    ],
  },
};

module.exports = withPWA(nextConfig);