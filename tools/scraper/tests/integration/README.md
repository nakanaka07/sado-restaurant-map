# Integration Tests

このディレクトリには、システム統合テストとバグ修正検証テストが含まれています。

## ファイル一覧

### カテゴリ修正テスト

- `test_category_fix.py` - カテゴリ判別ロジック修正の検証
- `test_category_debug.py` - カテゴリ分類問題の調査

### データ修正テスト

- `test_parking_fix.py` - 駐車場データ修正の検証
- `test_toilet_fix.py` - トイレデータ修正の検証
- `test_toilet_place_details.py` - トイレPlace Details API テスト

### データフォーマットテスト

- `test_toilet_format.py` - トイレデータフォーマットの検証
- `test_updated_format.py` - 更新フォーマットの検証
- `test_header_debug.py` - ヘッダー設定の検証

### URL・検証テスト

- `test_google_maps_url.py` - Google Maps URL処理テスト
- `test_url_verification.py` - URL検証ロジックテスト

## 使用方法

```bash
cd C:\Users\HPE\Desktop\kueccha\sado-restaurant-map\tools\scraper\tests\integration
python test_script_name.py
```

## 目的

- システム全体の動作確認
- バグ修正の効果検証
- データ処理ロジックの統合テスト
- エンドツーエンドの動作確認
