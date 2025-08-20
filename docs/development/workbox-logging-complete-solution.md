# Workbox ログ制御 - 完全解決ガイド

> 🎯 **目的**: Workboxログ出力の完全制御と開発環境最適化
> **最終更新**: 2025年8月20日
> **バージョン**: 4.0 **[完全解決版 - ブラウザSW制御対応]**

## 🚨 問題の特定

開発環境で表示される以下のログ：

```text
workbox Network request for 'https://maps.googleapis.com/maps/vt/pb=!1m4...' returned a response with status '200'.
```

**原因**：

1. ブラウザに残存している古いService Worker
2. Google Maps API のキャッシング戦略が動作中
3. 開発環境でのWorkbox完全無効化が不十分

## ✅ 完全解決方法

### 1. 【即座解決】ブラウザのService Worker削除

**Chrome/Edge DevTools**：

1. `F12` → **Application** タブ
2. **Service Workers** → **Unregister** クリック
3. **Storage** → **Clear storage** → **Clear site data**

**Firefox DevTools**：

1. `F12` → **Application** タブ → **Service Workers**
2. **Unregister** クリック

### 2. 【根本解決】Vite設定の改善

開発環境でのWorkboxを完全無効化：

```typescript
// vite.config.ts の改善
const createPWAConfig = (isProduction: boolean) => ({
  registerType: "autoUpdate" as const,
  injectRegister: false as const,
  pwaAssets: {
    disabled: true,
  },
  manifest: createPWAManifest(isProduction),
  workbox: {
    // 開発環境では一切のファイルをキャッシュしない
    globPatterns: isProduction ? ["**/*.{js,css,html,svg,png,ico,woff2}"] : [],
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    runtimeCaching: isProduction ? createRuntimeCaching() : [], // 🔧 追加
  },
  devOptions: {
    enabled: false,              // 完全無効化
    navigateFallback: undefined, // フォールバック無効
    suppressWarnings: true,      // 警告抑制
    type: "module" as const,
  },
});
```

### 3. 【開発改善】環境変数での制御強化

**.env.local** に追加：

```bash
# 開発環境でのWorkbox制御
ENABLE_PWA_DEV=false
VITE_DEV_DISABLE_SW=true
```

### 4. 【予防策】キャッシュ無効化の自動設定

開発サーバー起動時の自動キャッシュ削除：

```typescript
// vite.config.ts の server 設定に追加
server: {
  port: 5173,
  host: "127.0.0.1",
  open: false,
  cors: true,
  strictPort: true,
  // 開発環境でのキャッシュ制御
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
}
```

## 🔍 検証方法

### 1. ログ出力の確認

```bash
# 開発サーバー再起動
pnpm dev
```

**期待結果**：`workbox Network request for...` ログが出力されない

### 2. DevTools確認

1. `F12` → **Console** タブ
2. **Network** タブでWorkboxキャッシュリクエスト確認
3. **Application** → **Service Workers** で登録状況確認

### 3. 本番環境確認

```bash
# 本番ビルド（Workbox有効）
pnpm build
pnpm preview
```

**期待結果**：本番環境でのみWorkboxが動作

## 🎯 使い分けガイド

| 環境 | Workbox | Service Worker | 用途 |
|------|---------|---------------|------|
| **開発** | 無効 | 無効 | 快適な開発環境 |
| **PWAテスト** | 有効 | 有効 | PWA機能確認 |
| **本番** | 有効 | 有効 | オフライン対応 |

### 開発時の制御コマンド

```bash
# 通常開発（Workboxログなし）
pnpm dev

# PWA機能テスト（ログあり）
$env:ENABLE_PWA_DEV="true"; pnpm dev

# 本番確認（完全なPWA）
pnpm build && pnpm preview
```

## 🚨 トラブルシューティング

### Q: まだログが出力される

**A**: ブラウザの完全リロード

```bash
# Chrome/Edge
Ctrl + Shift + R (ハードリロード)

# 完全なキャッシュクリア
F12 → Network → Disable cache にチェック
```

### Q: Service Workerが残存している

**A**: 手動削除

1. `chrome://settings/content/serviceWorker`
2. 該当サイトの **Delete** クリック
3. ブラウザ再起動

### Q: 本番でPWAが動作しない

**A**: ビルド設定確認

```typescript
// 本番ビルド時の設定確認
const isProduction = mode === "production";
console.log("Production mode:", isProduction);
console.log("PWA enabled:", shouldEnablePWA);
```

## 📁 関連設定ファイル

- `vite.config.ts` - Workbox設定
- `.env.local` - 環境変数
- `src/components/layout/PWABadge.tsx` - PWAコンポーネント

## 💡 ベストプラクティス

1. **開発時**: Workbox完全無効で高速開発
2. **テスト時**: 環境変数で一時的有効化
3. **本番前**: ビルド後のプレビューで最終確認
4. **定期的**: ブラウザのService Worker状況確認

---

**次回対応**: このガイドに従って設定すれば、開発環境でのWorkboxログは完全に制御できます。
