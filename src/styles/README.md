# Styles

## 概要

このディレクトリは、佐渡島レストランマップアプリケーションの**スタイルシステム**を構成します。モダンなフルスクリーンマップUIに最適化されたCSS設計で、レスポンシブデザインとアクセシビリティを重視したスタイル実装を提供します。

## ファイル構成

### `App.css`

- **メインスタイルファイル** - アプリケーション全体のスタイル定義
- **サイズ**: 13.3KB - 包括的なデザインシステムとコンポーネントスタイル
- **バージョン**: v2.2 - Critical Override版

### `index.css`

- **Viteベーススタイル** - 基本的なボタンスタイルとVite固有の設定
- **サイズ**: 608バイト - 軽量な基本スタイル

### `PWABadge.css`

- **PWA専用スタイル** - Progressive Web App機能のUI要素
- **サイズ**: 545バイト - PWAインストール促進バッジのスタイル

## デザインシステム

### CSS Variables（カスタムプロパティ）

#### カラーパレット

```css
:root {
  /* Primary Colors */
  --color-primary: #2563eb;
  --color-primary-light: #3b82f6;
  --color-primary-dark: #1d4ed8;

  /* Surface Colors */
  --color-surface: #ffffff;
  --color-surface-elevated: #f8fafc;
  --color-surface-overlay: rgba(255, 255, 255, 0.9);

  /* Text Colors */
  --color-text-primary: #0f172a;
  --color-text-secondary: #64748b;
  --color-text-on-primary: #ffffff;
}
```text

#### シャドウシステム

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```text

#### 境界線半径

```css
:root {
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}
```text

#### スペーシングシステム

```css
:root {
  --spacing-xs: 0.5rem;
  --spacing-sm: 0.75rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}
```text

#### タイポグラフィ

```css
:root {
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
}
```text

## アーキテクチャ特徴

### 1. フルスクリーンマップ最適化

#### レイアウト戦略

```css
html, body {
  margin: 0 !important;
  padding: 0 !important;
  height: 100vh !important;
  width: 100vw !important;
  overflow: hidden !important;
}

.app {
  height: 100vh !important;
  width: 100vw !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}
```text

- **100vh/100vw** - ビューポート全体を活用
- **overflow: hidden** - スクロールバーを完全に排除
- **!important** - 他のスタイルからの干渉を防止

### 2. フローティングUI設計

#### ヘッダーコンポーネント

```css
.app-header {
  position: absolute !important;
  top: 6px !important;
  z-index: 1000 !important;
  background: var(--color-surface-overlay) !important;
  backdrop-filter: blur(16px) !important;
  border-radius: var(--radius-lg) !important;
}
```text

- **Backdrop Filter** - 地図の視認性を保ちながら透明感を演出
- **Absolute Positioning** - 地図領域を最大化
- **高いz-index** - UI要素の重なり順序を保証

### 3. レスポンシブデザイン

#### モバイルファースト設計

```css
@media (max-width: 768px) {
  .app-header {
    top: 4px;
    left: var(--spacing-xs);
    right: var(--spacing-xs);
  }
  
  .filter-panel {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }
}
```text

- **ブレークポイント**: 768px（タブレット境界）
- **フルスクリーン対応** - モバイルでの地図領域最大化
- **タッチフレンドリー** - 指操作に適したサイズ調整

## コンポーネントスタイル

### 1. フィルターパネル

#### デザイン特徴

- **スライドイン アニメーション** - スムーズな表示/非表示
- **ブラー背景** - 地図との視覚的分離
- **スクロール対応** - 長いフィルターリストに対応

```css
.filter-panel {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: var(--color-surface-overlay);
  backdrop-filter: blur(20px);
  transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```text

### 2. マップコンテナ

#### 最適化ポイント

- **フルスクリーン表示** - UI要素による遮蔽を最小化
- **パフォーマンス重視** - GPU加速の活用
- **インタラクション保持** - 地図操作の妨げにならない設計

### 3. PWAバッジ

#### 特徴

- **固定位置表示** - 右下角への配置
- **軽量実装** - 最小限のスタイル定義
- **アクセシブル** - 適切なコントラストとサイズ

## CSS最適化戦略

### 1. Critical CSS

- **Above-the-fold** - 初期表示に必要なスタイルを優先
- **インライン化** - レンダリングブロッキングを回避
- **最小化** - 不要なスタイルの除去

### 2. パフォーマンス最適化

```css
/* GPU加速の活用 */
.animated-element {
  transform: translateZ(0);
  will-change: transform;
}

/* 効率的なトランジション */
.smooth-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```text

### 3. メンテナビリティ

- **CSS Variables** - 一元的な値管理
- **BEM命名規則** - 構造化されたクラス名
- **コメント** - 重要な実装の説明

## ブラウザ対応

### サポート対象

- **Chrome/Edge** 88+ - フル機能対応
- **Firefox** 85+ - backdrop-filter対応
- **Safari** 14+ - CSS Variables対応
- **モバイルブラウザ** - iOS Safari 14+, Chrome Mobile 88+

### フォールバック戦略

```css
/* backdrop-filter非対応時のフォールバック */
.app-header {
  background: var(--color-surface-overlay);
}

@supports (backdrop-filter: blur(16px)) {
  .app-header {
    backdrop-filter: blur(16px);
    background: rgba(255, 255, 255, 0.9);
  }
}
```text

## カスタマイゼーション

### テーマ変更

```css
/* ダークテーマの例 */
[data-theme="dark"] {
  --color-surface: #1e293b;
  --color-surface-elevated: #334155;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
}
```text

### カスタムプロパティの拡張

```css
:root {
  /* 新しいカラー変数の追加 */
  --color-accent: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  /* 新しいスペーシング */
  --spacing-2xs: 0.25rem;
  --spacing-2xl: 3rem;
}
```text

## デバッグとトラブルシューティング

### CSS読み込み確認

```css
/* DEBUG: この行が見えていればCSS更新成功 */
```text

- コメント行でCSS読み込み状況を確認
- ブラウザ開発者ツールでの検証方法

### よくある問題

#### 1. スタイル適用されない

```css
/* 解決方法: 詳細度を上げる */
.app .component {
  /* より具体的なセレクター */
}

/* または !important の使用 */
.critical-style {
  property: value !important;
}
```text

#### 2. レスポンシブ表示の問題

```css
/* viewport meta タグの確認 */
<meta name="viewport" content="width=device-width, initial-scale=1.0">

/* メディアクエリの順序確認 */
@media (max-width: 768px) { /* モバイル */ }
@media (min-width: 769px) { /* デスクトップ */ }
```text

## パフォーマンス監視

### CSS メトリクス

- **First Contentful Paint (FCP)** - 初期レンダリング速度
- **Largest Contentful Paint (LCP)** - メインコンテンツ表示速度
- **Cumulative Layout Shift (CLS)** - レイアウト安定性

### 最適化チェックリスト

- [ ] 未使用CSSの除去
- [ ] Critical CSSの分離
- [ ] CSS Variables の活用
- [ ] GPU加速の適用
- [ ] メディアクエリの最適化

## 関連ドキュメント

- `src/components/` - コンポーネント実装
- `src/hooks/` - カスタムフック
- `docs/development/` - 開発ガイドライン
- `public/` - 静的アセット

## ベストプラクティス

### CSS設計原則

- **Single Responsibility** - 各クラスは単一の責任を持つ
- **DRY (Don't Repeat Yourself)** - CSS Variablesで重複を避ける
- **Progressive Enhancement** - 基本機能から段階的に拡張

### メンテナンス指針

- **定期的なリファクタリング** - 未使用スタイルの除去
- **パフォーマンス監視** - Core Web Vitalsの確認
- **ブラウザテスト** - 対象ブラウザでの動作確認

## 注意事項

- **!important の使用** - 必要最小限に留める
- **z-index管理** - 階層構造を明確に定義
- **アクセシビリティ** - 色覚異常やコントラスト比に配慮
- **パフォーマンス** - 複雑なセレクターやアニメーションの影響を考慮
