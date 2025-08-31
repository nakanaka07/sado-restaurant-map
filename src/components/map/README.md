# Map Components

> 🎯 **目的**: Google Maps API を使用した地図表示・マーカー管理・情報ウィンドウ表示
> **対象**: 地図機能を実装・保守する開発者
> **最終更新**: 2025 年 8 月 30 日

## 🔧 主要コンポーネント

| コンポーネント    | 用途                                               | 推奨度      |
| ----------------- | -------------------------------------------------- | ----------- |
| **MapView**       | 多様なポイントタイプ（レストラン・駐車場・トイレ） | ✅ 推奨     |
| **RestaurantMap** | レストラン専用表示                                 | 🔶 レガシー |

## 🚀 基本的な使用方法

### MapView (推奨)

```tsx
import { MapView } from "@/components/map";

const points: MapPoint[] = [
  {
    id: "restaurant-1",
    name: "佐渡の味処",
    type: "restaurant",
    coordinates: { lat: 38.0186, lng: 138.3669 },
    cuisineType: "日本料理",
    priceRange: "2000-3000円",
  },
];

<MapView
  points={points}
  center={{ lat: 38.0186, lng: 138.3669 }}
  loading={false}
/>;
```

### RestaurantMap (レガシー)

```tsx
import { RestaurantMap } from "@/components/map";

<RestaurantMap
  restaurants={restaurants}
  center={{ lat: 38.0186, lng: 138.3669 }}
  loading={false}
/>;
```

## 🛠️ ユーティリティ関数

```tsx
import {
  getMarkerColorByCuisine,
  getMarkerSizeByPrice,
  getMarkerConfig,
} from "@/components/map/utils";

// 料理ジャンル別の色
const color = getMarkerColorByCuisine("日本料理"); // "#ef4444"

// 価格帯別のサイズ
const size = getMarkerSizeByPrice("2000-3000円"); // 40
```

## 🔍 トラブルシューティング

- **地図が表示されない**: 環境変数 `VITE_GOOGLE_MAPS_MAP_ID`、`VITE_GOOGLE_MAPS_API_KEY` を確認
- **マーカーが表示されない**: レストランデータの `coordinates` プロパティを確認
- **情報ウィンドウが開かない**: イベントハンドラーの登録を確認

## 📚 関連ドキュメント

- [Google Maps API ドキュメント](https://developers.google.com/maps/documentation)
- [React Google Maps ライブラリ](https://visgl.github.io/react-google-maps/)

---

**技術スタック**: React 19.1、@vis.gl/react-google-maps v2.0、TypeScript 5.7

## 📁 ディレクトリ構成

````text
src/components/map/
├── MapView/                    # 高度な地図表示コンポーネント群
│   ├── MapView.tsx            # メイン地図ビューコンポーネント
│   ├── MapContainer.tsx       # 地図コンテナ
│   ├── MapMarker.tsx          # マーカーコンポーネント
│   ├── MapInfoWindow.tsx      # 情報ウィンドウ
│   ├── MapErrorFallback.tsx   # エラーフォールバック
│   ├── index.ts               # バレルエクスポート
│   └── README.md              # MapView詳細ドキュメント
├── utils/                     # マーカーユーティリティ
│   ├── markerUtils.ts         # マーカー関連ユーティリティ関数
│   ├── index.ts               # バレルエクスポート
│   └── README.md              # Utils詳細ドキュメント
├── RestaurantMap.tsx          # シンプルなレストラン地図コンポーネント
├── RestaurantMap.test.tsx     # テストファイル
├── index.ts                   # ディレクトリのバレルエクスポート
└── README.md                  # このファイル
```text

## 🎯 主要コンポーネント

### 1. **MapView** (推奨)

高度な機能を持つ地図表示コンポーネント群。複数のポイントタイプ（レストラン、駐車場、トイレ）をサポートし、アクセシビリティ、エラーハンドリング、パフォーマンス最適化が組み込まれています。

- **用途**: メインアプリケーションでの地図表示
- **特徴**: 多様なポイントタイプ、アクセシビリティ対応、エラーハンドリング

### 2. **RestaurantMap** (レガシー)

シンプルなレストラン専用地図コンポーネント。基本的な地図表示とレストラン情報の表示に特化しています。

- **用途**: レストランのみの表示が必要な場合
- **特徴**: シンプルな実装、レストラン特化
- **推奨**: 新規開発では `MapView` を使用

## 🔧 RestaurantMap コンポーネント

### 概要

レストラン情報の地図表示に特化したシンプルなコンポーネントです。Google Maps APIを使用してレストランの位置をマーカーで表示し、クリック時に詳細情報を表示します。

### Props インターフェース

```typescript
interface RestaurantMapProps {
  restaurants: readonly Restaurant[];  // 表示するレストランリスト
  center: { lat: number; lng: number }; // 地図の中心座標
  loading: boolean;                     // ローディング状態
  error?: string | null;                // エラーメッセージ（オプション）
}
```text

### 基本的な使用方法

```tsx
import { RestaurantMap } from '@/components/map';
import type { Restaurant } from '@/types';

const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "佐渡の味処",
    cuisineType: "日本料理",
    coordinates: { lat: 38.0186, lng: 138.3669 },
    address: "新潟県佐渡市両津夷269-1",
    priceRange: "2000-3000円",
    phone: "0259-27-5151",
    rating: 4.2,
    reviewCount: 45,
    description: "新鮮な海の幸を使った伝統的な日本料理店"
  },
  // ... その他のレストラン
];

const MapPage = () => {
  const [loading, setLoading] = useState(false);

  return (
    <RestaurantMap
      restaurants={restaurants}
      center={{ lat: 38.0186, lng: 138.3669 }}
      loading={loading}
    />
  );
};
```text

### 主な機能

#### 1. **マーカー表示**

- 料理ジャンル別の色分け（`getMarkerColorByCuisine`）
- 価格帯別のサイズ調整（`getMarkerSizeByPrice`）
- クリック可能なインタラクティブマーカー

#### 2. **情報ウィンドウ**

- レストラン名と基本情報
- 料理ジャンルと価格帯のバッジ表示
- 住所、電話番号、評価の表示
- 説明文とWebサイトリンク（利用可能な場合）

#### 3. **状態管理**

- ローディング状態の表示
- エラーハンドリング（Map ID未設定など）
- 選択されたレストランの管理

#### 4. **アナリティクス統合**

- レストランクリックの追跡
- 地図操作の追跡

### スタイリング

```tsx
// 地図コンテナのスタイル
const mapContainerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  border: "1px solid #e0e0e0",
};

// 情報ウィンドウのスタイル
const infoWindowStyle = {
  padding: "16px",
  minWidth: "300px",
  maxWidth: "400px",
};
```text

## 🛠️ ユーティリティ関数

### マーカーユーティリティ

地図マーカーの外観を決定するユーティリティ関数群：

```typescript
import {
  getMarkerColorByCuisine,
  getMarkerSizeByPrice,
  getMarkerIcon,
  getMarkerSize,
  getMarkerConfig,
} from '@/components/map/utils';

// 料理ジャンル別の色取得
const color = getMarkerColorByCuisine("日本料理"); // "#ef4444"

// 価格帯別のサイズ取得
const size = getMarkerSizeByPrice("2000-3000円"); // 40

// 統合されたマーカー設定
const config = getMarkerConfig(restaurant);
```text

詳細は [`utils/README.md`](README.md) を参照してください。

## 🎨 使用方法

### 基本的なインポート

```typescript
// 推奨: MapViewを使用
import { MapView } from '@/components/map';

// レガシー: RestaurantMapを使用
import { RestaurantMap } from '@/components/map';

// ユーティリティ関数
import { getMarkerColorByCuisine, getMarkerSizeByPrice } from '@/components/map/utils';
```text

### MapView の使用（推奨）

```tsx
import { MapView } from '@/components/map';
import type { MapPoint } from '@/types';

const points: MapPoint[] = [
  // レストラン
  {
    id: "restaurant-1",
    name: "佐渡の味処",
    type: "restaurant",
    coordinates: { lat: 38.0186, lng: 138.3669 },
    cuisineType: "日本料理",
    priceRange: "2000-3000円",
    // ... その他のプロパティ
  },
  // 駐車場
  {
    id: "parking-1",
    name: "両津港駐車場",
    type: "parking",
    coordinates: { lat: 38.0200, lng: 138.3700 },
    // ... その他のプロパティ
  },
  // トイレ
  {
    id: "toilet-1",
    name: "両津港公衆トイレ",
    type: "toilet",
    coordinates: { lat: 38.0190, lng: 138.3680 },
    // ... その他のプロパティ
  },
];

const MapPage = () => {
  return (
    <MapView
      points={points}
      center={{ lat: 38.0186, lng: 138.3669 }}
      loading={false}
    />
  );
};
```text

### RestaurantMap の使用（レガシー）

```tsx
import { RestaurantMap } from '@/components/map';
import type { Restaurant } from '@/types';

const restaurants: Restaurant[] = [
  // レストランデータ
];

const RestaurantPage = () => {
  return (
    <RestaurantMap
      restaurants={restaurants}
      center={{ lat: 38.0186, lng: 138.3669 }}
      loading={false}
    />
  );
};
```text

## 🏗️ アーキテクチャ原則

### 設計原則

1. **コンポーネント分離**
   - 表示ロジックとビジネスロジックの分離
   - 再利用可能なコンポーネント設計
   - 単一責任の原則

2. **型安全性**
   - TypeScriptによる厳密な型定義
   - Props インターフェースの明確化
   - ランタイムエラーの最小化

3. **パフォーマンス**
   - `useCallback` によるイベントハンドラーの最適化
   - 不要な再レンダリングの防止
   - 効率的な状態管理

### 依存関係

#### 外部ライブラリ

- `@vis.gl/react-google-maps`: Google Maps React コンポーネント
- `react`: UI ライブラリ
- `typescript`: 型安全性

#### 内部依存

- `@/types`: 型定義
- `@/utils/analytics`: アナリティクス機能
- `@/components/map/utils`: マーカーユーティリティ

### データフロー

```text
App Component
    ↓ (restaurants, loading, error)
RestaurantMap / MapView
    ↓ (marker click)
Analytics Tracking
    ↓ (selected restaurant)
InfoWindow Display
```text

## 🔧 開発ガイドライン

### 新しいマップコンポーネントの追加

1. **コンポーネント作成**

```typescript
// NewMapComponent.tsx
import type { MapPoint } from '@/types';

interface NewMapComponentProps {
  points: MapPoint[];
  // その他のprops
}

export const NewMapComponent = ({ points }: NewMapComponentProps) => {
  // 実装
};
```text

1. **エクスポートの追加**

```typescript
// index.ts
export { NewMapComponent } from './NewMapComponent';
```text

1. **テストの作成**

```typescript
// NewMapComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { NewMapComponent } from './NewMapComponent';

describe('NewMapComponent', () => {
  test('renders correctly', () => {
    // テスト実装
  });
});
```text

### カスタムマーカーの追加

1. **マーカーユーティリティの拡張**

```typescript
// utils/markerUtils.ts
export const getCustomMarkerIcon = (customType: string) => {
  switch (customType) {
    case 'hotel':
      return { background: '#9c27b0', glyph: '🏨' };
    // その他のケース
  }
};
```text

1. **コンポーネントでの使用**

```tsx
import { getCustomMarkerIcon } from '@/components/map/utils';

const CustomMarker = ({ point }) => {
  const { background, glyph } = getCustomMarkerIcon(point.customType);
  // マーカーレンダリング
};
```text

## 🧪 テスト

### テスト構成

- **Unit Tests**: 個別コンポーネントのテスト
- **Integration Tests**: コンポーネント間の連携テスト
- **E2E Tests**: 地図操作の統合テスト

### テスト実行

```bash
# 全テスト実行
npm test

# 地図コンポーネントのテストのみ
npm test -- --testPathPattern=map

# カバレッジ付きテスト
npm test -- --coverage
```text

### テスト例

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { RestaurantMap } from './RestaurantMap';
import type { Restaurant } from '@/types';

const mockRestaurants: Restaurant[] = [
  {
    id: "1",
    name: "テストレストラン",
    cuisineType: "日本料理",
    coordinates: { lat: 38.0186, lng: 138.3669 },
    address: "テスト住所",
    priceRange: "1000-2000円",
  },
];

describe('RestaurantMap', () => {
  test('displays restaurants on map', () => {
    render(
      <RestaurantMap
        restaurants={mockRestaurants}
        center={{ lat: 38.0186, lng: 138.3669 }}
        loading={false}
      />
    );

    expect(screen.getByTitle('テストレストラン')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    render(
      <RestaurantMap
        restaurants={[]}
        center={{ lat: 38.0186, lng: 138.3669 }}
        loading={true}
      />
    );

    expect(screen.getByText('🗺️ 地図を読み込み中...')).toBeInTheDocument();
  });
});
```text

## 🔍 トラブルシューティング

### よくある問題

1. **地図が表示されない**

   ```typescript
   // 環境変数の確認
   console.log('Map ID:', import.meta.env.VITE_GOOGLE_MAPS_MAP_ID);
   console.log('API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
````

- Google Maps API キーの設定確認
- Map ID の設定確認
- API の有効化確認

1. **マーカーが表示されない**

   ```typescript
   // データの確認
   console.log("Restaurants:", restaurants);
   console.log(
     "Coordinates:",
     restaurants.map((r) => r.coordinates)
   );
   ```

   - レストランデータの形式確認
   - 座標データの妥当性確認
   - マーカーユーティリティの動作確認

1. **情報ウィンドウが開かない**

   ```typescript
   // イベントハンドラーの確認
   const handleMarkerClick = useCallback((restaurant: Restaurant) => {
     console.log("Marker clicked:", restaurant);
     setSelectedRestaurant(restaurant);
   }, []);
   ```

   - イベントハンドラーの登録確認
   - 状態更新の確認
   - React DevTools での状態確認

### デバッグ方法

````typescript
// デバッグ用のログ出力
const debugMapComponent = () => {
  console.log('Map Debug Info:', {
    restaurantsCount: restaurants.length,
    center: center,
    loading: loading,
    selectedRestaurant: selectedRestaurant,
    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
  });
};

// パフォーマンス監視
const measureMapPerformance = () => {
  console.time('Map Render');
  // レンダリング処理
  console.timeEnd('Map Render');
};
```text

### パフォーマンス最適化

```typescript
// メモ化による最適化
const memoizedMarkers = useMemo(() => {
  return restaurants.map(restaurant => ({
    ...restaurant,
    markerColor: getMarkerColorByCuisine(restaurant.cuisineType),
    markerSize: getMarkerSizeByPrice(restaurant.priceRange),
  }));
}, [restaurants]);

// コールバックの最適化
const handleMarkerClick = useCallback((restaurant: Restaurant) => {
  setSelectedRestaurant(restaurant);
  trackRestaurantClick(restaurant);
}, []);
```text

## 🚀 今後の改善予定

### 短期的な改善

- [ ] マーカークラスタリング機能の追加
- [ ] カスタムマップスタイルの対応
- [ ] オフライン地図の対応

### 長期的な改善

- [ ] 3D地図表示の対応
- [ ] AR機能との連携
- [ ] リアルタイム位置情報の統合

## 📚 関連ドキュメント

- [MapView詳細ドキュメント](README.md)
- [マーカーユーティリティドキュメント](README.md)
- [Google Maps API ドキュメント](https://developers.google.com/maps/documentation)
- [React Google Maps ライブラリ](https://visgl.github.io/react-google-maps/)
````
