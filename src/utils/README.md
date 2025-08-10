# Utils Layer - ユーティリティ関数群

佐渡飲食店マップアプリケーションのユーティリティ関数層です。アプリケーション全体で使用される汎用的な機能を提供します。

## 📁 ディレクトリ構成

```
src/utils/
├── analytics.ts        # Google Analytics 4 統合
├── districtUtils.ts    # 佐渡島地区分類システム
├── lightValidation.ts  # 軽量バリデーション（Zod代替）
├── securityUtils.ts    # セキュリティユーティリティ
└── README.md          # このファイル
```

## 🛠️ ユーティリティファイル概要

### 📊 Analytics (`analytics.ts`)
Google Analytics 4との統合を提供し、ユーザー行動の追跡と分析を行います。

**主な機能:**
- **GA4初期化**: 環境変数からの自動設定
- **イベント追跡**: カスタムイベントの送信
- **専用イベント**: 飲食店クリック、検索、フィルタリング、地図操作
- **PWA追跡**: インストールとスタンドアロンモード
- **デバッグツール**: 開発環境での診断機能

**主要な関数:**
```typescript
// 初期化
initGA(): Promise<void>

// 基本イベント追跡
trackEvent(eventName: string, parameters: Record<string, unknown>): void

// 専用イベント
trackRestaurantClick(restaurant: RestaurantData): void
trackSearch(query: string, resultCount: number): void
trackFilter(filterType: string, filterValue: string): void
trackMapInteraction(action: "zoom" | "pan" | "marker_click"): void
trackPWAUsage(action: "install" | "standalone_mode"): void

// デバッグ機能（開発環境限定）
runGADiagnostics(): void
checkGAStatus(): void
```

### 🗺️ District Utils (`districtUtils.ts`)
佐渡島の11地区への住所分類システムを提供します。

**対応地区:**
- 両津、相川、佐和田、金井、新穂、畑野、真野、小木、羽茂、赤泊、その他

**主な機能:**
- **住所解析**: 住所文字列からの地区自動判定
- **地区正規化**: 入力された地区名の標準化
- **バリデーション**: 地区名の有効性チェック

**主要な関数:**
```typescript
// 住所から地区を判定
getDistrictFromAddress(address: string): SadoDistrict

// 地区名の正規化
normalizeDistrict(district: string): SadoDistrict

// 地区の有効性チェック
isValidDistrict(district: string): district is SadoDistrict

// 全地区リスト取得
getAllDistricts(): readonly SadoDistrict[]
```

### ✅ Light Validation (`lightValidation.ts`)
TypeScriptネイティブな型ガードを提供し、Zodの軽量代替として機能します。

**主な機能:**
- **基本型ガード**: string、number、array、objectの検証
- **ドメイン型ガード**: CuisineType、PriceRange、SadoDistrict
- **座標検証**: LatLngLiteralの形式チェック
- **レストランデータ検証**: 完全なRestaurantオブジェクトの検証
- **セキュリティ検証**: APIキー、検索クエリのバリデーション
- **エラー詳細**: ValidationErrorクラスによる詳細なエラー情報

**主要な関数:**
```typescript
// 基本型ガード
isString(value: unknown): value is string
isNumber(value: unknown): value is number
isArray(value: unknown): value is unknown[]

// ドメイン型ガード
isCuisineType(value: unknown): value is CuisineType
isPriceRange(value: unknown): value is PriceRange
isSadoDistrict(value: unknown): value is SadoDistrict
isLatLngLiteral(value: unknown): value is LatLngLiteral

// 複合型検証
isRestaurant(value: unknown): value is Restaurant
validateRestaurant(value: unknown): ValidationError[]

// セキュリティ関連
isValidApiKey(value: unknown): value is string
sanitizeInput(input: string): string
isValidSearchQuery(value: unknown): value is string
```

### 🔒 Security Utils (`securityUtils.ts`)
アプリケーションのセキュリティ機能を提供します。

**主な機能:**
- **XSS対策**: HTMLエスケープとタグ除去
- **入力サニタイゼーション**: ユーザー入力の無害化
- **URL検証**: 安全なURLのチェック
- **レート制限**: API呼び出しの制限
- **安全なストレージ**: SecureStorageクラス
- **セキュアフェッチ**: 安全なHTTPリクエスト

**主要な関数とクラス:**
```typescript
// XSS対策
escapeHtml(text: string): string
stripHtml(text: string): string

// 入力検証・サニタイゼーション
sanitizeUserInput(input: string): string
isSecureUrl(url: string): boolean
validateApiKey(apiKey: string | undefined): boolean

// レート制限
class RateLimiter {
  isAllowed(identifier: string): boolean
  getRemainingRequests(identifier: string): number
}

// 安全なストレージ
class SecureStorage {
  static setItem(key: string, value: unknown): void
  static getItem<T>(key: string, defaultValue: T): T
}

// セキュアHTTPリクエスト
secureFetch(url: string, options?: RequestInit): Promise<Response>

// その他のセキュリティ機能
generateNonce(): string
generateCSRFToken(): string
maskApiKey(apiKey: string): string
```

## 🏗️ アーキテクチャ原則

### 1. **型安全性**
- TypeScriptの型システムを最大限活用
- 実行時型チェックによる堅牢性
- 型ガードによる安全な型変換

### 2. **セキュリティファースト**
- XSS、CSRF攻撃対策
- 入力値の厳格な検証とサニタイゼーション
- レート制限によるDoS攻撃対策
- 機密情報の適切な取り扱い

### 3. **パフォーマンス最適化**
- 軽量なバリデーション（Zod代替）
- 効率的な地区判定アルゴリズム
- レート制限による負荷制御

### 4. **開発者体験**
- 豊富なデバッグツール（GA診断機能）
- 詳細なエラーメッセージ
- TypeScriptの型推論サポート

## 🔧 開発ツール

### Google Analytics デバッグ
開発環境でのGA動作確認用のデバッグ機能:

```typescript
// ブラウザコンソールで利用可能（開発環境のみ）
window.gaDebug.runDiagnostics()  // GA診断実行
window.gaDebug.checkStatus()     // GA状態確認
window.gaDebug.sendTestEvents()  // テストイベント送信
window.gaDebug.autoFix()         // 自動修復試行
```

### バリデーションエラー詳細
詳細なバリデーションエラー情報の取得:

```typescript
const errors = validateRestaurant(data);
errors.forEach(error => {
  console.log(`Field: ${error.field}, Message: ${error.message}`);
});
```

## 🧪 テスト戦略

### 単体テスト
- 各ユーティリティ関数の個別テスト
- 型ガード関数の境界値テスト
- セキュリティ関数の攻撃パターンテスト

### 統合テスト
- GA初期化とイベント送信の統合テスト
- 地区判定の実際の住所データでのテスト
- セキュリティ機能の実際の攻撃シナリオテスト

### テスト例
```typescript
import { describe, it, expect } from 'vitest';
import { getDistrictFromAddress, isRestaurant } from '@/utils';

describe('districtUtils', () => {
  it('should correctly identify district from address', () => {
    expect(getDistrictFromAddress('新潟県佐渡市両津夷')).toBe('両津');
    expect(getDistrictFromAddress('新潟県佐渡市相川下戸村')).toBe('相川');
  });
});

describe('lightValidation', () => {
  it('should validate restaurant data', () => {
    const validRestaurant = {
      id: '1',
      name: 'テストレストラン',
      // ... other required fields
    };
    expect(isRestaurant(validRestaurant)).toBe(true);
  });
});
```

## 📚 使用例

### 基本的な使用方法
```typescript
import {
  initGA,
  trackRestaurantClick,
  getDistrictFromAddress,
  isRestaurant,
  sanitizeUserInput,
  SecureStorage
} from '@/utils';

// GA初期化
await initGA();

// 地区判定
const district = getDistrictFromAddress('新潟県佐渡市両津夷123');

// データ検証
if (isRestaurant(data)) {
  // 安全にRestaurantとして使用可能
  trackRestaurantClick(data);
}

// 入力サニタイゼーション
const cleanInput = sanitizeUserInput(userInput);

// 安全なストレージ操作
SecureStorage.setItem('userPreferences', preferences);
```

### 高度な使用例
```typescript
import { 
  validateRestaurant, 
  secureFetch, 
  apiRateLimiter,
  runGADiagnostics 
} from '@/utils';

// 詳細バリデーション
const errors = validateRestaurant(restaurantData);
if (errors.length === 0) {
  // データが有効
  processRestaurant(restaurantData as Restaurant);
} else {
  // エラー処理
  handleValidationErrors(errors);
}

// レート制限付きAPI呼び出し
if (apiRateLimiter.isAllowed(userId)) {
  const response = await secureFetch('/api/restaurants');
  // 処理続行
} else {
  // レート制限エラー
  showRateLimitError();
}

// 開発環境でのGA診断
if (import.meta.env.DEV) {
  runGADiagnostics();
}
```

## 🚀 拡張ポイント

### 新しいユーティリティの追加
1. **新しいバリデーション関数**: `lightValidation.ts`に追加
2. **新しいセキュリティ機能**: `securityUtils.ts`に追加
3. **新しい分析イベント**: `analytics.ts`に追加
4. **新しい地区**: `districtUtils.ts`のキーワードマッピングに追加

### パフォーマンス最適化
- 地区判定アルゴリズムの最適化
- バリデーション関数のキャッシュ機能
- セキュリティチェックの並列化

## 🔗 関連ドキュメント

- [Types Layer](../types/README.md) - 型定義システム
- [Services Layer](../services/README.md) - サービス層アーキテクチャ
- [Test Infrastructure](../test/README.md) - テスト基盤

---

**Note**: このユーティリティ層は、アプリケーション全体の基盤となる重要なコンポーネントです。変更時は十分なテストを実施し、セキュリティ面での影響を慎重に検討してください。
