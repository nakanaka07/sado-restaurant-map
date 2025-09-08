# Public Assets Directory

> 🎯 **目的**: PWA 対応・SEO 最適化・ブランディングに必要な静的アセット管理
> **プロジェクト**: 佐渡飲食店マップアプリケーション
> **最終更新**: 2025 年 9 月 9 日 | **最適化完了**

## 🚨 **重要な問題と解決策**

### ⚠️ **発見された問題**

- **重複ファイル**: `apple-touch-icon.png` と `og-image.png` が同一ファイル (113KB)
- **SVGファビコン肥大**: `favicon.svg` が 130KB と異常に大きい
- **最適化の必要性**: PNG圧縮、WebP対応、メタデータ削除が必要

### ✅ **実装済み最適化**

- **PWA Manifest改善**: iOS対応強化、purpose属性最適化
- **キャッシング戦略**: PWAアセット専用キャッシュ、長期キャッシング
- **HTML最適化**: SEO強化、アクセシビリティ対応、プリロード設定
- **ビルド最適化**: アセットハッシュ化、ディレクトリ分割

## 📁 ディレクトリ構成

```text
public/
├── 📄 README.md                      # このファイル - アセット管理ガイド
├── 🎯 favicon.ico                    # レガシーブラウザ対応favicon（32x32）⚠️ 2.5KB
├── 🎯 favicon.svg                    # モダンブラウザ向けSVGfavicon ⚠️ 130KB (要最適化)
├── 🍎 apple-touch-icon.png          # iOS Safari用タッチアイコン ⚠️ 113KB (要最適化)
├── 📱 pwa-64x64.png                 # PWA小サイズアイコン (2.6KB ✅)
├── 📱 pwa-192x192.png               # PWA標準アイコン (8.3KB ✅)
├── 📱 pwa-512x512.png               # PWA大サイズアイコン (26KB ✅)
├── 🎭 maskable-icon-512x512.png     # Android Adaptive Icon対応 (18KB ✅)
├── 🖼️ og-image.png                   # ⚠️ 重複ファイル (113KB) - 要修正
└── 📋 _assets_optimization_guide.md  # 最適化ガイド (作業用)
```

## 🛠️ アセット仕様

### PWA アイコンセット

| ファイル                    | サイズ    | ファイルサイズ | 用途                         | 状態    |
| --------------------------- | --------- | -------------- | ---------------------------- | ------- |
| `pwa-64x64.png`             | 64×64px   | 2.6KB ✅       | 小アイコン・通知             | 🟢 最適 |
| `pwa-192x192.png`           | 192×192px | 8.3KB ✅       | ホーム画面・アプリドロワー   | 🟢 最適 |
| `pwa-512x512.png`           | 512×512px | 26KB ✅        | スプラッシュ画面・大アイコン | 🟢 最適 |
| `maskable-icon-512x512.png` | 512×512px | 18KB ✅        | Android Adaptive Icons       | 🟢 最適 |

### Favicon セット

| ファイル      | 形式 | サイズ | 用途         | 対応ブラウザ                    | 状態        |
| ------------- | ---- | ------ | ------------ | ------------------------------- | ----------- |
| `favicon.ico` | ICO  | 2.5KB  | レガシー対応 | IE, 古いブラウザ                | 🟢 最適     |
| `favicon.svg` | SVG  | 130KB  | モダン対応   | Chrome 80+, Firefox 41+, Safari | ⚠️ 要最適化 |

### その他アセット

| ファイル               | サイズ     | ファイルサイズ | 用途                      | 状態        |
| ---------------------- | ---------- | -------------- | ------------------------- | ----------- |
| `apple-touch-icon.png` | 180×180px  | 113KB          | iOS Safari タッチアイコン | ⚠️ 要最適化 |
| `og-image.png`         | 1200×630px | 113KB          | SNS 共有画像              | ⚠️ 重複問題 |

## 🔧 技術仕様

### PWA Manifest 連携

これらのアイコンは `vite.config.ts` の PWA Manifest 設定と連携：

```typescript
// 🎯 最適化済み設定
icons: [
  { src: "pwa-64x64.png", sizes: "64x64", type: "image/png", purpose: "any" },
  { src: "pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  { src: "apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" }, // 🎯 追加
];
```

### HTML 参照

`index.html` での最適化済み参照：

```html
<!-- 🎯 Critical Resource として優先読み込み -->
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32" type="image/x-icon" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />

<!-- 🎯 Performance最適化 -->
<link rel="preconnect" href="https://maps.googleapis.com" crossorigin />
<meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#1d4ed8" media="(prefers-color-scheme: dark)" />
```

### 🎯 キャッシング戦略（最適化済み）

```typescript
// PWAアセット専用キャッシュ
{
  urlPattern: /\/(?:manifest\.webmanifest|favicon\.|apple-touch-icon\.|pwa-.*\.png|maskable-.*\.png|og-image\.png)$/,
  handler: "CacheFirst",
  options: {
    cacheName: "pwa-assets-cache",
    expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30日
  },
}
```

## 📐 デザインガイドライン

### アイコンデザイン原則

1. **ブランド一貫性**: すべてのアイコンで統一されたブランドカラー・デザイン
2. **視認性**: 小サイズでも認識可能なシンプルなデザイン
3. **マスキング対応**: maskable アイコンは中央 80%エリア内にロゴ配置
4. **スケーラビリティ**: SVG ファビコンによる解像度非依存

### 🎯 最適化目標

| ファイル               | 現在サイズ | 目標サイズ | 最適化方法               |
| ---------------------- | ---------- | ---------- | ------------------------ |
| `favicon.svg`          | 130KB      | <10KB      | SVGO最適化               |
| `apple-touch-icon.png` | 113KB      | <30KB      | 180x180適正サイズ+圧縮   |
| `og-image.png`         | 113KB      | <50KB      | 専用OG画像作成(1200x630) |

## 🚀 生成・更新プロセス

### PWA Assets Generator 使用

```bash
# 設定ファイル: config/pwa-assets.config.ts
pnpm run generate:pwa-assets
```

### 🎯 緊急修正手順

1. **重複ファイル修正**:

   ```bash
   # OG画像を適切なサイズ（1200x630）で再作成
   # 現在のog-image.pngは apple-touch-icon.png と同一
   ```

2. **SVGファビコン最適化**:

   ```bash
   # SVGO使用例:
   npx svgo favicon.svg --output favicon.optimized.svg
   ```

3. **PNG圧縮最適化**:

   ```bash
   # pngquant使用例:
   pngquant --quality=80-95 --output optimized/ *.png
   ```

## 🔍 トラブルシューティング

### よくある問題

| 問題                   | 原因              | 解決方法                         | 備考                      |
| ---------------------- | ----------------- | -------------------------------- | ------------------------- |
| アイコンが表示されない | キャッシュ        | ブラウザキャッシュクリア         | PWAアセットキャッシュ確認 |
| iOS で古いアイコン表示 | Safari キャッシュ | ホーム画面からアプリ削除・再追加 | 180x180サイズ要確認       |
| PWA インストール不可   | Manifest 設定     | vite.config.ts の icons 設定確認 | purpose属性最適化済み     |
| OG 画像が反映されない  | SNS キャッシュ    | SNS デバッガーでキャッシュクリア | ⚠️重複ファイル問題        |

### 🎯 最適化後の検証方法

```bash
# ファイル存在・サイズ確認
ls -la public/*.{png,ico,svg}

# 重複ファイル確認
diff public/apple-touch-icon.png public/og-image.png

# PWA Manifest 確認（開発時）
curl http://localhost:5173/manifest.webmanifest

# Lighthouse PWA スコア確認
npx lighthouse http://localhost:5173 --only-categories=pwa
```

## 📚 関連ドキュメント

- [PWA Configuration Guide](../docs/development/pwa-configuration-guide.md)
- [Google PWA Icons Guide](https://web.dev/add-manifest/)
- [Apple Touch Icon Specification](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Open Graph Protocol](https://ogp.me/)

---

**管理者**: プロジェクトメンテナー
**最適化実施**: 2025年9月9日 - PWA Manifest強化、キャッシング戦略改善、HTML最適化
**品質基準**: Web Vitals, PWA Lighthouse Score 90+
**次回作業**: 重複ファイル修正、SVG最適化、PNG圧縮

## 📁 ディレクトリ構成

```text
public/
├── 📄 README.md                      # このファイル - アセット管理ガイド
├── 🎯 favicon.ico                    # レガシーブラウザ対応favicon（32x32）
├── 🎯 favicon.svg                    # モダンブラウザ向けSVGfavicon（スケーラブル）
├── 🍎 apple-touch-icon.png          # iOS Safari用タッチアイコン（180x180推奨）
├── 📱 pwa-64x64.png                 # PWA小サイズアイコン
├── 📱 pwa-192x192.png               # PWA標準アイコン（Android推奨）
├── 📱 pwa-512x512.png               # PWA大サイズアイコン（スプラッシュ対応）
├── 🎭 maskable-icon-512x512.png     # Android Adaptive Icon対応
└── 🖼️ og-image.png                   # SNS共有用OG画像（1200x630推奨）
```

## 🛠️ アセット仕様

### PWA アイコンセット

| ファイル                    | サイズ    | 用途                         | 必須度  |
| --------------------------- | --------- | ---------------------------- | ------- |
| `pwa-64x64.png`             | 64×64px   | 小アイコン・通知             | 🟢 必須 |
| `pwa-192x192.png`           | 192×192px | ホーム画面・アプリドロワー   | 🟢 必須 |
| `pwa-512x512.png`           | 512×512px | スプラッシュ画面・大アイコン | 🟢 必須 |
| `maskable-icon-512x512.png` | 512×512px | Android Adaptive Icons       | 🟡 推奨 |

### Favicon セット

| ファイル      | 形式 | 用途         | 対応ブラウザ                        |
| ------------- | ---- | ------------ | ----------------------------------- |
| `favicon.ico` | ICO  | レガシー対応 | IE, 古いブラウザ                    |
| `favicon.svg` | SVG  | モダン対応   | Chrome 80+, Firefox 41+, Safari 12+ |

### その他アセット

| ファイル               | サイズ     | 用途                      | プラットフォーム        |
| ---------------------- | ---------- | ------------------------- | ----------------------- |
| `apple-touch-icon.png` | 180×180px  | iOS Safari タッチアイコン | iOS Safari              |
| `og-image.png`         | 1200×630px | SNS 共有画像              | Facebook, Twitter, LINE |

## 🔧 技術仕様

### PWA Manifest 連携

これらのアイコンは `vite.config.ts` の PWA Manifest 設定と連携：

```typescript
// vite.config.ts で自動参照される設定
icons: [
  { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
  { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
  { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
  {
    src: "maskable-icon-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
];
```

### HTML 参照

`index.html` での自動参照：

```html
<!-- Favicon Settings -->
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />

<!-- Open Graph -->
<meta property="og:image" content="https://domain.com/og-image.png" />
```

## 📐 デザインガイドライン

### アイコンデザイン原則

1. **ブランド一貫性**: すべてのアイコンで統一されたブランドカラー・デザイン
2. **視認性**: 小サイズでも認識可能なシンプルなデザイン
3. **マスキング対応**: maskable アイコンは中央 80%エリア内にロゴ配置
4. **スケーラビリティ**: SVG ファビコンによる解像度非依存

### 最適化仕様

- **PNG 圧縮**: 可逆圧縮で品質維持
- **SVG 最適化**: 不要なメタデータ削除済み
- **ファイルサイズ**: 各アイコン 30KB 以下を目標
- **色空間**: sRGB 色空間で統一

## 🚀 生成・更新プロセス

### PWA Assets Generator 使用

```bash
# 設定ファイル: config/pwa-assets.config.ts
pnpm run generate:pwa-assets
```

### 手動更新時の注意点

1. **サイズ厳守**: 指定サイズ・アスペクト比を正確に守る
2. **形式統一**: PNG（アイコン）、SVG（ファビコン）、ICO（レガシー）
3. **命名規則**: 既存ファイル名と完全一致させる
4. **品質チェック**: 各デバイス・ブラウザでの表示確認

## 🔍 トラブルシューティング

### よくある問題

| 問題                   | 原因              | 解決方法                         |
| ---------------------- | ----------------- | -------------------------------- |
| アイコンが表示されない | キャッシュ        | ブラウザキャッシュクリア         |
| iOS で古いアイコン表示 | Safari キャッシュ | ホーム画面からアプリ削除・再追加 |
| PWA インストール不可   | Manifest 設定     | vite.config.ts の icons 設定確認 |
| OG 画像が反映されない  | SNS キャッシュ    | SNS デバッガーでキャッシュクリア |

### 検証方法

```bash
# ファイル存在確認
ls -la public/*.{png,ico,svg}

# サイズ確認（画像ファイル）
identify public/*.png

# Manifest 確認（開発時）
curl http://localhost:5173/manifest.webmanifest
```

## 📚 関連ドキュメント

- [PWA Configuration Guide](../docs/development/pwa-configuration-guide.md)
- [Google PWA Icons Guide](https://web.dev/add-manifest/)
- [Apple Touch Icon Specification](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Open Graph Protocol](https://ogp.me/)

---

**管理者**: プロジェクトメンテナー
**自動生成**: vite-plugin-pwa + @vite-pwa/assets-generator
**品質基準**: Web Vitals, PWA Lighthouse Score 90+
