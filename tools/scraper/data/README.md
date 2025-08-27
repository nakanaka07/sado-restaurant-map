# 📊 Scraper Data

佐渡飲食店マップのデータ収集用ソースファイル管理

## 📁 ファイル構成

```text
data/
├── restaurants_merged.txt        # レストラン・飲食店（455件）
├── parkings_merged.txt          # 駐車場（124件）
└── toilets_merged.txt           # トイレ・公衆施設（83件）
```

## 🎯 データファイル詳細

### restaurants_merged.txt

- **件数**: 455 件（36.8KB）
- **内容**: 飲食店、カフェ、コンビニ、食品店
- **形式**: Google Maps CID + テキスト検索クエリ
- **更新**: 2025 年 8 月 5 日

### parkings_merged.txt

- **件数**: 124 件（10.3KB）
- **内容**: 公共駐車場、観光地駐車場、施設駐車場
- **形式**: Google Maps CID + テキスト検索クエリ
- **更新**: 2025 年 8 月 6 日

### toilets_merged.txt

- **件数**: 83 件（6.8KB）
- **内容**: 公衆トイレ、観光地トイレ、施設トイレ
- **形式**: Google Maps CID + テキスト検索クエリ
- **更新**: 2025 年 8 月 6 日

## 🔍 データ形式

### ファイル構造

```text
# --- カテゴリ名 統合クエリファイル ---
# 作成日時: YYYY年MM月DD日 HH:MM:SS

# CID形式（高精度・直接アクセス）
https://maps.google.com/place?cid=9867684745575651684    # 店舗名
https://maps.google.com/place?cid=8416518954523348407    # 施設名

# テキスト検索（補完用）
店舗名
施設名
```

### 使用箇所

- `src/run_new_unified.py` - メインスクレイピング処理
- `processors/url_converter.py` - URL 変換処理
- `processors/data_deduplicator.py` - 重複除去処理

## 🔧 メンテナンス

### データ更新

```bash
# 重複チェック
python -m processors.data_deduplicator

# URL形式統一
python -m processors.url_converter
```

### ファイル検証

```python
# 基本的な読み込み
def load_data_file(file_path: str) -> tuple[list, list]:
    """CIDとテキスト検索クエリを分離"""
    cid_urls = []
    text_queries = []

    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith('https://maps.google.com/place?cid='):
                cid_urls.append(line)
            elif line and not line.startswith('#'):
                text_queries.append(line)

    return cid_urls, text_queries
```

## 📚 関連ドキュメント

- [../config/README.md](../config/README.md) - 設定管理
- [../processors/README.md](../processors/README.md) - データ処理
- [../src/README.md](../src/README.md) - 実行スクリプト
