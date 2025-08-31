# 🔧 Scraper Development Tools

> 🎯 **目的**: スクレイパー開発・保守・分析用ツール集
> **対象**: スクレイパー開発者・データ分析者・保守担当者
> **最終更新**: 2025 年 8 月 31 日

## 📁 ディレクトリ構成

### 📊 analysis/

診断・分析用ツール（データ分析・問題調査）

- `check_sheets.py` - Google Sheets データ内容確認
- `check_sheets_detail.py` - シート詳細情報分析
- `check_timestamps.py` - 更新時間戳の詳細調査
- `check_worksheets.py` - ワークシート構造確認
- `investigate_update_logic.py` - 更新ロジック調査
- `trace_update_process.py` - 更新プロセス追跡

### 🧪 testing/

テスト・検証用ツール

- `test_smart_update.py` - スマート更新システムテスト

### 🔧 maintenance/

メンテナンス・修復用ツール

- `restore_worksheets.py` - ワークシート復旧ツール
- `smart_update_patch.py` - スマート更新パッチ適用

## 🎯 使用用途

### 日常開発

```bash
# データ確認
python tools/analysis/check_sheets.py

# 更新ロジック調査
python tools/analysis/investigate_update_logic.py

# スマート更新テスト
python tools/testing/test_smart_update.py
```

### トラブルシューティング

```bash
# 更新時間戳調査
python tools/analysis/check_timestamps.py

# 更新プロセス追跡
python tools/analysis/trace_update_process.py

# ワークシート復旧
python tools/maintenance/restore_worksheets.py
```

### システム保守

```bash
# 詳細データ分析
python tools/analysis/check_sheets_detail.py

# パッチ適用
python tools/maintenance/smart_update_patch.py
```

## 📋 ツール依存関係

すべてのツールはスクレイパーのメイン環境設定を使用：

- `shared/config.py` - 環境設定
- `shared/container.py` - 依存性注入
- `config/.env` - 環境変数

実行前に仮想環境を有効化してください：

```bash
.venv\Scripts\Activate.ps1
```
