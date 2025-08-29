# src/hooks/map - 地図関連フック

佐渡島レストランマップアプリケーションの地図機能に特化したカスタムフック群を管理するディレクトリです。地図上のポイント管理、座標計算、地理的データ処理を担当します。

## 📁 ディレクトリ構成

```text
src/hooks/map/
├── index.ts                    # バレルエクスポート
├── useMapPoints.ts            # 地図ポイント統合管理フック
└── useMapPoints.test.ts       # useMapPointsテストファイル
```text

## 🎯 概要

このディレクトリは、Google Maps APIと連携した地図機能に関するフック群を提供します。レストラン、駐車場、トイレなどの地図上のポイントを統合的に管理し、効率的な地理的データ処理を実現します。

### 主要な責務

- **地図ポイント統合管理**: レストラン、駐車場、トイレの統一的な管理
- **地理的データ処理**: 座標計算、距離測定、範囲フィルタリング
- **リアルタイム更新**: 地図表示の動的更新とパフォーマンス最適化
- **状態管理**: 非同期データの効率的な状態管理
- **キャッシュ戦略**: 地理的データの効果的なキャッシュ

## 🔧 主要フック

### useMapPoints

地図上のすべてのポイント（レストラン、駐車場、トイレ）を統合管理するメインフックです。

#### 基本的な使用方法

```typescript
import { useMapPoints } from '@/hooks/map';

function MapComponent() {
  const {
    mapPoints,
    loading,
    error,
    refreshMapPoints
  } = useMapPoints();

  if (loading) return <div>地図データ読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;

  return (
    <GoogleMap>
      {mapPoints.map(point => (
        <MapMarker
          key={point.id}
          position={point.coordinates}
          type={point.type}
          data={point}
        />
      ))}
    </GoogleMap>
  );
}
```text

#### フィルタリング付きの使用

```typescript
function FilteredMapView() {
  const { mapPoints, loading, error } = useMapPoints();

  // レストランのみフィルタリング
  const restaurants = useMemo(() => 
    mapPoints.filter(point => point.type === 'restaurant'),
    [mapPoints]
  );

  // 駐車場のみフィルタリング
  const parkingLots = useMemo(() => 
    mapPoints.filter(point => point.type === 'parking'),
    [mapPoints]
  );

  return (
    <div>
      <LayerControls>
        <LayerToggle label="レストラン" points={restaurants} />
        <LayerToggle label="駐車場" points={parkingLots} />
      </LayerControls>
      
      <GoogleMap>
        {mapPoints.map(point => (
          <MapMarker key={point.id} point={point} />
        ))}
      </GoogleMap>
    </div>
  );
}
```text

## 📊 型定義

### MapPoint

```typescript
interface MapPoint {
  id: string;
  type: 'restaurant' | 'parking' | 'toilet';
  name: string;
  description?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address?: string;
  lastUpdated: string;
  
  // レストラン固有のプロパティ
  cuisineType?: CuisineType;
  priceRange?: PriceRange;
  district?: District;
  openingHours?: OpeningHours[];
  features?: Feature[];
  rating?: number;
  
  // 駐車場固有のプロパティ
  capacity?: number;
  hourlyRate?: number;
  available24h?: boolean;
  
  // トイレ固有のプロパティ
  accessible?: boolean;
  babyChanging?: boolean;
}
```text

### UseMapPointsResult

```typescript
interface UseMapPointsResult {
  mapPoints: MapPoint[];
  loading: boolean;
  error: Error | null;
  refreshMapPoints: () => Promise<void>;
}
```text

## 🏗️ アーキテクチャ

### データフロー

```text
Google Sheets API → useMapPoints → 統合処理 → 地理的フィルタリング → UI
                                ↓
                          ローカルキャッシュ
```text

### 統合処理パターン

```typescript
const fetchAllMapPoints = async (): Promise<MapPoint[]> => {
  const [restaurants, parkingLots, toilets] = await Promise.all([
    fetchRestaurants(),
    fetchParkingLots(),
    fetchToilets()
  ]);

  const allPoints: MapPoint[] = [
    ...restaurants.map(r => convertToMapPoint(r, 'restaurant')),
    ...parkingLots.map(p => convertToMapPoint(p, 'parking')),
    ...toilets.map(t => convertToMapPoint(t, 'toilet'))
  ];

  return allPoints.sort((a, b) => {
    if (a.coordinates.lat !== b.coordinates.lat) {
      return a.coordinates.lat - b.coordinates.lat;
    }
    return a.coordinates.lng - b.coordinates.lng;
  });
};
```text

### 地理的計算ユーティリティ

```typescript
// ハバーサイン公式による距離計算
export const calculateDistance = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number => {
  const R = 6371; // 地球の半径（km）
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 最寄りポイント検索
export const findNearestPoints = (
  targetPoint: { lat: number; lng: number },
  points: MapPoint[],
  limit: number = 5
): Array<MapPoint & { distance: number }> => {
  return points
    .map(point => ({
      ...point,
      distance: calculateDistance(targetPoint, point.coordinates)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};
```text

## 🧪 テスト

### テスト戦略

#### 1. 基本機能テスト

```typescript
describe('useMapPoints - 基本機能', () => {
  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useMapPoints());
    
    expect(result.current.mapPoints).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('地図ポイントを正常に取得する', async () => {
    const mockPoints = [
      createMockMapPoint('restaurant'),
      createMockMapPoint('parking')
    ];
    vi.mocked(fetchAllMapPoints).mockResolvedValue(mockPoints);

    const { result } = renderHook(() => useMapPoints());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.mapPoints).toEqual(mockPoints);
  });
});
```text

#### 2. 地理的計算テスト

```typescript
describe('地理的計算ユーティリティ', () => {
  it('距離計算が正確に動作する', () => {
    const point1 = { lat: 38.0, lng: 138.0 };
    const point2 = { lat: 38.1, lng: 138.1 };
    
    const distance = calculateDistance(point1, point2);
    
    expect(distance).toBeCloseTo(13.89, 1);
  });

  it('最寄りポイント検索が正常に動作する', () => {
    const target = { lat: 38.0, lng: 138.0 };
    const points = [
      createMockMapPoint('restaurant', { lat: 38.01, lng: 138.01 }),
      createMockMapPoint('parking', { lat: 38.1, lng: 138.1 })
    ];
    
    const nearest = findNearestPoints(target, points, 1);
    
    expect(nearest).toHaveLength(1);
    expect(nearest[0].type).toBe('restaurant');
  });
});
```text

### テスト実行

```bash
# 単体テスト実行
npm run test src/hooks/map

# カバレッジ付きテスト
npm run test:coverage src/hooks/map

# ウォッチモード
npm run test:watch src/hooks/map
```text

## 🚀 開発ガイドライン

### 新しい地図フックの追加

#### 1. フックファイル作成

```typescript
// src/hooks/map/useMapRegions.ts
import { useState, useEffect, useCallback } from 'react';

interface MapRegion {
  id: string;
  name: string;
  bounds: GeographicBounds;
  center: { lat: number; lng: number };
}

export function useMapRegions() {
  const [regions, setRegions] = useState<MapRegion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegions = useCallback(async () => {
    try {
      const data = await fetchMapRegions();
      setRegions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  return { regions, loading, refreshRegions: fetchRegions };
}
```text

#### 2. バレルエクスポート更新

```typescript
// src/hooks/map/index.ts
export { useMapPoints } from "./useMapPoints";
export { useMapRegions } from "./useMapRegions";
```text

### パフォーマンス最適化

#### 1. 地理的データの効率的処理

```typescript
// 空間インデックスの活用
const createSpatialIndex = (points: MapPoint[]) => {
  const index = new Map<string, MapPoint[]>();
  
  points.forEach(point => {
    const gridKey = `${Math.floor(point.coordinates.lat * 100)}_${Math.floor(point.coordinates.lng * 100)}`;
    if (!index.has(gridKey)) {
      index.set(gridKey, []);
    }
    index.get(gridKey)!.push(point);
  });
  
  return index;
};
```text

#### 2. メモ化とキャッシュ

```typescript
// 計算結果のメモ化
const memoizedCalculateDistance = useMemo(() => {
  const cache = new Map<string, number>();
  
  return (point1: Coordinates, point2: Coordinates) => {
    const key = `${point1.lat},${point1.lng}-${point2.lat},${point2.lng}`;
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const distance = calculateDistance(point1, point2);
    cache.set(key, distance);
    return distance;
  };
}, []);
```text

## 🔍 トラブルシューティング

### よくある問題と解決方法

#### 1. 地図ポイントが表示されない

**症状**: 地図上にマーカーが表示されない

**解決方法**:

```typescript
// 座標の妥当性チェック
const validateCoordinates = (coords: { lat: number; lng: number }) => {
  const { lat, lng } = coords;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

const validPoints = mapPoints.filter(point => 
  validateCoordinates(point.coordinates)
);
```text

#### 2. パフォーマンスの問題

**症状**: 大量のポイントで地図が重くなる

**解決方法**:

```typescript
// 表示範囲によるフィルタリング
const useVisiblePoints = (mapPoints: MapPoint[], bounds: GeographicBounds) => {
  return useMemo(() => {
    return filterPointsInBounds(mapPoints, bounds);
  }, [mapPoints, bounds]);
};
```text

#### 3. 距離計算の精度問題

**症状**: 距離計算が不正確

**解決方法**:

```typescript
// 正確なハバーサイン公式の実装
const calculateDistanceAccurate = (point1: Coordinates, point2: Coordinates) => {
  const R = 6371; // 地球の半径（km）
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
```text

## 📈 パフォーマンス監視

### メトリクス

- **データ取得時間**: 地図ポイントの読み込み時間
- **フィルタリング時間**: 大量データでの処理時間
- **距離計算時間**: 地理的計算の効率性
- **レンダリング時間**: マーカー表示の最適化

### 監視コード例

```typescript
const useMapPerformance = () => {
  const measureTime = (label: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${label}: ${(end - start).toFixed(2)}ms`);
  };

  return { measureTime };
};
```text

## 🚀 今後の改善予定

### 短期的な改善

- [ ] クラスタリング機能の追加
- [ ] リアルタイム位置追跡
- [ ] オフライン地図対応

### 中期的な改善

- [ ] 高度な空間検索機能
- [ ] 地図レイヤー管理
- [ ] ルート検索統合

### 長期的な改善

- [ ] AI による最適ルート提案
- [ ] AR機能統合
- [ ] 3D地図表示

## 📚 関連ドキュメント

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [React 19 ドキュメント](https://react.dev/)
- [地理空間データ処理](https://en.wikipedia.org/wiki/Geographic_information_system)
- [ハバーサイン公式](https://en.wikipedia.org/wiki/Haversine_formula)

## 🔗 関連ファイル

- `src/hooks/README.md` - フック全体の概要
- `src/hooks/api/README.md` - API関連フック
- `src/hooks/ui/README.md` - UI関連フック
- `src/components/map/README.md` - 地図コンポーネント
- `src/services/sheets.ts` - Google Sheets API サービス
