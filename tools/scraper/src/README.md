# Src - 実行スクリプト# Src - ソースコード・実行スクリプト

佐渡島レストランマップの Google Places API データ収集システムの実行スクリプトです。佐渡島レストランマップの Google Places API データ収集システムのメイン実行スクリプトとソースコード群です。

## 📁 ディレクトリ構成## 📁 ディレクトリ構成

`text`text

src/src/

└── run_new_unified.py # Google Places API 統合実行スクリプト ├── analyze_api_compatibility.py # API 対応状況分析ツール

````├── new_unified_processor.py       # 統合プロセッサー（New API版）

└── run_new_unified.py            # 新API対応統合実行スクリプト

## 🔧 主要スクリプト```



### `run_new_unified.py` - Google Places API統合実行スクリプト## 🔧 主要スクリプト



**機能**: Places API (New) v1を使用したデータ収集システム### 1. **実行スクリプト**



**特徴**:#### `run_new_unified.py` - 新API対応統合実行スクリプト

- レストラン・駐車場・トイレデータの処理

- コマンドライン引数対応- **機能**: Places API (New) v1を使用した最新版実行システム

- ドライラン機能- **特徴**:

- 環境変数自動読み込み  - コマンドライン引数対応

- 実行前検証機能  - 複数データファイル対応（レストラン・駐車場・トイレ）

  - ドライラン機能

## 🚀 使用方法  - 環境変数自動読み込み

  - 実行前検証機能

### 基本実行

### 2. **プロセッサー**

```bash

# レストランデータの処理#### `new_unified_processor.py` - 統合プロセッサー

python src/run_new_unified.py --target restaurants

- **機能**: NewAPIProcessorを基盤とした統合処理システム

# 駐車場データの処理- **特徴**:

python src/run_new_unified.py --target parkings  - Legacy APIとNew APIの両方に対応

  - 佐渡地域特化検索

# トイレデータの処理  - 自動地区分類

python src/run_new_unified.py --target toilets  - 位置による自動データ分離



# 全カテゴリの処理### 3. **分析ツール**

python src/run_new_unified.py --target all

```#### `analyze_api_compatibility.py` - API対応状況分析ツール



### 高度なオプション- **機能**: Google Places API対応状況の分析・レポート

- **特徴**:

```bash  - Legacy API vs New API v1の比較

# ドライラン（実際の更新なし）  - primary_typeフィールド対応状況分析

python src/run_new_unified.py --target restaurants --dry-run  - ハイブリッド方式の説明

  - 移行戦略の提示

# 位置分離を無効化

python src/run_new_unified.py --target restaurants --no-separate## 🚀 使用方法

````

### 基本実行

## ⚙️ 必須環境変数

````bash

```bash# レストランデータの処理

# Google Places API設定python src/run_new_unified.py --category restaurants

PLACES_API_KEY=your_places_api_key_here

# 駐車場データの処理

# Google Sheets設定python src/run_new_unified.py --category parkings

SPREADSHEET_ID=your_spreadsheet_id_here

GOOGLE_SERVICE_ACCOUNT_PATH=config/service-account.json# トイレデータの処理

```python src/run_new_unified.py --category toilets



## 🏗️ 処理フロー# 全カテゴリの処理

python src/run_new_unified.py --category all

```text```

run_new_unified.py → processors/new_unified_processor.py → Google APIs

       ↓                      ↓                              ↓### 高度なオプション

   引数解析・検証         統合処理制御                データ取得・更新

       ↓                      ↓                              ↓```bash

   環境変数読み込み       プロセッサー連携         スプレッドシート更新# ドライラン（実際の更新なし）

```python src/run_new_unified.py --category restaurants --dry-run



## 🔍 トラブルシューティング# 位置分離を無効化

python src/run_new_unified.py --category restaurants --no-separation

### よくある問題

# カスタムファイル指定

1. **環境変数エラー**: `.env`ファイルの設定を確認python src/run_new_unified.py --file data/custom/my_data.txt --sheet-name "カスタムデータ"

2. **API制限エラー**: API使用量・請求アカウントを確認

3. **ファイル読み込みエラー**: データファイルの存在・エンコーディングを確認# 詳細ログ出力

python src/run_new_unified.py --category restaurants --verbose

---```



**注意**: 本番環境での実行前には必ず`--dry-run`でテストを行ってください。### API対応状況分析

```bash
# API対応状況の分析実行
python src/analyze_api_compatibility.py
````

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

### Phase 2 機能フラグ

```bash
# 新プロセッサー使用
USE_NEW_PROCESSORS=true

# スマートスキップ機能
ENABLE_SMART_SKIP=true

# 位置分離機能
ENABLE_LOCATION_SEPARATION=true
```

## 🏗️ アーキテクチャ設計

### 実行フロー

```text
run_new_unified.py → new_unified_processor.py → processors/ → Google APIs
       ↓                      ↓                    ↓            ↓
   引数解析・検証         統合処理制御        専門処理実行    データ取得
       ↓                      ↓                    ↓            ↓
   環境変数読み込み       プロセッサー連携      API通信       レスポンス処理
       ↓                      ↓                    ↓            ↓
   ファイル検証           結果集約・報告        データ検証    スプレッドシート更新
```

### 処理レイヤー

1. **実行層**: `run_new_unified.py` - コマンドライン処理・環境設定
2. **制御層**: `new_unified_processor.py` - 統合処理制御・結果管理
3. **処理層**: `processors/` - 専門処理実行・API 通信
4. **データ層**: Google Sheets・Places API - データ永続化・取得

## 📊 データ処理統計

### 処理能力

- **レストラン**: 450+件の処理対応
- **駐車場**: 130+件の処理対応
- **トイレ**: 95+件の処理対応
- **API 効率**: 98%以上の成功率
- **処理速度**: 1 件/秒（API 制限準拠）

### 品質指標

- **データ完全性**: 95%以上の必須フィールド充足
- **位置精度**: 100%の佐渡島内外判定
- **重複率**: 5%以下の重複データ
- **地区分類精度**: 90%以上の正確な地区分類

## 🔍 トラブルシューティング

### よくある問題と解決方法

#### 1. **環境変数エラー**

```text
エラー: Environment variable not found
解決方法:
- .env.localファイルの存在確認
- 必須環境変数の設定確認
- config/.envファイルの配置確認
```

#### 2. **ファイル読み込みエラー**

```text
エラー: File not found or empty
解決方法:
- データファイルの存在確認
- ファイルパスの正確性確認
- UTF-8エンコーディングの確認
```

#### 3. **API 制限エラー**

```text
エラー: API quota exceeded
解決方法:
- API使用量の確認
- 請求アカウントの確認
- レート制限設定の調整
```

#### 4. **プロセッサー初期化エラー**

```text
エラー: Processor initialization failed
解決方法:
- processors/ディレクトリの確認
- 依存関係のインストール確認
- Python環境の確認
```

## 🎯 パフォーマンス最適化

### 実行時間短縮

- **並列処理**: 複数カテゴリの同時処理
- **スマートスキップ**: 既存データの再利用
- **バッチ処理**: 効率的な API 呼び出し
- **キャッシュ活用**: 中間結果の保存

### メモリ効率化

- **ストリーミング処理**: 大容量ファイルの逐次処理
- **ガベージコレクション**: 明示的なメモリ解放
- **データ圧縮**: 中間結果の圧縮保存

### API 効率化

- **レート制限遵守**: 1 秒間隔の API 呼び出し
- **エラーハンドリング**: 自動リトライ機能
- **コスト管理**: API 使用量の監視・制御

## 🔄 継続的改善

### 定期メンテナンス

1. **API 対応状況確認**: `analyze_api_compatibility.py`による分析
2. **パフォーマンス測定**: 処理時間・成功率の監視
3. **データ品質チェック**: 結果データの品質確認
4. **環境設定更新**: 新機能・設定の適用

### 品質改善指標

- **処理速度**: 月次 10%向上目標
- **エラー率**: 月次 20%削減目標
- **API 効率**: 月次 5%コスト削減目標
- **データ精度**: 月次 1%向上目標

## 📚 拡張ポイント

### 新機能追加

1. **新カテゴリ対応**: 観光地・宿泊施設等の追加
2. **API 機能拡張**: 新しい Places API 機能の活用
3. **出力形式拡張**: JSON・CSV 等の出力対応
4. **監視機能**: リアルタイム処理状況監視

### 新 API 移行

1. **Places API (New) v1 完全移行**: Legacy API からの段階的移行
2. **新フィールド対応**: primary_type 等の新フィールド活用
3. **パフォーマンス向上**: 新 API の高速化機能活用
4. **コスト最適化**: 新料金体系への対応

## 🔧 開発者向け情報

### デバッグ方法

```bash
# デバッグモードで実行
python src/run_new_unified.py --category restaurants --verbose --dry-run

# 特定ファイルのテスト
python src/run_new_unified.py --file data/test/sample.txt --dry-run

# API対応状況の詳細分析
python src/analyze_api_compatibility.py
```

### カスタマイズ

- **新プロセッサー追加**: `new_unified_processor.py`の拡張
- **新実行オプション**: `run_new_unified.py`の引数追加
- **新分析機能**: `analyze_api_compatibility.py`の機能拡張

---

**注意**: このソースコード群は佐渡島レストランマップの中核実行システムです。本番環境での実行前には必ずドライランでテストを行ってください。
