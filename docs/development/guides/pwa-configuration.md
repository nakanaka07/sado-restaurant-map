# PWA設定ガイド - Workbox最適化

> 🎯 **目的**: PWA (Progressive Web App) のWorkbox設定最適化
> **最終更新**: 2025年8月20日
> **対象**: vite-plugin-pwa v0.20 + Workbox最新版

## 🚀 解決済み問題

### 1. プリキャッシュ対象ファイルの不一致エラー

**❌ 問題**:

```log
workbox Precaching did not find a match for /@vite/client
workbox Precaching did not find a match for /src/app/main.tsx
```

**✅ 解決策**:

- 開発環境では`globPatterns: []`に設定し、プリキャッシュを無効化
- `globIgnores`でVite開発専用ファイルを除外
- 本番環境のみ実際のビルドファイルをキャッシュ

### 2. ルーティング設定の最適化

**❌ 問題**:

```log
workbox No route found for: https://www.google-analytics.com/...
workbox No route found for: /manifest.webmanifest
```

**✅ 解決策**:

- Google Analytics: `NetworkOnly`戦略で統計収集を優先
- WebマニフェストとFavicon: `CacheFirst`で高速化
- 外部APIごとに適切なキャッシュ戦略を設定

### 3. ソースマップ読み込みエラー

**❌ 問題**:

```log
connect ECONNREFUSED ::1:5173
```

**✅ 解決策**:

- サーバー設定で`host: "127.0.0.1"`を明示的に指定
- IPv6 (::1) 接続を回避してIPv4ループバックを使用
- `sourcemapIgnoreList`で不要なソースマップを除外

## 🛠️ 現在の最適化設定

### 開発環境 (Development)

```typescript
// 開発時の設定ポイント
devOptions: {
  enabled: process.env.NODE_ENV === "development",
  suppressWarnings: true,
  disableDevLogs: true, // 開発ログを無効化
}

// プリキャッシュを無効化
globPatterns: process.env.NODE_ENV === "production"
  ? ["**/*.{js,css,html,svg,png,ico,woff2}"]
  : [], // 開発環境では空配列
```

### 本番環境 (Production)

```typescript
// 本番環境の最適化
workbox: {
  globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
}
```

## 🎯 キャッシュ戦略の詳細

### 1. Google Maps API

- **戦略**: `StaleWhileRevalidate`
- **目的**: 地図表示の高速化
- **期間**: 30日間
- **特徴**: APIキーを除いたURLをキャッシュキーとして使用

### 2. Google Sheets API

- **戦略**: `NetworkFirst`
- **目的**: 飲食店データの鮮度重視
- **期間**: 2時間
- **特徴**: ネットワーク優先でデータ更新を確実に取得

### 3. Google Analytics

- **戦略**: `NetworkOnly`
- **目的**: 統計収集の正確性確保
- **特徴**: キャッシュしない（リアルタイム分析のため）

### 4. 静的アセット

- **戦略**: `CacheFirst`
- **目的**: 画像・アイコンの高速表示
- **期間**: 30日間
- **対象**: `.png, .jpg, .jpeg, .svg, .gif, .webp, .ico`

### 5. WebマニフェストとFavicon

- **戦略**: `CacheFirst`
- **目的**: PWAメタデータの高速読み込み
- **期間**: 7日間
- **対象**: `manifest.webmanifest`, `favicon.ico`, `favicon.svg`

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### Q: まだWorkbox警告が表示される

**A**:

1. 開発サーバーを再起動: `pnpm dev`
2. ブラウザキャッシュをクリア: DevTools → Application → Storage → Clear storage
3. Service Workerを削除: DevTools → Application → Service Workers → Unregister

#### Q: PWA機能が動作しない

**A**:

1. `devOptions.enabled`が`true`になっていることを確認
2. HTTPS環境または`localhost`で動作確認
3. `manifest.webmanifest`が正しく配信されているか確認

#### Q: 本番環境でキャッシュが効いていない

**A**:

1. ビルド後のファイルパスが`globPatterns`と一致しているか確認
2. Service Workerが正しく登録されているか確認: `navigator.serviceWorker.ready`
3. ネットワークタブでキャッシュヒット状況を確認

## 📊 パフォーマンス監視

### Core Web Vitals 対応

```typescript
// パフォーマンス監視用の設定
build: {
  sourcemap: process.env.NODE_ENV === "development" ? true : "hidden",
  rollupOptions: {
    output: {
      manualChunks: {
        "google-maps": ["@vis.gl/react-google-maps"],
        "react-vendor": ["react", "react-dom"],
      },
    },
  },
}
```

### 推奨メトリクス

- **FCP (First Contentful Paint)**: < 1.8秒
- **LCP (Largest Contentful Paint)**: < 2.5秒
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FID (First Input Delay)**: < 100ms

## 🚀 今後の改善計画

### Phase 1: 基本最適化 (完了)

- ✅ 開発環境でのWorkbox警告抑制
- ✅ 適切なキャッシュ戦略設定
- ✅ IPv6接続エラーの解決

### Phase 2: 高度な最適化

- 🔄 Background Sync機能の実装
- 🔄 Push Notifications対応
- 🔄 Offline対応の拡充

### Phase 3: パフォーマンス向上

- 📋 Service Worker更新戦略の改善
- 📋 Critical CSS最適化
- 📋 画像最適化（WebP対応）

## 📚 参考リンク

- **vite-plugin-pwa**: <https://vite-pwa-org.netlify.app/>
- **Workbox公式**: <https://developer.chrome.com/docs/workbox/>
- **PWA Checklist**: <https://web.dev/pwa-checklist/>
- **Service Worker API**: <https://developer.mozilla.org/docs/Web/API/Service_Worker_API>

---

**最終更新**: 2025年8月20日
**設定ファイル**: `vite.config.ts`
**関連ファイル**: `dev-dist/suppress-warnings.js`
