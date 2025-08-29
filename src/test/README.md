# Test Infrastructure

## 概要

このディレクトリは、佐渡島レストランマップアプリケーションの**テストインフラストラクチャ**を構成します。Vitestを使用した現代的なテスト環境で、単体テスト、統合テスト、E2Eテストをサポートし、高品質なコードベースの維持を支援します。

## ディレクトリ構成

```text
src/test/
├── mocks/              # テスト用モック実装
│   ├── pwa-register.ts # PWA機能のモック
│   └── README.md       # モック実装の詳細
├── setup.ts            # テスト環境セットアップ
└── README.md           # このファイル
```text

## ファイル構成

### `setup.ts`

- **テスト環境セットアップファイル** - グローバルなテスト設定
- **サイズ**: 5.4KB - 包括的なモック設定とテスト環境初期化
- **機能**: 環境変数、API モック、ブラウザAPI モック

### `mocks/`

- **モック実装ディレクトリ** - 外部依存関係のモック
- **PWA機能** - Service Worker関連のモック
- **詳細**: [`mocks/README.md`](./mocks/README.md)参照

## テスト環境設定

### 環境変数設定

```typescript
// テスト用環境変数の事前設定
process.env.VITE_GA_MEASUREMENT_ID = "G-TEST123456";
process.env.VITE_GOOGLE_MAPS_API_KEY = "TEST_API_KEY";
process.env.VITE_GOOGLE_SHEETS_API_KEY = "test-sheets-api-key";
process.env.VITE_SPREADSHEET_ID = "test-spreadsheet-id";
```text

#### 設定項目

- **Google Analytics** - 測定IDのテスト値
- **Google Maps API** - 地図機能のテストキー
- **Google Sheets API** - スプレッドシート連携のテストキー
- **スプレッドシートID** - テスト用データソースID

### React Testing Library設定

```typescript
import { configure } from "@testing-library/react";

configure({
  asyncUtilTimeout: 2000,        // 非同期処理のタイムアウト
  reactStrictMode: true,         // React 19 Concurrent Features対応
});
```text

#### 特徴

- **非同期更新の自動ラッピング** - act()の自動適用
- **React Strict Mode対応** - 開発モードでの厳密チェック
- **タイムアウト設定** - 非同期テストの適切な待機時間

## モック実装

### 1. Google Maps API モック

```typescript
interface MockGoogleMaps {
  maps: {
    MapTypeId: Record<string, string>;
    Map: ReturnType<typeof vi.fn>;
    Marker: ReturnType<typeof vi.fn>;
    InfoWindow: ReturnType<typeof vi.fn>;
    LatLng: ReturnType<typeof vi.fn>;
    event: {
      addListener: ReturnType<typeof vi.fn>;
      removeListener: ReturnType<typeof vi.fn>;
    };
  };
}
```text

#### 機能

- **地図初期化** - Map コンストラクターのモック
- **マーカー管理** - Marker 作成・操作のモック
- **イベント処理** - 地図イベントのモック
- **情報ウィンドウ** - InfoWindow 表示のモック

### 2. LocalStorage モック

```typescript
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] || null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { store = {}; }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((index: number) => keys[index] || null),
};
```text

#### 特徴

- **完全な互換性** - ブラウザのLocalStorageと同じAPI
- **状態管理** - テスト間での状態保持・リセット
- **型安全性** - TypeScriptによる型チェック

### 3. Analytics モック

```typescript
vi.mock("../utils/analytics", () => ({
  trackSearch: vi.fn(),
  trackFilter: vi.fn(),
  initGA: vi.fn().mockResolvedValue(undefined),
  trackEvent: vi.fn(),
  trackRestaurantClick: vi.fn(),
  trackMapInteraction: vi.fn(),
  trackPWAUsage: vi.fn(),
  trackPageView: vi.fn(),
  checkGAStatus: vi.fn().mockResolvedValue({}),
  debugGA: vi.fn().mockResolvedValue({}),
  runGADiagnostics: vi.fn().mockReturnValue({}),
  sendTestEvents: vi.fn(),
  autoFixGA: vi.fn().mockReturnValue({}),
}));
```text

#### 対象機能

- **検索トラッキング** - ユーザー検索行動の記録
- **フィルタートラッキング** - フィルター使用状況の記録
- **地図インタラクション** - 地図操作の記録
- **PWA使用状況** - PWA機能の利用記録

### 4. Sheets Service モック

```typescript
vi.mock("../services/sheets/sheetsService", () => ({
  fetchRestaurantsFromSheets: vi.fn().mockResolvedValue([]),
  fetchParkingsFromSheets: vi.fn().mockResolvedValue([]),
  fetchToiletsFromSheets: vi.fn().mockResolvedValue([]),
  fetchAllMapPoints: vi.fn().mockResolvedValue([]),
  checkDataFreshness: vi.fn().mockResolvedValue({ needsUpdate: false }),
  SheetsApiError: class SheetsApiError extends Error { /* ... */ },
}));
```text

#### 機能範囲

- **データ取得** - レストラン、駐車場、トイレデータの取得
- **統合データ** - 全マップポイントの統合取得
- **データ更新チェック** - キャッシュ状態の確認
- **エラーハンドリング** - カスタムエラー型の提供

## テスト戦略

### 1. 単体テスト（Unit Tests）

#### 対象

- **コンポーネント** - React コンポーネントの個別テスト
- **フック** - カスタムフックの動作検証
- **ユーティリティ** - 純粋関数の入出力テスト
- **サービス** - API呼び出しとデータ変換のテスト

#### アプローチ

```typescript
describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // モック状態のリセット
  });

  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```text

### 2. 統合テスト（Integration Tests）

#### 対象

- **コンポーネント間連携** - 複数コンポーネントの協調動作
- **サービス層統合** - API とコンポーネントの統合
- **状態管理** - グローバル状態の更新と反映
- **ルーティング** - ページ遷移とデータ連携

#### アプローチ

```typescript
describe('Feature Integration', () => {
  it('should handle complete user flow', async () => {
    render(<App />);
    
    // ユーザー操作のシミュレーション
    await user.click(screen.getByRole('button', { name: /検索/ }));
    await user.type(screen.getByRole('textbox'), '佐渡');
    
    // 結果の検証
    await waitFor(() => {
      expect(screen.getByText(/検索結果/)).toBeInTheDocument();
    });
  });
});
```text

### 3. E2Eテスト（End-to-End Tests）

#### 対象

- **ユーザージャーニー** - 完全なユーザー体験の検証
- **ブラウザ互換性** - 異なるブラウザでの動作確認
- **パフォーマンス** - 実際の使用条件での性能測定
- **PWA機能** - オフライン動作とインストール

## パフォーマンス最適化

### テスト実行速度

#### 並列実行

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    threads: true,           // 並列実行の有効化
    maxThreads: 4,          // 最大スレッド数
    minThreads: 2,          // 最小スレッド数
  },
});
```text

#### モック最適化

- **遅延読み込み** - 必要時のみモックを生成
- **共有モック** - 複数テストでの再利用
- **メモリ効率** - 大量データモックの最適化

### メモリ管理

#### クリーンアップ

```typescript
afterEach(() => {
  vi.clearAllMocks();     // モック状態のクリア
  cleanup();              // DOM のクリーンアップ
});

afterAll(() => {
  vi.restoreAllMocks();   // モックの完全復元
});
```text

## デバッグとトラブルシューティング

### よくある問題

#### 1. Act Warning の抑制

```typescript
// setup.ts での自動処理
if (process.env.NODE_ENV === "test") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (args[0]?.includes("was not wrapped in act")) {
      return; // act() 警告を抑制
    }
    originalError.call(console, ...args);
  };
}
```text

#### 2. 非同期処理のテスト

```typescript
// 適切な待機処理
await waitFor(() => {
  expect(mockFunction).toHaveBeenCalled();
}, { timeout: 2000 });

// Promise の解決待ち
await act(async () => {
  await Promise.resolve();
});
```text

#### 3. モック状態の確認

```typescript
// モック呼び出し履歴の確認
console.log(mockFunction.mock.calls);
console.log(mockFunction.mock.results);

// モック状態のリセット確認
expect(mockFunction).not.toHaveBeenCalled();
```text

### デバッグ技法

#### テスト分離

```typescript
describe.only('Focused Test', () => {
  // 特定のテストのみ実行
});

it.skip('Skipped Test', () => {
  // テストをスキップ
});
```text

#### 詳細ログ

```typescript
// テスト環境でのログ出力
if (process.env.NODE_ENV === "test") {
  console.log("Test debug info:", debugData);
}
```text

## CI/CD統合

### GitHub Actions設定例

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run test:coverage
```text

### テストカバレッジ

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```text

## ベストプラクティス

### テスト設計原則

#### AAA パターン

```typescript
it('should calculate total correctly', () => {
  // Arrange - 準備
  const items = [{ price: 100 }, { price: 200 }];
  
  // Act - 実行
  const total = calculateTotal(items);
  
  // Assert - 検証
  expect(total).toBe(300);
});
```text

#### テスト命名規則

- **should + 期待する動作** - 明確な期待値の表現
- **given + 条件 + when + 操作 + then + 結果** - BDD スタイル
- **日本語での説明** - 複雑なビジネスロジックの場合

### モック使用指針

#### モックすべきもの

- **外部API** - ネットワーク依存の排除
- **ブラウザAPI** - 環境依存の排除
- **時間依存処理** - 実行時間の制御
- **ランダム値** - 予測可能な結果

#### モックすべきでないもの

- **テスト対象の実装** - 実際のロジックをテスト
- **単純な計算** - 純粋関数の直接テスト
- **型定義** - TypeScript の型チェックを活用

## 関連ドキュメント

- [`mocks/README.md`](./mocks/README.md) - モック実装の詳細
- `vitest.config.ts` - テスト設定ファイル
- `src/components/` - テスト対象のコンポーネント
- `src/services/` - テスト対象のサービス
- `src/hooks/` - テスト対象のカスタムフック

## 拡張ポイント

### 新しいテストタイプの追加

#### Visual Regression Tests

```typescript
// 視覚的回帰テストの例
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

it('should match visual snapshot', async () => {
  const screenshot = await page.screenshot();
  expect(screenshot).toMatchImageSnapshot();
});
```text

#### Performance Tests

```typescript
// パフォーマンステストの例
it('should load within performance budget', async () => {
  const startTime = performance.now();
  render(<HeavyComponent />);
  const endTime = performance.now();
  
  expect(endTime - startTime).toBeLessThan(100); // 100ms以内
});
```text

### カスタムマッチャー

```typescript
// カスタムマッチャーの定義
expect.extend({
  toBeValidRestaurant(received) {
    const pass = received.name && received.lat && received.lng;
    return {
      message: () => `expected ${received} to be a valid restaurant`,
      pass,
    };
  },
});
```text

## 注意事項

- **テスト隔離** - テスト間での状態共有を避ける
- **実装詳細の回避** - 内部実装ではなく動作をテスト
- **適切なモック範囲** - 過度なモック化を避ける
- **メンテナンス性** - テストコードの可読性と保守性を重視
- **実行速度** - 高速なフィードバックループの維持
