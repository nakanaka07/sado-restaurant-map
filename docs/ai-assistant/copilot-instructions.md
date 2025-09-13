# GitHub Copilot Instructions

> 🎯 **目的**: React 19 + TypeScript 5.7 + Vite 7 プロジェクト向けの統合開発支援
> **プロジェクト**: 佐渡飲食店マップアプリケーション（個人開発・GitHub Pages）
> **技術スタック**: React 19, TypeScript 5.7, Vite 7, Google Maps Advanced Markers, PWA

## 🏗️ プロジェクト概要

このプロジェクトは佐渡島の飲食店を紹介する React ベースのマップアプリケーションです。

### 主要技術 (2025年9月14日現在)

- **フロントエンド**: React 19.1.1 + TypeScript 5.7.3 + Vite 7.1.4
- **地図機能**: Google Maps Advanced Markers API + @vis.gl/react-google-maps v1.5.5
- **スタイリング**: CSS Modules + レスポンシブデザイン + Container Queries
- **テスト**: Vitest 3.2.3 + Testing Library + MSW (モック)
- **PWA**: Service Worker + Manifest v3 + vite-plugin-pwa v0.21
- **パッケージ管理**: pnpm v9.x (workspace対応)
- **品質保証**: ESLint 9.x + Prettier 3.x + TypeScript strict mode
- **デプロイ**: GitHub Pages + GitHub Actions (自動デプロイ)

### 🚀 最新技術特徴 (2025年対応)

- **React 19新機能**: Actions API, useActionState, useOptimistic, use() hook
- **TypeScript 5.7**: 改良された型推論、enum安全性パターン
- **Vite 7**: Environment API (実験的)、Baseline Widely Available対応
- **Modern Web**: Core Web Vitals 2025基準、PWA Manifest v3準拠

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

#### 🔒 厳格な型システム活用

- **any型完全排除**: `unknown` → 型ガード → 安全な型使用
- **enum一貫使用パターン**: enum定義後は文字列リテラルを使用禁止
- **実装・テスト同期**: enum/型変更時はテスト期待値も必ず同期更新
- **Generic活用**: `<T>` で再利用性・型安全性を両立
- **Union Types**: `|` で明確な型選択肢を定義

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

#### 🚀 Actions API 活用

```typescript
// useActionState でフォーム処理
const [error, submitAction, isPending] = useActionState(async (previousState: string | null, formData: FormData) => {
  const result = await updateRestaurant(formData);
  if (result.error) return result.error;
  return null;
}, null);

// useOptimistic で楽観的更新
const [optimisticRestaurants, setOptimisticRestaurants] = useOptimistic(restaurants, (state, newRestaurant) => [
  ...state,
  newRestaurant,
]);
```

#### 📋 use() hook パターン

```typescript
// Promise処理の効率化
function RestaurantList({ restaurantPromise }: { restaurantPromise: Promise<Restaurant[]> }) {
  const restaurants = use(restaurantPromise);
  return <RestaurantGrid restaurants={restaurants} />;
}

// Context処理の簡素化
function MapComponent() {
  const mapConfig = use(MapConfigContext);
  return <GoogleMap config={mapConfig} />;
}
```

#### 🔗 ref as prop パターン

```typescript
// forwardRef不要の新パターン
interface MapMarkerProps {
  position: google.maps.LatLngLiteral;
  ref?: React.Ref<HTMLDivElement>;
}

function MapMarker({ position, ref, ...props }: MapMarkerProps) {
  return <AdvancedMarker ref={ref} position={position} {...props} />;
}
```

#### 📝 Document Metadata 直接レンダリング

```typescript
function RestaurantDetail({ restaurant }: { restaurant: Restaurant }) {
  return (
    <>
      <title>{restaurant.name} - 佐渡飲食店マップ</title>
      <meta name="description" content={restaurant.description} />
      <link rel="canonical" href={`/restaurant/${restaurant.id}`} />

      <RestaurantInfo restaurant={restaurant} />
    </>
  );
}
```

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

### 自動的な対応機能

#### 🔍 実装状況分析機能

```text
正確な実装分析のための自動チェック:

1. ファイル存在・サイズ確認 (list_dir, file_search)
2. 実装内容詳細確認 (read_file - メソッド・クラス定義)
3. 横断的パターン確認 (grep_search - TODO/FIXME/enum使用)
4. 依存関係・テスト統合性確認
5. 定量的進捗率算出 (ドキュメント依存禁止)

analysis-accuracy-prompt.md の指針に完全準拠。
```

#### 🔧 コード品質向上自動化

- **TypeScript 5.7 型エラー自動検出**: 型安全性問題の特定・修正提案
- **enum一貫性チェック**: 文字列リテラル使用・テスト同期の自動検出
- **未使用コード自動特定**: import/変数/関数の未使用箇所削除提案
- **React 19新機能適用提案**: Actions API、use() hookの活用機会特定
- **パフォーマンス改善自動提案**: メモ化、遅延読み込み等の最適化

#### 🗺️ Google Maps Advanced Markers 特化支援

```typescript
// 自動提案パターン
// 1. Advanced Markers への移行サポート
import { AdvancedMarker } from '@vis.gl/react-google-maps';

// 2. カスタムHTML/CSSマーカー実装支援
const CustomMarker = ({ restaurant }: { restaurant: Restaurant }) => (
  <AdvancedMarker position={restaurant.position}>
    <div className="custom-marker">
      <img src={restaurant.icon} alt={restaurant.name} />
      <span>{restaurant.category}</span>
    </div>
  </AdvancedMarker>
);

// 3. API使用量最適化の提案
- マーカークラスタリング実装
- 地図状態のメモ化・キャッシュ戦略
- 3D altitude制御・ドラッグ機能の効率的実装
```

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

### 📁 ファイル配置・構造的提案機能

#### コードファイル自動配置ロジック

```text
ファイル種別別自動配置提案:

新規Reactコンポーネント:
→ src/components/[category]/
  例: MapView.tsx → src/components/map/

Custom Hook:
→ src/hooks/[category]/
  例: useRestaurantData.ts → src/hooks/api/

ユーティリティ関数:
→ src/utils/
  例: formatAddress.ts, mapHelpers.ts

型定義:
→ src/types/
  例: restaurant.types.ts, map.types.ts

サービスレイヤー:
→ src/services/
  例: googleMapsApi.ts, dataProcessor.ts
```

#### スマートディレクトリ推定機能

```text
ファイル名・機能からの自動配置先推定:

パターンマッチング:
- *Map*.tsx → src/components/map/
- *Restaurant*.tsx → src/components/restaurant/
- use*.ts → src/hooks/
- *.types.ts → src/types/
- *.constants.ts → src/config/
- *.test.ts → src/test/ (または同階層)

機能ベースの推定:
- Google Maps関連 → map/
- フォーム処理 → common/ または forms/
- レイアウト → layout/
- 設定・定数 → config/
```

#### 📝 実用的ドキュメント管理原則

```text
30秒理解原則・実行可能情報優先:

README.md 作成基準:
✅ 作成推奨:
- 複雑な設定・環境変数が必要
- 外部API・ライブラリとの統合
- 複数ファイルで構成される機能
- 使用方法が自明でない

❌ 作成不要:
- 単純な関数・コンポーネント
- ファイル名から機能が明確
- 設定ファイルのみのディレクトリ

情報重複回避・一元化:
- 同一内容の複数配置を回避
- 中央集中型ドキュメントで情報管理
- 相互参照で情報の一貫性確保
```

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

## 📂 計画書管理体系

### ディレクトリ構成

```
docs/planning/
├── project-completion-status.md  # 中央管理ドキュメント
├── README.md                     # ナビゲーション・概要
├── 完了済み計画書/               # 実装完了済みの計画
├── 進行中計画書/                 # 現在実装中の計画
└── 将来計画書/                   # 未着手・将来実装予定
```

### 自動配置ルール

新しい計画書作成時は **実装状況に基づいて適切なディレクトリに配置**：

- **完了済み計画書/**: 実装・テスト完了、実際に稼働中
- **進行中計画書/**: 現在開発中、部分実装済み
- **将来計画書/**: アイデア段階、未着手、検討中

---

**最終更新**: 2025年9月14日
**連携ファイル**: `ai-prompts.md`, `analysis-accuracy-prompt.md`

> 💡 **重要**: このガイドは`ai-prompts.md`の18個のプロンプト(#1-#6, #D1-#D6, #P1-#P6)と`analysis-accuracy-prompt.md`の実装分析手法と完全連携しています。正確な実装状況分析→適切なプロンプト選択→効率的な改善実行のサイクルで開発効率を最大化してください。

```

**最終更新**: 2025 年 9 月 8 日
**連携ファイル**: `ai-prompts.md` (同ディレクトリ)
```
