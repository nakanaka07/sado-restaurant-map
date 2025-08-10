# Config Directory

このディレクトリには、佐渡島レストランマップアプリケーションの設定値・定数・環境変数の管理ファイルが含まれています。

## 📁 ディレクトリ構成

```
src/config/
├── constants.ts           # アプリケーション定数
├── environment.ts         # 環境変数設定
├── types.ts              # 設定関連の型定義
└── index.ts              # バレルエクスポート
```

## 📋 ファイル詳細

### `constants.ts`
アプリケーション全体で使用される定数値を一元管理

#### 🗺️ 地図関連の定数
- **`SADO_CENTER`**: 佐渡島の中心座標 (lat: 38.018611, lng: 138.367222)
- **`DEFAULT_ZOOM`**: デフォルトの地図ズームレベル (10)
- **`MIN_CLUSTER_ZOOM`**: マーカークラスタリングの最小ズームレベル (8)
- **`SEARCH_RADIUS_OPTIONS`**: 検索半径の選択肢 [1, 3, 5, 10, 20] km

#### 🔌 API関連の設定
- **`GA_MEASUREMENT_ID`**: Google Analytics測定ID
- **`SHEETS_CONFIG`**: Google Sheets API設定
  - スプレッドシートID
  - APIキー
  - シート名とデータ範囲
- **`GEOLOCATION_OPTIONS`**: 位置情報取得の設定

#### 🎨 UI関連の定数
- **`THEMES`**: 利用可能なテーマ ["light", "dark", "auto"]
- **`VIEW_MODES`**: 表示モード ["map", "list", "grid"]
- **`SORT_OPTIONS`**: ソート順の選択肢
- **`PAGINATION_CONFIG`**: ページネーション設定

#### ✅ バリデーション関連
- **`INPUT_LIMITS`**: 入力値の最大長制限
- **`API_KEY_PATTERNS`**: APIキーの形式パターン

#### ⚡ パフォーマンス関連
- **`DEBOUNCE_DELAYS`**: デバウンス時間設定
- **`CACHE_DURATIONS`**: キャッシュの有効期限

#### ♿ アクセシビリティ関連
- **`ARIA_LABELS`**: ARIA ラベル定義
- **`KEYBOARD_SHORTCUTS`**: キーボードショートカット

### `environment.ts`
環境変数の管理と型安全なアクセスを提供

### `types.ts`
設定関連のTypeScript型定義

### `index.ts`
すべての設定値を統一的にエクスポートするバレルファイル

## 🎯 使用方法

### 基本的なインポート
```typescript
// 統一エクスポートからのインポート
import { SADO_CENTER, DEFAULT_ZOOM, THEMES } from '@/config';

// 個別インポート
import { SADO_CENTER } from '@/config/constants';
```

### 使用例

#### 地図の初期化
```typescript
import { SADO_CENTER, DEFAULT_ZOOM } from '@/config';

const mapOptions = {
  center: SADO_CENTER,
  zoom: DEFAULT_ZOOM,
};
```

#### API設定の使用
```typescript
import { SHEETS_CONFIG, GA_MEASUREMENT_ID } from '@/config';

// Google Sheets API呼び出し
const response = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.SPREADSHEET_ID}/values/${SHEETS_CONFIG.SHEET_NAME}!${SHEETS_CONFIG.RANGE}?key=${SHEETS_CONFIG.API_KEY}`
);
```

#### UI設定の使用
```typescript
import { THEMES, SORT_OPTIONS } from '@/config';

// テーマ選択
const themeSelector = THEMES.map(theme => ({
  value: theme,
  label: theme
}));

// ソート選択
const sortSelector = SORT_OPTIONS;
```

#### バリデーション
```typescript
import { INPUT_LIMITS, API_KEY_PATTERNS } from '@/config';

// 入力値の検証
const isValidSearchQuery = (query: string) => 
  query.length <= INPUT_LIMITS.SEARCH_QUERY;

// APIキーの検証
const isValidGoogleMapsKey = (key: string) => 
  API_KEY_PATTERNS.GOOGLE_MAPS.test(key);
```

## 🔧 環境変数

以下の環境変数が必要です（`.env.local`ファイルで設定）：

### 必須環境変数
- **`VITE_GOOGLE_MAPS_API_KEY`**: Google Maps APIキー
- **`VITE_GOOGLE_SHEETS_API_KEY`**: Google Sheets APIキー
- **`VITE_SPREADSHEET_ID`**: Google SheetsのスプレッドシートID

### オプション環境変数
- **`VITE_GA_MEASUREMENT_ID`**: Google Analytics測定ID

### 設定例
```env
# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC...

# Google Sheets API
VITE_GOOGLE_SHEETS_API_KEY=AIzaSyD...
VITE_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

# Google Analytics (オプション)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 🏗️ 設計原則

### 1. **一元管理**
- すべての定数を`constants.ts`に集約
- 環境変数は`environment.ts`で管理
- 型定義は`types.ts`で統一

### 2. **型安全性**
- `as const`アサーションによる厳密な型推論
- 環境変数の型安全なアクセス
- バリデーションパターンの型定義

### 3. **保守性**
- カテゴリ別の整理された構造
- 明確なコメントとドキュメント
- 変更しやすい設計

### 4. **セキュリティ**
- APIキーのパターンマッチング
- 入力値の制限設定
- 環境変数の適切な管理

## 🔍 設定値の分類

### 📍 地理・地図関連
```typescript
SADO_CENTER          // 佐渡島中心座標
DEFAULT_ZOOM         // デフォルトズーム
SEARCH_RADIUS_OPTIONS // 検索半径選択肢
```

### 🔌 外部API関連
```typescript
GA_MEASUREMENT_ID    // Google Analytics
SHEETS_CONFIG        // Google Sheets API
GEOLOCATION_OPTIONS  // 位置情報API
```

### 🎨 ユーザーインターフェース
```typescript
THEMES              // テーマ設定
VIEW_MODES          // 表示モード
SORT_OPTIONS        // ソート選択肢
PAGINATION_CONFIG   // ページネーション
```

### ⚡ パフォーマンス最適化
```typescript
DEBOUNCE_DELAYS     // デバウンス時間
CACHE_DURATIONS     // キャッシュ期間
```

### ♿ アクセシビリティ
```typescript
ARIA_LABELS         // ARIA ラベル
KEYBOARD_SHORTCUTS  // キーボードショートカット
```

## 🚀 ベストプラクティス

### 新しい定数の追加
1. **適切なカテゴリに分類**
2. **`as const`アサーションを使用**
3. **明確なコメントを追加**
4. **型定義が必要な場合は`types.ts`に追加**

### 環境変数の管理
1. **`.env.local.example`に例を追加**
2. **`environment.ts`で型安全にアクセス**
3. **本番環境での適切な設定**

### 設定値の変更
1. **影響範囲を確認**
2. **関連するテストを更新**
3. **ドキュメントを更新**

## 🔧 トラブルシューティング

### よくある問題

1. **環境変数が読み込まれない**
   - `.env.local`ファイルの存在確認
   - `VITE_`プレフィックスの確認
   - 開発サーバーの再起動

2. **型エラーが発生する**
   - `as const`アサーションの確認
   - 型定義ファイルの更新
   - インポートパスの確認

3. **APIキーが無効**
   - APIキーの形式確認
   - 権限設定の確認
   - 使用制限の確認

### デバッグ方法
```typescript
// 環境変数の確認
console.log('Environment variables:', {
  mapsKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.slice(0, 10) + '...',
  sheetsKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY?.slice(0, 10) + '...',
});

// 設定値の確認
console.log('Config values:', {
  center: SADO_CENTER,
  zoom: DEFAULT_ZOOM,
  themes: THEMES,
});
```
