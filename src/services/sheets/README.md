# Sheets Service

> 🎯 **目的**: Google Sheets API 連携・データ取得・型安全な変換処理
> **対象**: Google API 統合・データ変換を担当する開発者
> **最終更新**: 2025 年 8 月 30 日

## 🚀 主要機能

| 機能                           | 用途             | データ型                       |
| ------------------------------ | ---------------- | ------------------------------ |
| **fetchRestaurantsFromSheets** | 飲食店データ取得 | Restaurant 型（26 フィールド） |
| **fetchParkingsFromSheets**    | 駐車場データ取得 | Parking 型（21 フィールド）    |
| **fetchToiletsFromSheets**     | トイレデータ取得 | Toilet 型（20 フィールド）     |

## 🏗️ アーキテクチャ原則

このディレクトリは、**Google Sheets API** を使用して佐渡島レストランマップのデータを取得するサービスを提供します。`places_data_updater.py`で生成されたスプレッドシートからレストラン、駐車場、トイレの情報を取得し、アプリケーション内で使用可能な型安全なデータに変換します。

### 1. データ取得機能

#### `fetchRestaurantsFromSheets()`

- **目的**: 飲食店データの取得と Restaurant 型への変換
- **データ構造**: 26 フィールドの詳細な店舗情報
- **特徴**:
  - Google Places API データの精密な分類
  - 料理ジャンル自動判定
  - 価格帯マッピング
  - 営業時間パース

#### `fetchParkingsFromSheets()`

- **目的**: 駐車場データの取得と Parking 型への変換
- **データ構造**: 21 フィールドの駐車場情報
- **特徴**:
  - 料金体系の解析
  - バリアフリー対応情報
  - 支払い方法の抽出

#### `fetchToiletsFromSheets()`

- **目的**: 公衆トイレデータの取得と Toilet 型への変換
- **データ構造**: 20 フィールドのトイレ施設情報
- **特徴**:
  - 子供連れ対応情報
  - 駐車場併設状況
  - アクセシビリティ情報

#### `fetchAllMapPoints()`

- **目的**: 全マップポイントの統合取得
- **機能**: レストラン、駐車場、トイレを統一的な MapPoint 型に変換

### 2. データ変換・分析機能

#### 料理ジャンル分類

````typescript
mapStoreTypeToCuisineType(storeTypeWithName: string, description: string): CuisineType
```text

- **v2.0改良版** - 店舗名も分析対象に含めた精密分類
- **対応ジャンル**: 和食、洋食、中華、カフェ、居酒屋、ファストフード、その他

#### 価格帯マッピング

```typescript
mapPriceLevelToPriceRange(priceLevel: string, storeType: string): PriceRange
```text

- Google Places APIの価格レベルをアプリケーション用価格帯に変換
- 店舗タイプを考慮した適切な価格帯設定

#### 特徴抽出

```typescript
extractFeaturesFromPlacesData(data: PlacesData): string[]
```text

- **25種類以上の特徴**を自動抽出
- テイクアウト、デリバリー、予約可能、バリアフリーなど
- 店舗タイプに応じた適応的特徴抽出

### 3. エラーハンドリング

#### `SheetsApiError`クラス

```typescript
export class SheetsApiError extends Error {
  public readonly status: number;
  public readonly response?: unknown;
}
```text

- **カスタムエラー型** - API固有のエラー情報を保持
- HTTPステータスコードとレスポンス詳細の保存
- 403エラーの詳細ログ出力

### 4. データ品質管理

#### `checkDataFreshness()`

- **データ更新チェック** - キャッシュ対応
- 最終更新日時の確認
- 更新必要性の判定

#### データバリデーション

```typescript
validateRestaurantData(data: any): data is Restaurant
```text

- **型安全性の保証** - 実行時型チェック
- 必須フィールドの検証
- 座標データの妥当性確認

## 環境設定

### 必要な環境変数

```env
VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
VITE_SPREADSHEET_ID=your_spreadsheet_id_here
```text

### スプレッドシート構造

#### ワークシート名

```typescript
const WORKSHEETS = {
  RESTAURANTS: "restaurants",
  PARKINGS: "parkings",
  TOILETS: "toilets",
} as const;
```text

#### データ範囲

- **取得範囲**: `A:Z` (全列)
- **ヘッダー行**: 自動スキップ
- **データ形式**: CSV互換の文字列配列

## 使用例

### 基本的な使用方法

```typescript
import {
  fetchRestaurantsFromSheets,
  fetchAllMapPoints,
  checkDataFreshness
} from '@/services/sheets';

// レストランデータの取得
const restaurants = await fetchRestaurantsFromSheets();

// 全マップポイントの取得
const allPoints = await fetchAllMapPoints();

// データ更新状況の確認
const { lastUpdated, needsUpdate } = await checkDataFreshness();
```text

### エラーハンドリング

```typescript
try {
  const restaurants = await fetchRestaurantsFromSheets();
} catch (error) {
  if (error instanceof SheetsApiError) {
    console.error(`API Error ${error.status}:`, error.message);
    if (error.status === 403) {
      // API キー権限エラーの処理
    }
  }
}
```text

## データフロー

```text
Google Sheets
     ↓ (Google Sheets API)
Raw String Data
     ↓ (sheetsService.ts)
Type-safe Objects
     ↓ (Application)
UI Components
```text

### 変換プロセス

1. **API呼び出し** - Google Sheets APIからraw dataを取得
2. **データ検証** - 必須フィールドと形式の確認
3. **型変換** - 文字列データを適切な型に変換
4. **特徴抽出** - Places APIデータから特徴を自動抽出
5. **地区分類** - 住所から佐渡の地区を判定
6. **最終検証** - 完全性チェックと型安全性確保

## パフォーマンス最適化

### キャッシュ戦略

- **データ更新チェック** - 不要なAPI呼び出しを回避
- **バッチ処理** - 複数データタイプの並列取得
- **エラー回復** - 部分的失敗時の継続処理

### メモリ効率

- **ストリーミング処理** - 大量データの逐次処理
- **型最適化** - 必要最小限のデータ保持
- **ガベージコレクション** - 適切なオブジェクト解放

## テスト戦略

### 単体テスト

- **API モック** - fetch APIのモック化
- **エラーシナリオ** - 各種エラー状況のテスト
- **データ変換** - 型変換ロジックの検証
- **統合テスト** - 複数サービスの協調動作

### テストカバレッジ

- **正常系** - 各機能の基本動作
- **異常系** - API エラー、データ不整合
- **境界値** - 空データ、不正データ
- **パフォーマンス** - 大量データ処理

## トラブルシューティング

### よくある問題

#### 1. API認証エラー (403)

```text
🔒 403エラー詳細: API key not valid
```text

**解決方法**:

- API キーの有効性確認
- スプレッドシートの共有設定確認
- API使用量制限の確認

#### 2. データ形式エラー

```text
No valid restaurant data could be parsed
```text

**解決方法**:

- スプレッドシートの列構造確認
- ヘッダー行の存在確認
- データ型の整合性確認

#### 3. 座標データエラー

```text
Invalid coordinates: lat=undefined, lng=undefined
```text

**解決方法**:

- 緯度・経度列の数値形式確認
- 空セルの処理確認

## 拡張ポイント

### 新しいデータタイプの追加

1. **型定義** - `@/types`に新しい型を追加
2. **変換関数** - `convertSheetRowToNewType()`の実装
3. **取得関数** - `fetchNewTypeFromSheets()`の実装
4. **統合** - `fetchAllMapPoints()`への組み込み

### カスタム分析機能

```typescript
// 新しい特徴抽出ロジック
function extractCustomFeatures(data: CustomData): string[] {
  // カスタム分析ロジック
}
```text

## 関連ドキュメント

- `src/types/` - 型定義
- `src/utils/` - ユーティリティ関数
- `docs/development/` - 開発ガイドライン
- `places_data_updater.py` - データ更新スクリプト

## 注意事項

- **API制限** - Google Sheets APIの使用量制限に注意
- **データ整合性** - スプレッドシートの列構造変更時の影響
- **セキュリティ** - API キーの適切な管理
- **パフォーマンス** - 大量データ処理時のメモリ使用量
````
