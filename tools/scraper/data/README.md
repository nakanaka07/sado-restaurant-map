# 📊 Scraper Data Directory

佐渡飲食店マップ - スクレイパーデータソース管理

## 📋 概要

このディレクトリは、Google Places APIでのデータ収集に使用するURL・検索クエリデータを管理します。Google Maps URL（CID形式）とテキスト検索クエリの2つの検索方式に対応し、効率的で正確なデータ収集を実現します。

## 📁 ディレクトリ構成

```
data/
└── urls/
    ├── restaurants_merged.txt        # レストラン統合データ（CID + テキスト検索）
    ├── parkings_merged.txt          # 駐車場統合データ（CID + テキスト検索）
    ├── toilets_merged.txt           # トイレ統合データ（CID + テキスト検索）
    └── converted/
        ├── restaurants_merged_cid_only.txt  # レストランCID専用ファイル
        ├── parkings_merged_cid_only.txt     # 駐車場CID専用ファイル
        └── toilets_merged_cid_only.txt      # トイレCID専用ファイル
```

## 🎯 データファイル詳細

### メインデータファイル（統合形式）

#### 1. **`restaurants_merged.txt`**
- **データ件数**: 450+ 件
- **形式**: Google Maps URL（CID）+ テキスト検索クエリ
- **対象**: 佐渡島内の飲食店、カフェ、コンビニ、食品店
- **更新日**: 2025年8月4日

#### 2. **`parkings_merged.txt`**
- **データ件数**: 130+ 件
- **形式**: Google Maps URL（CID）+ テキスト検索クエリ
- **対象**: 公共駐車場、観光地駐車場、施設駐車場
- **更新日**: 2025年8月4日

#### 3. **`toilets_merged.txt`**
- **データ件数**: 95+ 件
- **形式**: Google Maps URL（CID）+ テキスト検索クエリ
- **対象**: 公衆トイレ、観光地トイレ、施設トイレ
- **更新日**: 2025年8月4日

### CID専用ファイル（変換済み）

#### `converted/` ディレクトリ
- **目的**: CIDのみを抽出した高速検索用ファイル
- **生成日**: 2025年8月5日
- **用途**: Places API Detail検索での直接アクセス

## 🔍 データ形式仕様

### 統合ファイル形式

```txt
# --- カテゴリ名 統合クエリファイル ---
# 説明コメント
# 作成日時: YYYY年MM月DD日 HH:MM:SS

# ========================================
# 高精度検索: Google Maps URL (CID)
# ========================================
# これらのURLは直接Place詳細を取得可能（API効率◎）

https://maps.google.com/place?cid=9867684745575651684    # 店舗名・施設名
https://maps.google.com/place?cid=8416518954523348407    # ショッピングプラザ キング 両津店

# ========================================
# テキスト検索: 店舗名・施設名
# ========================================
# Places Text Search API で検索される項目

店舗名1
施設名2
```

### CID専用ファイル形式

```txt
# --- カテゴリ名_Merged CID専用ファイル ---
# 生成日時: YYYY年M月D日
# 元ファイル: original_file.txt
# CID件数: XXX

https://maps.google.com/place?cid=9867684745575651684  # 店舗名・施設名
https://maps.google.com/place?cid=8416518954523348407  # ショッピングプラザ キング 両津店
```

## 🚀 検索方式の特徴

### 1. **CID検索（高精度・高効率）**

#### 利点
- **直接アクセス**: Place IDを使用した確実な施設特定
- **API効率**: 1回のリクエストで詳細情報取得
- **データ品質**: 100%の検索成功率
- **コスト効率**: 最小限のAPI呼び出し

#### 使用場面
```python
# Places API Detail リクエスト
place_id = extract_cid_from_url(cid_url)
place_details = places_client.place(place_id=place_id)
```

### 2. **テキスト検索（補完・発見）**

#### 利点
- **柔軟性**: 店舗名の変更や新規発見に対応
- **網羅性**: CIDが不明な施設の検索
- **更新対応**: 最新の店舗情報を取得

#### 使用場面
```python
# Places API Text Search リクエスト
search_results = places_client.text_search(
    query=f"{facility_name} 佐渡",
    region="jp"
)
```

## 📈 データ統計

### レストランデータ分析
- **総件数**: 450+ 件
- **CID形式**: 約 98%（440+ 件）
- **テキスト検索**: 約 2%（10+ 件）
- **カバー範囲**: 佐渡島全域

### 駐車場データ分析
- **総件数**: 130+ 件
- **CID形式**: 約 95%（125+ 件）
- **テキスト検索**: 約 5%（5+ 件）
- **種類**: 公共駐車場、観光地、施設併設

### トイレデータ分析
- **総件数**: 95+ 件
- **CID形式**: 約 90%（85+ 件）
- **テキスト検索**: 約 10%（10+ 件）
- **種類**: 公衆トイレ、観光地、施設内

## 🛠️ データ利用方法

### 基本的な読み込み

```python
def load_data_file(file_path: str) -> tuple[list, list]:
    """データファイルからCIDとテキスト検索クエリを分離"""
    cid_urls = []
    text_queries = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        current_section = None
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            if 'Google Maps URL' in line:
                current_section = 'cid'
            elif 'テキスト検索' in line:
                current_section = 'text'
            elif current_section == 'cid' and line.startswith('https://'):
                cid_urls.append(line)
            elif current_section == 'text':
                text_queries.append(line)
    
    return cid_urls, text_queries
```

### CID専用ファイルの利用

```python
def load_cid_only_file(file_path: str) -> list:
    """CID専用ファイルからURLリストを取得"""
    cid_urls = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith('https://maps.google.com/place?cid='):
                cid_urls.append(line)
    
    return cid_urls
```

### データファイル選択ロジック

```python
def get_data_file_path(category: str, cid_only: bool = False) -> str:
    """カテゴリとモードに応じてデータファイルパスを取得"""
    base_dir = "tools/scraper/data/urls"
    
    if cid_only:
        return f"{base_dir}/converted/{category}_merged_cid_only.txt"
    else:
        return f"{base_dir}/{category}_merged.txt"

# 使用例
restaurants_path = get_data_file_path('restaurants', cid_only=True)
parkings_path = get_data_file_path('parkings', cid_only=False)
```

## 🔄 データメンテナンス

### 定期更新プロセス

#### 1. **データ収集**
```bash
# 新しい施設情報の収集
# - 佐渡市観光協会サイト
# - Google Maps検索
# - 地域情報サイト
```

#### 2. **CID抽出**
```python
def extract_cid_from_google_maps_url(url: str) -> str:
    """Google Maps URLからCIDを抽出"""
    import re
    match = re.search(r'cid=(\d+)', url)
    return match.group(1) if match else None
```

#### 3. **ファイル更新**
```bash
# メインファイル更新
# 1. 新規CID URLの追加
# 2. コメント（施設名）の更新
# 3. 重複チェック
# 4. ファイルヘッダーの更新日時変更
```

#### 4. **CID専用ファイル再生成**
```python
def generate_cid_only_file(source_file: str, output_file: str):
    """統合ファイルからCID専用ファイルを生成"""
    cid_urls, _ = load_data_file(source_file)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"# --- {category}_Merged CID専用ファイル ---\n")
        f.write(f"# 生成日時: {datetime.now().strftime('%Y年%m月%d日')}\n")
        f.write(f"# CID件数: {len(cid_urls)}\n\n")
        
        for url in cid_urls:
            f.write(f"{url}\n")
```

### データ品質管理

#### 1. **重複チェック**
```python
def check_duplicates(file_path: str) -> list:
    """ファイル内の重複CIDをチェック"""
    cids = []
    duplicates = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            if 'cid=' in line:
                cid = extract_cid_from_google_maps_url(line)
                if cid in cids:
                    duplicates.append(cid)
                else:
                    cids.append(cid)
    
    return duplicates
```

#### 2. **データ検証**
```python
def validate_data_file(file_path: str) -> dict:
    """データファイルの整合性をチェック"""
    stats = {
        'total_lines': 0,
        'cid_urls': 0,
        'text_queries': 0,
        'invalid_lines': 0,
        'duplicates': []
    }
    
    # 検証ロジック実装
    return stats
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. **ファイル読み込みエラー**
```python
# 問題: 文字エンコーディングエラー
# 解決: UTF-8エンコーディングの明示
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
except UnicodeDecodeError:
    with open(file_path, 'r', encoding='shift_jis') as f:
        content = f.read()
```

#### 2. **CID抽出失敗**
```python
# 問題: URL形式の変更
# 解決: 正規表現パターンの更新
def extract_cid_robust(url: str) -> str:
    patterns = [
        r'cid=(\d+)',           # 標準形式
        r'place/([^/]+)',       # 代替形式
        r'data=.*?(\d{15,})'    # 埋め込み形式
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None
```

#### 3. **データファイル破損**
```bash
# 問題: ファイル破損・形式エラー
# 解決: バックアップからの復旧
cp data/urls/restaurants_merged.txt.backup data/urls/restaurants_merged.txt

# 解決: 形式チェックスクリプト実行
python tools/scraper/validate_data_files.py
```

## 📊 パフォーマンス最適化

### 1. **ファイル読み込み最適化**
```python
def load_data_optimized(file_path: str) -> dict:
    """メモリ効率的なデータ読み込み"""
    data = {'cid_urls': [], 'text_queries': []}
    
    with open(file_path, 'r', encoding='utf-8') as f:
        # ジェネレーター使用でメモリ効率化
        for line in f:
            line = line.strip()
            if line.startswith('https://maps.google.com/place?cid='):
                data['cid_urls'].append(line)
    
    return data
```

### 2. **並列処理対応**
```python
from concurrent.futures import ThreadPoolExecutor

def process_data_files_parallel(file_paths: list) -> dict:
    """複数データファイルの並列処理"""
    results = {}
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {
            executor.submit(load_data_file, path): path 
            for path in file_paths
        }
        
        for future in futures:
            path = futures[future]
            results[path] = future.result()
    
    return results
```

## 📚 関連ドキュメント

- [tools/scraper/config/README.md](../config/README.md) - スクレイパー設定管理
- [tools/data/README.md](../../data/README.md) - データベース操作とデータ管理
- [tools/testing/README.md](../../testing/README.md) - テストと診断ツール

## 🎯 まとめ

このデータディレクトリは、佐渡飲食店マップのデータ収集システムの基盤となるデータソースを管理します。CID形式による高精度検索とテキスト検索による柔軟性を組み合わせることで、効率的で正確なデータ収集を実現し、プロジェクトの品質と信頼性を向上させます。

### 主要な利点
- **🎯 高精度**: CID形式による確実な施設特定
- **⚡ 高効率**: 最小限のAPI呼び出しでコスト削減
- **🔄 柔軟性**: テキスト検索による補完機能
- **📊 網羅性**: 佐渡島全域の450+施設をカバー
- **🛠️ 保守性**: 統一された形式と明確な管理プロセス
