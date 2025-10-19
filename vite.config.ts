import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, type PluginOption } from "vite";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { VitePWA } from "vite-plugin-pwa";

type WorkboxPluginLike = {
  cacheKeyWillBeUsed?: ({
    request,
  }: {
    request: Request;
  }) => Promise<string | Request>;
};

const enablePWAInDev = process.env.ENABLE_PWA_DEV === "true";

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
    { src: "pwa-64x64.png", sizes: "64x64", type: "image/png", purpose: "any" },
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
    {
      src: "apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
      purpose: "any",
    },
  ],
  shortcuts: createPWAShortcuts(isProduction),
});

const createRuntimeCaching = () => [
  {
    urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
    handler: "StaleWhileRevalidate" as const,
    options: {
      cacheName: "google-maps-api-cache",
      expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
      plugins: [
        {
          cacheKeyWillBeUsed: ({
            request,
          }: {
            request: Request;
          }): Promise<string> => {
            const url = new URL(request.url);
            url.searchParams.delete("key");
            return Promise.resolve(url.toString());
          },
        } as WorkboxPluginLike,
      ],
    },
  },
  {
    urlPattern: /^https:\/\/sheets\.googleapis\.com\/.*/i,
    handler: "NetworkFirst" as const,
    options: {
      cacheName: "restaurant-data-cache",
      expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 2 },
    },
  },
  {
    urlPattern: /^https:\/\/www\.google-analytics\.com\/.*/i,
    handler: "NetworkOnly" as const,
  },
  {
    urlPattern: /^https:\/\/www\.googletagmanager\.com\/.*/i,
    handler: "NetworkOnly" as const,
  },
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
    handler: "CacheFirst" as const,
    options: {
      cacheName: "images-cache",
      expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 90 },
      plugins: [
        {
          cacheKeyWillBeUsed: ({
            request,
          }: {
            request: Request;
          }): Promise<string> => {
            const url = new URL(request.url);
            url.search = "";
            return Promise.resolve(url.toString());
          },
        } as WorkboxPluginLike,
      ],
    },
  },
  {
    urlPattern:
      /\/(?:manifest\.webmanifest|favicon\.(ico|svg)|apple-touch-icon\.png|pwa-.*\.png|maskable-.*\.png|og-image\.png)$/,
    handler: "CacheFirst" as const,
    options: {
      cacheName: "pwa-assets-cache",
      expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
    },
  },
  {
    urlPattern: /\.(?:css|js)$/i,
    handler: "StaleWhileRevalidate" as const,
    options: {
      cacheName: "static-resources-cache",
      expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
    },
  },
];

const createPWAConfig = (isProduction: boolean) => ({
  registerType: "autoUpdate" as const,
  injectRegister: false as const,
  pwaAssets: { disabled: true },
  manifest: createPWAManifest(isProduction),
  workbox: {
    globPatterns: isProduction ? ["**/*.{js,css,html,svg,png,ico,woff2}"] : [],
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    navigateFallback: isProduction
      ? "/sado-restaurant-map/offline.html"
      : "/offline.html",
    navigateFallbackDenylist: [/^\/_/, /^\/api/],
    globIgnores: [
      "**/node_modules/**/*",
      "**/dev-dist/**/*",
      "**/@vite/**/*",
      "**/@react-refresh/**/*",
      "**/src/**/*",
      "**/*.map",
    ],
    runtimeCaching: isProduction ? createRuntimeCaching() : [],
  },
  devOptions: {
    enabled: false,
    suppressWarnings: true,
    type: "module" as const,
  },
});

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";
  const shouldEnablePWA = isProduction || enablePWAInDev;

  return {
    base:
      process.env.VITE_BASE_URL ||
      (isProduction ? "/sado-restaurant-map/" : "/"),
    plugins: [
      react(),
      ...(isProduction
        ? [
            ViteImageOptimizer({
              png: {
                quality: 80,
              },
              jpeg: {
                quality: 80,
              },
              jpg: {
                quality: 80,
              },
              webp: {
                lossless: false,
                quality: 75,
              },
            }),
          ]
        : []),
      ...(shouldEnablePWA ? [VitePWA(createPWAConfig(isProduction))] : []),
      // Bundle analysis: Use static import when ANALYZE=true
      // Note: visualizer must be imported at top level for ESM compatibility
      ...(process.env.ANALYZE === "true"
        ? [
            visualizer({
              filename: "dist/stats.html",
              open: true,
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : []),
    ] as PluginOption[],
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
        "@services": fileURLToPath(new URL("./src/services", import.meta.url)),
      },
    },
    server: {
      port: 5173,
      host: "127.0.0.1",
      open: false,
      cors: true,
      strictPort: true,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      sourcemapIgnoreList: (relativeSourcePath: string) =>
        relativeSourcePath.includes("node_modules") ||
        relativeSourcePath.includes("workbox") ||
        relativeSourcePath.includes("dev-dist"),
    },
    build: {
      target: "es2022",
      sourcemap: !isProduction ? true : "hidden",
      minify: "terser",
      cssMinify: "esbuild",
      terserOptions: {
        compress: {
          // 本番環境でconsole.logを削除
          drop_console: isProduction,
          drop_debugger: isProduction,
          // 純粋関数として扱い、未使用なら削除
          pure_funcs: isProduction
            ? ["console.log", "console.info", "console.debug", "console.trace"]
            : [],
          // デッドコード除去
          dead_code: true,
          // 未使用変数除去
          unused: true,
          // 条件式の最適化 (import.meta.env.DEV など)
          conditionals: true,
          // 不要なブロック削除
          evaluate: true,
          // 短縮記法の使用
          collapse_vars: true,
          reduce_vars: true,
          // Phase 8 Task 2.5: 複数パス圧縮で品質向上
          passes: 2,
          // インライン関数の最適化
          inline: 2,
        },
        mangle: {
          // Safari 10+ 対応
          safari10: true,
          // トップレベル変数も短縮 (aggressive)
          toplevel: false,
        },
        format: {
          // コメント削除 (ライセンスコメントは保持)
          comments: /^!/,
        },
      },
      rollupOptions: {
        input: "index.html",
        output: {
          manualChunks: (id: string) => {
            // React vendor libraries including Google Maps (React components)
            // Note: Google Maps must stay with React to avoid circular dependencies
            if (
              id.includes("node_modules/react") ||
              id.includes("node_modules/react-dom") ||
              id.includes("@vis.gl/react-google-maps")
            ) {
              return "react-vendor";
            }

            // Marker components (Phase 8 optimization)
            if (
              id.includes("src/components/map/markers/") ||
              id.includes("src/components/map/UnifiedMarker") ||
              id.includes("src/utils/markerColorUtils") ||
              id.includes("src/utils/hybridMarkerUtils")
            ) {
              return "markers";
            }

            // Data processing & services (Phase 8 optimization)
            // Note: ABテスト関連は除外 (dynamic import で遅延読み込み)
            if (
              (id.includes("src/services/") &&
                !id.includes("src/services/abtest")) ||
              id.includes("src/utils/districtUtils") ||
              id.includes("src/utils/businessHours") ||
              id.includes("src/utils/dateUtils")
            ) {
              return "data-processing";
            }

            // UI components (Phase 8 optimization)
            if (
              id.includes("src/components/common/") ||
              id.includes("src/components/restaurant/")
            ) {
              return "ui-components";
            }

            // Default: return undefined to let Vite decide
            return undefined;
          },
          assetFileNames: (assetInfo: {
            name: string | undefined;
            names: string[] | undefined;
          }) => {
            const fileName =
              assetInfo.names?.[0] || assetInfo.name || "unknown";
            if (/\.(png|jpe?g|svg|gif|webp|avif|ico)$/i.test(fileName))
              return `assets/images/[name]-[hash][extname]`;
            if (/\.(css)$/i.test(fileName))
              return `assets/css/[name]-[hash][extname]`;
            return `assets/[name]-[hash][extname]`;
          },
          sourcemapExcludeSources: isProduction,
          format: "es",
          generatedCode: { preset: "es2015", symbols: true },
        },
        treeshake: { preset: "recommended", moduleSideEffects: false },
      },
      chunkSizeWarningLimit: 1000,
      emptyOutDir: true,
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
    },
  };
});
