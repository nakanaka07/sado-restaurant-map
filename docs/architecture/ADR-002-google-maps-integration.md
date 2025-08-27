# ADR-002: Google Maps 統合方針

## ステータス

承認済み

## コンテキスト

佐渡飲食店マップアプリケーションにおいて、地図機能は中核的な機能です。Google Maps API の統合において、以下の要件を満たす実装方針の決定が必要でした：

### 機能要件

- 飲食店位置のマーカー表示
- マーカークリック時の詳細情報表示
- 地図の操作（ズーム、パン、回転）
- モバイル端末での最適化されたタッチ操作
- 複数の地点の効率的な表示

### 技術要件

- React との効率的な統合
- TypeScript 型安全性の確保
- パフォーマンスの最適化
- API 使用量の効率化
- レスポンシブ対応

## 決定

### 採用技術

- **@vis.gl/react-google-maps v1.5**: React 統合ライブラリ
- **Google Maps JavaScript API**: 地図表示 API
- **Advanced Markers**: 最新のマーカー機能

### 実装方針

#### 1. コンポーネント設計

```typescript
// MapView: メインマップコンポーネント
// MapMarker: 個別マーカーコンポーネント
// MapInfoWindow: 情報ウィンドウコンポーネント
```

#### 2. 状態管理

- マーカー選択状態: ローカル state
- 地図表示設定: Context API
- 飲食店データ: カスタム Hook

#### 3. パフォーマンス最適化

- マーカーのメモ化（React.memo）
- 地図コンポーネントの遅延読み込み
- API 呼び出しの最適化

## 結果

### 利点

1. **開発効率**: React 専用ライブラリによる効率的な開発
2. **型安全性**: TypeScript 完全対応
3. **最新機能**: Advanced Markers による高度な表示
4. **パフォーマンス**: 最適化されたレンダリング

### 制約

1. **API 依存**: Google Maps API の制限に依存
2. **ライセンス**: API 使用量による課金
3. **ネットワーク**: オンライン環境必須

## 代替案

### 検討した他の選択肢

#### 1. react-google-maps/api

**利点**: 成熟したライブラリ、豊富な機能
**欠点**: TypeScript 対応が不完全、開発停滞

#### 2. Leaflet + React-Leaflet

**利点**: オープンソース、カスタマイズ性高
**欠点**: Google Maps との機能差、デザイン統一性

#### 3. Mapbox GL JS

**利点**: 高性能、カスタマイズ性
**欠点**: Google Maps との親和性、学習コスト

## 実装詳細

### 環境変数設定

```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key
VITE_GOOGLE_MAPS_MAP_ID=your_map_id
```

### 基本設定

```typescript
const mapConfig = {
  defaultCenter: { lat: 38.0186, lng: 138.3669 }, // 佐渡島中心
  defaultZoom: 10,
  mapId: process.env.VITE_GOOGLE_MAPS_MAP_ID,
  gestureHandling: "cooperative",
  disableDefaultUI: false,
};
```

### セキュリティ対策

- API キーの環境変数管理
- HTTPS での通信
- API キーの制限設定（ドメイン・API 制限）

---

**日付**: 2025 年 8 月 27 日
**決定者**: プロジェクトチーム
**関連**: ADR-001（フロントエンド技術選定）
