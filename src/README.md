# Sado Restaurant Map - Source Code

> 🎯 **目的**: React 19.1 + TypeScript 5.7 + Vite 7 フロントエンドアプリケーション
> **対象**: 佐渡島飲食店マップアプリケーション

## 📁 ディレクトリ構成

```text
src/
├── app/            # アプリケーションエントリーポイント
├── assets/         # 静的アセット（画像、アイコン）
├── components/     # Reactコンポーネント
├── config/         # アプリケーション設定
├── hooks/          # カスタムReactフック
├── services/       # 外部サービス統合
├── styles/         # CSS/スタイル定義
├── test/           # テストインフラ
├── types/          # TypeScript型定義
├── utils/          # ユーティリティ関数
└── vite-env.d.ts   # Vite環境変数型定義
```

## 🎯 核となる機能

- 🍽️ **Google Maps Advanced Markers**: 飲食店マップ表示
- 🏪 **店舗詳細情報**: フィルタリング・検索機能
- 📱 **PWA対応**: オフライン機能・モバイル最適化
- 🔍 **TypeScript型安全性**: 厳格な型チェック

## 🚀 使用方法

```bash
# 開発開始
pnpm run dev

# ビルド
pnpm run build

# テスト実行
pnpm run test:run
```

## 📋 環境変数設定

```bash
# 必須設定
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
VITE_GOOGLE_MAPS_MAP_ID=your_map_id

# オプション設定
VITE_GOOGLE_SHEETS_API_KEY=your_sheets_api_key
VITE_SPREADSHEET_ID=your_spreadsheet_id
```

---

**最終更新**: 2025年9月8日

## 🏗️ アーキテクチャ原則

### **Clean Architecture**

- **依存性逆転の原則**: サービス層で抽象化を通じた疎結合設計
- **関心の分離**: 各レイヤーが明確な責務を持つ
- **型安全性**: TypeScriptによる厳密な型チェック

### **セキュリティファースト**

- XSS攻撃対策とInput Sanitization
- セキュアなAPI呼び出し
- レート制限とセキュアストレージ

### **パフォーマンス最適化**

- 遅延読み込みとコード分割
- メモ化とキャッシング戦略
- TypeScript型推論の活用

## 📂 主要ディレクトリ詳細

### **app/** - アプリケーションコア

- `main.tsx`: React アプリケーションのエントリーポイント
- `App.tsx`: メインアプリケーションコンポーネント
- `App.test.tsx`: アプリケーションレベルのテスト

#### 主な機能

- Google Maps API統合
- PWA機能の初期化
- グローバル状態管理
- アクセシビリティ対応

### **components/** - UIコンポーネント

コンポーネントは機能別に整理されています：

- `common/`: 共通コンポーネント（アクセシビリティ、ユーティリティ）
- `layout/`: レイアウトコンポーネント（PWAバッジなど）
- `map/`: 地図関連コンポーネント（マップビュー、マーカーなど）
- `restaurant/`: レストラン機能コンポーネント（フィルター、詳細表示など）

#### 設計原則

- 単一責任の原則
- 再利用可能性
- アクセシビリティ対応

### **hooks/** - カスタムフック

React の状態管理とロジックを抽象化：

- `api/`: API関連フック（データフェッチング、キャッシング）
- `map/`: 地図操作フック（マーカー管理、ビューポート制御）
- `ui/`: UI状態管理フック（モーダル、フィルター状態）

#### 特徴

- 型安全なデータフェッチング
- エラーハンドリング
- パフォーマンス最適化

### **services/** - 外部サービス統合

Clean Architectureに基づく外部依存の抽象化：

- `abstractions/`: インターフェース定義（依存性逆転）
- `sheets/`: Google Sheets API統合
- エラーハンドリングと型安全なデータ変換

### **types/** - 型定義システム

TypeScriptによる包括的な型システム：

- **コア型**: `LatLngLiteral`, `SadoDistrict`, `OpeningHours`
- **ドメイン型**: `Restaurant`, `Parking`, `Toilet`, `MapPoint`
- **インターフェース型**: `IDataSource`, `IValidator`, `ICacheProvider`
- **型ガード**: ランタイム型チェックと検証

### **utils/** - ユーティリティ関数

アプリケーション全体で使用される共通機能：

- `analytics.ts`: Google Analytics 4統合
- `districtUtils.ts`: 佐渡島11地区分類システム
- `lightValidation.ts`: TypeScript型ガード（Zod代替）
- `securityUtils.ts`: セキュリティ機能

### **styles/** - スタイルシステム

CSSによるデザインシステム：

- レスポンシブデザイン
- アクセシビリティ対応
- パフォーマンス最適化

### **test/** - テストインフラストラクチャ

Vitestを使用した包括的テスト環境：

- モック実装（Google Maps API、Google Sheets API）
- React Testing Library統合
- 並列実行とカバレッジ監視

## 🔧 開発ツール統合

### **TypeScript設定**

- 厳密な型チェック
- パス解決エイリアス（`@/`）
- VS Code統合

### **Vite設定**

- 高速開発サーバー
- ホットモジュールリプレースメント
- 最適化されたビルド

### **PWA対応**

- Service Worker自動生成
- オフライン機能
- アプリインストール対応

## 🚀 使用方法

### **開発開始**

````bash
npm run dev
```text

### **ビルド**

```bash
npm run build
```text

### **テスト実行**

```bash
npm run test
```text

## 📋 環境変数設定

`vite-env.d.ts`で定義された環境変数：

```typescript
// 必須設定
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
VITE_GOOGLE_MAPS_MAP_ID=your_map_id

// オプション設定
VITE_GOOGLE_SHEETS_API_KEY=your_sheets_api_key
VITE_SPREADSHEET_ID=your_spreadsheet_id
VITE_DEBUG_MODE=true
```text

## 🎯 主要機能

### **地図機能**

- インタラクティブな佐渡島地図
- レストラン・駐車場・トイレのマーカー表示
- リアルタイムフィルタリング

### **レストラン検索**

- 料理ジャンル別フィルター
- 価格帯フィルター
- 地区別フィルター
- 営業時間表示

### **アクセシビリティ**

- スクリーンリーダー対応
- キーボードナビゲーション
- ARIA属性の適切な使用

### **パフォーマンス**

- 遅延読み込み
- 画像最適化
- キャッシング戦略

## 🔍 拡張ポイント

### **新しいマップポイントタイプの追加**

1. `types/`で新しい型を定義
2. `components/map/`でマーカーコンポーネント作成
3. `hooks/`でデータフェッチングフック追加
4. `utils/districtUtils.ts`で地区分類対応

### **新しいフィルター機能**

1. `types/`でフィルター型定義
2. `components/restaurant/`でUIコンポーネント作成
3. `hooks/ui/`で状態管理フック追加

### **外部API統合**

1. `services/abstractions/`でインターフェース定義
2. `services/`で具体実装作成
3. `test/mocks/`でモック実装追加

## 📚 ドキュメント

各ディレクトリには詳細なREADME.mdファイルがあります：

- [app/README.md](README.md) - アプリケーションコア
- [components/README.md](./components/README.md) - UIコンポーネント
- [hooks/README.md](./hooks/README.md) - カスタムフック
- [services/README.md](./services/README.md) - サービス層
- [styles/README.md](README.md) - スタイルシステム
- [test/README.md](./test/README.md) - テストインフラ
- [types/README.md](./types/README.md) - 型定義システム
- [utils/README.md](README.md) - ユーティリティ関数

## 🏆 ベストプラクティス

### **コード品質**

- ESLint + Prettier設定
- 厳密なTypeScript設定
- 包括的なテストカバレッジ

### **セキュリティ**

- Input Sanitization
- XSS攻撃対策
- セキュアなAPI呼び出し

### **パフォーマンス**

- コード分割
- 遅延読み込み
- メモ化戦略

### **アクセシビリティ**

- WCAG 2.1準拠
- セマンティックHTML
-適切なARIA属性

---

このアーキテクチャは、保守性、拡張性、パフォーマンス、セキュリティを重視した設計となっています。各レイヤーが明確な責務を持ち、疎結合な設計により将来の変更に柔軟に対応できます。
````
