import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Desativar cache agressivo para garantir que o cliente pegue novos arquivos
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    // Forçar atualização do SW quando houver um novo build
    skipWaiting: true,
    clientsClaim: true,
    // Garantir que arquivos de manifesto não fiquem presos no cache
    exclude: [/\.map$/, /_buildManifest\.js$/, /_ssgManifest\.js$/],
  },
});

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {},
};

export default withPWA(nextConfig);
