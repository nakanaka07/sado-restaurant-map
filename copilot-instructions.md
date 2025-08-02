# GitHub Copilot Instructions

> 🎯 **目的**: React+TypeScript+Google Maps プロジェクト向けの統合開発支援  
> **プロジェクト**: 佐渡飲食店マップアプリケーション  
> **技術スタック**: React 19, TypeScript 5.9, Vite 8.0, Google Maps API, PWA

## 🏗️ プロジェクト概要

このプロジェクトは佐渡島の飲食店を紹介する React ベースのマップアプリケーションです。

### 主要技術

- **フロントエンド**: React 19.1 + TypeScript 5.9 + Vite 8.0
- **React 最新機能**: React Compiler RC → Stable、View Transitions API、use フック、Activity API
- **地図機能**: Google Maps JavaScript API + Advanced Markers v2 + Places API (New) +
  @vis.gl/react-google-maps v3
- **スタイリング**: CSS4 Variables + Container Queries + View Transitions + CSS Nesting
- **テスト**: Vitest 4.0 + Testing Library + Playwright
- **PWA**: Service Worker v3 + Manifest v3 + Web Share API v2 + Background Sync
- **パッケージ管理**: pnpm v9

### 重要な特徴

- 🍽️ Google Maps 統合による飲食店マップ（Places API (New) v1 対応）
- 🏪 店舗詳細情報・メニュー・営業時間表示（リアルタイム更新）
- 📱 レスポンシブ・モバイルファースト設計（iOS 18 / Android 15 対応）
- ⚡ Vite 8.0 による超高速開発・ビルド（Rolldown 統合）
- 🏃‍♂️ PWA 対応（オフライン機能・Background Sync・Push Notifications）
- 🔍 AI 支援検索・フィルタリング（Google AI Gemini 統合）
- ⭐ レビュー・評価システム統合（Google Places データ活用）
- 🧪 包括的なテストカバレッジ（E2E・Visual Regression・Accessibility）
- 🌐 国際化対応（日本語・英語・多言語切り替え）
- 🔧 開発者体験最適化（HMR・TypeScript 厳格モード・ESLint v9）

## 🎯 コード作成・修正の基本方針

### 1. TypeScript 優先

- 厳格な型定義を必須とする
- `any`の使用を避け、適切な型を定義
- Generics、Union Types、Conditional Types を積極活用
- 型ガードとユーザー定義型ガード関数を使用

### 2. React 現代的パターン

- 関数コンポーネント + Hooks のみ使用
- React 19.1 最新機能の積極活用（React Compiler 完全対応、use hook、Activity API）
- `memo`、`useMemo`、`useCallback`で適切にメモ化（React Compiler 自動最適化）
- Custom Hooks で状態ロジックを分離（型安全性重視）
- Suspense、Error Boundary で堅牢性を確保（並行レンダリング対応）
- Concurrent Features 活用（startTransition、useDeferredValue、useTransition）
- Server Components 準備（Next.js 15 / Remix v2 互換）
- View Transitions API 統合（ページ遷移アニメーション）
- Progressive Enhancement（JavaScript 無効環境でも基本機能動作）

### 3. パフォーマンス重視

- Code Splitting（React.lazy）を積極使用
- 画像・アセットの遅延読み込み
- Google Maps API 呼び出しの最適化
- 不要な再レンダリングの防止

### 4. アクセシビリティ・UX

- WCAG 2.2 AA 準拠（最新基準）
- セマンティック HTML、適切な ARIA 属性（ARIA 1.3）
- キーボードナビゲーション対応（Focus Management）
- スクリーンリーダー対応（NVDA / JAWS / VoiceOver）
- カラーコントラスト対応（APCA コントラスト基準）
- 動作縮小設定対応（prefers-reduced-motion）
- 多言語対応（RTL・日本語・英語）
- タッチ対応・ジェスチャー操作（iOS / Android）

## 🛠️ 開発ガイドライン

### ファイル構成規則

**段階的構成アプローチ**  
プロジェクトの成長に合わせて、シンプルな構成から段階的に複雑化していく。

#### Phase 1: シンプル構成（現在～小規模）

```
src/
├── components/        # 全てのReactコンポーネント
├── hooks/            # カスタムHooks
├── data/             # 静的データ・定数
├── types/            # TypeScript型定義
├── utils/            # ユーティリティ関数
├── styles/           # スタイル定義
└── assets/           # 画像・アイコン等
```

**適用条件**: コンポーネント数 < 20 個、機能が明確に分離されていない段階

#### Phase 2: 機能別構成（中規模～）

```
src/
├── components/
│   ├── common/       # 汎用UI（Button、Modal等）
│   ├── map/          # Google Maps関連
│   └── restaurant/   # 飲食店関連
├── hooks/
│   ├── useMap.ts     # 地図関連
│   ├── useRestaurant.ts # 店舗データ
│   └── useApi.ts     # API関連
├── services/         # 外部API・サービス連携
├── data/             # 静的データ・設定
├── types/            # 型定義
├── utils/            # ユーティリティ
└── styles/           # スタイル
```

**適用条件**: コンポーネント数 20-50 個、機能が明確に分離された段階

#### Phase 3: ドメイン駆動構成（大規模）

機能が多くなった場合のみ適用する高度な構成

**現在の推奨**: Phase 1 のシンプル構成から開始

### 現実的な移行戦略

1. **現在**: `src/` 直下にファイルを配置（App.tsx、main.tsx 等）
2. **次のステップ**: `components/` フォルダを作成し、コンポーネントを整理
3. **その後**: 機能が増えてきたら Phase 2 に移行検討

### ファイル命名規則（簡略版）

- **コンポーネント**: `PascalCase.tsx` (例: `MapView.tsx`)
- **Hooks**: `use*.ts` (例: `useMapState.ts`)
- **型定義**: `*.types.ts` (例: `restaurant.types.ts`)
- **ユーティリティ**: `camelCase.ts` (例: `formatAddress.ts`)
- **定数**: `*.constants.ts` (例: `map.constants.ts`)

### 命名規則（簡略版）

**基本原則**: 一貫性とシンプルさを重視

- **コンポーネント**: `PascalCase.tsx` (例: `MapView.tsx`, `RestaurantCard.tsx`)
- **Hooks**: `use*.ts` (例: `useMapState.ts`, `useRestaurants.ts`)
- **型定義**: `*.types.ts` (例: `restaurant.types.ts`, `map.types.ts`)
- **ユーティリティ**: `camelCase.ts` (例: `formatAddress.ts`, `validateCoords.ts`)
- **定数・設定**: `*.constants.ts` (例: `map.constants.ts`, `api.constants.ts`)
- **スタイル**: `*.module.css` または `*.css` (コンポーネント名と対応)

### コーディング標準

- ESLint + Prettier 設定に準拠
- コメントは英語で記述（ユーザー向けは日本語）
- 1 ファイル 300 行以内を目標
- 関数は 1 つの責任のみ持つ
- 副作用のある処理は明確に分離

## 🎯 特化した対応方針

### Google Maps 統合

- Advanced Markers を最優先使用（従来の Marker より推奨）
- `@vis.gl/react-google-maps`ライブラリを優先使用
- 3D 地図・WebGL 機能の活用検討
- マーカークラスタリングでパフォーマンス最適化
- InfoWindow、カスタムコントロールの適切な実装
- 地図の状態管理とメモ化に注意
- Maps JavaScript API 週次版（"weekly"）の使用
- Places API (New) v1 の完全活用
- HTML マーカー・カスタムマーカーの高度な実装
- 地図高度（altitude）設定による 3D 表示最適化
- クリック・キーボードイベントの包括的対応

### PWA・モバイル対応

- Service Worker でオフライン対応
- Manifest v3 対応（最新 PWA 仕様）
- Touch 操作、ジェスチャーサポート
- Safe Area、ノッチ対応
- Critical CSS で FCP 最適化
- Web Share API 統合
- Push Notifications 対応
- View Transitions API 活用
- Background Sync v2 による完全オフライン同期
- Installable PWA（Android / iOS / Desktop）
- Network Information API 活用（適応的読み込み）
- Performance Observer による Core Web Vitals 監視

### エラーハンドリング

- グローバルエラーバウンダリ
- ネットワークエラーの適切な処理
- ユーザーフレンドリーなエラーメッセージ
- 開発時は詳細ログ、本番時は最小ログ

## 🚀 開発支援機能

### 自動的な対応

#### コード品質

- TypeScript 型エラーの自動検出・修正提案
- 未使用 import/変数の削除提案
- パフォーマンス改善の自動提案
- アクセシビリティ問題の指摘

#### Google Maps 特化

- Advanced Markers への移行サポート
- 3D 地図機能の実装支援
- API 使用量最適化の提案
- マーカー・InfoWindow の効率的な実装
- WebGL オーバーレイ活用の提案
- 地図イベントハンドリングのベストプラクティス
- カスタムコントロールの適切な実装

#### PWA 最適化

- Service Worker 実装のサポート
- Manifest v3 対応への移行
- キャッシュ戦略の最適化提案
- オフライン対応の実装支援
- Web Share API 統合支援
- Push Notifications 実装
- View Transitions 実装支援

### コンテキスト認識

#### プロジェクト固有の知識

- 佐渡島の地理的特性を考慮
- 飲食店アプリとしての UX 要件
- 日本語・多言語対応の考慮
- モバイル利用シーンの想定

## 🔧 統合プロンプト対応

### ai-prompts.md 連携

ユーザーが `#番号` 形式でプロンプトを指定した場合：

- **#1-#6**: 基本的なコード改善（修正、整理、最適化、リファクタ、モダナイズ、包括改善）
- **#7-#9**: 専門的な改善（環境、フロントエンド、プロジェクト構造）
- **#10-#12**: 診断・メンテナンス（プロジェクト診断、ディレクトリ診断、緊急対応）

各プロンプトに対して、プロジェクト特性を考慮した具体的な改善を提案する。

### 優先度付き対応

1. **Critical**: セキュリティ、アクセシビリティ、型安全性
2. **High**: パフォーマンス、ユーザビリティ、Google Maps 最適化
3. **Medium**: コード品質、保守性、テスト
4. **Low**: スタイル、コメント、ドキュメント

## 📚 参照すべき技術情報

### 必須ドキュメント

- React 19 公式ドキュメント + React Compiler RC
- TypeScript 5.9 ハンドブック
- Google Maps JavaScript API + Advanced Markers
- @vis.gl/react-google-maps
- Vite 8.0 公式ガイド
- Web Vitals 2025 基準
- WCAG 2.2 アクセシビリティガイドライン
- Places API (New) v1 ドキュメント
- PWA Manifest v3 仕様
- View Transitions API 仕様

### コード例の提供

- プロジェクト構造に合わせた実装例
- TypeScript 型定義のベストプラクティス
- Google Maps 統合の効率的なパターン
- PWA 実装の段階的ガイド

## 🎯 応答スタイル

### 基本姿勢

- **実用性優先**: 理論より実装可能な解決策
- **段階的改善**: 大きな変更は小分けして提案
- **リスク考慮**: 変更による影響を事前に説明
- **テスト重視**: 変更後のテスト方法も併せて提案

### コミュニケーション

- 日本語でユーザーフレンドリーに説明
- 技術的な根拠を簡潔に提示
- 代替案がある場合は選択肢を提供
- 実装の優先度を明確に示す

---

**最終更新**: 2025 年 8 月 2 日  
**連携ファイル**: `ai-prompts.md`
