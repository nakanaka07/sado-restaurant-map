# GitHub Copilot Instruction### 🏆 プロジェクト特徴

- 🍽️ Google Maps Advanced Markers 飲食店マップ
- 📱 レスポンシブ・モバイルファースト + PWA
- ⚡ Vite 7 高速開発・ビルド
- 🔍 検索・フィルタリング機能
- 🧪 包括的テストカバレッジ**目的**: React 19.1.1 + TypeScript 5.7.3 + Vite 7.1.4 プロジェクト向けの統合開発支援
  > **プロジェクト**: 佐渡飲食店マップアプリケーション（個人開発・GitHub Pages）
  > **技術スタック**: React 19.1.1, TypeScript 5.7.3, Vite 7.1.4, Google Maps Advanced Markers, PWA

## 🏗️ プロジェクト概要

このプロジェクトは佐渡島の飲食店を紹介する React ベースのマップアプリケーションです。

### 🚀 主要技術 (2025年対応)

- React 19.1.1 (Actions API, useActionState, use() hook)
- TypeScript 5.7.3 (enum安全性、型推論改善)
- Vite 7.1.4 (Environment API, Baseline Widely Available)
- Google Maps Advanced Markers + @vis.gl/react-google-maps
- PWA (Service Worker, Manifest v3) + GitHub Pages

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

### 1. TypeScript 5.7.3 型安全性優先

- any型完全排除、enum一貫使用パターン
- 実装・テスト同期、Generic活用、Union Types

#### 📋 型ガード・安全性パターン

```typescript
// ✅ 推奨：enum値の一貫使用
export enum RestaurantStatus {
  OPEN = "営業中",
  CLOSED = "閉店中",
  UNKNOWN = "不明",
}

// ✅ 正しいパターン
if (status === RestaurantStatus.OPEN) {
  return "営業中です";
}

// ❌ 禁止パターン
if (status === "営業中") {
  // 文字列リテラル使用禁止
  return "営業中です";
}

// ✅ 型ガード関数
function isRestaurantStatus(value: unknown): value is RestaurantStatus {
  return Object.values(RestaurantStatus).includes(value as RestaurantStatus);
}

// ✅ テスト同期例
expect(calculateStatus(hours)).toBe(RestaurantStatus.OPEN);
```

#### ⚙️ ESLint 厳格ルール設定

```javascript
// eslint.config.js - enum安全性ルール
"@typescript-eslint/no-unsafe-enum-comparison": "error",
"@typescript-eslint/prefer-literal-enum-member": "error",
"@typescript-eslint/prefer-enum-initializers": "warn",
"@typescript-eslint/no-explicit-any": "error",
"@typescript-eslint/strict-boolean-expressions": "error"
```

### 2. React 19.1 現代的パターン

- Actions API (useActionState、useOptimistic) 活用
- use() hook でPromise・Context処理効率化
- ref as prop (orwardRef不要)
- Document Metadata 直接レンダリング

### 3. パフォーマンス & アクセシビリティ

- Code Splitting (React.lazy)、画像遅延読み込み
- Google Maps Advanced Markers API 効率使用
- WCAG 2.2 AA 準拠、キーボードナビゲーション

## 🛠️ 開発ガイドライン

### 🔍 **実装状況の正確な把握**

#### 実際のプロジェクト構成の理解

- **フロントエンドのみ**: React + TypeScript + Vite 7 + GitHub Pages
- **バックエンドなし**: 静的サイトとして動作
- **クリーンな構成**: プロジェクト整理完了（2025年9月8日）により最適化済み
- **シンプルな構成**: 複雑なインフラではなく、個人開発向け最適化
- **直接的な実装確認**: ドキュメントより実際のコードファイルを信頼

### プロジェクト構造

- **src/**: React コンポーネント、hooks、services、types
- **config/**: ESLint、Vitest、PWA、TypeScript設定
- **public/**: 静的ファイル・PWAアイコン
- **data-platform/**: データ収集・管理システム

### ファイル命名規則

- コンポーネント: `PascalCase.tsx`
- Hooks: `use*.ts`
- 型定義: `*.types.ts`
- 定数: `*.constants.ts`

### プロジェクト構造

- **src/**: React コンポーネント、hooks、services、types
- **config/**: ESLint、Vitest、PWA、TypeScript設定
- **public/**: 静的ファイル・PWAアイコン
- **data-platform/**: データ収集・管理システム

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

### Google Maps Advanced Markers 統合

- Advanced Markers API 最優先使用（従来Markersより高性能）
- カスタム HTML/CSS マーカーデザイン
- `@vis.gl/react-google-maps`ライブラリ活用
- API 使用量管理・パフォーマンス最適化

### PWA・モバイル対応

- Service Worker オフライン対応
- Manifest PWA 対応
- Touch 操作・レスポンシブデザイン

### 🔧 開発支援自動化

- TypeScript 5.7 型エラー自動検出・修正提案
- enum一貫性チェック・テスト同期自動検出
- 未使用コード自動特定・削除提案
- React 19新機能適用提案（Actions API、use() hook）
- Google Maps Advanced Markers 移行サポート
- Vite 7・PWA最適化提案

#### 🔧 コード品質向上自動化

- **TypeScript 5.7 型エラー自動検出**: 型安全性問題の特定・修正提案
- **enum一貫性チェック**: 文字列リテラル使用・テスト同期の自動検出
- **未使用コード自動特定**: import/変数/関数の未使用箇所削除提案
- **React 19新機能適用提案**: Actions API、use() hookの活用機会特定
- **パフォーマンス改善自動提案**: メモ化、遅延読み込み等の最適化

#### 🗺️ Google Maps Advanced Markers 特化支援

- Advanced Markers への移行サポート
- カスタムHTML/CSSマーカー実装支援
- API使用量最適化・パフォーマンス改善提案

#### 📦 Vite 7 ・ PWA 最適化自動化

- **Environment API 実験機能検討サポート**: 新機能の実装可能性評価
- **Lightning CSS 導入支援**: パフォーマンス向上のためのLightning CSS導入ガイド
- **Service Worker 最適化提案**: オフライン対応・キャッシュ戦略の最適化
- **GitHub Pages 対応改善**: 静的ファイル最適化・デプロイ設定改善

### コンテキスト認識

#### プロジェクト固有の知識

- 佐渡島の地理的特性を考慮
- 飲食店アプリとしての UX 要件
- 日本語・多言語対応の考慮
- モバイル利用シーンの想定
- 個人開発・GitHub Pages 環境の制約
- シンプルで効率的な開発体験重視

## 🔧 統合プロンプト対応

### 🎯 ai-prompts.md 連携機能

ユーザーが `#番号` 形式でプロンプトを指定した場合、以下の機能で対応：

#### 📄 ファイルレベルプロンプト (#1-#6)

```text
#1 修正・強化    - TypeScript型エラー、セキュリティ問題、バグ修正
#2 整理・清掃    - コードフォーマット、未使用コード削除、可読性向上
#3 最適化       - パフォーマンス改善、メモ化、バンドルサイズ減
#4 リファクタ   - 設計改善、責任分離、テスタビリティ向上
#5 モダナイズ   - React 19新機能、TypeScript 5.7最新パターン適用
#6 包括改善     - UX最適化、アクセシビリティ、総合品質向上
```

#### 📁 ディレクトリレベルプロンプト (#D1-#D6)

```text
#D1 ディレクトリ修正   - 機能単位でのバグ・型エラー解決
#D2 ディレクトリ整理   - フォルダ構造、命名規則の統一
#D3 ディレクトリ最適化 - モジュール間の効率化、依存関係最適化
#D4 ディレクトリ再構築 - 責任分離、モジュール設計改善
#D5 ディレクトリ更新   - 機能単位での技術更新、パターン適用
#D6 ディレクトリ総合   - 機能エリア全体の包括改善
```

#### 🏗️ プロジェクトレベルプロンプト (#P1-#P6)

```text
#P1 プロジェクト修正   - 設定ファイル、依存関係、セキュリティ修正
#P2 プロジェクト整理   - 構成、ドキュメント、開発環境整理
#P3 プロジェクト最適化 - ビルド、デプロイ、CI/CD最適化
#P4 アーキテクチャ改善 - システム設計、技術選定見直し
#P5 技術スタック更新 - 基盤技術、フレームワーク更新
#P6 プロジェクト総合   - 品質、保守性、拡張性の全面改善
```

### 📊 優先度付き対応戦略

1. **Critical**: セキュリティ、アクセシビリティ、型安全性
2. **High**: パフォーマンス、Google Maps最適化、UX
3. **Medium**: コード品質、保守性、テストカバレッジ
4. **Low**: スタイル、コメント、ドキュメント

### 🔧 統合プロンプト対応

ユーザーが `#番号` でプロンプト指定時：

- **#1-#6**: ファイルレベル（修正・整理・最適化・リファクタ・モダナイズ・包括改善）
- **#D1-#D6**: ディレクトリレベル（機能単位の包括対応）
- **#P1-#P6**: プロジェクトレベル（全体最適化・技術更新）

**優先度**: Critical(セキュリティ・アクセシビリティ) > High(パフォーマンス・UX) > Medium(品質) > Low(スタイル)

### 📁 ファイル配置提案

**自動配置パターン**:

- React コンポーネント → `src/components/[category]/`
- Custom Hook → `src/hooks/[category]/`
- 型定義 → `src/types/`
- ユーティリティ → `src/utils/`

### 🔧 技術リファレンス

- [React 19](https://react.dev/) - Actions API、useActionState、use() hook
- [TypeScript 5.7](https://www.typescriptlang.org/) - 最新型安全性機能
- [Google Maps Advanced Markers](https://developers.google.com/maps/documentation/javascript/advanced-markers)
- [@vis.gl/react-google-maps](https://visgl.github.io/react-google-maps/)
- [Vite 7.0](https://vitejs.dev/) - Environment API、Baseline Widely Available

### 🎯 応答スタイル

- **実用性優先**: 理論より実装可能な解決策
- **段階的改善**: 大きな変更は小分けして提案
- **シンプル志向**: 複雑さより実用性を重視
- **メンテナンス性**: 長期的に維持しやすい解決策

---

**最終更新**: 2025年9月16日
**連携ファイル**: `ai-prompts.md`, `analysis-accuracy-prompt.md`, `README.md`

> 💡 **重要**: このガイドは`ai-prompts.md`の18個のプロンプト(#1-#6, #D1-#D6, #P1-#P6)と`analysis-accuracy-prompt.md`の実装分析手法と完全連携しています。正確な実装状況分析→適切なプロンプト選択→効率的な改善実行のサイクルで開発効率を最大化してください。
