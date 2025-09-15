import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, type PluginOption } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// 🔧 開発環境でのWorkbox完全制御
const enablePWAInDev = process.env.ENABLE_PWA_DEV === "true";

// PWAマニフェスト設定を分離
const createPWAManifest = (isProduction: boolean) => ({
  name: "佐渡飲食店マップ",
  short_name: "佐渡グルメ",
  description:
    "佐渡島の美味しい飲食店を発見できるインタラクティブマップアプリケーション。地元グルメから隠れた名店まで、佐渡の食文化を楽しく探索できます。",
  theme_color: "#2563eb",
  background_color: "#ffffff",
  display: "standalone" as const,
  orientation: "portrait-primary" as const,
  start_url: isProduction ? "/sado-restaurant-map/" : "/",
  scope: isProduction ? "/sado-restaurant-map/" : "/",
  lang: "ja",
  categories: ["food", "travel", "utilities"],
  icons: [
    {
      src: "pwa-64x64.png",
      sizes: "64x64",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "pwa-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "pwa-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "maskable-icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
    // 🎯 Apple Touch Icon への参照追加（iOS PWA対応強化）
    {
      src: "apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
      purpose: "any",
    },
  ],
  shortcuts: createPWAShortcuts(isProduction),
});

// PWAショートカット設定を分離
const createPWAShortcuts = (isProduction: boolean) => [
  {
    name: "全ての飲食店",
    short_name: "全店舗",
    description: "佐渡島の全飲食店を表示",
    url: isProduction ? "/sado-restaurant-map/?filter=all" : "/?filter=all",
    icons: [
      {
        src: isProduction ? "/sado-restaurant-map/favicon.svg" : "/favicon.svg",
        sizes: "192x192",
      },
    ],
  },
  {
    name: "近くの店舗",
    short_name: "近くの店",
    description: "現在地周辺の飲食店を検索",
    url: isProduction
      ? "/sado-restaurant-map/?filter=nearby"
      : "/?filter=nearby",
    icons: [
      {
        src: isProduction ? "/sado-restaurant-map/favicon.svg" : "/favicon.svg",
        sizes: "192x192",
      },
    ],
  },
];

// Workboxキャッシュ戦略を分離
const createRuntimeCaching = () => [
  // Google Maps API キャッシュ戦略
  {
    urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
    handler: "StaleWhileRevalidate" as const,
    options: {
      cacheName: "google-maps-api-cache",
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
      },
      plugins: [
        {
          cacheKeyWillBeUsed: ({ request }: { request: Request }): string => {
            // API キーを除外してキャッシュキーを生成
            const url = new URL(request.url);
            url.searchParams.delete("key");
            return url.toString();
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
    },
  },
  // Google Sheets API キャッシュ戦略
  {
    urlPattern: /^https:\/\/sheets\.googleapis\.com\/.*/i,
    handler: "NetworkFirst" as const,
    options: {
      cacheName: "restaurant-data-cache",
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 2, // 2時間
      },
    },
  },
  // Google Analytics - ネットワーク優先
  {
    urlPattern: /^https:\/\/www\.google-analytics\.com\/.*/i,
    handler: "NetworkOnly" as const,
  },
  {
    urlPattern: /^https:\/\/www\.googletagmanager\.com\/.*/i,
    handler: "NetworkOnly" as const,
  },
  // 🎯 静的アセット（アイコン、画像）のキャッシュ戦略 - WebP対応追加
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
    handler: "CacheFirst" as const,
    options: {
      cacheName: "images-cache",
      expiration: {
        maxEntries: 200, // エントリ数を増加
        maxAgeSeconds: 60 * 60 * 24 * 90, // 90日（長期キャッシュ）
      },
      plugins: [
        {
          cacheKeyWillBeUsed: ({ request }: { request: Request }): string => {
            // クエリパラメータを除外してキャッシュキーを生成
            const url = new URL(request.url);
            url.search = "";
            return url.toString();
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
    },
  },
  // 🎯 Webマニフェスト・Favicon・PWAアセット
  {
    urlPattern:
      /\/(?:manifest\.webmanifest|favicon\.(ico|svg)|apple-touch-icon\.png|pwa-.*\.png|maskable-.*\.png|og-image\.png)$/,
    handler: "CacheFirst" as const,
    options: {
      cacheName: "pwa-assets-cache",
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
      },
    },
  },
  // 🎯 CSS・JSファイルのキャッシング強化
  {
    urlPattern: /\.(?:css|js)$/i,
    handler: "StaleWhileRevalidate" as const,
    options: {
      cacheName: "static-resources-cache",
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7日
      },
    },
  },
];

// PWA設定を分離
const createPWAConfig = (isProduction: boolean) => ({
  registerType: "autoUpdate" as const,
  injectRegister: false as const,
  pwaAssets: {
    disabled: true, // CLIで生成済みのため無効化
  },
  manifest: createPWAManifest(isProduction),
  workbox: {
    globPatterns: isProduction ? ["**/*.{js,css,html,svg,png,ico,woff2}"] : [],
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    globIgnores: [
      "**/node_modules/**/*",
      "**/dev-dist/**/*",
      "**/@vite/**/*",
      "**/@react-refresh/**/*",
      "**/src/**/*",
      "**/*.map",
    ],
    // 🔧 開発環境ではランタイムキャッシュを完全無効化
    runtimeCaching: isProduction ? createRuntimeCaching() : [],
  },
  devOptions: {
    enabled: false,
    suppressWarnings: true,
    type: "module" as const,
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";
  const shouldEnablePWA = isProduction || enablePWAInDev;

  return {
    base:
      process.env.VITE_BASE_URL ||
      (isProduction ? "/sado-restaurant-map/" : "/"),
    plugins: [
      react(),
      ...(shouldEnablePWA ? [VitePWA(createPWAConfig(isProduction))] : []),
      // 🔍 バンドル分析プラグイン（ビルド時のみ）
      ...(process.env.ANALYZE === "true"
        ? [
            visualizer({
              filename: "dist/stats.html",
              open: true,
              gzipSize: true,
              brotliSize: true,
            }) as unknown as PluginOption, // 型互換性のための変換
          ]
        : []),
    ] as PluginOption[],

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
      host: "127.0.0.1", // IPv4 loopbackを明示的に指定
      open: false,
      cors: true,
      // IPv6関連の問題を回避
      strictPort: true,
      // 🔧 開発環境でのキャッシュ無効化ヘッダー
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      // Source map関連の設定
      sourcemapIgnoreList: relativeSourcePath => {
        return (
          relativeSourcePath.includes("node_modules") ||
          relativeSourcePath.includes("workbox") ||
          relativeSourcePath.includes("dev-dist")
        );
      },
    },

    // ビルド最適化（2025年9月最新）
    build: {
      target: "es2022",
      // 開発環境では詳細なソースマップ、本番では軽量化
      sourcemap: !isProduction ? true : "hidden",
      minify: "terser",
      // 従来のCSS処理を使用（Lightning CSSの依存関係問題を回避）
      cssMinify: "esbuild",
      rollupOptions: {
        input: "index.html",
        output: {
          manualChunks: {
            "google-maps": ["@vis.gl/react-google-maps"],
            "react-vendor": ["react", "react-dom"],
          },
          // 🎯 アセットファイル名にハッシュ追加（キャッシング最適化）
          assetFileNames: assetInfo => {
            const fileName = assetInfo.names?.[0] || "unknown";
            if (/\.(png|jpe?g|svg|gif|webp|avif|ico)$/i.test(fileName)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/\.(css)$/i.test(fileName)) {
              return `assets/css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          // ソースマップファイルの出力先を調整
          sourcemapExcludeSources: isProduction,
          // 2025年最適化: ES2022対応
          format: "es",
          generatedCode: {
            preset: "es2015",
            symbols: true,
          },
        },
        // Tree-shaking最適化
        treeshake: {
          preset: "recommended",
          moduleSideEffects: false,
        },
      },
      chunkSizeWarningLimit: 1000,
      emptyOutDir: true,
      // CSS Code Splitting
      cssCodeSplit: true,
      // 🎯 アセット最適化設定
      assetsInlineLimit: 4096, // 4KB未満はインライン化
    },
  };
});
