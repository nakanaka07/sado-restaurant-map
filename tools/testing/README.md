# 🔬 Testing Tools

> 🎯 **目的**: 開発環境の設定確認・Google APIs 統合テスト・データフロー検証
> **対象**: 環境設定・API 統合を担当する開発者
> **最終更新**: 2025 年 8 月 30 日

## 🛠️ ツール構成

| ツール                  | 機能                     | 用途             |
| ----------------------- | ------------------------ | ---------------- |
| `check-environment.ps1` | 環境変数設定チェック     | 開発環境準備     |
| `test-integration.ps1`  | Google Sheets 統合テスト | データフロー検証 |

## 🚀 使用方法

### 環境設定チェック

```powershell
# 基本チェック
.\check-environment.ps1

# 詳細表示
.\check-environment.ps1 -Verbose

# 自動修正提案
.\check-environment.ps1 -Fix
```

### 統合テスト実行

```powershell
# 統合テスト実行
.\test-integration.ps1

# package.json経由
pnpm run test:integration
```

## 🔑 必須環境変数

- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps JavaScript API キー
- `VITE_GOOGLE_MAPS_MAP_ID` - Google Maps Map ID
- `VITE_GOOGLE_SHEETS_API_KEY` - Google Sheets API v4 キー
- `VITE_SPREADSHEET_ID` - スプレッドシート ID

## 🐛 トラブルシューティング

- **環境変数未設定**: `.env.local.example`をコピーして値を設定
- **Python 環境エラー**: `cd tools/scraper && python -m venv .venv`

## 🎯 推奨ワークフロー

```powershell
# 1. 環境設定確認
.\check-environment.ps1 -Verbose

# 2. 統合テスト実行
.\test-integration.ps1
```

---

**環境要件**: PowerShell 5.1+、Python 3.8+、Node.js 18+
