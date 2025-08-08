# Google Cloud Console API キー制限設定ガイド

> 🎯 **目的**: GitHub Pages での佐渡飲食店マップ動作のための API 制限設定  
> **対象**: Google Cloud Console API キー管理者  
> **最終更新**: 2025 年 8 月 8 日

## 🔧 HTTP リファラー制限の設定

### **必要な設定**

Google Cloud Console → APIs & Services → Credentials → API キー設定で以下を追加:

#### **ローカル開発環境**

```
http://localhost:*/*
http://127.0.0.1:*/*
```

#### **GitHub Pages**

```
https://nakanaka07.github.io/sado-restaurant-map/*
https://*.github.io/sado-restaurant-map/*
```

#### **その他の本番環境（将来用）**

```
https://sado-restaurant-map.vercel.app/*
https://your-custom-domain.com/*
```

## 🔐 API 制限の詳細設定

### **Google Maps JavaScript API**

1. **API 制限**

   - Maps JavaScript API: ✅ 有効
   - Places API (New): ✅ 有効
   - Geocoding API: ✅ 有効（住所 → 座標変換用）

2. **HTTP リファラー**
   ```
   http://localhost:*/*
   http://127.0.0.1:*/*
   https://nakanaka07.github.io/sado-restaurant-map/*
   https://*.github.io/sado-restaurant-map/*
   ```

### **Google Sheets API**

1. **API 制限**

   - Google Sheets API: ✅ 有効

2. **HTTP リファラー**
   ```
   http://localhost:*/*
   http://127.0.0.1:*/*
   https://nakanaka07.github.io/sado-restaurant-map/*
   https://*.github.io/sado-restaurant-map/*
   ```

## ⚠️ トラブルシューティング

### **よくあるエラー**

#### **`RefererNotAllowedMapError`**

```
原因: HTTPリファラー制限でGitHub Pagesのドメインがブロックされている
解決: 上記のGitHub Pagesドメインを追加
```

#### **`ApiNotActivatedMapError`**

```
原因: 必要なAPIが有効化されていない
解決: Maps JavaScript API、Places API、Sheets APIを有効化
```

#### **`RequestDenied`**

```
原因: APIキー制限またはクォータ制限
解決: API制限設定を確認し、必要に応じて制限を緩和
```

## 🔍 設定確認手順

### **1. API キー制限確認**

```bash
# Google Cloud Console
1. https://console.cloud.google.com/ にアクセス
2. APIs & Services → Credentials
3. 該当APIキーを選択
4. "Website restrictions" セクションを確認
```

### **2. API 有効化確認**

```bash
# Google Cloud Console
1. APIs & Services → Enabled APIs & services
2. 以下のAPIが有効か確認:
   - Maps JavaScript API
   - Places API (New)
   - Google Sheets API
   - Geocoding API
```

### **3. 実際のテスト**

```bash
# GitHub Pagesでの動作確認
1. https://nakanaka07.github.io/sado-restaurant-map/ にアクセス
2. ブラウザのDevToolsでコンソールエラーを確認
3. 地図が正常に表示されるか確認
4. 飲食店データが読み込まれるか確認
```

## 🎯 設定チェックリスト

### **Google Cloud Console**

- [ ] Maps JavaScript API が有効
- [ ] Places API (New) が有効
- [ ] Google Sheets API が有効
- [ ] Geocoding API が有効
- [ ] HTTP リファラー制限に GitHub Pages ドメイン追加
- [ ] HTTP リファラー制限にローカル開発ドメイン追加

### **GitHub リポジトリ**

- [ ] GOOGLE_MAPS_API_KEY Secret 設定済み
- [ ] GOOGLE_MAPS_MAP_ID Secret 設定済み
- [ ] GOOGLE_SHEETS_API_KEY Secret 設定済み
- [ ] SPREADSHEET_ID Secret 設定済み

### **動作確認**

- [ ] ローカル開発で正常動作
- [ ] GitHub Actions ビルド成功
- [ ] GitHub Pages デプロイ成功
- [ ] 本番環境での地図表示確認
- [ ] 本番環境でのデータ読み込み確認

---

**注意**: API キー制限は段階的に設定することを推奨します。まず制限を緩くして動作確認し、その後必要最小限に絞り込んでください。
