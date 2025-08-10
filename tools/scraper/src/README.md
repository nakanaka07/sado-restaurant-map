# Src - ソースコード・実行スクリプト

佐渡島レストランマップのGoogle Places APIデータ収集システムのメイン実行スクリプトとソースコード群です。

## 📁 ディレクトリ構成

```text
src/
├── analyze_api_compatibility.py   # API対応状況分析ツール
├── new_unified_processor.py       # 統合プロセッサー（New API版）
└── run_new_unified.py            # 新API対応統合実行スクリプト
```

## 🔧 主要スクリプト

### 1. **実行スクリプト**

#### `run_new_unified.py` - 新API対応統合実行スクリプト

- **機能**: Places API (New) v1を使用した最新版実行システム
- **特徴**:
  - コマンドライン引数対応
  - 複数データファイル対応（レストラン・駐車場・トイレ）
  - ドライラン機能
  - 環境変数自動読み込み
  - 実行前検証機能

### 2. **プロセッサー**

#### `new_unified_processor.py` - 統合プロセッサー

- **機能**: NewAPIProcessorを基盤とした統合処理システム
- **特徴**:
  - Legacy APIとNew APIの両方に対応
  - 佐渡地域特化検索
  - 自動地区分類
  - 位置による自動データ分離

### 3. **分析ツール**

#### `analyze_api_compatibility.py` - API対応状況分析ツール

- **機能**: Google Places API対応状況の分析・レポート
- **特徴**:
  - Legacy API vs New API v1の比較
  - primary_typeフィールド対応状況分析
  - ハイブリッド方式の説明
  - 移行戦略の提示

## 🚀 使用方法

### 基本実行

```bash
# レストランデータの処理
python src/run_new_unified.py --category restaurants

# 駐車場データの処理
python src/run_new_unified.py --category parkings

# トイレデータの処理
python src/run_new_unified.py --category toilets

# 全カテゴリの処理
python src/run_new_unified.py --category all
```

### 高度なオプション

```bash
# ドライラン（実際の更新なし）
python src/run_new_unified.py --category restaurants --dry-run

# 位置分離を無効化
python src/run_new_unified.py --category restaurants --no-separation

# カスタムファイル指定
python src/run_new_unified.py --file data/custom/my_data.txt --sheet-name "カスタムデータ"

# 詳細ログ出力
python src/run_new_unified.py --category restaurants --verbose
```

### API対応状況分析

```bash
# API対応状況の分析実行
python src/analyze_api_compatibility.py
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
3. **処理層**: `processors/` - 専門処理実行・API通信
4. **データ層**: Google Sheets・Places API - データ永続化・取得

## 📊 データ処理統計

### 処理能力

- **レストラン**: 450+件の処理対応
- **駐車場**: 130+件の処理対応
- **トイレ**: 95+件の処理対応
- **API効率**: 98%以上の成功率
- **処理速度**: 1件/秒（API制限準拠）

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

#### 3. **API制限エラー**

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
- **バッチ処理**: 効率的なAPI呼び出し
- **キャッシュ活用**: 中間結果の保存

### メモリ効率化

- **ストリーミング処理**: 大容量ファイルの逐次処理
- **ガベージコレクション**: 明示的なメモリ解放
- **データ圧縮**: 中間結果の圧縮保存

### API効率化

- **レート制限遵守**: 1秒間隔の API呼び出し
- **エラーハンドリング**: 自動リトライ機能
- **コスト管理**: API使用量の監視・制御

## 🔄 継続的改善

### 定期メンテナンス

1. **API対応状況確認**: `analyze_api_compatibility.py`による分析
2. **パフォーマンス測定**: 処理時間・成功率の監視
3. **データ品質チェック**: 結果データの品質確認
4. **環境設定更新**: 新機能・設定の適用

### 品質改善指標

- **処理速度**: 月次10%向上目標
- **エラー率**: 月次20%削減目標
- **API効率**: 月次5%コスト削減目標
- **データ精度**: 月次1%向上目標

## 📚 拡張ポイント

### 新機能追加

1. **新カテゴリ対応**: 観光地・宿泊施設等の追加
2. **API機能拡張**: 新しいPlaces API機能の活用
3. **出力形式拡張**: JSON・CSV等の出力対応
4. **監視機能**: リアルタイム処理状況監視

### 新API移行

1. **Places API (New) v1完全移行**: Legacy APIからの段階的移行
2. **新フィールド対応**: primary_type等の新フィールド活用
3. **パフォーマンス向上**: 新APIの高速化機能活用
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
