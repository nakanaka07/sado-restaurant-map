# Public Assets Directory

> 🎯 **目的**: PWA 対応・SEO 最適化・ブランディングに必要な静的アセット管理
> **プロジェクト**: 佐渡飲食店マップアプリケーション
> **最終更新**: 2025 年 8 月 27 日

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
