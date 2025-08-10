# Tools - 専門ユーティリティツール

佐渡島レストランマップのGoogle Places APIデータ収集システムの専門ユーティリティツール群です。

## 📁 ディレクトリ構成

```text
tools/
├── __init__.py                   # パッケージ初期化
├── complement_missing.py         # 手動URL補完更新スクリプト
├── debug_data_flow.py           # データ変換フロー確認ツール
├── debug_field_mask.py          # Places APIフィールドマスク確認ツール
├── debug_update.py              # 更新処理デバッグツール
└── manual_url_extractor.py      # 手動URL抽出・処理ツール
```

## 🔧 専門ツール

### 1. **補完・修復ツール**

#### `complement_missing.py` - 手動URL補完更新スクリプト
- **機能**: 通常検索で見つからない店舗を手動URLで補完
- **特徴**:
  - 通常のrun_optimized.py実行後の補完処理
  - 手動Google Maps検索結果の活用
  - missing_restaurants_urls.txtファイル対応
  - 自動データ整形・スプレッドシート更新

#### `manual_url_extractor.py` - 手動URL抽出・処理ツール
- **機能**: Google Maps URLからPlace IDを抽出してPlace APIで詳細情報を取得
- **特徴**:
  - 複数URL形式対応（通常URL・短縮URL・CID URL）
  - 短縮URL自動展開機能
  - コマンドライン・ファイル入力対応
  - Place API詳細情報取得

### 2. **デバッグ・診断ツール**

#### `debug_data_flow.py` - データ変換フロー確認ツール
- **機能**: unified_cid_processor → spreadsheet_manager のデータ変換フロー確認
- **特徴**:
  - 最終更新日時の正確性確認
  - データ変換プロセスの検証
  - サンプルクエリによるテスト実行
  - 変換エラーの特定・診断

#### `debug_field_mask.py` - Places APIフィールドマスク確認ツール
- **機能**: フィールドマスクの詳細確認と実際のAPIレスポンステスト
- **特徴**:
  - カテゴリ別フィールドマスク表示
  - フィールド分類・整理表示
  - 実際のAPIレスポンス確認
  - フィールド取得状況の診断

#### `debug_update.py` - 更新処理デバッグツール
- **機能**: 地区・GoogleマップURL更新が失敗した原因を特定
- **特徴**:
  - 佐渡市公式地区分類システム
  - 住所から地区判定の詳細確認
  - 更新処理エラーの診断
  - Google Sheets接続確認

## 🚀 使用方法

### 手動URL補完処理

```bash
# 1. 通常処理実行
python run_optimized.py

# 2. 見つからない店舗のURLを手動収集
# missing_restaurants_urls.txt に保存

# 3. 手動URL補完実行
python tools/complement_missing.py
```

### 手動URL抽出・処理

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
# データ変換フロー確認
python tools/debug_data_flow.py

# フィールドマスク確認
python tools/debug_field_mask.py

# 更新処理デバッグ
python tools/debug_update.py
```

## ⚙️ 設定・環境変数

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

## 🏗️ アーキテクチャ設計

### ツール分類

```text
補完・修復系 → デバッグ・診断系 → メイン処理システム
     ↓              ↓                    ↓
complement_    debug_data_flow      processors/
missing.py     debug_field_mask     unified_cid_processor
     ↓         debug_update              ↓
manual_url_         ↓              Google APIs
extractor.py   問題特定・解決      データ取得・更新
```

### 処理フロー

1. **メイン処理実行**: 通常のデータ収集処理
2. **問題特定**: デバッグツールによる問題診断
3. **手動補完**: 見つからないデータの手動収集・処理
4. **品質確認**: 変換フロー・フィールドマスクの確認

## 📊 対応URL形式

### Google Maps URL形式

- **通常URL**: `https://www.google.com/maps/place/店舗名/@緯度,経度,zoom/data=...`
- **CID URL**: `https://maps.google.com/place?cid=数値`
- **データURL**: `https://www.google.com/maps/place/店舗名/data=...`
- **短縮URL**: `https://goo.gl/maps/短縮URL`
- **新短縮URL**: `https://maps.app.goo.gl/短縮URL`

### Place ID抽出方法

- **data=パラメータ**: Base64デコード・正規表現抽出
- **CIDパラメータ**: 直接数値抽出
- **短縮URL**: HTTP展開・リダイレクト追跡
- **埋め込み情報**: URL構造解析・パターンマッチング

## 🔍 トラブルシューティング

### よくある問題と解決方法

#### 1. **手動URL補完エラー**

```text
エラー: missing_restaurants_urls.txt が見つかりません
解決方法:
- ファイル作成・URL追加
- UTF-8エンコーディング確認
- URL形式の正確性確認
```

#### 2. **URL抽出失敗**

```text
エラー: Place ID extraction failed
解決方法:
- URL形式の確認
- 短縮URL展開の確認
- data=パラメータの存在確認
```

#### 3. **データ変換フローエラー**

```text
エラー: Data conversion flow failed
解決方法:
- processors/ディレクトリの確認
- 環境変数設定の確認
- サンプルデータの形式確認
```

#### 4. **フィールドマスクエラー**

```text
エラー: Field mask validation failed
解決方法:
- Places API接続確認
- APIキー権限確認
- フィールドマスク形式確認
```

## 🎯 パフォーマンス最適化

### 処理効率化

- **バッチ処理**: 複数URL・データの一括処理
- **キャッシュ活用**: 重複処理の回避
- **並列処理**: 独立処理の同時実行
- **エラーハンドリング**: 失敗時の自動リトライ

### メモリ効率化

- **ストリーミング処理**: 大容量ファイルの逐次処理
- **リソース管理**: 明示的なリソース解放
- **データ圧縮**: 中間結果の効率的保存

### API効率化

- **レート制限遵守**: API呼び出し間隔の制御
- **エラー処理**: 適切なエラーハンドリング
- **コスト管理**: 不要なAPI呼び出しの削減

## 🔄 継続的改善

### 定期メンテナンス

1. **URL形式更新**: 新しいGoogle Maps URL形式への対応
2. **デバッグ機能拡張**: 新しい診断項目の追加
3. **補完精度向上**: 手動処理の自動化推進
4. **エラー処理改善**: 新しいエラーパターンへの対応

### 品質改善指標

- **URL抽出成功率**: 95%以上の抽出成功率
- **補完処理精度**: 90%以上の正確な補完
- **デバッグ効率**: 問題特定時間の短縮
- **処理速度**: 月次10%の処理時間短縮

## 📚 拡張ポイント

### 新機能追加

1. **新URL形式対応**: 将来のGoogle Maps URL変更への対応
2. **自動補完機能**: 手動処理の自動化
3. **高度診断機能**: より詳細な問題分析
4. **統合レポート**: 包括的な処理結果レポート

### ツール統合

1. **ワークフロー自動化**: 複数ツールの連携実行
2. **GUI化**: ユーザーフレンドリーなインターフェース
3. **監視機能**: リアルタイム処理状況監視
4. **通知機能**: 処理完了・エラー通知

## 🔧 開発者向け情報

### カスタマイズ方法

```python
# 新しいURL形式追加例
def extract_new_url_format(self, url):
    """新しいURL形式の処理"""
    pattern = r'new_pattern_here'
    match = re.search(pattern, url)
    if match:
        return match.group(1)
    return None
```

### デバッグ出力

```python
# 詳細デバッグ出力の有効化
DEBUG_MODE = True
VERBOSE_OUTPUT = True
```

### テスト実行

```bash
# 個別ツールテスト
python -m pytest tools/test_manual_url_extractor.py
python -m pytest tools/test_debug_tools.py
```

---

**注意**: これらのツールは専門的な問題解決・補完処理用です。メイン処理で解決できない問題に対してのみ使用してください。
