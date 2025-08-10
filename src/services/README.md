# Services Layer

## 概要

このディレクトリは、佐渡島レストランマップアプリケーションの**サービス層**を構成します。外部API通信、データ変換、ビジネスロジックの抽象化を担当し、クリーンアーキテクチャの原則に基づいて設計されています。

## アーキテクチャ概要

```
src/services/
├── abstractions/          # 依存関係逆転原則の実装
├── sheets/               # Google Sheets API連携
├── index.ts              # バレルエクスポート
└── sheetsService.ts      # レガシーサービス（互換性維持）
```

## ディレクトリ構成

### `abstractions/`
**依存関係逆転原則（Dependency Inversion Principle）の実装**

- **目的**: 具象実装への依存を排除し、テスタブルなアーキテクチャを実現
- **主要コンポーネント**:
  - `AbstractDataService<T>` - 抽象データサービス基底クラス
  - `RestaurantService` - 飲食店データサービス
  - `ParkingService` - 駐車場データサービス
  - `ToiletService` - トイレデータサービス
  - `ServiceFactory` - 依存関係注入ファクトリー
  - `MapDataService` - 統合マップデータサービス

### `sheets/`
**Google Sheets API連携サービス**

- **目的**: スプレッドシートからのデータ取得と型安全な変換
- **主要機能**:
  - データ取得（レストラン、駐車場、トイレ）
  - 型変換とバリデーション
  - エラーハンドリング
  - データ品質管理

### `index.ts`
**バレルエクスポートファイル**

- **目的**: サービス層の統一的なインターフェース提供
- **エクスポート内容**:
  - Sheets Service関数群
  - Abstract Services クラス群
  - 型定義の再エクスポート

## 設計原則

### 1. 依存関係逆転原則（DIP）
```typescript
// 高レベルモジュールは抽象化に依存
class MapDataService {
  constructor(
    private restaurantService: RestaurantService,
    private parkingService: ParkingService,
    private toiletService: ToiletService
  ) {}
}
```

### 2. 単一責任原則（SRP）
- 各サービスは特定のデータタイプまたは機能領域を担当
- 関心事の分離により保守性を向上

### 3. 開放閉鎖原則（OCP）
- 新機能の追加は拡張で対応
- 既存コードの修正を最小限に抑制

## データフロー

```
External Data Sources
        ↓
Google Sheets API
        ↓
Sheets Service Layer
        ↓
Abstract Service Layer
        ↓
Application Components
```

### フロー詳細

1. **データソース** - Google Sheets、外部API
2. **取得層** - `sheets/` サービスによるデータ取得
3. **変換層** - 型安全なオブジェクトへの変換
4. **抽象化層** - `abstractions/` による統一インターフェース
5. **アプリケーション層** - コンポーネントでの利用

## 使用例

### 基本的な使用方法

```typescript
import {
  fetchAllMapPoints,
  ServiceFactory,
  MapDataService
} from '@/services';

// 直接的なデータ取得
const allPoints = await fetchAllMapPoints();

// 抽象化されたサービスの使用
const factory = new ServiceFactory(
  mapPointProvider,
  cacheProvider,
  errorHandler,
  validators
);

const mapService = new MapDataService(
  factory.createRestaurantService(),
  factory.createParkingService(),
  factory.createToiletService()
);

const nearbyPoints = await mapService.getMapPointsInArea(
  { lat: 38.0186, lng: 138.3672 },
  5000
);
```

### エラーハンドリング

```typescript
import { SheetsApiError } from '@/services';

try {
  const restaurants = await fetchRestaurantsFromSheets();
} catch (error) {
  if (error instanceof SheetsApiError) {
    console.error(`API Error ${error.status}:`, error.message);
    // 適切なフォールバック処理
  }
}
```

## パフォーマンス最適化

### キャッシュ戦略
- **L1キャッシュ**: メモリ内キャッシュ
- **データ更新チェック**: 不要なAPI呼び出しの回避
- **バッチ処理**: 複数データタイプの並列取得

### メモリ管理
- **オブジェクトプーリング**: 頻繁に作成されるオブジェクトの再利用
- **遅延読み込み**: 必要時のみデータを取得
- **適切な解放**: 不要なオブジェクトの早期解放

## テスト戦略

### 単体テスト
```typescript
// モック注入による抽象サービステスト
const mockDataSource = createMock<IMapPointProvider>();
const service = new RestaurantService(
  mockDataSource,
  mockCache,
  mockErrorHandler,
  mockValidator
);
```

### 統合テスト
```typescript
// 実際のAPIを使用した統合テスト
describe('Services Integration', () => {
  it('should fetch and transform data correctly', async () => {
    const result = await fetchAllMapPoints();
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
```

## 環境設定

### 必要な環境変数

```env
# Google Sheets API
VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
VITE_SPREADSHEET_ID=your_spreadsheet_id_here

# その他のAPI設定（将来の拡張用）
# VITE_EXTERNAL_API_KEY=your_external_api_key
```

### 設定ファイル

```typescript
// services/config.ts (将来の拡張例)
export const serviceConfig = {
  sheets: {
    apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
    spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
  },
  cache: {
    ttl: 300000, // 5分
    maxSize: 100,
  },
};
```

## エラーハンドリング

### カスタムエラー型

```typescript
// SheetsApiError - Google Sheets API固有のエラー
export class SheetsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'SheetsApiError';
  }
}
```

### エラー分類
- **認証エラー** (403) - API キー関連
- **レート制限エラー** (429) - API使用量超過
- **データ形式エラー** - スプレッドシート構造不整合
- **ネットワークエラー** - 通信障害

## 拡張ポイント

### 新しいデータソースの追加

1. **新しいサービスディレクトリの作成**
   ```
   src/services/newapi/
   ├── index.ts
   ├── newApiService.ts
   └── newApiService.test.ts
   ```

2. **抽象サービスの実装**
   ```typescript
   class NewDataService extends AbstractDataService<NewDataType> {
     // 具象実装
   }
   ```

3. **ファクトリーへの統合**
   ```typescript
   class ServiceFactory {
     createNewDataService(): NewDataService {
       // ファクトリーメソッドの実装
     }
   }
   ```

### カスタムキャッシュプロバイダー

```typescript
class RedisCache implements ICacheProvider<T> {
  async get(key: string): Promise<T | null> {
    // Redis実装
  }
  
  async set(key: string, value: T, ttl?: number): Promise<void> {
    // Redis実装
  }
}
```

## モニタリング・ログ

### パフォーマンス監視

```typescript
// サービス呼び出しの監視
const startTime = performance.now();
const result = await fetchRestaurantsFromSheets();
const duration = performance.now() - startTime;

console.log(`Data fetch completed in ${duration}ms`);
```

### エラー追跡

```typescript
// エラーログの構造化
const errorLog = {
  timestamp: new Date().toISOString(),
  service: 'SheetsService',
  operation: 'fetchRestaurants',
  error: error.message,
  status: error.status,
};
```

## 関連ドキュメント

- [`abstractions/README.md`](./abstractions/README.md) - 依存関係逆転実装の詳細
- [`sheets/README.md`](./sheets/README.md) - Google Sheets API連携の詳細
- `src/types/` - 型定義
- `src/utils/` - ユーティリティ関数
- `docs/development/` - 開発ガイドライン

## ベストプラクティス

### コード品質
- **型安全性** - TypeScriptの型システムを最大限活用
- **エラーハンドリング** - 適切な例外処理とログ出力
- **テスト可能性** - 依存関係注入によるモック化

### パフォーマンス
- **キャッシュ活用** - 不要なAPI呼び出しの削減
- **並列処理** - 独立したデータ取得の並列化
- **メモリ効率** - 適切なオブジェクト管理

### 保守性
- **関心事の分離** - 各サービスの責任範囲を明確化
- **依存関係管理** - 抽象化による疎結合
- **ドキュメント** - 包括的なドキュメンテーション

## 注意事項

- **API制限** - 外部APIの使用量制限に注意
- **データ整合性** - 外部データソースの変更への対応
- **セキュリティ** - API キーの適切な管理
- **互換性** - 既存コードとの後方互換性維持
