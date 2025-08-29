# Test Mocks

## 概要

このディレクトリは、佐渡島レストランマップアプリケーションの**テスト用モック実装**を提供します。外部依存関係やブラウザAPI、PWA機能をモック化し、単体テストと統合テストの実行を可能にします。

## ファイル構成

### `pwa-register.ts`

- **PWAレジスターモック** - Service Worker登録機能のモック実装
- **サイズ**: 312バイト - 軽量なPWA機能モック
- **対象**: `vite-plugin-pwa`の`useRegisterSW`フック

## モック実装詳細

### PWA Register Mock

#### 基本実装

```typescript
import { vi } from "vitest";

export const useRegisterSW = vi.fn(() => ({
  needRefresh: [false, vi.fn()],
  offlineReady: [false, vi.fn()],
  updateServiceWorker: vi.fn(() => Promise.resolve()),
}));
```text

#### 機能説明

- **`needRefresh`** - アプリ更新が必要かどうかの状態とセッター
- **`offlineReady`** - オフライン準備完了状態とセッター
- **`updateServiceWorker`** - Service Worker更新関数のモック

#### 使用場面

- PWAコンポーネントの単体テスト
- Service Worker関連機能のテスト
- オフライン状態のシミュレーション

## テストセットアップとの連携

### Global Setup (`../setup.ts`)

#### 環境変数モック

```typescript
process.env.VITE_GA_MEASUREMENT_ID = "G-TEST123456";
process.env.VITE_GOOGLE_MAPS_API_KEY = "TEST_API_KEY";
process.env.VITE_GOOGLE_SHEETS_API_KEY = "test-sheets-api-key";
process.env.VITE_SPREADSHEET_ID = "test-spreadsheet-id";
```text

#### Google Maps API モック

```typescript
const mockGoogle: MockGoogleMaps = {
  maps: {
    MapTypeId: { ROADMAP: 'roadmap', SATELLITE: 'satellite' },
    Map: vi.fn(),
    Marker: vi.fn(),
    InfoWindow: vi.fn(),
    LatLng: vi.fn(),
    event: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
};
```text

#### LocalStorage モック

```typescript
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: vi.fn(),
  key: vi.fn(),
};
```text

## モック戦略

### 1. 外部API依存関係

#### Google Sheets API

- **fetch関数のモック** - API呼び出しのシミュレーション
- **レスポンスデータ** - 実際のスプレッドシート構造を模倣
- **エラーシナリオ** - 403, 404, 500エラーの再現

#### Google Maps API

- **地図コンポーネント** - 地図表示機能のモック
- **マーカー操作** - マーカー追加・削除のシミュレーション
- **イベントハンドリング** - クリック、ドラッグイベントのモック

### 2. ブラウザAPI

#### Service Worker

- **登録プロセス** - SW登録のライフサイクルモック
- **更新通知** - アプリ更新検知のシミュレーション
- **オフライン状態** - ネットワーク状態の制御

#### LocalStorage

- **データ永続化** - キャッシュ機能のテスト
- **容量制限** - ストレージ制限のシミュレーション
- **データ整合性** - 保存・取得の正確性検証

### 3. PWA機能

#### App Install

- **インストール促進** - PWAインストールバナーのモック
- **インストール状態** - アプリインストール済み判定
- **プラットフォーム検知** - iOS/Android判定のモック

## 使用例

### PWAコンポーネントテスト

```typescript
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import PWABadge from '@/components/PWABadge';

// モックのカスタマイズ
vi.mock('@/test/mocks/pwa-register', () => ({
  useRegisterSW: vi.fn(() => ({
    needRefresh: [true, vi.fn()], // 更新が必要な状態
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(() => Promise.resolve()),
  })),
}));

describe('PWABadge', () => {
  it('should show update notification when refresh needed', () => {
    render(<PWABadge />);
    expect(screen.getByText(/更新が利用可能/)).toBeInTheDocument();
  });
});
```text

### Google Maps コンポーネントテスト

```typescript
import { render } from '@testing-library/react';
import MapComponent from '@/components/MapComponent';

describe('MapComponent', () => {
  it('should initialize map with correct options', () => {
    render(<MapComponent />);
    
    // Google Maps API モックの呼び出し確認
    expect(window.google.maps.Map).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        zoom: 12,
        center: { lat: 38.0186, lng: 138.3672 },
      })
    );
  });
});
```text

### API呼び出しテスト

```typescript
import { vi } from 'vitest';
import { fetchRestaurantsFromSheets } from '@/services/sheets';

// fetch APIのモック
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      values: [
        ['Header'],
        ['Restaurant1', 'Address1', '38.0186', '138.3672'],
      ],
    }),
  })
) as any;

describe('Sheets Service', () => {
  it('should fetch restaurant data successfully', async () => {
    const restaurants = await fetchRestaurantsFromSheets();
    expect(restaurants).toHaveLength(1);
    expect(restaurants[0].name).toBe('Restaurant1');
  });
});
```text

## モック管理戦略

### 1. モックの分類

#### Static Mocks

- **固定データ** - 常に同じレスポンスを返すモック
- **設定ファイル** - 環境変数やAPI設定のモック
- **ユーティリティ** - 共通的なヘルパー関数のモック

#### Dynamic Mocks

- **状態管理** - テストケースに応じて動作を変更
- **シナリオベース** - 複数の実行パターンを持つモック
- **時間依存** - 時刻や期間に依存する処理のモック

### 2. モックの更新戦略

#### 実装追従

- **API変更対応** - 外部APIの仕様変更への追従
- **型定義更新** - TypeScript型定義の同期
- **機能拡張** - 新機能追加時のモック拡張

#### データ整合性

- **実データ反映** - 本番データ構造の反映
- **エッジケース** - 異常系データパターンの追加
- **パフォーマンス** - 大量データ処理のシミュレーション

## テスト環境設定

### Vitest設定との連携

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['src/test/setup.ts'],
    environment: 'jsdom',
    globals: true,
  },
});
```text

### モック自動適用

```typescript
// setup.ts内での自動モック設定
vi.mock('virtual:pwa-register/react', () => 
  import('./mocks/pwa-register')
);
```text

## デバッグとトラブルシューティング

### よくある問題

#### 1. モックが適用されない

```typescript
// 解決方法: モックの読み込み順序を確認
vi.mock('./module', () => ({ ... })); // テストファイルの最上部
```text

#### 2. 非同期処理のテスト

```typescript
// 解決方法: 適切な待機処理
await waitFor(() => {
  expect(mockFunction).toHaveBeenCalled();
});
```text

#### 3. モック状態のリセット

```typescript
// 各テスト前にモック状態をクリア
beforeEach(() => {
  vi.clearAllMocks();
});
```text

### デバッグ技法

#### モック呼び出し確認

```typescript
// モック関数の呼び出し履歴確認
console.log(mockFunction.mock.calls);
console.log(mockFunction.mock.results);
```text

#### 実行時モック状態

```typescript
// モックの現在状態を確認
expect(mockFunction).toHaveBeenCalledTimes(1);
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
```text

## 拡張ポイント

### 新しいモックの追加

#### 1. 外部サービスモック

```typescript
// src/test/mocks/external-service.ts
export const mockExternalService = {
  getData: vi.fn(() => Promise.resolve(mockData)),
  postData: vi.fn(() => Promise.resolve({ success: true })),
};
```text

#### 2. カスタムフックモック

```typescript
// src/test/mocks/custom-hooks.ts
export const useCustomHook = vi.fn(() => ({
  data: mockData,
  loading: false,
  error: null,
}));
```text

#### 3. コンポーネントモック

```typescript
// src/test/mocks/components.ts
export const MockComponent = vi.fn(() => <div data-testid="mock-component" />);
```text

### モックファクトリー

```typescript
// src/test/mocks/factories.ts
export const createMockRestaurant = (overrides = {}) => ({
  id: '1',
  name: 'Test Restaurant',
  address: 'Test Address',
  lat: 38.0186,
  lng: 138.3672,
  ...overrides,
});
```text

## パフォーマンス考慮

### モック最適化

- **遅延読み込み** - 必要時のみモックを生成
- **メモリ効率** - 大量データモックの最適化
- **実行速度** - モック処理の高速化

### テスト実行時間

- **並列実行** - 独立したテストの並列化
- **モック共有** - 共通モックの再利用
- **クリーンアップ** - テスト後の適切なリソース解放

## 関連ドキュメント

- `src/test/setup.ts` - テスト環境セットアップ
- `src/services/` - モック対象のサービス実装
- `src/components/` - テスト対象のコンポーネント
- `vitest.config.ts` - テスト設定ファイル

## ベストプラクティス

### モック設計原則

- **実装に近い動作** - 実際のAPIに近い挙動を再現
- **エラーケース網羅** - 正常系・異常系の両方をカバー
- **型安全性** - TypeScriptの型システムを活用

### テスト品質

- **モック検証** - モック呼び出しの適切な検証
- **データ整合性** - モックデータの実データとの整合性
- **保守性** - モックの更新・拡張の容易さ

## 注意事項

- **実装依存** - 実装詳細に依存しすぎないモック設計
- **テスト隔離** - テスト間でのモック状態の干渉防止
- **パフォーマンス** - 過度に複雑なモックによる実行速度低下
- **メンテナンス** - 実装変更時のモック更新忘れ防止
