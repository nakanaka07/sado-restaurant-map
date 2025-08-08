# 🛠️ Utilities Reference

> **目的**: 佐渡飲食店マップアプリケーションのユーティリティ関数リファレンス  
> **更新日**: 2025 年 8 月 8 日

## 📁 ディレクトリ構造

```text
utils/
├── analytics.ts           # Google Analytics関連
├── districtUtils.ts       # 佐渡島地区分類
├── lightValidation.ts     # 軽量バリデーション
├── district/              # 地区関連詳細
├── security/              # セキュリティ関連
├── validation/            # バリデーション詳細
└── index.ts              # barrel export
```

## 🎯 設計方針

### 1. **純粋関数優先**

副作用のない、テスト可能な関数を基本とする

```typescript
// ✅ 純粋関数
const formatPrice = (price: number): string => {
  return `¥${price.toLocaleString()}`;
};

// ❌ 副作用あり
const logAndFormatPrice = (price: number): string => {
  console.log(price); // 副作用
  return `¥${price.toLocaleString()}`;
};
```

### 2. **型安全性**

厳格な型定義とガード関数

```typescript
// 型ガード関数
export const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

// 型安全な変換
export const parseNumber = (value: unknown): number | null => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};
```

### 3. **パフォーマンス**

計算量とメモリ使用量を意識した実装

```typescript
// 効率的な検索
const DISTRICT_KEYWORDS = new Map([
  ["両津", "両津"],
  ["相川", "相川"],
  // ... マップによる高速検索
]);

export const getDistrictFromAddress = memoize(
  (address: string): SadoDistrict => {
    // メモ化による性能向上
  }
);
```

## 📚 ユーティリティ詳細

### **analytics.ts**

Google Analytics 関連の機能

#### **主要関数**

```typescript
// Google Analytics初期化
export const initGA = (measurementId: string): void

// イベントトラッキング
export const trackEvent = (action: string, category: string, label?: string): void

// ページビュートラッキング
export const trackPageView = (path: string): void

// GA状態チェック
export const checkGAStatus = (): boolean
```

#### **使用例**

```typescript
import { initGA, trackEvent } from "@/utils/analytics";

// アプリ初期化時
initGA("G-XXXXXXXXXX");

// ユーザーアクション時
trackEvent("search", "restaurant", searchQuery);
trackEvent("click", "restaurant_card", restaurant.name);
```

### **districtUtils.ts**

佐渡島の地区分類機能

#### **主要関数**

```typescript
// 住所から地区を判定
export const getDistrictFromAddress = (address: string): SadoDistrict

// 地区名の正規化
export const normalizeDistrict = (district: string): SadoDistrict

// 地区一覧取得
export const getAllDistricts = (): SadoDistrict[]
```

#### **地区マッピング**

```typescript
const DISTRICT_KEYWORDS: Record<string, SadoDistrict> = {
  // 両津地区
  両津: "両津",
  夷: "両津",
  湊: "両津",

  // 相川地区
  相川: "相川",
  下戸炭目: "相川",
  上戸炭目: "相川",

  // ... 全11地区のマッピング
};
```

#### **使用例**

```typescript
import { getDistrictFromAddress } from "@/utils/districtUtils";

// 住所から地区を判定
const district = getDistrictFromAddress("新潟県佐渡市両津夷261");
// => "両津"

const unknownDistrict = getDistrictFromAddress("東京都渋谷区");
// => "その他"
```

### **lightValidation.ts**

Zod の代替軽量バリデーション

#### **基本型ガード**

```typescript
// プリミティブ型
export const isString = (value: unknown): value is string
export const isNumber = (value: unknown): value is number
export const isArray = (value: unknown): value is unknown[]
export const isObject = (value: unknown): value is Record<string, unknown>
```

#### **ドメイン特化バリデーション**

```typescript
// 料理タイプバリデーション
export const isCuisineType = (value: unknown): value is CuisineType

// 価格帯バリデーション
export const isPriceRange = (value: unknown): value is PriceRange

// 座標バリデーション
export const isLatLngLiteral = (value: unknown): value is LatLngLiteral

// 飲食店データバリデーション
export const isRestaurant = (value: unknown): value is Restaurant
```

#### **エラーハンドリング**

```typescript
interface ValidationError {
  field: string;
  message: string;
  value: unknown;
}

export const createValidationError = (
  field: string,
  message: string,
  value: unknown
): ValidationError => ({
  field,
  message,
  value,
});
```

#### **使用例**

```typescript
import { isRestaurant, validateRestaurantData } from "@/utils/lightValidation";

// 型ガード使用
if (isRestaurant(data)) {
  // data は Restaurant 型として扱える
  console.log(data.name);
}

// バリデーション使用
const result = validateRestaurantData(unknownData);
if (result.isValid) {
  // result.data は Restaurant 型
} else {
  // result.errors は ValidationError[]
}
```

## 🔒 セキュリティユーティリティ

### **security/securityUtils.ts**

```typescript
// 入力サニタイゼーション
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, "") // HTMLタグ除去
    .substring(0, 1000); // 長さ制限
};

// APIキーバリデーション
export const validateApiKey = (key: string): boolean => {
  return /^AIza[0-9A-Za-z-_]{35}$/.test(key);
};

// XSS防止
export const escapeHtml = (text: string): string => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};
```

## 🧪 テスト戦略

### **単体テスト例**

```typescript
import { getDistrictFromAddress } from "./districtUtils";

describe("districtUtils", () => {
  describe("getDistrictFromAddress", () => {
    test("両津地区の判定", () => {
      expect(getDistrictFromAddress("佐渡市両津夷261")).toBe("両津");
      expect(getDistrictFromAddress("新潟県佐渡市夷")).toBe("両津");
    });

    test("相川地区の判定", () => {
      expect(getDistrictFromAddress("佐渡市相川一町目")).toBe("相川");
      expect(getDistrictFromAddress("相川下戸村")).toBe("相川");
    });

    test("不明な住所の処理", () => {
      expect(getDistrictFromAddress("東京都渋谷区")).toBe("その他");
      expect(getDistrictFromAddress("")).toBe("その他");
    });

    test("住所正規化の動作", () => {
      expect(getDistrictFromAddress("新潟県佐渡市両津夷261")).toBe(
        getDistrictFromAddress("佐渡市両津夷261")
      );
    });
  });
});
```

### **プロパティベーステスト**

```typescript
import { fc, test } from "@fast-check/vitest";

test("sanitizeInput は常に安全な文字列を返す", () => {
  fc.assert(
    fc.property(fc.string(), (input) => {
      const result = sanitizeInput(input);
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
      expect(result.length).toBeLessThanOrEqual(1000);
    })
  );
});
```

## 🚀 パフォーマンス最適化

### **メモ化**

```typescript
// LRUキャッシュ実装
class LRUCache<K, V> {
  private cache = new Map<K, V>();

  constructor(private maxSize: number) {}

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 最近使用したアイテムを末尾に移動
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 最も古いアイテムを削除
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// メモ化ヘルパー
export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  cacheSize = 100
): T => {
  const cache = new LRUCache<string, ReturnType<T>>(cacheSize);

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};
```

### **デバウンス/スロットル**

```typescript
// デバウンス
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// スロットル
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;

  return (...args: Parameters<T>) => {
    if (!lastRan) {
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};
```

## 📦 エクスポート規則

### **Barrel Export**

```typescript
// utils/index.ts
export * from "./analytics";
export * from "./districtUtils";
export * from "./lightValidation";
export * from "./district";
export * from "./security";
export * from "./validation";
```

### **使用時**

```typescript
// ✅ 推奨
import { getDistrictFromAddress, sanitizeInput, trackEvent } from "@/utils";

// ❌ 非推奨
import { getDistrictFromAddress } from "@/utils/districtUtils";
import { sanitizeInput } from "@/utils/security/securityUtils";
```

## 🔮 将来の拡張予定

### **formatting/ - フォーマット関連**

```typescript
// 日時フォーマット
export const formatDate = (date: Date, locale = 'ja-JP'): string
export const formatTime = (time: string): string

// 通貨フォーマット
export const formatPrice = (price: number): string
export const formatPriceRange = (range: PriceRange): string

// 住所フォーマット
export const formatAddress = (address: string): string
export const formatPostalCode = (code: string): string
```

### **calculation/ - 計算関連**

```typescript
// 距離計算
export const calculateDistance = (
  point1: LatLngLiteral,
  point2: LatLngLiteral
): number

// 評価計算
export const calculateAverageRating = (reviews: Review[]): number
export const calculateRecommendationScore = (restaurant: Restaurant): number
```

### **storage/ - ストレージ関連**

```typescript
// LocalStorage ヘルパー
export const localStorage = {
  get: <T>(key: string): T | null,
  set: <T>(key: string, value: T): void,
  remove: (key: string): void,
  clear: (): void
};

// SessionStorage ヘルパー
export const sessionStorage = {
  // 同様のAPI
};
```

## 📚 参考資料

- [TypeScript Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [JavaScript Performance Best Practices](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Google Analytics 4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)

---

**📝 最終更新**: 2025 年 8 月 8 日  
**🔄 次回更新**: 新ユーティリティ追加時  
**👥 レビュー**: 開発チーム全体
