# GitHub Copilot Instructions

> 🎯 **目的**: React+TypeScript+Google Maps プロジェクト向けの統合開発支援
> **プロジェクト**: 佐渡飲食店マップアプリケーション
> **技術スタック**: React 19, TypeScript 5.7, Vite 6, Google Maps API, PWA

## 🏗️ プロジェクト概要

このプロジェクトは佐渡島の飲食店を紹介する React ベースのマップアプリケーションです。

### 主要技術

- **フロントエンド**: React 19.0 + TypeScript 5.7 + Vite 6.0
- **地図機能**: Google Maps JavaScript API + @vis.gl/react-google-maps v1.5
- **スタイリング**: CSS + レスポンシブデザイン
- **テスト**: Vitest 3.2 + Testing Library
- **PWA**: Service Worker + Manifest + vite-plugin-pwa
- **パッケージ管理**: pnpm

### 重要な特徴

- 🍽️ Google Maps 統合による飲食店マップ
- 🏪 店舗詳細情報・フィルタリング機能
- 📱 レスポンシブ・モバイルファースト設計
- ⚡ Vite による高速開発・ビルド
- 🏃‍♂️ PWA 対応（オフライン機能）
- 🔍 検索・フィルタリング機能
- 🧪 包括的なテストカバレッジ
- 🔧 開発者体験最適化
- 📁 **整理されたプロジェクト構造**

## 🎯 コード作成・修正の基本方針

### 1. TypeScript 優先

- 厳格な型定義を必須とする
- `any`の使用を避け、適切な型を定義
- Generics、Union Types を積極活用
- 型ガードとユーザー定義型ガード関数を使用

### 2. React 現代的パターン

- 関数コンポーネント + Hooks のみ使用
- `memo`、`useMemo`、`useCallback`で適切にメモ化
- Custom Hooks で状態ロジックを分離
- Suspense、Error Boundary で堅牢性を確保
- Concurrent Features 活用（startTransition、useDeferredValue）

### 3. パフォーマンス重視

- Code Splitting（React.lazy）を積極使用
- 画像・アセットの遅延読み込み
- Google Maps API 呼び出しの最適化
- 不要な再レンダリングの防止

### 4. アクセシビリティ・UX

- WCAG 2.2 AA 準拠
- セマンティック HTML、適切な ARIA 属性
- キーボードナビゲーション対応
- スクリーンリーダー対応
- カラーコントラスト対応
- 動作縮小設定対応（prefers-reduced-motion）

## 🛠️ 開発ガイドライン

### プロジェクト構造

```text
プロジェクトルート/
├── 📄 package.json, tsconfig.*.json    # 設定ファイル
├── 📄 index.html, vite.config.ts       # ビルド・エントリーポイント
├──  src/                             # ソースコード
│   ├── components/                     # React コンポーネント
│   │   ├── common/                     # 汎用UIコンポーネント
│   │   ├── layout/                     # レイアウトコンポーネント
│   │   ├── map/                        # Google Maps関連
│   │   └── restaurant/                 # 飲食店関連
│   ├── hooks/                          # カスタムHooks
│   │   ├── api/                        # API関連フック
│   │   ├── map/                        # 地図関連フック
│   │   └── ui/                         # UI関連フック
│   ├── services/                       # 外部API・サービス連携
│   ├── types/                          # TypeScript型定義
│   ├── utils/                          # ユーティリティ関数
│   ├── config/                         # 設定・定数管理
│   └── styles/                         # CSSファイル
├── 📁 docs/                            # ドキュメント
│   ├── development/                    # 開発支援
│   ├── architecture/                   # アーキテクチャ決定
│   └── planning/                       # ロードマップ・計画
├── 📁 tools/                           # 開発ツール
└── 📁 config/, public/                 # 設定・静的ファイル
```

### ファイル・ディレクトリ命名規則

- **コンポーネント**: `PascalCase.tsx` (例: `MapView.tsx`)
- **Hooks**: `use*.ts` (例: `useMapState.ts`)
- **型定義**: `*.types.ts` (例: `restaurant.types.ts`)
- **ユーティリティ**: `camelCase.ts` (例: `formatAddress.ts`)
- **定数**: `*.constants.ts` (例: `map.constants.ts`)

### コーディング標準

- ESLint + Prettier 設定に準拠
- コメントは英語で記述（ユーザー向けは日本語）
- 1 ファイル 300 行以内を目標
- 関数は 1 つの責任のみ持つ
- 副作用のある処理は明確に分離

## 🎯 特化した対応方針

### Google Maps 統合

- Advanced Markers を最優先使用
- `@vis.gl/react-google-maps`ライブラリを優先使用
- マーカークラスタリングでパフォーマンス最適化
- InfoWindow、カスタムコントロールの適切な実装
- 地図の状態管理とメモ化に注意
- Maps JavaScript API の効率的な使用

### PWA・モバイル対応

- Service Worker でオフライン対応
- Manifest による PWA 対応
- Touch 操作、ジェスチャーサポート
- Critical CSS で FCP 最適化
- レスポンシブデザイン

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
- API 使用量最適化の提案
- マーカー・InfoWindow の効率的な実装
- 地図イベントハンドリングのベストプラクティス
- カスタムコントロールの適切な実装

#### PWA 最適化

- Service Worker 実装のサポート
- Manifest 対応への移行
- キャッシュ戦略の最適化提案
- オフライン対応の実装支援

### コンテキスト認識

#### プロジェクト固有の知識

- 佐渡島の地理的特性を考慮
- 飲食店アプリとしての UX 要件
- 日本語・多言語対応の考慮
- モバイル利用シーンの想定
- **整理されたプロジェクト構造の活用**

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

### ファイル配置の自動提案

- 新規コンポーネント → `src/components/[category]/`
- 開発ツール → `tools/[category]/`
- ドキュメント → `docs/[category]/`

## 📚 参照すべき技術情報

### 必須ドキュメント

- React 19 公式ドキュメント
- TypeScript 5.7 ハンドブック
- Google Maps JavaScript API + Advanced Markers
- @vis.gl/react-google-maps v1.5
- Vite 6.0 公式ガイド
- WCAG 2.2 アクセシビリティガイドライン
- PWA Manifest 仕様

### コード例の提供

- **整理されたプロジェクト構造**に合わせた実装例
- TypeScript 型定義のベストプラクティス
- Google Maps 統合の効率的なパターン
- PWA 実装の段階的ガイド
- **適切なディレクトリ配置**を考慮したファイル作成例

## 🎯 応答スタイル

### 基本姿勢

- **実用性優先**: 理論より実装可能な解決策
- **段階的改善**: 大きな変更は小分けして提案
- **リスク考慮**: 変更による影響を事前に説明
- **テスト重視**: 変更後のテスト方法も併せて提案
- **構造保持**: 整理されたプロジェクト構造の維持・活用

### コミュニケーション

- 日本語でユーザーフレンドリーに説明
- 技術的な根拠を簡潔に提示
- 代替案がある場合は選択肢を提供
- 実装の優先度を明確に示す
- **適切なファイル配置場所**を提案に含める

---

**最終更新**: 2025年8月27日
**連携ファイル**: `ai-prompts.md` (同ディレクトリ)
