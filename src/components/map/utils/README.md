# Map Utils Directory

このディレクトリには、佐渡島レストランマップアプリケーションの地図機能で使用されるユーティリティ関数が含まれています。主にマーカーの外観・サイズ・色分けに関する処理を提供します。

## 📁 ディレクトリ構成

```text
src/components/map/utils/
├── markerUtils.ts           # マーカー関連ユーティリティ関数
└── index.ts                # バレルエクスポート
```text

## 🎯 マーカーユーティリティ (`markerUtils.ts`)

### 概要

地図上のマーカーの視覚的表現を決定するための統合されたユーティリティ関数群です。レストラン・駐車場・トイレなど、ポイントタイプに応じた適切なマーカー設定を提供します。

## 🎨 カラーマッピング

### 料理ジャンル別カラーマップ

レストランの料理タイプに基づいた色分けシステム：

```typescript
const CUISINE_COLOR_MAP = {
  日本料理: "#ef4444",        // 赤
  寿司: "#f97316",           // オレンジ
  海鮮: "#06b6d4",           // シアン
  "焼肉・焼鳥": "#dc2626",   // 濃い赤
  ラーメン: "#eab308",       // 黄色
  "そば・うどん": "#84cc16", // ライム
  中華: "#f59e0b",           // アンバー
  イタリアン: "#10b981",     // エメラルド
  フレンチ: "#8b5cf6",       // 紫
  "カフェ・喫茶店": "#14b8a6", // ティール
  "バー・居酒屋": "#f59e0b", // アンバー
  ファストフード: "#ef4444", // 赤
  "デザート・スイーツ": "#ec4899", // ピンク
  "カレー・エスニック": "#f97316", // オレンジ
  "ステーキ・洋食": "#6366f1", // インディゴ
  "弁当・テイクアウト": "#8b5cf6", // 紫
  レストラン: "#06b6d4",     // シアン
  その他: "#6b7280",         // グレー
} as const;
```text

### 価格帯別サイズマップ

レストランの価格帯に基づいたマーカーサイズ：

```typescript
const PRICE_SIZE_MAP = {
  "～1000円": 30,      // 小サイズ
  "1000-2000円": 35,   // 中サイズ（デフォルト）
  "2000-3000円": 40,   // 大サイズ
  "3000円～": 45,      // 特大サイズ
} as const;
```text

## 🔧 ユーティリティ関数

### `getMarkerColorByCuisine(cuisineType: string): string`

料理ジャンルに基づいてマーカーの色を決定

```typescript
// 使用例
const color = getMarkerColorByCuisine("日本料理"); // "#ef4444"
const unknownColor = getMarkerColorByCuisine("未知の料理"); // "#9e9e9e" (デフォルト)
```text

**パラメータ**:

- `cuisineType`: 料理ジャンル文字列

**戻り値**:

- CSS カラーコード（16進数）
- 未知のジャンルの場合は `#9e9e9e` (グレー)

### `getMarkerSizeByPrice(priceRange?: string): number`

価格帯に基づいてマーカーのサイズを決定

```typescript
// 使用例
const size = getMarkerSizeByPrice("2000-3000円"); // 40
const defaultSize = getMarkerSizeByPrice(); // 35 (デフォルト)
const unknownSize = getMarkerSizeByPrice("未知の価格帯"); // 35 (デフォルト)
```text

**パラメータ**:

- `priceRange` (オプション): 価格帯文字列

**戻り値**:

- マーカーサイズ（ピクセル）
- 未指定または未知の価格帯の場合は `35`

### `getMarkerIcon(point: MapPoint): MarkerIcon`

ポイントタイプに基づいてマーカーのアイコンを決定

```typescript
interface MarkerIcon {
  readonly background: string;
  readonly glyph: string;
}

// 使用例
const restaurantIcon = getMarkerIcon({
  type: "restaurant",
  cuisineType: "寿司"
}); // { background: "#f97316", glyph: "🍽️" }

const parkingIcon = getMarkerIcon({
  type: "parking"
}); // { background: "#4caf50", glyph: "🅿️" }
```text

**パラメータ**:

- `point`: MapPointオブジェクト

**戻り値**:

- `MarkerIcon`オブジェクト（背景色とグリフ）

**ポイントタイプ別の設定**:

- **レストラン**: 料理タイプ別の色 + 🍽️
- **駐車場**: グリーン (#4caf50) + 🅿️
- **トイレ**: ブルー (#2196f3) + �
- **その他**: グレー (#9e9e9e) + 📍

### `getMarkerSize(point: MapPoint): number`

マップポイントのサイズを決定

```typescript
// 使用例
const restaurantSize = getMarkerSize({
  type: "restaurant",
  priceRange: "3000円～"
}); // 45

const parkingSize = getMarkerSize({
  type: "parking"
}); // 32
```text

**パラメータ**:

- `point`: MapPointオブジェクト

**戻り値**:

- マーカーサイズ（ピクセル）

**ポイントタイプ別のサイズ**:

- **レストラン**: 価格帯に基づく動的サイズ (30-45px)
- **駐車場・トイレ**: 固定サイズ (32px)
- **その他**: デフォルトサイズ (35px)

### `getMarkerConfig(point: MapPoint): MarkerConfig`

統合されたマーカー設定を取得

```typescript
interface MarkerConfig {
  readonly background: string;
  readonly glyph: string;
  readonly size: number;
  readonly scale: number;
}

// 使用例
const config = getMarkerConfig({
  type: "restaurant",
  cuisineType: "イタリアン",
  priceRange: "2000-3000円"
});
// {
//   background: "#10b981",
//   glyph: "🍽️",
//   size: 40,
//   scale: 1.14
// }
```text

**パラメータ**:

- `point`: MapPointオブジェクト

**戻り値**:

- 完全な`MarkerConfig`オブジェクト

## 🎯 使用方法

### 基本的なインポート

```typescript
// 統一エクスポートからのインポート
import {
  getMarkerColorByCuisine,
  getMarkerSizeByPrice,
  getMarkerIcon,
  getMarkerSize,
  getMarkerConfig,
} from '@/components/map/utils';

// 個別インポート
import { getMarkerIcon } from '@/components/map/utils/markerUtils';
```text

### MapMarkerコンポーネントでの使用

```tsx
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { getMarkerIcon, getMarkerSize } from '@/components/map/utils';
import type { MapPoint } from '@/types';

interface MapMarkerProps {
  point: MapPoint;
  onClick: (point: MapPoint) => void;
}

const MapMarker = ({ point, onClick }: MapMarkerProps) => {
  const { background, glyph } = getMarkerIcon(point);
  const size = getMarkerSize(point);

  return (
    <AdvancedMarker
      position={point.coordinates}
      title={point.name}
      onClick={() => onClick(point)}
    >
      <Pin
        background={background}
        borderColor="#fff"
        glyphColor="white"
        scale={size / 35}
      >
        {glyph}
      </Pin>
    </AdvancedMarker>
  );
};
```text

### カスタムマーカーレンダラー

```tsx
import { getMarkerConfig } from '@/components/map/utils';

const CustomMarkerRenderer = ({ points }: { points: MapPoint[] }) => {
  return (
    <>
      {points.map((point, index) => {
        const config = getMarkerConfig(point);

        return (
          <div
            key={`${point.type}-${point.id}`}
            className="custom-marker"
            style={{
              backgroundColor: config.background,
              width: config.size,
              height: config.size,
              transform: `scale(${config.scale})`,
            }}
          >
            {config.glyph}
          </div>
        );
      })}
    </>
  );
};
```text

## 🏗️ 設計原則

### 1. **型安全性**

- `as const`アサーションによる厳密な型推論
- `Readonly`型による不変性の保証
- 明確なインターフェース定義

### 2. **拡張性**

- 新しい料理ジャンルの簡単な追加
- 価格帯の柔軟な設定
- ポイントタイプの容易な拡張

### 3. **一貫性**

- 統一されたカラーパレット
- 論理的なサイズ階層
- 直感的なアイコン選択

### 4. **パフォーマンス**

- 定数時間での色・サイズ決定
- メモリ効率的なマッピング
- 軽量な関数設計

## 🎨 カスタマイズ

### 新しい料理ジャンルの追加

```typescript
// markerUtils.ts内のCUISINE_COLOR_MAPに追加
const CUISINE_COLOR_MAP = {
  // 既存のマッピング...
  "新しい料理ジャンル": "#新しい色コード",
} as const;
```text

### 価格帯の調整

```typescript
// markerUtils.ts内のPRICE_SIZE_MAPを調整
const PRICE_SIZE_MAP = {
  "～500円": 25,      // より小さいサイズ
  "500-1000円": 30,
  "1000-2000円": 35,
  "2000-3000円": 40,
  "3000-5000円": 45,
  "5000円～": 50,     // より大きいサイズ
} as const;
```text

### カスタムアイコンの追加

```typescript
export const getMarkerIcon = (point: MapPoint): MarkerIcon => {
  switch (point.type) {
    // 既存のケース...
    case "hotel":
      return {
        background: "#9c27b0", // 紫
        glyph: "🏨",
      };
    case "attraction":
      return {
        background: "#ff5722", // 深いオレンジ
        glyph: "🎯",
      };
    // デフォルトケース...
  }
};
```text

## 🔧 開発ガイドライン

### 新しいユーティリティ関数の追加

1. **適切な型定義の作成**
2. **JSDocコメントの追加**
3. **テストケースの作成**
4. **使用例の提供**
5. **エクスポートの更新**

### テスト方法

```typescript
import {
  getMarkerColorByCuisine,
  getMarkerSizeByPrice,
  getMarkerIcon,
  getMarkerSize,
  getMarkerConfig,
} from './markerUtils';

describe('markerUtils', () => {
  test('getMarkerColorByCuisine returns correct color', () => {
    expect(getMarkerColorByCuisine('日本料理')).toBe('#ef4444');
    expect(getMarkerColorByCuisine('未知の料理')).toBe('#9e9e9e');
  });

  test('getMarkerSizeByPrice returns correct size', () => {
    expect(getMarkerSizeByPrice('3000円～')).toBe(45);
    expect(getMarkerSizeByPrice()).toBe(35);
  });

  test('getMarkerIcon returns correct icon for restaurant', () => {
    const restaurant = {
      type: 'restaurant',
      cuisineType: '寿司',
    } as Restaurant;

    const icon = getMarkerIcon(restaurant);
    expect(icon.background).toBe('#f97316');
    expect(icon.glyph).toBe('🍽️');
  });

  test('getMarkerConfig returns complete configuration', () => {
    const restaurant = {
      type: 'restaurant',
      cuisineType: 'イタリアン',
      priceRange: '2000-3000円',
    } as Restaurant;

    const config = getMarkerConfig(restaurant);
    expect(config.background).toBe('#10b981');
    expect(config.size).toBe(40);
    expect(config.scale).toBeCloseTo(1.14);
  });
});
```text

## 🔍 トラブルシューティング

### よくある問題

1. **マーカーの色が表示されない**
   - 料理ジャンル名の確認（大文字小文字、全角半角）
   - CUISINE_COLOR_MAPの定義確認
   - CSSでの色の上書き確認

1. **マーカーサイズが適用されない**
   - 価格帯文字列の形式確認
   - PRICE_SIZE_MAPの定義確認
   - スケール計算の確認

1. **新しいポイントタイプが表示されない**
   - getMarkerIcon関数のswitch文更新確認
   - 型定義の更新確認
   - デフォルトケースの動作確認

### デバッグ方法

```typescript
// マーカー設定のデバッグ
const debugMarkerConfig = (point: MapPoint) => {
  const config = getMarkerConfig(point);
  console.log('Marker Config Debug:', {
    point: point.name,
    type: point.type,
    config,
  });
  return config;
};

// 色マッピングのデバッグ
const debugColorMapping = () => {
  console.log('Available cuisine colors:', CUISINE_COLOR_MAP);
  console.log('Available price sizes:', PRICE_SIZE_MAP);
};
```text

### パフォーマンス監視

```typescript
// マーカー生成のパフォーマンス測定
const measureMarkerPerformance = (points: MapPoint[]) => {
  console.time('Marker Config Generation');
  const configs = points.map(getMarkerConfig);
  console.timeEnd('Marker Config Generation');
  return configs;
};
```text
