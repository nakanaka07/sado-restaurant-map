# 🚀 GitHub Pages デプロイ手順

## 📋 **事前準備**

### 1. GitHubリポジトリ作成

```bash
# GitHubで新しいリポジトリ作成（sado-restaurant-map）
# プロジェクトをGitHubにプッシュ
git init
git add .
git commit -m "初期コミット: 佐渡飲食店マップ完成版"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sado-restaurant-map.git
git push -u origin main
```

### 2. Google Maps API キーをGitHub Secretsに設定

1. GitHubリポジトリ → Settings → Secrets and variables → Actions
2. "New repository secret" をクリック
3. Name: `GOOGLE_MAPS_API_KEY`
4. Secret: あなたのGoogle Maps APIキー
5. "Add secret" をクリック

### 3. GitHub Pages有効化

1. GitHubリポジトリ → Settings → Pages
2. Source: "GitHub Actions" を選択
3. 保存

## 🎯 **自動デプロイ開始**

### 4. 初回デプロイ実行

```bash
# mainブランチにプッシュするだけで自動デプロイ開始
git add .
git commit -m "GitHub Pages デプロイ設定完了"
git push origin main
```

### 5. デプロイ状況確認

1. GitHubリポジトリ → Actions タブ
2. "Deploy to GitHub Pages" ワークフローの進行状況を確認
3. 完了後、`https://YOUR_USERNAME.github.io/sado-restaurant-map/` でアクセス可能

## 🔧 **カスタムドメイン設定（オプション）**

### 6. 独自ドメイン設定

1. ドメインプロバイダでCNAMEレコード設定:

   ```dns
   www.your-domain.com → YOUR_USERNAME.github.io
   ```

2. GitHubリポジトリ → Settings → Pages
3. Custom domain: `www.your-domain.com` を入力
4. "Enforce HTTPS" をチェック

## 📊 **本番環境URL**

- **GitHub Pages**: `https://YOUR_USERNAME.github.io/sado-restaurant-map/`
- **カスタムドメイン**: `https://www.your-domain.com/`

## 🔄 **更新デプロイ**

```bash
# コード変更後、自動デプロイ
git add .
git commit -m "機能追加: 新しい店舗データ"
git push origin main
# → 自動的にビルド・デプロイされます
```

## ✅ **デプロイ後確認項目**

- [ ] 地図が正常に表示される
- [ ] Google Maps APIキーが機能している
- [ ] 検索・フィルター機能が動作する
- [ ] PWA機能（ホーム画面追加）が利用できる
- [ ] モバイルでレスポンシブ表示される
- [ ] HTTPS接続が有効

## 🚨 **トラブルシューティング**

### API キーエラー

- GitHub Secrets の `GOOGLE_MAPS_API_KEY` が正しく設定されているか確認
- Google Cloud Console でAPIキーの制限設定を確認

### 404エラー

- `vite.config.ts` の `base` パスが正しく設定されているか確認
- GitHub Pages の設定で "GitHub Actions" が選択されているか確認

### PWA機能不具合

- HTTPS接続でアクセスしているか確認
- ブラウザのキャッシュをクリア

---

**🎉 完了**: 佐渡飲食店マップがGitHub Pagesで稼働開始！
