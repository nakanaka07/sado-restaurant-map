# 🔧 Phase 3-Full 統合テスト環境 開発環境セットアップ

## 📋 開発環境での警告解消手順

### 1. 統合テスト用パッケージのインストール

開発環境でコード警告を解消するため、以下のパッケージをインストールします：

```powershell
# 仮想環境をアクティベート
& .\.venv\Scripts\Activate.ps1

# 統合テスト用依存関係をインストール
pip install -r requirements-integration.txt
```

### 2. 警告が解消される項目

#### ✅ Locust インポート警告

- **警告**: `インポート "locust" を解決できませんでした`
- **解消**: `pip install locust` で Locust パッケージがインストールされ、型チェックエラーが解消

#### ✅ Markdown 書式警告

- **警告**: `MD031/blanks-around-fences: Fenced code blocks should be surrounded by blank lines`
- **解消**: ドキュメントファイルの書式を修正済み

### 3. 開発環境セットアップ完了確認

```powershell
# Locustが正常にインストールされたことを確認
python -c "import locust; print(f'Locust version: {locust.__version__}')"

# 負荷テストファイルの構文チェック
python -m py_compile tools\testing\load-tests\locustfile.py
```

### 4. 統合テスト環境での実行

開発環境でのセットアップ完了後、統合テスト環境でも正常に動作します：

```powershell
# 統合テスト環境起動
docker-compose -f docker-compose.integration.yml up -d

# Locust Web UI アクセス
# http://localhost:8089
```

## 📦 インストールされる主要パッケージ

| パッケージ | 用途                 | バージョン |
| ---------- | -------------------- | ---------- |
| **locust** | 負荷テスト           | >=2.0.0    |
| **pandas** | データ処理           | >=1.5.0    |
| **pytest** | テストフレームワーク | >=7.0.0    |
| **psutil** | システム監視         | >=5.9.0    |
| **black**  | コードフォーマッター | >=22.0.0   |
| **mypy**   | 型チェック           | >=1.0.0    |

## 🎯 警告解消確認

以下のコマンドで警告が解消されたことを確認できます：

```powershell
# Python型チェック（mypy使用）
mypy tools\testing\load-tests\locustfile.py

# Markdownリント（markdownlint使用、オプション）
# npm install -g markdownlint-cli
# markdownlint docs\testing\INTEGRATION_TEST_QUICKSTART.md
```

---

**🎉 これで開発環境でも警告なしで Phase 3-Full 統合テスト環境を使用できます！**
