# Types System

> 🎯 **目的**: TypeScript 型システム・型安全性・実行時型チェック
> **対象**: 型設計・インターフェース設計を担当する開発者
> **最終更新**: 2025 年 8 月 30 日

## 🛡️ 型システム構成

| ファイル                | 用途         | サイズ | 特徴                   |
| ----------------------- | ------------ | ------ | ---------------------- |
| **core.types.ts**       | 基盤・共通型 | 1.6KB  | アプリケーション基本型 |
| **restaurant.types.ts** | ドメイン型   | 3.7KB  | ビジネスロジック型     |
| **interfaces.types.ts** | 抽象化 IF    | 6.9KB  | 依存関係逆転対応       |
| **type-guards.ts**      | 型ガード     | 5.0KB  | 実行時型チェック       |
| **api.types.ts**        | API 型       | 3.8KB  | 外部 API 通信型        |
| **ui.types.ts**         | UI 型        | 5.6KB  | React コンポーネント型 |
| **map.types.ts**        | 地図型       | 2.3KB  | Google Maps API 型     |

## 🏗️ アーキテクチャ原則

このディレクトリは、佐渡島レストランマップアプリケーションの**TypeScript 型システム**を構成します。型安全性を重視した設計で、インターフェース分離原則（ISP）に基づく抽象化と、実行時型チェックによる堅牢なアプリケーション基盤を提供します。

## 型システムアーキテクチャ

### 階層構造

````text
Types Hierarchy
├── Core Types (基盤型)
│   ├── LatLngLiteral
│   ├── SadoDistrict
│   └── OpeningHours
├── Domain Types (ドメイン型)
│   ├── Restaurant
│   ├── Parking
│   ├── Toilet
│   └── MapPoint
├── Interface Types (抽象化)
│   ├── IDataSource<T>
│   ├── IMapPointProvider
│   └── IValidator<T>
└── Utility Types (ユーティリティ)
    ├── Type Guards
    ├── API Types
    └── UI Types
```text

## 主要型定義

### 1. 基盤型（Core Types）

#### 地理座標

```typescript
export interface LatLngLiteral {
  readonly lat: number;
  readonly lng: number;
}
```text

#### 佐渡地区分類

```typescript
export type SadoDistrict =
  | "両津" | "相川" | "佐和田" | "金井"
  | "新穂" | "畑野" | "真野" | "小木"
  | "羽茂" | "赤泊";
```text

#### 営業時間

```typescript
export interface OpeningHours {
  readonly day: string;
  readonly hours: string;
  readonly isOpen: boolean;
}
```text

### 2. ドメイン型（Domain Types）

#### 飲食店型

```typescript
export interface Restaurant {
  readonly id: string;
  readonly type: "restaurant";
  readonly name: string;
  readonly description?: string;
  readonly district: SadoDistrict;
  readonly address: string;
  readonly coordinates: LatLngLiteral;
  readonly phone?: string;
  readonly website?: string;
  readonly cuisineType: CuisineType;
  readonly priceRange: PriceRange;
  readonly rating?: number;
  readonly reviewCount?: number;
  readonly openingHours?: readonly OpeningHours[];
  readonly features: readonly string[];
  readonly lastUpdated: string;
}
```text

#### 料理ジャンル

```typescript
export type CuisineType =
  | "日本料理" | "寿司" | "海鮮" | "焼肉・焼鳥"
  | "ラーメン" | "そば・うどん" | "中華" | "イタリアン"
  | "フレンチ" | "カフェ・喫茶店" | "バー・居酒屋"
  | "ファストフード" | "デザート・スイーツ"
  | "カレー・エスニック" | "ステーキ・洋食"
  | "弁当・テイクアウト" | "レストラン" | "その他";
```text

#### 統合マップポイント

```typescript
export type MapPoint = Restaurant | Parking | Toilet;
```text

### 3. インターフェース型（Interface Types）

#### データソース抽象化

```typescript
export interface IDataSource<T> {
  fetch(): Promise<T[]>;
  validate(data: T[]): boolean;
  clearCache(): void;
}

export interface IMapPointProvider {
  getAllMapPoints(): Promise<MapPoint[]>;
  getMapPointsByType(type: MapPointType): Promise<MapPoint[]>;
  searchNearby(center: LatLngLiteral, radius: number): Promise<MapPoint[]>;
}
```text

#### バリデーション抽象化

```typescript
export interface IValidator<T> {
  validate(data: T): IValidationResult;
  validateSchema(data: unknown): data is T;
}

export interface IValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}
```text

#### キャッシュ管理抽象化

```typescript
export interface ICacheProvider<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
```text

### 4. 型ガード（Type Guards）

#### マップポイント型ガード

```typescript
export const isRestaurant = (point: MapPoint): point is Restaurant => {
  return point.type === "restaurant";
};

export const isParking = (point: MapPoint): point is Parking => {
  return point.type === "parking";
};

export const isToilet = (point: MapPoint): point is Toilet => {
  return point.type === "toilet";
};
```text

#### 座標検証

```typescript
export const isValidLatLng = (
  coords: unknown
): coords is LatLngLiteral => {
  return (
    typeof coords === "object" &&
    coords !== null &&
    typeof (coords as any).lat === "number" &&
    typeof (coords as any).lng === "number" &&
    Math.abs((coords as any).lat) <= 90 &&
    Math.abs((coords as any).lng) <= 180
  );
};
```text

## 設計原則

### 1. インターフェース分離原則（ISP）

#### 細分化されたインターフェース

- **IDataSource<T>** - データ取得の基本契約
- **IRestaurantDataSource** - 飲食店固有の機能
- **IMapPointProvider** - マップポイント統合機能
- **IFilterStateManager** - フィルター状態管理
- **IAnalyticsProvider** - 分析機能

#### 利点

- **依存関係の最小化** - 必要な機能のみに依存
- **テスト容易性** - モック作成の簡素化
- **拡張性** - 新機能追加時の影響範囲限定

### 2. 型安全性の保証

#### Readonly修飾子

```typescript
export interface Restaurant {
  readonly id: string;
  readonly coordinates: LatLngLiteral;
  readonly features: readonly string[];
}
```text

#### Union Types

```typescript
export type MapPointType = "restaurant" | "parking" | "toilet";
export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };
```text

### 3. 実行時型チェック

#### 型ガード活用

```typescript
// 安全な型変換
const processMapPoint = (point: MapPoint) => {
  if (isRestaurant(point)) {
    // point は Restaurant 型として扱える
    console.log(point.cuisineType);
  } else if (isParking(point)) {
    // point は Parking 型として扱える
    console.log(point.capacity);
  }
};
```text

#### バリデーション統合

```typescript
const validateAndProcess = (data: unknown) => {
  if (validateMapPoint(data)) {
    // data は MapPoint 型として安全に使用可能
    return processMapPoint(data);
  }
  throw new Error("Invalid map point data");
};
```text

## 使用例

### 基本的な型使用

```typescript
import type { Restaurant, MapPoint, LatLngLiteral } from '@/types';
import { isRestaurant, isValidLatLng } from '@/types';

// 型安全な関数定義
const findNearbyRestaurants = (
  center: LatLngLiteral,
  points: MapPoint[],
  radius: number
): Restaurant[] => {
  if (!isValidLatLng(center)) {
    throw new Error("Invalid coordinates");
  }

  return points
    .filter(isRestaurant)
    .filter(restaurant =>
      calculateDistance(center, restaurant.coordinates) <= radius
    );
};
```text

### インターフェース実装

```typescript
import type { IDataSource, IValidator } from '@/types';

class RestaurantService implements IDataSource<Restaurant> {
  constructor(
    private validator: IValidator<Restaurant>
  ) {}

  async fetch(): Promise<Restaurant[]> {
    const data = await fetchFromAPI();
    return this.validate(data) ? data : [];
  }

  validate(data: Restaurant[]): boolean {
    return data.every(item =>
      this.validator.validate(item).isValid
    );
  }

  clearCache(): void {
    // キャッシュクリア実装
  }
}
```text

### 型ガード活用

```typescript
import { isRestaurant, isParking, isToilet } from '@/types';

const categorizeMapPoints = (points: MapPoint[]) => {
  const restaurants = points.filter(isRestaurant);
  const parkings = points.filter(isParking);
  const toilets = points.filter(isToilet);

  return { restaurants, parkings, toilets };
};
```text

## パフォーマンス最適化

### 型推論の活用

```typescript
// 型推論による最適化
const createMapPoint = <T extends MapPoint>(
  base: Omit<T, 'id' | 'lastUpdated'>
): T => ({
  ...base,
  id: generateId(),
  lastUpdated: new Date().toISOString(),
} as T);
```text

### 条件型の使用

```typescript
// 条件型による型レベル最適化
type ExtractCoordinates<T> = T extends { coordinates: infer C } ? C : never;
type RestaurantCoords = ExtractCoordinates<Restaurant>; // LatLngLiteral
```text

### Template Literal Types

```typescript
// 文字列リテラル型による型安全性
type EventName = `track_${string}`;
type AnalyticsEvent = {
  name: EventName;
  properties: Record<string, unknown>;
};
```text

## 開発ツール統合

### VS Code設定

```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.preferences.importModuleSpecifier": "relative"
}
```text

### ESLint TypeScript設定

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error'
  }
};
```text

## テスト戦略

### 型テスト

```typescript
// 型レベルテスト
type AssertTrue<T extends true> = T;
type AssertFalse<T extends false> = T;

// Restaurant型の検証
type _RestaurantHasId = AssertTrue<'id' extends keyof Restaurant ? true : false>;
type _RestaurantReadonly = AssertTrue<
  Restaurant['id'] extends readonly string ? true : false
>;
```text

### 型ガードテスト

```typescript
describe('Type Guards', () => {
  it('should correctly identify restaurant type', () => {
    const restaurant: MapPoint = createMockRestaurant();
    expect(isRestaurant(restaurant)).toBe(true);
    expect(isParking(restaurant)).toBe(false);
  });

  it('should validate coordinates', () => {
    expect(isValidLatLng({ lat: 38.0186, lng: 138.3672 })).toBe(true);
    expect(isValidLatLng({ lat: 91, lng: 0 })).toBe(false);
  });
});
```text

## 拡張ポイント

### 新しいマップポイントタイプの追加

```typescript
// 1. 基本型定義
export interface Hospital {
  readonly id: string;
  readonly type: "hospital";
  readonly name: string;
  readonly district: SadoDistrict;
  readonly coordinates: LatLngLiteral;
  readonly departments: readonly string[];
  readonly emergencyService: boolean;
}

// 2. Union型への追加
export type MapPoint = Restaurant | Parking | Toilet | Hospital;

// 3. 型ガードの追加
export const isHospital = (point: MapPoint): point is Hospital => {
  return point.type === "hospital";
};
```text

### カスタムユーティリティ型

```typescript
// 部分更新型
export type PartialUpdate<T> = {
  [K in keyof T]?: T[K] extends readonly (infer U)[]
    ? readonly U[]
    : T[K];
};

// 必須フィールド抽出
export type RequiredFields<T> = {
  [K in keyof T]-?: T[K];
};
```text

## ベストプラクティス

### 型定義の命名規則

- **Interface**: `I` プレフィックス（抽象化）
- **Type Alias**: 具体的な名前
- **Generic**: `T`, `U`, `V` または意味のある名前
- **Union Types**: 具体的な値の組み合わせ

### 型の組織化

```typescript
// ドメイン別の型グループ化
export namespace Restaurant {
  export type Data = Restaurant;
  export type Filters = Pick<Restaurant, 'cuisineType' | 'priceRange'>;
  export type Summary = Pick<Restaurant, 'id' | 'name' | 'rating'>;
}
```text

### パフォーマンス考慮

- **過度な型計算の回避** - 複雑な条件型の制限
- **循環参照の防止** - 型定義間の依存関係管理
- **適切な型推論** - 明示的型注釈の最小化

## 関連ドキュメント

- `src/services/` - 型を実装するサービス層
- `src/components/` - 型を使用するコンポーネント
- `src/hooks/` - 型安全なカスタムフック
- `src/utils/` - 型ガードを活用するユーティリティ

## 注意事項

- **型の一貫性** - 全体を通じた型定義の統一
- **実行時安全性** - 型ガードによる実行時チェック
- **パフォーマンス** - 型計算の複雑さに注意
- **保守性** - 型定義の変更影響範囲の考慮
- **ドキュメント** - 複雑な型の適切な説明
````
