# Services Abstractions

## 概要

このディレクトリは、**依存関係逆転原則（Dependency Inversion Principle）** を実装したサービス層の抽象化を提供します。具象実装への依存を排除し、テスタブルで保守性の高いアーキテクチャを実現します。

## アーキテクチャ

### 依存関係逆転の実装

```
高レベルモジュール（MapDataService）
         ↓ 依存
抽象化層（AbstractDataService）
         ↑ 実装
低レベルモジュール（RestaurantService, ParkingService, ToiletService）
```

## ファイル構成

### `AbstractDataService.ts`

佐渡島レストランマップアプリケーションのサービス層抽象化を実装するメインファイルです。

## 主要コンポーネント

### 1. AbstractDataService<T>

**抽象データサービス基底クラス**

- **目的**: 具象実装への依存を排除
- **機能**: 
  - キャッシュ戦略付きデータ取得
  - エラーハンドリング
  - データバリデーション
  - 共通的なCRUD操作の抽象化

```typescript
export abstract class AbstractDataService<T> {
  constructor(
    protected readonly dataSource: IMapPointProvider,
    protected readonly cache: ICacheProvider<T[]>,
    protected readonly errorHandler: IErrorHandler,
    protected readonly validator: IValidator<T>
  ) {}
}
```

### 2. 具象サービス実装

#### RestaurantService
- **機能**: 飲食店データの管理
- **メソッド**: `getAll()`, `getById()`, `getNearby()`

#### ParkingService
- **機能**: 駐車場データの管理
- **メソッド**: `getAll()`

#### ToiletService
- **機能**: トイレデータの管理
- **メソッド**: `getAll()`

### 3. ServiceFactory

**依存関係注入ファクトリー**

- **目的**: サービスインスタンスの生成と依存関係の注入
- **利点**: 
  - 依存関係の一元管理
  - テスト時のモック注入が容易
  - 設定変更の影響範囲を限定

### 4. MapDataService

**統合マップデータサービス**

- **目的**: 複数のサービスを協調させる高レベルサービス
- **機能**:
  - 全マップポイントの統合取得
  - エリア内検索
  - 距離ベースフィルタリング
  - Haversine公式による距離計算

## 設計原則

### 1. 依存関係逆転原則（DIP）
- 高レベルモジュールは低レベルモジュールに依存しない
- 両方とも抽象化に依存する

### 2. 単一責任原則（SRP）
- 各サービスは特定のデータタイプの管理のみを担当

### 3. 開放閉鎖原則（OCP）
- 新しいサービスタイプの追加は拡張で対応
- 既存コードの修正は不要

## 使用例

```typescript
// ファクトリーでサービスを生成
const factory = new ServiceFactory(
  mapPointProvider,
  cacheProvider,
  errorHandler,
  restaurantValidator,
  parkingValidator,
  toiletValidator
);

// 個別サービスの使用
const restaurantService = factory.createRestaurantService();
const restaurants = await restaurantService.getAll();

// 統合サービスの使用
const mapDataService = new MapDataService(
  factory.createRestaurantService(),
  factory.createParkingService(),
  factory.createToiletService()
);

const allMapPoints = await mapDataService.getAllMapPoints();
```

## テスト戦略

### モック注入による単体テスト

```typescript
// テスト用のモック依存関係
const mockDataSource = createMock<IMapPointProvider>();
const mockCache = createMock<ICacheProvider<Restaurant[]>>();
const mockErrorHandler = createMock<IErrorHandler>();
const mockValidator = createMock<IValidator<Restaurant>>();

// テスト対象サービスの生成
const service = new RestaurantService(
  mockDataSource,
  mockCache,
  mockErrorHandler,
  mockValidator
);
```

## パフォーマンス最適化

### キャッシュ戦略
- **L1キャッシュ**: メモリ内キャッシュ
- **キャッシュキー**: データタイプ別の階層化
- **TTL**: データの性質に応じた有効期限設定

### 距離計算最適化
- **Haversine公式**: 高精度な地球上の距離計算
- **フィルタリング**: 不要な計算の事前除外

## 拡張ポイント

### 新しいマップポイントタイプの追加

1. **型定義**: `@/types`に新しい型を追加
2. **サービス実装**: `AbstractDataService`を継承
3. **ファクトリー拡張**: `ServiceFactory`にファクトリーメソッド追加
4. **統合**: `MapDataService`に統合ロジック追加

### カスタムキャッシュ戦略

```typescript
class CustomCacheProvider implements ICacheProvider<T> {
  // カスタムキャッシュロジックの実装
}
```

## 関連ドキュメント

- `src/types/` - 型定義
- `src/services/` - 具象サービス実装
- `docs/development/` - 開発ガイドライン

## 注意事項

- **型安全性**: TypeScriptの型システムを最大限活用
- **エラーハンドリング**: 各層での適切なエラー処理
- **パフォーマンス**: キャッシュとバリデーションのバランス
- **テスタビリティ**: 依存関係注入によるテスト容易性の確保
