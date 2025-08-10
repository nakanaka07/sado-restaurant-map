# Processors - データ処理パイプライン

佐渡島レストランマップのGoogle Places APIデータ処理パイプラインを構成するプロセッサーモジュール群です。

## 📁 ディレクトリ構成

```text
processors/
├── unified_cid_processor.py       # 統合CID処理（レガシー版）
├── new_unified_processor.py       # 新API対応統合プロセッサー
├── places_api_client.py          # Places API通信クライアント
├── spreadsheet_manager.py        # Google Sheets操作管理
├── data_validator.py             # データ検証・変換
├── data_deduplicator.py          # データ重複除去
├── location_separator.py         # 位置による自動データ分離
├── new_store_discoverer.py       # 新店舗発見システム
├── new_api_processor.py          # 新API処理システム
└── url_converter.py              # URL→CID変換処理
```

## 🔧 主要プロセッサー

### 1. **統合プロセッサー**

#### `new_unified_processor.py` - 新API対応統合プロセッサー

- **機能**: Places API (New) v1対応の最新版処理システム
- **特徴**:
  - CIDファイル・テキスト検索の統合処理
  - 高精度な店舗データ取得
  - 新APIクライアント連携
  - スプレッドシート自動更新

#### `unified_cid_processor.py` - レガシー統合CID処理

- **機能**: CIDベース・店舗名検索・URL抽出の統合処理
- **特徴**:
  - Google Maps URLからのPlace ID抽出
  - 店舗名による検索とPlace ID取得
  - レガシーAPI対応

### 2. **API通信層**

#### `places_api_client.py` - Places API通信クライアント

- **機能**: Google Places API (New) v1との通信管理
- **特徴**:
  - Text Search API対応
  - Place Details API対応
  - CID URL対応
  - エラーハンドリング・レート制限対応
  - 佐渡島地理的境界設定

### 3. **データ管理層**

#### `spreadsheet_manager.py` - Google Sheets操作管理

- **機能**: Google Sheetsとの連携管理
- **特徴**:
  - ワークシート作成・更新
  - データの佐渡島内外振り分け
  - ヘッダー管理
  - 一括更新・追加
  - データ重複チェック

#### `data_validator.py` - データ検証・変換

- **機能**: Places APIレスポンスの検証・変換・正規化
- **特徴**:
  - Places APIレスポンス検証
  - 住所正規化
  - 地区分類（佐渡市公式基準）
  - 緯度経度による佐渡島内判定
  - データ品質チェック

### 4. **データ処理ユーティリティ**

#### `data_deduplicator.py` - データ重複除去

- **機能**: CIDとテキスト検索項目の重複排除処理
- **特徴**:
  - CID付き施設データの重複除去
  - テキスト検索項目の類似度チェック
  - ファイル統合時の重複排除
  - 施設名の正規化・比較処理

#### `location_separator.py` - 位置による自動データ分離

- **機能**: スプレッドシートのデータを佐渡島内外で自動分離
- **特徴**:
  - 緯度経度による佐渡島内外判定
  - 自動シート作成・データ振り分け
  - 統計情報の提供
  - バックアップ機能

#### `url_converter.py` - URL→CID変換処理

- **機能**: Google Maps URLをCID形式に変換
- **特徴**:
  - Google Maps URLからCIDを抽出
  - 長いURLをCID形式に変換
  - 統合ファイルの一括変換
  - バックアップ作成機能

### 5. **発見・拡張システム**

#### `new_store_discoverer.py` - 新店舗発見システム

- **機能**: Google Places API Nearby Searchを活用した佐渡島新店舗自動発見
- **特徴**:
  - 格子状地域分割による網羅的検索
  - 既存データベースとの重複チェック
  - 新店舗の自動特定と報告
  - 発見店舗の詳細情報取得

#### `new_api_processor.py` - 新API処理システム

- **機能**: Places API (New) v1を使用した最新版処理システム
- **特徴**:
  - 新APIエンドポイント対応
  - 拡張フィールド対応
  - パフォーマンス最適化

## 🏗️ アーキテクチャ設計

### データ処理パイプライン

```text
データソース → API通信 → データ検証 → 重複除去 → 位置分離 → スプレッドシート更新
     ↓           ↓          ↓          ↓          ↓              ↓
  data/urls/  places_api  data_      data_    location_    spreadsheet_
             _client.py  validator  deduplicator separator   _manager.py
                         .py        .py       .py
```

### 処理フロー

1. **データ読み込み**: CIDファイル・テキストクエリの解析
2. **API通信**: Places API (New) v1による店舗情報取得
3. **データ検証**: レスポンス検証・住所正規化・地区分類
4. **重複除去**: 既存データとの重複チェック・除去
5. **位置分離**: 佐渡島内外の自動振り分け
6. **スプレッドシート更新**: Google Sheetsへの一括更新

## 🚀 使用方法

### 基本的な処理実行

```python
# 新API対応統合プロセッサー使用例
from processors.new_unified_processor import NewUnifiedProcessor

processor = NewUnifiedProcessor()
processor.process_cid_file('data/converted/restaurants_cid.txt', 'restaurants')
```

### 個別プロセッサー使用例

```python
# Places API通信
from processors.places_api_client import PlacesAPIClient

client = PlacesAPIClient(api_key)
result = client.get_place_details('ChIJ...')

# データ検証
from processors.data_validator import DataValidator

validator = DataValidator()
validation_result = validator.validate_place_data(place_data)

# 重複除去
from processors.data_deduplicator import DataDeduplicator

deduplicator = DataDeduplicator()
deduplicator.remove_duplicates('data/urls/restaurants_merged.txt')
```

## ⚙️ 設定・環境変数

### 必須環境変数

```bash
# Google Places API設定
PLACES_API_KEY=your_places_api_key_here

# Google Sheets設定
SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_PATH=config/service-account.json

# API制御設定
API_REQUEST_DELAY=1.0
MAX_RESULTS_PER_REQUEST=20
```

### Phase 2機能フラグ

```bash
# 新プロセッサー使用
USE_NEW_PROCESSORS=true

# スマートスキップ機能
ENABLE_SMART_SKIP=true

# 位置分離機能
ENABLE_LOCATION_SEPARATION=true
```

## 📊 データ品質管理

### 検証項目

- **必須フィールド**: 店舗名、住所、緯度経度
- **地理的境界**: 佐渡島内判定（北緯37.74-38.39度、東経137.85-138.62度）
- **地区分類**: 佐渡市公式11地区分類
- **重複チェック**: CID・店舗名・住所による重複検出

### 品質指標

- **データ完全性**: 95%以上の必須フィールド充足率
- **位置精度**: 100%の佐渡島内外判定精度
- **重複率**: 5%以下の重複データ率
- **API成功率**: 98%以上のAPI呼び出し成功率

## 🔍 トラブルシューティング

### よくある問題と解決方法

#### 1. **API認証エラー**

```text
エラー: 401 Unauthorized
解決方法:
- PLACES_API_KEYの確認
- APIキーの権限設定確認
- 請求アカウントの有効化確認
```

#### 2. **スプレッドシートアクセスエラー**

```text
エラー: Google Sheets API access denied
解決方法:
- service-account.jsonの配置確認
- スプレッドシート共有設定確認
- Google Sheets APIの有効化確認
```

#### 3. **データ検証エラー**

```text
エラー: Invalid place data format
解決方法:
- Places APIレスポンス形式の確認
- 必須フィールドの存在確認
- 緯度経度の数値形式確認
```

#### 4. **重複除去エラー**

```text
エラー: Duplicate detection failed
解決方法:
- ファイル形式の確認（UTF-8エンコーディング）
- CID形式の正規性確認
- メモリ不足の場合はバッチ処理に変更
```

## 🎯 パフォーマンス最適化

### API呼び出し最適化

- **バッチ処理**: 複数リクエストの並列実行
- **レート制限**: 1秒間隔でのAPI呼び出し
- **キャッシュ活用**: 既存データの再利用
- **スマートスキップ**: 不要な処理のスキップ

### メモリ効率化

- **ストリーミング処理**: 大容量ファイルの逐次処理
- **データ圧縮**: 中間結果の圧縮保存
- **ガベージコレクション**: 明示的なメモリ解放

### 処理時間短縮

- **並列処理**: マルチスレッド・マルチプロセス活用
- **インデックス活用**: 高速検索のためのインデックス構築
- **差分更新**: 変更分のみの更新処理

## 🔄 継続的改善

### 月次メンテナンス手順

1. **データ品質チェック**: `data_validator.py`による全データ検証
2. **重複除去実行**: `data_deduplicator.py`による重複データクリーンアップ
3. **新店舗発見**: `new_store_discoverer.py`による新店舗検索
4. **パフォーマンス分析**: 処理時間・API使用量の分析

### 品質改善指標

- **処理速度**: 月次10%向上目標
- **データ精度**: 月次1%向上目標
- **API効率**: 月次5%コスト削減目標
- **エラー率**: 月次20%削減目標

## 📚 拡張ポイント

### 新プロセッサー追加

1. **基底クラス継承**: 共通インターフェースの実装
2. **設定ファイル更新**: 新プロセッサーの設定追加
3. **テスト作成**: 単体・統合テストの作成
4. **ドキュメント更新**: README・コメントの更新

### 新API対応

1. **APIクライアント拡張**: 新エンドポイントの追加
2. **データモデル更新**: 新フィールドの対応
3. **検証ルール追加**: 新データ形式の検証
4. **変換処理更新**: 新形式への変換処理

---

**注意**: このプロセッサー群は佐渡島レストランマップの中核データ処理システムです。変更時は十分なテストと品質確認を行ってください。
