# Testing Guide - Test Helpers使用ガイド

**Last Updated**: 2026年1月4日
**Version**: 1.0

このドキュメントは、プロジェクトのテストヘルパー（Test Helpers）の使用方法と、効率的なテスト作成のベストプラクティスを提供します。

---

## 目次

1. [概要](#概要)
2. [Test Helpersの構成](#test-helpersの構成)
3. [基本的な使い方](#基本的な使い方)
4. [各ヘルパーの詳細](#各ヘルパーの詳細)
5. [実践例](#実践例)
6. [トラブルシューティング](#トラブルシューティング)
7. [参考情報](#参考情報)

---

## 概要

### Test Helpersとは

Test Helpersは、テストコードのボイラープレート（定型コード）を削減し、テストの可読性と保守性を向上させるユーティリティ群です。

### 導入効果

**実績（useFilterHandlers.test.ts）**:

- **総行数**: 746行 → 612行（**-134行、18%削減**）
- **setup部分**: 50行 → 27行（**54%削減**）
- **テスト結果**: 31/31通過（100%）

### 主な機能

- ✅ console spy自動設定
- ✅ 環境変数管理
- ✅ React Testing Library統合
- ✅ モックオブジェクト生成
- ✅ 型安全な設計

---

## Test Helpersの構成

Test Helpersは4つのモジュールで構成されています：

```
src/test/helpers/
├── testEnv.ts         # テスト環境セットアップ
├── renderHelpers.ts   # React Testing Library統合
├── mockHelpers.ts     # モックオブジェクト生成
└── index.ts           # Barrel export
```

### ファイル構成

| ファイル           | 行数      | 主な機能                      | テスト数 |
| ------------------ | --------- | ----------------------------- | -------- |
| `testEnv.ts`       | 144行     | console spy、環境変数         | 8        |
| `renderHelpers.ts` | 109行     | React wrapper、モックリセット | -        |
| `mockHelpers.ts`   | 197行     | モックファクトリ              | 12       |
| `index.ts`         | 30行      | エクスポート                  | -        |
| **合計**           | **480行** | -                             | **20**   |

---

## 基本的な使い方

### Before: 従来の書き方

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

describe("useFilterHandlers", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  const mockFilters: ExtendedMapFilters = {
    cuisineTypes: [],
    priceRanges: [],
    districts: [],
    features: [],
    searchQuery: "",
    openNow: false,
    pointTypes: ["restaurant", "parking", "toilet"],
    minRating: undefined,
  };

  const mockUpdateFilters = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("DEV", true);
    vi.stubEnv("PROD", false);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    vi.unstubAllEnvs();
    mockUpdateFilters.mockClear();
    mockOnError.mockClear();
  });

  // ... テスト本体
});
```

**問題点**:

- 50行の冗長なsetup/teardownコード
- モック宣言が分散
- console spy管理が煩雑
- 環境変数管理が手動

### After: Test Helpers使用

```typescript
import { autoSetupTestEnv, createMockFilterHandlers, createMockFilters, resetMocks } from "@/test/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

describe("useFilterHandlers", () => {
  const testEnv = autoSetupTestEnv();
  const mockFilters = createMockFilters();
  const { mockUpdateFilters, mockOnError } = createMockFilterHandlers();

  beforeEach(() => {
    resetMocks(mockUpdateFilters, mockOnError);
  });

  // ... テスト本体
});
```

**改善点**:

- ✅ 27行に削減（**54%削減**）
- ✅ imports明確化
- ✅ 自動的なsetup/teardown
- ✅ 型安全性向上

---

## 各ヘルパーの詳細

### 1. testEnv.ts - テスト環境セットアップ

#### `autoSetupTestEnv()`

**用途**: beforeEach/afterEachを自動設定

```typescript
const testEnv = autoSetupTestEnv({
  isDev: true, // DEV環境（デフォルト: true）
  suppressConsoleError: false, // console.error抑制（デフォルト: false）
  envVars: {
    // カスタム環境変数
    CUSTOM_VAR: "value",
  },
});
```

**戻り値**:

```typescript
interface TestEnv {
  consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  consoleLogSpy: ReturnType<typeof vi.spyOn>;
  consoleInfoSpy: ReturnType<typeof vi.spyOn>;
}
```

**使用例**:

```typescript
describe("MyComponent", () => {
  const testEnv = autoSetupTestEnv();

  it("should log warning", () => {
    // テストコード
    expect(testEnv.current?.consoleWarnSpy).toHaveBeenCalledWith("Warning!");
  });
});
```

#### `setupTestEnv(options)` / `cleanupTestEnv(testEnv)`

**用途**: 手動でsetup/teardownを制御

```typescript
describe("MyComponent", () => {
  let testEnv: TestEnv;

  beforeEach(() => {
    testEnv = setupTestEnv({ isDev: true });
  });

  afterEach(() => {
    cleanupTestEnv(testEnv);
  });
});
```

---

### 2. renderHelpers.ts - React Testing Library統合

#### `renderWithTestWrapper(ui, options)`

**用途**: カスタムwrapperでコンポーネントをレンダリング

```typescript
import { renderWithTestWrapper } from "@/test/helpers";

it("renders with wrapper", () => {
  const { getByText } = renderWithTestWrapper(<MyComponent />, {
    wrapper: ({ children }) => <Provider>{children}</Provider>,
  });

  expect(getByText("Hello")).toBeInTheDocument();
});
```

#### `renderHookWithTestWrapper(hook, options)`

**用途**: カスタムwrapperでhookをテスト

```typescript
import { renderHookWithTestWrapper } from "@/test/helpers";

it("uses hook with wrapper", () => {
  const { result } = renderHookWithTestWrapper(() => useMyHook(), {
    wrapper: ({ children }) => <Provider>{children}</Provider>,
  });

  expect(result.current.value).toBe(42);
});
```

#### `resetMocks(...mocks)`

**用途**: 複数のモックを一括リセット

```typescript
import { resetMocks } from "@/test/helpers";

beforeEach(() => {
  resetMocks(mockFn1, mockFn2, mockFn3);
});
```

---

### 3. mockHelpers.ts - モックオブジェクト生成

#### `createMockFilters(overrides?)`

**用途**: ExtendedMapFilters型のモック生成

```typescript
const mockFilters = createMockFilters({
  cuisineTypes: ["日本料理"],
  openNow: true,
});
```

#### `createMockRestaurant(overrides?)`

**用途**: Restaurant型のモック生成（型安全）

```typescript
const mockRestaurant = createMockRestaurant({
  name: "Test Restaurant",
  cuisineType: "日本料理",
  coordinates: { lat: 35.6762, lng: 139.6503 },
});
```

**型対応**:

- ✅ `type: "restaurant" as const`
- ✅ `cuisineType`（not `cuisine`）
- ✅ `coordinates: { lat, lng }`（not flat properties）
- ✅ `openingHours: OpeningHours[]`（not string）

#### `createMockMapPoint(overrides?)`

**用途**: MapPoint union型のモック生成

```typescript
const mockMapPoint = createMockMapPoint({
  type: "restaurant",
  name: "Test Point",
});
```

#### `createMockFilterHandlers()`

**用途**: フィルターハンドラーのモック生成

```typescript
const { mockUpdateFilters, mockOnError } = createMockFilterHandlers();

// テスト内で使用
expect(mockUpdateFilters).toHaveBeenCalledWith({ cuisineTypes: ["日本料理"] });
expect(mockOnError).not.toHaveBeenCalled();
```

#### Google Maps関連モック

```typescript
// Google Map mock
const mockMap = createMockGoogleMap();

// Google Marker mock
const mockMarker = createMockGoogleMarker();

// Google Maps API mock
const mockApi = getGoogleMapsApiMock();
```

#### `clearMockLocalStorage()`

**用途**: localStorage モックのクリア

```typescript
beforeEach(() => {
  clearMockLocalStorage();
});
```

---

## 実践例

### 例1: フィルターHookのテスト

```typescript
import { autoSetupTestEnv, createMockFilterHandlers, createMockFilters, resetMocks } from "@/test/helpers";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFilterHandlers } from "../useFilterHandlers";

describe("useFilterHandlers", () => {
  const testEnv = autoSetupTestEnv();
  const mockFilters = createMockFilters();
  const { mockUpdateFilters, mockOnError } = createMockFilterHandlers();

  beforeEach(() => {
    resetMocks(mockUpdateFilters, mockOnError);
  });

  it("有効な料理タイプでフィルターを更新する", () => {
    const { result } = renderHook(() =>
      useFilterHandlers({
        filters: mockFilters,
        updateFilters: mockUpdateFilters,
        onError: mockOnError,
      })
    );

    act(() => {
      result.current.handleCuisineFilter("日本料理");
    });

    expect(mockUpdateFilters).toHaveBeenCalledWith({
      cuisineTypes: ["日本料理"],
    });
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it("無効な料理タイプで警告を出力する（DEV環境）", () => {
    const { result } = renderHook(() =>
      useFilterHandlers({
        filters: mockFilters,
        updateFilters: mockUpdateFilters,
        onError: mockOnError,
      })
    );

    act(() => {
      result.current.handleCuisineFilter(123 as any);
    });

    expect(testEnv.current?.consoleWarnSpy).toHaveBeenCalled();
    expect(mockUpdateFilters).not.toHaveBeenCalled();
  });
});
```

### 例2: コンポーネントのテスト

```typescript
import { renderWithTestWrapper, createMockRestaurant } from "@/test/helpers";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RestaurantCard } from "../RestaurantCard";

describe("RestaurantCard", () => {
  it("レストラン情報を表示する", () => {
    const mockRestaurant = createMockRestaurant({
      name: "Test Restaurant",
      cuisineType: "日本料理",
    });

    renderWithTestWrapper(<RestaurantCard restaurant={mockRestaurant} />);

    expect(screen.getByText("Test Restaurant")).toBeInTheDocument();
    expect(screen.getByText("日本料理")).toBeInTheDocument();
  });
});
```

---

## トラブルシューティング

### Q1: `consoleWarnSpy is not defined`エラー

**原因**: `consoleWarnSpy`を直接参照している

**解決策**: `testEnv.current`経由で参照

```typescript
// ❌ Bad
expect(consoleWarnSpy).toHaveBeenCalled();

// ✅ Good
expect(testEnv.current?.consoleWarnSpy).toHaveBeenCalled();
```

### Q2: モックが前のテストの状態を保持している

**原因**: beforeEachでモックをリセットしていない

**解決策**: `resetMocks()`を使用

```typescript
beforeEach(() => {
  resetMocks(mockUpdateFilters, mockOnError);
});
```

### Q3: 環境変数が期待通りに設定されない

**原因**: `vi.stubEnv`は文字列のみ受け付ける

**解決策**: Test Helpersが自動的に`String()`変換

```typescript
// Test Helpers内部で自動変換
vi.stubEnv(key, String(value)); // boolean → "true"/"false"
```

### Q4: Restaurant型エラー

**原因**: 古い型定義を使用している

**解決策**: `createMockRestaurant()`を使用（型安全）

```typescript
// ✅ Good
const mock = createMockRestaurant({
  cuisineType: "日本料理", // not "cuisine"
  coordinates: { lat, lng }, // not flat lat/lng
  openingHours: [], // not string
});
```

---

## 参考情報

### 関連ドキュメント

- [TASKS.md](../tasks/TASKS.md) - タスク管理
- [SHARED_GLOSSARY.md](../guidelines/SHARED_GLOSSARY.md) - 用語・品質基準

### 型定義

```typescript
// src/test/helpers/testEnv.ts
interface TestEnv {
  consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  consoleLogSpy: ReturnType<typeof vi.spyOn>;
  consoleInfoSpy: ReturnType<typeof vi.spyOn>;
}

interface SetupTestEnvOptions {
  isDev?: boolean;
  suppressConsoleError?: boolean;
  envVars?: Record<string, string | boolean>;
}
```

### ベストプラクティス

1. **常に`autoSetupTestEnv()`を使用**
   - beforeEach/afterEachを自動管理
   - console spyの一貫性確保

2. **モックファクトリを活用**
   - `createMock*()` で型安全なモック生成
   - overridesで必要な部分のみカスタマイズ

3. **beforeEachで状態リセット**
   - `resetMocks()`で確実にクリーンな状態
   - テスト間の独立性確保

4. **console spy参照は`testEnv.current`経由**
   - `testEnv.current?.consoleWarnSpy`
   - オプショナルチェーンで安全性確保

### 削減効果の目安

| テストファイルサイズ | 期待削減行数 | 期待削減率 |
| -------------------- | ------------ | ---------- |
| 200-500行            | 30-50行      | 10-15%     |
| 500-800行            | 50-150行     | 15-20%     |
| 800行以上            | 100-200行    | 15-25%     |

**実績**: useFilterHandlers.test.ts（746行）で **134行削減（18%）** を達成

---

**Last Updated**: 2026年1月4日
**Version**: 1.0
**Author**: Dev Team
**Review Status**: ✅ Approved
