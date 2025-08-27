# Processors - データ処理パイプライン

佐渡島レストランマップの Google Places API データ処理パイプラインを構成するプロセッサーモジュール群です。

## 📁 ディレクトリ構成

```text
processors/
├── new_unified_processor.py       # 🎯 メイン: 新API対応統合プロセッサー
├── places_api_client.py          # 🌐 Google Places API (New) v1 通信クライアント
├── spreadsheet_manager.py        # 📊 Google Sheets操作管理
├── data_validator.py             # ✅ データ検証・変換・地区分類
├── data_deduplicator.py          # 🔄 データ重複除去
├── location_separator.py         # 📍 佐渡島内外自動分離
├── new_store_discoverer.py       # 🔍 新店舗発見システム
├── new_api_processor.py          # 🚀 新API処理システム
├── url_converter.py              # 🔗 URL→CID変換処理
└── unified_cid_processor.py      # ⚠️ レガシー版（廃止予定）
```

## 🎯 主要プロセッサー

### 現在使用中のプロセッサー

#### `new_unified_processor.py` - メイン統合プロセッサー

- **機能**: Places API (New) v1 対応の統合処理システム
- **特徴**: CID ファイル・テキスト検索の統合処理、スプレッドシート自動更新
- **実行**: `../src/run_new_unified.py`から呼び出し

#### `places_api_client.py` - API 通信クライアント

- **機能**: Google Places API (New) v1 との通信管理
- **特徴**: Text Search API、Place Details API、エラーハンドリング

#### `data_validator.py` - データ検証・変換

- **機能**: Places API レスポンスの検証・正規化
- **特徴**: 住所正規化、佐渡市 11 地区分類、佐渡島内外判定

#### `spreadsheet_manager.py` - Google Sheets 操作

- **機能**: Google Sheets との連携管理
- **特徴**: ワークシート作成・更新、データ振り分け、重複チェック

### ユーティリティプロセッサー

#### `data_deduplicator.py` - 重複除去

- **機能**: CID とテキスト検索項目の重複排除

#### `location_separator.py` - 位置分離

- **機能**: 佐渡島内外の自動データ分離

#### `url_converter.py` - URL 変換

- **機能**: Google Maps URL → CID 形式変換

#### `new_store_discoverer.py` - 新店舗発見

- **機能**: Places API Nearby Search による新店舗自動発見

### レガシープロセッサー（廃止予定）

#### `unified_cid_processor.py` - レガシー統合処理

- **状態**: 廃止予定（新 API プロセッサーに移行済み）
- **機能**: 旧 Places API を使用した統合処理

## 🚀 基本的な使用方法

### メイン処理実行

```bash
# 統合処理実行スクリプト
cd tools/scraper/src
python run_new_unified.py --mode standard --target all
```

### プロセッサー個別使用

```python
# 新API対応統合プロセッサー
from processors.new_unified_processor import NewUnifiedProcessor
processor = NewUnifiedProcessor()
processor.process_cid_file('data/converted/restaurants_cid.txt', 'restaurants')

# データ検証
from processors.data_validator import DataValidator
validator = DataValidator()
result = validator.validate_place_data(place_data)
```

## ⚙️ 環境設定

### 必須環境変数

```bash
# Google Places API設定
PLACES_API_KEY=your_places_api_key_here

# Google Sheets設定
SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_PATH=config/service-account.json
```

## 🔧 トラブルシューティング

### よくある問題

1. **API 認証エラー**: PLACES_API_KEY とサービスアカウント設定を確認
2. **データ検証エラー**: Places API レスポンス形式と必須フィールドを確認
3. **重複除去エラー**: ファイル形式（UTF-8）と CID 形式を確認

## 📊 データ処理フロー

```text
データソース → API通信 → データ検証 → 重複除去 → 位置分離 → スプレッドシート更新
```

---

**メンテナンス情報**:

- メインプロセッサー: `new_unified_processor.py`
- 実行スクリプト: `../src/run_new_unified.py`
- レガシーファイル: `unified_cid_processor.py`（廃止予定）
