# API Tests

このディレクトリには、Google Places API関連のテストスクリプトが含まれています。

## ファイル一覧

### API基本テスト

- `test_field_mask.py` - フィールドマスク設定のテスト
- `test_api_response_debug.py` - APIレスポンスの詳細解析

### カテゴリ別API テスト

- `test_restaurant_api.py` - 飲食店API の基本テスト
- `test_restaurant_cid_api.py` - 飲食店CID URL テスト
- `test_restaurant_text_search.py` - 飲食店Text Search テスト
- `test_toilet_search_fixed.py` - トイレ検索API修正後テスト

## 使用方法

```bash
cd C:\Users\HPE\Desktop\kueccha\sado-restaurant-map\tools\scraper\tests\api
python test_script_name.py
```

## 目的

- Google Places API (New) v1 の動作確認
- APIレスポンスの検証
- 各カテゴリのデータ取得テスト
- フィールドマスク設定の検証
