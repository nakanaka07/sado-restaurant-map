# MapView Components Directory

このディレクトリには、佐渡島レストランマップアプリケーションのメイン地図表示機能を構成するコンポーネント群が含まれています。Google Maps APIを使用したインタラクティブな地図表示を提供します。

## 📁 ディレクトリ構成

```text
src/components/map/MapView/
├── MapView.tsx              # メイン地図表示コンポーネント
├── MapContainer.tsx         # 地図コンテナコンポーネント
├── MapMarker.tsx           # 地図マーカーコンポーネント
├── MapInfoWindow.tsx       # 情報ウィンドウコンポーネント
├── MapErrorFallback.tsx    # エラーフォールバックコンポーネント
└── index.ts               # バレルエクスポート
```text

## 🗺️ コンポーネント詳細

### `MapView.tsx`

メインの地図表示コンポーネント（分割後の統合管理）

**主要機能**:

- 地図の状態管理（選択されたポイント、ローディング、エラー）
- マーカークリックイベントの処理
- Google Analytics連携（レストランクリック、地図インタラクション追跡）
- InfoWindow開閉制御

```tsx
interface MapViewProps {
  mapPoints: readonly MapPoint[];
  center: { lat: number; lng: number };
  loading: boolean;
  error?: string | null;
}

// 使用例
<MapView
  mapPoints={filteredMapPoints}
  center={SADO_CENTER}
  loading={loading}
  error={error}
/>
```text

**実装の特徴**:

- `useCallback`による最適化されたイベントハンドラー
- レストランクリック時の分析データ追跡
- ローディング・エラー状態の適切な表示

### `MapContainer.tsx`

地図コンテナの管理コンポーネント

**主要機能**:

- Google Maps APIの`Map`コンポーネント統合
- マーカーとInfoWindowの配置管理
- 地図の基本設定（中心座標、ズーム、スタイル）

```tsx
interface MapContainerProps {
  mapPoints: readonly MapPoint[];
  center: { lat: number; lng: number };
  mapId: string;
  selectedPoint: MapPoint | null;
  onMarkerClick: (point: MapPoint) => void;
  onCloseInfoWindow: () => void;
}
```text

**実装の特徴**:

- `@vis.gl/react-google-maps`ライブラリの活用
- アクセシビリティ対応（`aria-label`、`role`属性）
- レスポンシブ対応の地図コンテナ

### `MapMarker.tsx`

地図マーカーの表示コンポーネント

**主要機能**:

- Advanced Markerによる高度なマーカー表示
- ポイントタイプ別のマーカーアイコン・色分け
- マーカークリックイベントの処理

```tsx
interface MapMarkerProps {
  point: MapPoint;
  index: number;
  onClick: (point: MapPoint) => void;
}
```text

**実装の特徴**:

- `getMarkerIcon`ユーティリティによる動的アイコン設定
- `getMarkerSize`による適応的サイズ調整
- Pinコンポーネントによるカスタマイズされた外観

### `MapInfoWindow.tsx`

情報ウィンドウのコンテンツコンポーネント

**主要機能**:

- レストラン、駐車場、トイレの詳細情報表示
- ポイントタイプ別の情報レイアウト
- リッチなコンテンツ表示（画像、評価、営業時間等）

```tsx
interface MapInfoWindowProps {
  point: MapPoint;
}
```text

**表示内容**:

- **レストラン**: 名前、料理タイプ、価格帯、評価、営業時間、住所、電話番号
- **駐車場**: 名前、収容台数、料金情報、利用時間
- **トイレ**: 名前、設備情報、利用可能時間

**実装の特徴**:

- ポイントタイプに応じた動的コンテンツ生成
- レスポンシブ対応のレイアウト
- アクセシブルな情報構造

### `MapErrorFallback.tsx`

地図エラー時のフォールバック表示コンポーネント

**主要機能**:

- Google Maps API読み込み失敗時の代替表示
- ユーザーフレンドリーなエラーメッセージ
- 問題解決のための案内表示

```tsx
interface MapErrorFallbackProps {
  mapId?: string;
  error?: string | null;
}
```text

**実装の特徴**:

- 視覚的に分かりやすいエラー表示
- 具体的な解決策の提示
- アクセシブルなエラーメッセージ

## 🎯 使用方法

### 基本的なインポート

```tsx
// 統一エクスポートからのインポート
import {
  MapView,
  MapContainer,
  MapMarker,
  MapInfoWindow,
  MapErrorFallback,
} from '@/components/map/MapView';

// 個別インポート
import { MapView } from '@/components/map/MapView/MapView';
```text

### 完全な実装例

```tsx
import React, { useState, useCallback } from 'react';
import { MapView } from '@/components/map/MapView';
import { SADO_CENTER } from '@/config';
import type { MapPoint } from '@/types';

const RestaurantMapApp = () => {
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // データ取得処理
  const fetchMapData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/restaurants');
      const data = await response.json();
      setMapPoints(data);
    } catch (err) {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="map-app">
      <MapView
        mapPoints={mapPoints}
        center={SADO_CENTER}
        loading={loading}
        error={error}
      />
    </div>
  );
};
```text

### カスタムマーカーの実装

```tsx
import { MapMarker } from '@/components/map/MapView';

const CustomMapMarkers = ({ points, onMarkerClick }) => {
  return (
    <>
      {points.map((point, index) => (
        <MapMarker
          key={`${point.type}-${point.id}`}
          point={point}
          index={index}
          onClick={onMarkerClick}
        />
      ))}
    </>
  );
};
```text

## 🏗️ アーキテクチャ設計

### 1. **コンポーネント分離**

- **MapView**: 状態管理とビジネスロジック
- **MapContainer**: 地図レンダリング
- **MapMarker**: マーカー表示
- **MapInfoWindow**: 詳細情報表示
- **MapErrorFallback**: エラーハンドリング

### 2. **状態管理パターン**

```tsx
// MapView内の状態管理
const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

const handleMarkerClick = useCallback((point: MapPoint) => {
  setSelectedPoint(point);
  // Analytics tracking
  trackMapInteraction("marker_click");
}, []);
```text

### 3. **イベント処理**

- マーカークリック → 選択状態更新 → InfoWindow表示
- InfoWindow閉じる → 選択状態リセット
- 分析データの自動追跡

### 4. **エラーハンドリング**

- Google Maps API読み込み失敗の検出
- 適切なフォールバック表示
- ユーザーへの明確な案内

## 🚀 パフォーマンス最適化

### 1. **メモ化の活用**

```tsx
// イベントハンドラーのメモ化
const handleMarkerClick = useCallback((point: MapPoint) => {
  // 処理内容
}, []);

const handleCloseInfoWindow = useCallback(() => {
  setSelectedPoint(null);
}, []);
```text

### 2. **効率的なレンダリング**

```tsx
// マーカーの効率的なレンダリング
{mapPoints.map((point, index) => (
  <MapMarker
    key={`${point.type}-${point.id}-${index}`}
    point={point}
    index={index}
    onClick={handleMarkerClick}
  />
))}
```text

### 3. **遅延読み込み**

```tsx
// 地図の遅延読み込み
const LazyMapView = React.lazy(() => import('./MapView'));

// 使用時
<Suspense fallback={<MapLoadingSpinner />}>
  <LazyMapView {...props} />
</Suspense>
```text

## 📊 分析・追跡機能

### Google Analytics連携

```tsx
// レストランクリック追跡
trackRestaurantClick({
  id: restaurant.id,
  name: restaurant.name,
  category: restaurant.cuisineType,
  priceRange: restaurant.priceRange || "不明",
});

// 地図インタラクション追跡
trackMapInteraction("marker_click");
```text

### カスタム分析イベント

```tsx
// カスタムイベントの追加
const trackCustomMapEvent = (eventName: string, data: any) => {
  // 分析データの送信
  analytics.track(eventName, {
    timestamp: new Date().toISOString(),
    mapCenter: center,
    visiblePoints: mapPoints.length,
    ...data,
  });
};
```text

## 🔧 開発ガイドライン

### 新しいマップコンポーネントの追加

1. **適切な責務の分離**
2. **TypeScript型定義の追加**
3. **アクセシビリティ対応**
4. **パフォーマンス考慮**
5. **テストの作成**

### テスト方法

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MapView } from './MapView';

// Google Maps APIのモック
jest.mock('@vis.gl/react-google-maps', () => ({
  Map: ({ children }) => <div data-testid="map">{children}</div>,
  AdvancedMarker: ({ children, onClick }) => (
    <div data-testid="marker" onClick={onClick}>
      {children}
    </div>
  ),
  InfoWindow: ({ children }) => (
    <div data-testid="info-window">{children}</div>
  ),
}));

test('MapView renders markers correctly', () => {
  const mockMapPoints = [
    {
      id: '1',
      name: 'テストレストラン',
      type: 'restaurant',
      coordinates: { lat: 38.0, lng: 138.0 },
    },
  ];

  render(
    <MapView
      mapPoints={mockMapPoints}
      center={{ lat: 38.0, lng: 138.0 }}
      loading={false}
    />
  );

  expect(screen.getByTestId('map')).toBeInTheDocument();
  expect(screen.getByTestId('marker')).toBeInTheDocument();
});
```text

## 🔍 トラブルシューティング

### よくある問題

1. **地図が表示されない**
   - Google Maps APIキーの確認
   - Map IDの設定確認
   - ネットワーク接続の確認

1. **マーカーが表示されない**
   - mapPointsデータの形式確認
   - 座標値の妥当性確認
   - マーカーアイコン設定の確認

1. **InfoWindowが正しく表示されない**
   - selectedPointの状態確認
   - InfoWindowコンテンツの確認
   - CSSスタイルの確認

### デバッグ方法

```tsx
// 地図状態のデバッグ
useEffect(() => {
  console.log('MapView Debug:', {
    mapPointsCount: mapPoints.length,
    selectedPoint,
    loading,
    error,
    center,
  });
}, [mapPoints, selectedPoint, loading, error, center]);

// マーカークリックのデバッグ
const handleMarkerClick = useCallback((point: MapPoint) => {
  console.log('Marker clicked:', point);
  setSelectedPoint(point);
}, []);
```text

### 開発ツール

- **Google Maps JavaScript API**: 公式ドキュメント
- **React DevTools**: コンポーネント状態の確認
- **Chrome DevTools**: ネットワーク・コンソールの確認
