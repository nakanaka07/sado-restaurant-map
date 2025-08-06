# Debug Scripts

このディレクトリには、開発・デバッグ用のスクリプトが含まれています。

## ファイル一覧

### API デバッグ

- `debug_parking_issue.py` - 駐車場データ取得問題の調査
- `debug_toilet_issue.py` - トイレデータ取得問題の調査
- `debug_text_search_api.py` - Text Search API の動作確認
- `debug_parking_category.py` - 駐車場カテゴリ分類の調査
- `debug_toilet_category_issue.py` - トイレカテゴリ混入問題の調査

### カテゴリ判別

- `quick_category_check.py` - カテゴリ判別ロジックの簡易チェック

## 使用方法

```bash
cd C:\Users\HPE\Desktop\kueccha\sado-restaurant-map\tools\scraper\debug
python script_name.py
```

## 注意事項

- これらのスクリプトは開発・デバッグ目的のため、本番環境では使用しないでください
- 一部のスクリプトはAPI呼び出しを行うため、実行時にコストが発生する可能性があります
