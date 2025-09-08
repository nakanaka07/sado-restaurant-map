# GitHub Copilot Instructions

> 🎯 **目的**: React 19 + TypeScript 5.7 + Vite 7 プロジェクト向けの統合開発支援
> **プロジェクト**: 佐渡飲食店マップアプリケーション（個人開発・GitHub Pages）
> **技術スタック**: React 19, TypeScript 5.7, Vite 7, Google Maps Advanced Markers, PWA

## 🏗️ プロジェクト概要

このプロジェクトは佐渡島の飲食店を紹介する React ベースのマップアプリケーションです。

### 主要技術

- **フロントエンド**: React 19.1 + TypeScript 5.7 + Vite 7.1
- **地図機能**: Google Maps Advanced Markers API + @vis.gl/react-google-maps v1.5
- **スタイリング**: CSS + レスポンシブデザイン
- **テスト**: Vitest 3.2 + Testing Library
- **PWA**: Service Worker + Manifest + vite-plugin-pwa
- **パッケージ管理**: pnpm
- **デプロイ**: GitHub Pages（静的サイトホスティング）

### 重要な特徴

- 🍽️ Google Maps Advanced Markers 統合による飲食店マップ
- 🏪 店舗詳細情報・フィルタリング機能
- 📱 レスポンシブ・モバイルファースト設計
- ⚡ Vite 7 による高速開発・ビルド
- 🏃‍♂️ PWA 対応（オフライン機能）
- 🔍 検索・フィルタリング機能
- 🧪 包括的なテストカバレッジ
- 🔧 シンプルで効率的な開発体験

## 🎯 コード作成・修正の基本方針

### 1. TypeScript 優先

- 厳格な型定義を必須とする
- `any`の使用を避け、適切な型を定義
- Generics、Union Types を積極活用
- 型ガードとユーザー定義型ガード関数を使用

### 2. React 19 現代的パターン

- 関数コンポーネント + Hooks のみ使用
- **Actions API 活用**：useActionState、useOptimistic でフォーム処理・楽観的更新
- **use() hook 活用**：Promise・Context の効率的な処理
- **ref as prop**：forwardRef 不要の新パターン
- **Document Metadata**：title、meta、link の直接レンダリング
- `memo`、`useMemo`、`useCallback`で適切にメモ化
- Custom Hooks で状態ロジックを分離
- Suspense、Error Boundary で堅牢性を確保
- Concurrent Features 活用（startTransition、useDeferredValue）

### 3. パフォーマンス重視

- Code Splitting（React.lazy）を積極使用
- 画像・アセットの遅延読み込み
- Google Maps Advanced Markers API の効率的使用
- 不要な再レンダリングの防止
- Vite 7 新機能（Environment API 実験的機能、Baseline Widely Available）活用

### 4. アクセシビリティ・UX

- WCAG 2.2 AA 準拠
- セマンティック HTML、適切な ARIA 属性
- キーボードナビゲーション対応
- スクリーンリーダー対応
- カラーコントラスト対応
- 動作縮小設定対応（prefers-reduced-motion）

## 🛠️ 開発ガイドライン

### 🔍 **実装状況の正確な把握**

#### 実際のプロジェクト構成の理解

- **フロントエンドのみ**: React + TypeScript + Vite 7 + GitHub Pages
- **バックエンドなし**: 静的サイトとして動作
- **クリーンな構成**: プロジェクト整理完了（2025年9月8日）により最適化済み
- **シンプルな構成**: 複雑なインフラではなく、個人開発向け最適化
- **直接的な実装確認**: ドキュメントより実際のコードファイルを信頼

#### 実装度評価の基準

- **src/ディレクトリ構造**: コンポーネント・hooks・services 等の実装状況
- **public/静的ファイル**: PWA manifest・アイコン等の配置状況
- **設定ファイル**: vite.config.ts・tsconfig.json 等の最適化状況
- **GitHub Pages 対応**: デプロイ設定・静的ファイル最適化
- **data-platform/**: データ収集・管理システム（独立モジュール）

### プロジェクト構造

```text
佐渡飲食店マップ/
├── 📄 package.json, tsconfig.*.json    # 設定ファイル
├── 📄 index.html, vite.config.ts       # ビルド・エントリーポイント
├── src/                               # メインソースコード
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
│   ├── styles/                         # CSSファイル
│   └── test/                           # テスト設定・モック
├── config/                             # ビルド・開発環境設定
│   ├── eslint.config.js                # ESLint設定
│   ├── vitest.config.ts                # テスト設定
│   ├── pwa-assets.config.ts            # PWAアセット設定
│   └── typescript/                     # TypeScript詳細設定
├── public/                             # 静的ファイル
│   ├── *.png, *.ico, *.svg             # PWAアイコン・ファビコン各種
│   └── README.md                       # 静的ファイル説明
├── 📁 docs/                            # プロジェクトドキュメント
├── 📁 data-platform/                   # データ収集・管理システム
├── 📁 scripts/                         # デプロイ・メンテナンススクリプト
├── 📁 tests/                           # 統合テスト・E2Eテスト（空・将来用）
└── .github/workflows/                  # GitHub Actions（最小限）
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

### Google Maps Advanced Markers 統合

- Advanced Markers API を最優先使用（従来の Markers より高性能）
- カスタム HTML/CSS による柔軟なマーカーデザイン
- 3D altitude 制御・ドラッグ機能対応
- `@vis.gl/react-google-maps`ライブラリを活用
- マーカークラスタリングでパフォーマンス最適化
- InfoWindow、カスタムコントロールの効率的実装
- 地図の状態管理とメモ化に注意
- API 使用量の効率的な管理

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

#### コード品質向上

- TypeScript 5.7 型エラーの自動検出・修正提案
- 未使用 import/変数の削除提案
- React 19 新機能（Actions API、useActionState）の活用提案
- パフォーマンス改善の自動提案
- アクセシビリティ問題の指摘

#### Google Maps Advanced Markers 特化

- Advanced Markers API への移行サポート
- カスタム HTML/CSS マーカーの実装支援
- API 使用量最適化の提案
- 3D 機能・ドラッグ対応の実装ガイド
- 地図イベントハンドリングのベストプラクティス

#### Vite 7・PWA 最適化

- Environment API 実験的機能の検討サポート
- Lightning CSS 導入の評価・実装支援
- Service Worker・Manifest の最適化提案
- GitHub Pages 対応の改善提案
- オフライン対応の実装支援

### コンテキスト認識

#### プロジェクト固有の知識

- 佐渡島の地理的特性を考慮
- 飲食店アプリとしての UX 要件
- 日本語・多言語対応の考慮
- モバイル利用シーンの想定
- 個人開発・GitHub Pages 環境の制約
- シンプルで効率的な開発体験重視

## 🔧 統合プロンプト対応

### ai-prompts.md 連携

ユーザーが `#番号` 形式でプロンプトを指定した場合：

- **#1-#3**: 基本的なコード改善（修正・強化、整理・清掃、最適化）
- **#4-#6**: 高度な改善（リファクタ、モダナイズ、包括改善）

各プロンプトに対して、プロジェクト特性を考慮した具体的な改善を提案する。

### 優先度付き対応

1. **Critical**: セキュリティ、アクセシビリティ、型安全性
2. **High**: パフォーマンス、ユーザビリティ、Google Maps 最適化
3. **Medium**: コード品質、保守性、テスト
4. **Low**: スタイル、コメント、ドキュメント

### ファイル配置の自動提案

#### コードファイル配置

- 新規コンポーネント → `src/components/[category]/`
- カスタムフック → `src/hooks/[category]/`
- ユーティリティ → `src/utils/`
- 型定義 → `src/types/`
- スクリプト → `scripts/`（必要最小限のみ）

#### ドキュメントファイル配置

- **プロジェクト全体ドキュメント** → `docs/[category]/`
- **個別機能ドキュメント** → `[directory]/README.md`（必要な場合のみ）

#### 配置原則

- **シンプル優先**: 複雑な階層構造を避ける
- **実用性重視**: 実際に使用・更新されるドキュメントのみ作成
- **重複回避**: 同一内容の複数配置を避ける
- **発見性**: 必要な情報にすぐアクセスできる構造

### 実用的なドキュメント管理

#### 基本方針

- **本当に必要なドキュメントのみ作成**: 作成・更新の負担を最小化
- **30 秒理解原則**: 読み手が 30 秒で要点を理解できる構成
- **実行可能な情報**: 抽象的でなく、具体的で実行可能な手順
- **メンテナンス性**: 更新しやすく、古くならない情報

#### README 作成基準

**✅ 作成推奨**:

- 複雑な設定・環境変数が必要
- 外部 API・ライブラリとの統合
- 複数ファイルで構成される機能
- 使用方法が自明でない

**❌ 作成不要**:

- 単純な関数・コンポーネント
- ファイル名から機能が明確
- 設定ファイルのみのディレクトリ

## 📚 参照すべき技術情報

### 必須ドキュメント

- [React 19](https://react.dev/) - Actions API、useActionState、useOptimistic、use() hook
- [TypeScript 5.7](https://www.typescriptlang.org/) - 最新型安全性機能
- [Google Maps Advanced Markers](https://developers.google.com/maps/documentation/javascript/advanced-markers) - 最新地図 API
- [@vis.gl/react-google-maps](https://visgl.github.io/react-google-maps/) - React 統合ライブラリ
- [Vite 7.0](https://vitejs.dev/) - Baseline Widely Available、Environment API
- [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/) - アクセシビリティガイドライン
- [PWA Manifest v3](https://web.dev/add-manifest/) - PWA 仕様

### コード例の提供

- React 19 新機能（Actions、useActionState、use() hook）の実装パターン
- Google Maps Advanced Markers の効率的な統合方法
- TypeScript 5.7 型定義のベストプラクティス
- Vite 7 設定・Environment API 活用例
- PWA・オフライン対応の段階的実装
- 適切なファイル配置・ディレクトリ構成例

## 🎯 応答スタイル

### 基本姿勢

- **実用性優先**: 理論より実装可能な解決策
- **段階的改善**: 大きな変更は小分けして提案
- **シンプル志向**: 複雑さより実用性を重視
- **テスト重視**: 変更後のテスト方法も併せて提案
- **メンテナンス性**: 長期的に維持しやすい解決策

### コミュニケーション

- 日本語でユーザーフレンドリーに説明
- 技術的な根拠を簡潔に提示
- 代替案がある場合は選択肢を提供
- 実装の優先度を明確に示す
- 適切なファイル配置場所を提案に含める

## 📋 プロジェクト整理状況

### ✅ 完了済み整理項目（2025年9月8日）

- **ルートディレクトリ整理**: 24個 → 20個に削減（目標達成）
- **config/最適化**: 9個 → 5個に整理（eslint, vitest, pwa-assets, typescript, README）
- **tools/処理**: 完全削除 → data-platform/として適切配置
- **docker/削除**: GitHub Pages環境に不要なため完全削除
- **data-platform/配置**: 旧tools/scraperを適切にリネーム・配置

### 🎯 現在の最適化された構成

- **シンプル**: 個人開発に適した軽量構成
- **クリーン**: 不要な依存関係・設定ファイルを排除
- **効率的**: 開発・ビルド・デプロイの高速化
- **メンテナブル**: 継続的な開発に適した構造

---

**最終更新**: 2025 年 9 月 8 日
**連携ファイル**: `ai-prompts.md` (同ディレクトリ)
