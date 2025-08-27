# Tools - 専門ユーティリティツール

佐渡島レストランマップの Google Places API データ収集システムの専門ユーティリティツール群です。

## ツール一覧

| ファイル                  | 目的                                  | 使用場面                                                            |
| ------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| `complement_missing.py`   | 手動 URL 補完更新スクリプト           | 通常検索で見つからない店舗を手動 URL で補完                         |
| `manual_url_extractor.py` | 手動 URL 抽出・処理ツール             | Google Maps URL から Place ID を抽出して Place API で詳細情報を取得 |
| `debug_field_mask.py`     | Places API フィールドマスク確認ツール | フィールドマスクの詳細確認と実際の API レスポンステスト             |

## 使用方法

### 手動 URL 補完処理

```bash
# 1. 通常処理実行
python src/run_new_unified.py

# 2. 見つからない店舗のURLを手動収集
# missing_restaurants_urls.txt に保存

# 3. 手動URL補完実行
python tools/complement_missing.py
```

### 手動 URL 抽出・処理

```bash
# 単一URL処理
python tools/manual_url_extractor.py --url "https://www.google.com/maps/place/..."

# ファイル一括処理
python tools/manual_url_extractor.py --file manual_urls.txt

# 詳細出力モード
python tools/manual_url_extractor.py --url "..." --verbose
```

### デバッグ・診断実行

```bash
# フィールドマスク確認
python tools/debug_field_mask.py
```

## 設定・環境変数

### 必須環境変数

```bash
# Google Places API設定
PLACES_API_KEY=your_places_api_key_here

# Google Sheets設定
SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_PATH=config/service-account.json
```

### ファイル設定

```text
# missing_restaurants_urls.txt 形式例
https://www.google.com/maps/place/店舗名/@緯度,経度,zoom/data=...
https://maps.google.com/place?cid=数値
https://goo.gl/maps/短縮URL
https://maps.app.goo.gl/短縮URL
```

## 対応 URL 形式

### Google Maps URL 形式

- **通常 URL**: `https://www.google.com/maps/place/店舗名/@緯度,経度,zoom/data=...`
- **CID URL**: `https://maps.google.com/place?cid=数値`
- **データ URL**: `https://www.google.com/maps/place/店舗名/data=...`
- **短縮 URL**: `https://goo.gl/maps/短縮URL`
- **新短縮 URL**: `https://maps.app.goo.gl/短縮URL`

## トラブルシューティング

### よくある問題と解決方法

#### 手動 URL 補完エラー

```text
エラー: missing_restaurants_urls.txt が見つかりません
解決方法:
- ファイル作成・URL追加
- UTF-8エンコーディング確認
- URL形式の正確性確認
```

#### URL 抽出失敗

```text
エラー: Place ID extraction failed
解決方法:
- URL形式の確認
- 短縮URL展開の確認
- data=パラメータの存在確認
```

## 関連ディレクトリ

- `../config/` - スクレイパー設定管理
- `../data/` - データソース管理
- `../debug/` - 問題診断ツール
- `../processors/` - メインデータ処理
