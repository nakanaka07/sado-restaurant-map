# Google Maps API 設定ガイド

> 🎯 **目的**: 佐渡飲食店マップ用Google Maps API設定
> **最終更新**: 2025年8月20日
> **対象**: 開発環境・本番環境の両方

## 🔐 **APIキー設定（重要）**

### 開発環境用ドメイン設定

Google Cloud Console → APIとサービス → 認証情報 → Maps JavaScript APIキー → アプリケーションの制限

**HTTP リファラー（ウェブサイト）に追加する設定**:

```text
# ローカル開発環境
http://localhost:5173/*
http://127.0.0.1:5173/*

# 本番環境（GitHub Pages）
https://nakanaka07.github.io/sado-restaurant-map/*

# その他の開発用（必要に応じて）
http://localhost:*
http://127.0.0.1:*
```

### 🚨 **トラブルシューティング**

#### 現象: 地図が表示されない

**原因**: APIキーのリファラー制限
**解決策**: 上記のドメインを追加

#### 現象: "This API project is not authorized" エラー

**原因**: APIが有効化されていない
**解決策**:

1. Google Cloud Console → APIとサービス → ライブラリ
2. 以下のAPIを有効化：
   - Maps JavaScript API
   - Places API (New)
   - Geocoding API

### 🔧 **環境変数設定**

`.env.local`ファイルを作成（`.env.local.example`をコピー）:

```bash
# Google Maps API設定
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
VITE_GOOGLE_MAPS_MAP_ID=your_map_id_here

# Google Sheets API設定
VITE_GOOGLE_SHEETS_API_KEY=your_sheets_api_key_here
VITE_SPREADSHEET_ID=your_spreadsheet_id_here
```

### ⚙️ **API制限の推奨設定**

```text
アプリケーションの制限: HTTP リファラー（ウェブサイト）

許可するリファラー:
✅ http://localhost:5173/*
✅ http://127.0.0.1:5173/*
✅ https://nakanaka07.github.io/sado-restaurant-map/*

API制限:
✅ Maps JavaScript API
✅ Places API (New)
✅ Geocoding API
```

## 🧪 **設定確認手順**

1. **APIキー設定変更後**、5-10分待つ（反映時間）
2. **開発サーバー再起動**: `pnpm dev`
3. **ブラウザキャッシュクリア**: Ctrl+Shift+R
4. **DevTools Console**で地図エラーがないことを確認

---

**設定完了後**: <http://127.0.0.1:5173/> で地図が正常表示されることを確認
