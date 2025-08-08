# 🔌 Services Architecture

> **目的**: 佐渡飲食店マップアプリケーションの外部サービス・API 連携アーキテクチャ  
> **更新日**: 2025 年 8 月 8 日

## 📁 ディレクトリ構造

```text
services/
├── sheets/
│   ├── sheetsService.ts    # Google Sheets API実装
│   └── index.ts           # sheets export
├── api/                   # 汎用API層 (将来実装)
├── maps/                  # Google Maps API (将来実装)
└── index.ts              # 全サービスのbarrel export
```

## 🎯 アーキテクチャ原則

### 1. **責任分離**

各サービスは特定の外部 API との通信のみを担当

```typescript
// ✅ 良い例: 特定API専用
class GoogleSheetsService {
  // Google Sheets APIのみを扱う
}

// ❌ 悪い例: 複数API混在
class DataService {
  // Google Sheets + Maps + Analytics混在
}
```

### 2. **抽象化**

具体的な実装詳細を隠蔽し、統一インターフェースを提供

```typescript
// 抽象インターフェース
interface DataService {
  fetchRestaurants(): Promise<Restaurant[]>;
  fetchMapPoints(): Promise<MapPoint[]>;
}

// 具体実装
class GoogleSheetsDataService implements DataService {
  // Google Sheets固有の実装
}
```

### 3. **エラーハンドリング**

統一的なエラー処理とログ出力

```typescript
class ServiceError extends Error {
  constructor(
    message: string,
    public service: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
```

## 📊 既存サービス詳細

### **GoogleSheetsService**

Google Sheets API との通信を担当

#### **主要機能**

```typescript
class GoogleSheetsService {
  // 基本データ取得
  async fetchSheetData(range: string): Promise<string[][]>;

  // 飲食店データ変換
  async fetchRestaurants(): Promise<Restaurant[]>;

  // 追加ポイント取得
  async fetchAdditionalPoints(): Promise<MapPoint[]>;
}
```

#### **設定**

```typescript
const SHEETS_CONFIG = {
  SPREADSHEET_ID: import.meta.env.VITE_SPREADSHEET_ID,
  API_KEY: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
  SHEET_NAME: "まとめータベース",
  RANGE: "A:Z",
} as const;
```

#### **エラーハンドリング**

```typescript
// レート制限対応
private async handleRateLimit(error: unknown): Promise<void> {
  if (this.isRateLimitError(error)) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    throw new ServiceError(
      'Rate limit exceeded. Please try again.',
      'GoogleSheets',
      error
    );
  }
}

// ネットワークエラー対応
private handleNetworkError(error: unknown): never {
  throw new ServiceError(
    'Network error occurred while fetching data.',
    'GoogleSheets',
    error
  );
}
```

#### **データ変換**

```typescript
// 生データから型安全なオブジェクトに変換
private convertRowToRestaurant(row: string[]): Restaurant {
  return {
    id: sanitizeInput(row[0] || ''),
    name: sanitizeInput(row[1] || ''),
    cuisineType: this.parseCuisineType(row[2]),
    priceRange: this.parsePriceRange(row[3]),
    district: getDistrictFromAddress(row[4] || ''),
    address: sanitizeInput(row[4] || ''),
    coordinates: this.parseCoordinates(row[5], row[6]),
    phone: this.parsePhone(row[7]),
    website: this.parseWebsite(row[8]),
    features: this.parseFeatures(row[9])
  };
}
```

## 🛠️ サービス作成ガイド

### **1. 基本テンプレート**

```typescript
import { ServiceError } from "./ServiceError";

interface ServiceConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

export class CustomService {
  private config: ServiceConfig;

  constructor(config: ServiceConfig) {
    this.config = config;
  }

  async fetchData<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/${endpoint}?key=${this.config.apiKey}`,
        {
          timeout: this.config.timeout || 10000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new ServiceError(
        `Failed to fetch data from ${endpoint}`,
        "CustomService",
        error
      );
    }
  }
}
```

### **2. 型安全性**

```typescript
// APIレスポンス型定義
interface ApiResponse<T> {
  data: T;
  status: "success" | "error";
  message?: string;
}

// サービスメソッドの型定義
interface RestaurantService {
  fetchRestaurants(): Promise<Restaurant[]>;
  searchRestaurants(query: string): Promise<Restaurant[]>;
  getRestaurantById(id: string): Promise<Restaurant | null>;
}
```

### **3. 設定管理**

```typescript
// 環境変数からの設定読み込み
const createServiceConfig = () => ({
  googleSheets: {
    apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
    spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
  },
  googleMaps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  },
  analytics: {
    measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
  },
});

// 設定バリデーション
const validateConfig = (config: ServiceConfig): void => {
  if (!config.googleSheets.apiKey) {
    throw new Error("Google Sheets API key is required");
  }
  // その他のバリデーション
};
```

## 🧪 テスト戦略

### **1. サービス単体テスト**

```typescript
import { GoogleSheetsService } from "./sheetsService";

describe("GoogleSheetsService", () => {
  let service: GoogleSheetsService;

  beforeEach(() => {
    service = new GoogleSheetsService({
      apiKey: "test-api-key",
      spreadsheetId: "test-spreadsheet-id",
    });
  });

  test("飲食店データ取得が正常に動作", async () => {
    // モックレスポンス設定
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          values: [
            ["ID", "Name", "Type", "Price", "Address", "Lat", "Lng"],
            [
              "1",
              "テストレストラン",
              "日本料理",
              "1000-2000円",
              "佐渡市両津",
              "38.0",
              "138.0",
            ],
          ],
        }),
    });

    const restaurants = await service.fetchRestaurants();

    expect(restaurants).toHaveLength(1);
    expect(restaurants[0].name).toBe("テストレストラン");
    expect(restaurants[0].cuisineType).toBe("日本料理");
  });

  test("APIエラー時の適切なエラーハンドリング", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    await expect(service.fetchRestaurants()).rejects.toThrow(ServiceError);
  });
});
```

### **2. 統合テスト**

```typescript
// 実際のAPIとの統合テスト（E2E）
test("実際のGoogle Sheets APIとの通信", async () => {
  const service = new GoogleSheetsService({
    apiKey: process.env.VITE_GOOGLE_SHEETS_API_KEY,
    spreadsheetId: process.env.VITE_SPREADSHEET_ID,
  });

  const restaurants = await service.fetchRestaurants();

  expect(restaurants.length).toBeGreaterThan(400); // 実際のデータ数
  expect(restaurants.every((r) => r.id && r.name)).toBe(true);
}, 30000); // 長いタイムアウト
```

## 🔒 セキュリティ

### **1. API キー管理**

```typescript
// 環境変数での管理
const config = {
  apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
  // 本番環境では暗号化やvaultサービス使用を検討
};

// APIキー形式バリデーション
const validateApiKey = (key: string): boolean => {
  return /^AIza[0-9A-Za-z-_]{35}$/.test(key);
};
```

### **2. 入力サニタイゼーション**

```typescript
import { sanitizeInput } from "@/utils/security";

const sanitizeRestaurantData = (raw: string[]): Restaurant => ({
  id: sanitizeInput(raw[0]),
  name: sanitizeInput(raw[1]),
  address: sanitizeInput(raw[4]),
  // すべての文字列入力をサニタイズ
});
```

### **3. レート制限対応**

```typescript
class RateLimitManager {
  private requestTimes: number[] = [];
  private readonly maxRequests = 100; // per minute
  private readonly timeWindow = 60000; // 1 minute

  canMakeRequest(): boolean {
    const now = Date.now();
    // 時間窓から古いリクエストを削除
    this.requestTimes = this.requestTimes.filter(
      (time) => now - time < this.timeWindow
    );

    return this.requestTimes.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requestTimes.push(Date.now());
  }
}
```

## 🚀 将来の拡張予定

### **Google Maps Service**

```typescript
// services/maps/mapsService.ts
export class GoogleMapsService {
  async geocode(address: string): Promise<LatLngLiteral>;
  async reverseGeocode(coordinates: LatLngLiteral): Promise<string>;
  async getPlaceDetails(placeId: string): Promise<PlaceDetails>;
}
```

### **Analytics Service**

```typescript
// services/analytics/analyticsService.ts
export class AnalyticsService {
  trackEvent(action: string, category: string, label?: string): void;
  trackPageView(path: string): void;
  setUserProperties(properties: Record<string, string>): void;
}
```

### **Cache Service**

```typescript
// services/cache/cacheService.ts
export class CacheService {
  async get<T>(key: string): Promise<T | null>;
  async set<T>(key: string, value: T, ttl?: number): Promise<void>;
  async invalidate(pattern: string): Promise<void>;
}
```

## 📦 エクスポート規則

### **Barrel Exports**

```typescript
// services/index.ts
export { GoogleSheetsService } from "./sheets";
export { GoogleMapsService } from "./maps";
export { AnalyticsService } from "./analytics";

// 型定義
export type { DataService, ServiceConfig, ServiceError } from "./types";
```

### **使用時**

```typescript
// ✅ 推奨
import { GoogleSheetsService } from "@/services";

// ❌ 非推奨
import { GoogleSheetsService } from "@/services/sheets/sheetsService";
```

## 📚 参考資料

- [Google Sheets API v4](https://developers.google.com/sheets/api)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Fetch API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**📝 最終更新**: 2025 年 8 月 8 日  
**🔄 次回更新**: 新サービス追加時  
**👥 レビュー**: 開発チーム全体
