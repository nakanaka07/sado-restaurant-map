# フルスクリーンフィルター修正・PWA画像移行計画書

> 🎯 **プロジェクト**: 佐渡飲食店マップ - UI改善・アセット最適化
> **作成日**: 2025年9月13日 | **優先度**: 高
> **期間見積もり**: 1-2日 | **複雑度**: 中

## 📋 概要・目的

### 解決すべき課題

1. **🚨 フルスクリーン表示時のフィルターボタン非表示問題**（未解決）
   - Google Maps フルスクリーン時にフィルターボタンが表示されない
   - ユーザビリティに深刻な影響

2. **🎨 PWA画像アセットの最適化・移行**
   - `public/` の汎用画像を `src/assets/` の専用画像に変更
   - 佐渡島らしい視覚的アイデンティティの向上

### 期待される成果

- フルスクリーンモードでの完全なフィルター機能アクセス
- ブランドアイデンティティ強化（佐渡島の特色活用）
- PWA体験の向上・視覚品質の改善

## 🔍 現状分析

### 1. フルスクリーン問題の現状

#### ✅ 実装済み機能

- フルスクリーン検出JavaScript（App.tsx）
- `.fullscreen-active` CSSクラス付与システム
- 複数ブラウザ対応（Chrome・Firefox・Safari）

#### ❌ 問題の詳細

```typescript
// App.tsx - 実装済み（要改善）
const handleFullscreenChange = () => {
  const isFullscreen = !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement
  );

  if (isFullscreen) {
    document.documentElement.classList.add("fullscreen-active");
  } else {
    document.documentElement.classList.remove("fullscreen-active");
  }
};
```

**技術的原因**:

- CSS設定は完璧だが、実際の表示で問題発生
- z-index競合・位置指定の問題の可能性
- モバイル・デスクトップ両対応の複雑性
- **🆕 最新仕様**: `:fullscreen` CSS疑似クラスの未活用
- **⚠️ 廃止予定**: `Document.fullscreen` プロパティは非推奨

### 2. 現在のPWA画像設定

#### 📁 Public 画像（現在使用中）

```bash
public/
├── pwa-64x64.png      (2.56 KB)
├── pwa-192x192.png    (8.1 KB)
├── pwa-512x512.png    (25.38 KB)
├── maskable-icon-512x512.png
├── apple-touch-icon.png
├── favicon.ico
└── favicon.svg
```

#### 🎨 新規アセット（移行対象）

```bash
src/assets/
├── svg/
│   ├── title_row1.svg (63,682文字 ≈ 62KB)
│   └── title_row2.svg (72,869文字 ≈ 71KB)
└── png/
    ├── title_row1.png (54.78 KB)
    └── title_row2.png (68.08 KB)
```

### 3. Vite PWA設定（現在）

- `vite-plugin-pwa` 使用
- マニフェスト自動生成
- Workbox キャッシュ戦略設定済み

## 🎯 実装計画

### Phase 1: フルスクリーンフィルター修正 🚨 【優先度：最高】

#### 1.1 問題原因の特定・診断

```css
/* 現在のCSS - CompactModalFilter.css */
.fullscreen-active .filter-trigger-btn,
html.fullscreen-active .filter-trigger-btn,
html.fullscreen-active body .filter-trigger-btn {
  position: fixed !important;
  z-index: 2147483647 !important; /* 最大値 */
  bottom: 20px !important;
  left: 20px !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  transform: none !important;
}
```

**検証・修正箇所**:

1. **DOM構造確認**: フルスクリーン要素の親子関係
2. **z-index競合**: Google Maps要素との順序確認
3. **position context**: フルスクリーン要素の位置コンテキスト
4. **CSS適用順序**: !important適用の効果確認

#### 1.2 修正アプローチ（複数の段階的対応）

##### Level 1: CSS強化修正（最新仕様対応）

```css
/* 🆕 最新Fullscreen API仕様対応 */
:fullscreen .filter-trigger-btn,
:-webkit-full-screen .filter-trigger-btn,
:-moz-full-screen .filter-trigger-btn,
.fullscreen-active .filter-trigger-btn {
  position: fixed !important;
  z-index: 2147483647 !important;
  inset: auto auto 20px 20px !important;
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}

/* 🔧 追加：フルスクリーン要素の直接子要素として配置 */
:fullscreen > .filter-trigger-btn,
:-webkit-full-screen > .filter-trigger-btn,
:-moz-full-screen > .filter-trigger-btn {
  position: absolute !important;
  z-index: 999999 !important;
  inset: auto auto 20px 20px !important;
}

/* 🎯 Google Maps特有の調整 */
.gm-fullscreen-control + .filter-trigger-btn,
[data-testid="map"] > .filter-trigger-btn {
  z-index: 1000000 !important;
}
```

##### Level 2: DOM操作対応（最新API仕様準拠）

```typescript
// App.tsx - 改良版フルスクリーン検出・DOM操作
const handleFullscreenChange = () => {
  // 🆕 最新仕様：Document.fullscreenElementを最優先
  const fullscreenElement =
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement;

  const isFullscreen = !!fullscreenElement;
  const filterBtn = document.querySelector(".filter-trigger-btn") as HTMLElement;

  if (isFullscreen && filterBtn && fullscreenElement) {
    // ✅ 改善：元の位置を保存
    if (!filterBtn.dataset.originalParent) {
      filterBtn.dataset.originalParent = filterBtn.parentElement?.tagName || "BODY";
      filterBtn.dataset.originalPosition = getComputedStyle(filterBtn).position;
    }

    // フルスクリーン要素直下に移動
    if (!fullscreenElement.contains(filterBtn)) {
      fullscreenElement.appendChild(filterBtn);
      filterBtn.style.position = "absolute";
      filterBtn.style.zIndex = "999999";
    }
  } else if (!isFullscreen && filterBtn.dataset.originalParent) {
    // 🔄 フルスクリーン終了時：元の場所に復元
    const originalParent = document.querySelector(filterBtn.dataset.originalParent) || document.body;
    originalParent.appendChild(filterBtn);
    filterBtn.style.position = filterBtn.dataset.originalPosition || "";
    filterBtn.style.zIndex = "";
    delete filterBtn.dataset.originalParent;
    delete filterBtn.dataset.originalPosition;
  }

  // CSS classの管理（既存コードとの互換性）
  document.documentElement.classList.toggle("fullscreen-active", isFullscreen);
};
```

##### Level 3: Portal活用（最終手段）

```tsx
// React Portal でフルスクリーン要素に直接レンダリング
const FullscreenFilterPortal = ({ children }: { children: React.ReactNode }) => {
  const [fullscreenElement, setFullscreenElement] = useState<Element | null>(null);

  useEffect(() => {
    const handleChange = () => {
      setFullscreenElement(document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  if (fullscreenElement) {
    return createPortal(children, fullscreenElement);
  }

  return <>{children}</>;
};
```

#### 1.3 テスト・検証計画

- デスクトップブラウザ（Chrome・Firefox・Safari・Edge）
- モバイルブラウザ（iOS Safari・Android Chrome）
- フルスクリーン切り替え操作の確認
- フィルター操作・モーダル表示の動作確認

### Phase 2: PWA画像アセット移行 🎨

#### 2.1 画像リサイズ・最適化

**現在の課題**:

- 新しい画像が大きすぎる（54-71KB vs 2-25KB）
- PWA用途には過剰な品質・サイズ

**最適化戦略**:

```bash
# PNG最適化（想定）
title_row1.png: 54.78KB → 8-12KB (目標)
title_row2.png: 68.08KB → 10-15KB (目標)

# SVGの場合は minify・不要要素削除
title_row1.svg: 62KB → 15-25KB (目標)
title_row2.svg: 71KB → 20-30KB (目標)
```

#### 2.2 画像リサイズ作業

**必要なサイズ生成**:

```bash
# 生成対象サイズ
64x64    - 小サイズファビコン
192x192  - PWA標準アイコン
512x512  - PWA大サイズ・マスカブルアイコン
180x180  - Apple Touch Icon
```

**画像選択基準**:

- `title_row1` vs `title_row2` の視認性比較
- PWAアイコンとしての適切性評価
- 佐渡島らしさの表現度合い

#### 2.3 vite.config.ts 修正

**現在の設定（`public/` ベース）**:

```typescript
icons: [
  { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
  { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
  { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
  { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];
```

**新設定（`src/assets/` ベース）**:

```typescript
// vite.config.ts修正案
icons: [
  {
    src: new URL("./src/assets/png/title_row1-64x64.png", import.meta.url).href,
    sizes: "64x64",
    type: "image/png",
  },
  {
    src: new URL("./src/assets/png/title_row1-192x192.png", import.meta.url).href,
    sizes: "192x192",
    type: "image/png",
  },
  // ... 他のサイズ
];
```

**🆕 推奨：Vite PWA Assets Generator活用戦略**:

````typescript
// vite.config.ts - 最新Vite PWAプラグイン機能活用
import { VitePWA } from 'vite-plugin-pwa';
import type { VitePWAOptions } from 'vite-plugin-pwa';

const pwaOptions: VitePWAOptions = {
  // 🎯 Assets Generator機能でアイコン自動生成
  pwaAssets: {
    config: true,
    // マスターアイコンから各サイズ自動生成
    image: './src/assets/png/title_row1.png',
    preset: {
      transparent: {
        sizes: [64, 192, 512],
        favicons: [[48, 'favicon.ico']],
      },
      maskable: {
        sizes: [512],
        resizeOptions: { fit: 'contain', background: '#佐渡島テーマカラー' },
      },
      apple: {
        sizes: [180],
      },
    },
  },

  // 🔧 Workbox設定の最適化
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-maps-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
          },
        },
      },
    ],
  },

  manifest: {
    name: '佐渡飲食店マップ',
    short_name: '佐渡グルメ',
    description: '佐渡島の飲食店を探索しよう',
    theme_color: '#佐渡島テーマカラー',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    // アイコンは pwaAssets で自動生成される
  },
};

plugins: [
  react(),
  VitePWA(pwaOptions),
];```

**従来のコピー戦略（フォールバック）**:

```typescript
// vite.config.ts - 手動コピー方式（必要に応じて）
import { copyFileSync } from "fs";

plugins: [
  react(),
  {
    name: "copy-pwa-assets",
    generateBundle() {
      // src/assets → public への自動コピー
      copyFileSync("./src/assets/png/title_row1-64x64.png", "./public/pwa-64x64.png");
      copyFileSync("./src/assets/png/title_row1-192x192.png", "./public/pwa-192x192.png");
      // ...
    },
  },
  VitePWA(/* 既存設定 */),
];
````

### Phase 3: 統合テスト・品質確認

#### 3.1 機能テスト

- フルスクリーンモードでのフィルター表示・操作
- PWA インストール・アイコン表示確認
- 各種デバイス・ブラウザでの動作確認

#### 3.2 性能測定

- 画像読み込み時間・キャッシュ効果確認
- PWA Lighthouse スコア測定
- Core Web Vitals 影響評価

## 📊 タスク詳細・実装手順

### 🚨 Task 1: フルスクリーンフィルター修正

- **見積もり時間**: 4-6時間
- **担当**: フロントエンド開発
- **依存関係**: なし

**詳細ステップ**:

1. [ ] フルスクリーン動作の現状詳細調査（30分）
2. [ ] CSS修正・強化（Level 1対応）（1時間）
3. [ ] DOM操作追加（Level 2対応）（2時間）
4. [ ] 必要に応じてPortal実装（Level 3対応）（2時間）
5. [ ] 全ブラウザテスト・検証（1時間）

### 🎨 Task 2: PWA画像最適化・移行

- **見積もり時間**: 3-4時間
- **担当**: デザイン・フロントエンド
- **依存関係**: なし

**詳細ステップ**:

1. [ ] 画像選択・品質評価（30分）
2. [ ] 各サイズでのリサイズ・最適化（1時間）
3. [ ] vite.config.ts設定変更（30分）
4. [ ] ビルド・動作確認（1時間）
5. [ ] PWAインストール・アイコン確認（1時間）

### 🔧 Task 3: 統合テスト・デプロイ

- **見積もり時間**: 2時間
- **担当**: QA・DevOps
- **依存関係**: Task 1, 2完了

**詳細ステップ**:

1. [ ] 機能統合テスト（45分）
2. [ ] 性能・品質測定（45分）
3. [ ] GitHub Pages デプロイ・確認（30分）

## ⚠️ リスク・注意事項

### 高リスク要因

#### フルスクリーン修正関連

- **DOM操作複雑性**: 予期しないレイアウト破綻
- **ブラウザ互換性**: 特定環境での動作不良
- **Google Maps API**: 外部ライブラリとの競合

**軽減策**:

- 段階的実装（Level 1→2→3）
- 各段階での十分なテスト
- フォールバック機能の実装

#### PWA画像移行関連

- **画像品質劣化**: 最適化過程での視認性低下
- **キャッシュ問題**: ブラウザキャッシュによる古い画像表示
- **ビルドサイズ増加**: 画像アセットの不適切な処理

**軽減策**:

- 複数候補での A/B 比較検討
- キャッシュクリア手順の文書化
- バンドルサイズ監視の実装

### 中リスク要因

- 実装時間の見積もり過少
- デザイン要件の追加変更

## 📈 成功基準・検証方法

### ✅ 完了条件

#### フルスクリーン機能

- [ ] Chrome・Firefox・Safari全てでフィルターボタン表示
- [ ] モバイル・デスクトップ両環境での動作確認
- [ ] フィルター操作・モーダル表示の正常動作
- [ ] パフォーマンス劣化なし

#### PWA画像移行

- [ ] 新しいアイコンでのPWAインストール確認
- [ ] 各デバイスでのアイコン表示品質確認
- [ ] 画像サイズ最適化（現在比50%以下）
- [ ] Lighthouse PWAスコア維持・向上

### 📊 測定指標

- **ユーザビリティ**: フルスクリーンでのフィルター利用率
- **PWA品質**: Lighthouse PWAスコア（95点以上維持）
- **パフォーマンス**: 画像読み込み時間（<100ms）
- **視覚品質**: ユーザーフィードバック・A/Bテスト結果
- **🆕 Core Web Vitals**:
  - LCP (Largest Contentful Paint): <2.5s
  - FID (First Input Delay): <100ms
  - CLS (Cumulative Layout Shift): <0.1
- **🔧 Fullscreen API対応率**: 全主要ブラウザで100%動作
- **📱 PWA Installation率**: インストール成功率95%以上

## 🚀 実装開始準備

### 事前準備

1. 画像編集ツール準備（Photoshop/GIMP/オンラインツール）
2. 各種ブラウザ・デバイスでのテスト環境確保
3. PWAテスト用のHTTPS環境確認

### 開発環境セットアップ

```bash
# 依存関係確認
pnpm install

# 開発サーバー起動
pnpm dev

# PWAビルドテスト
pnpm build && pnpm preview
```

---

## 📚 参考情報・関連ドキュメント

### 技術参考

- [Fullscreen API - MDN](https://developer.mozilla.org/ja/docs/Web/API/Fullscreen_API)
- [PWA App Icons - web.dev](https://web.dev/app-icons/)
- [Vite PWA Plugin Documentation](https://vite-pwa-org.netlify.app/)

### プロジェクト関連

- `docs/development/ai-assistant/copilot-instructions.md`
- `src/styles/CompactModalFilter.css` (フルスクリーン対応CSS)
- `vite.config.ts` (PWA設定)

---

> 📝 **Next Steps**: Task 1のフルスクリーンフィルター修正から着手し、段階的に実装を進めます。各フェーズ完了時に動作確認・品質チェックを実施します。

**最終更新**: 2025年9月13日
**ステータス**: 計画策定完了・実装待機
