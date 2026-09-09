import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        includeAssets: [
          "favicon.svg",
          "robots.txt",
          "pwa-icon-192.png",
          "pwa-icon-512.png",
          "apple-touch-icon.png",
          "logo.jpg",
        ],
        manifest: {
          name: "Obyo Option",
          short_name: "Obyo",
          description:
            "İkili opsiyon trading platformu — demo hesap ile profesyonel işlem deneyimi",
          theme_color: "#000000",
          background_color: "#000000",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/pwa-icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/pwa-icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ["**/*.{js,css,html,ico,png,jpg,svg,woff,woff2}"],
          navigateFallback: "index.html",
          skipWaiting: true,
          clientsClaim: true,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
    server: {
      port: 3000,
      host: "0.0.0.0",
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
