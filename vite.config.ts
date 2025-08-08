import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  base:
    process.env.VITE_BASE_URL ||
    (process.env.NODE_ENV === "production" ? "/sado-restaurant-map/" : "/"),
  plugins: [
    react({
      // React Compiler対応（React 19.1 Stable）
      // babel: {
      //   plugins: [['babel-plugin-react-compiler', {}]]
      // }
    }),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,

      pwaAssets: {
        disabled: true, // CLIで生成済みのため無効化
      },

      manifest: {
        name: "佐渡飲食店マップ",
        short_name: "佐渡グルメ",
        description:
          "佐渡島の美味しい飲食店を発見できるインタラクティブマップアプリケーション。地元グルメから隠れた名店まで、佐渡の食文化を楽しく探索できます。",
        theme_color: "#2563eb",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        start_url:
          process.env.NODE_ENV === "production" ? "/sado-restaurant-map/" : "/",
        scope:
          process.env.NODE_ENV === "production" ? "/sado-restaurant-map/" : "/",
        lang: "ja",
        categories: ["food", "travel", "utilities"],
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "全ての飲食店",
            short_name: "全店舗",
            description: "佐渡島の全飲食店を表示",
            url:
              process.env.NODE_ENV === "production"
                ? "/sado-restaurant-map/?filter=all"
                : "/?filter=all",
            icons: [
              {
                src:
                  process.env.NODE_ENV === "production"
                    ? "/sado-restaurant-map/favicon.svg"
                    : "/favicon.svg",
                sizes: "192x192",
              },
            ],
          },
          {
            name: "近くの店舗",
            short_name: "近くの店",
            description: "現在地周辺の飲食店を検索",
            url:
              process.env.NODE_ENV === "production"
                ? "/sado-restaurant-map/?filter=nearby"
                : "/?filter=nearby",
            icons: [
              {
                src:
                  process.env.NODE_ENV === "production"
                    ? "/sado-restaurant-map/favicon.svg"
                    : "/favicon.svg",
                sizes: "192x192",
              },
            ],
          },
        ],
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-maps-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
              },
            },
          },
          {
            urlPattern: /^https:\/\/sheets\.googleapis\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "restaurant-data-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 2, // 2時間
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: true, // 開発時もPWA機能をテスト
        navigateFallback: "index.html",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],

  // パス解決の最適化
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@components": fileURLToPath(
        new URL("./src/components", import.meta.url)
      ),
      "@hooks": fileURLToPath(new URL("./src/hooks", import.meta.url)),
      "@types": fileURLToPath(new URL("./src/types", import.meta.url)),
      "@utils": fileURLToPath(new URL("./src/utils", import.meta.url)),
      "@data": fileURLToPath(new URL("./src/data", import.meta.url)),
      "@assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
    },
  },

  // 開発サーバー最適化
  server: {
    port: 5173,
    host: true, // ネットワークアクセス許可（モバイルテスト用）
    open: false,
    cors: true,
  },

  // ビルド最適化
  build: {
    target: "es2020",
    sourcemap: true,
    minify: "terser",
    cssMinify: true,
    rollupOptions: {
      input: "src/app/main.tsx", // カスタムエントリーポイント
      output: {
        manualChunks: {
          "google-maps": ["@vis.gl/react-google-maps"],
          "react-vendor": ["react", "react-dom"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
