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

#### Step 1: ドメイン取得

推奨ドメインプロバイダ（日本語サポート）:

- **お名前.com**: 国内最大手・安価
- **ムームードメイン**: 初心者向け・簡単設定
- **Cloudflare Registrar**: 技術者向け・高機能

おすすめドメイン例:

- `sado-restaurant-map.com`
- `sado-gourmet.jp`
- `sadofood.net`

#### Step 2: DNSレコード設定

##### Option A: サブドメイン使用（推奨）

```dns
# CNAMEレコード
www.your-domain.com → nakanaka07.github.io
```

##### Option B: ルートドメイン使用

```dns
# Aレコード（GitHub Pages IP）
your-domain.com → 185.199.108.153
your-domain.com → 185.199.109.153
your-domain.com → 185.199.110.153
your-domain.com → 185.199.111.153

# CNAMEレコード（wwwリダイレクト）
www.your-domain.com → your-domain.com
```

#### Step 3: GitHub Pages設定

1. GitHubリポジトリ → **Settings** → **Pages**
2. **Custom domain**: `www.your-domain.com` を入力
3. **Save** をクリック
4. 🔄 DNS検証待ち（最大24時間）
5. ✅ 検証完了後 → **Enforce HTTPS** をチェック

#### Step 4: 自動HTTPS確認

```bash
# SSL証明書確認
curl -I https://www.your-domain.com
# → HTTP/2 200 が返れば成功
```

### 7. ドメインプロバイダ別設定例

#### お名前.com設定

1. ネームサーバー設定 → DNS設定
2. CNAMEレコード追加:
   - ホスト名: `www`
   - VALUE: `nakanaka07.github.io`
   - TTL: `3600`

#### ムームードメイン設定

1. ムームーDNS → カスタム設定
2. CNAMEレコード:
   - サブドメイン: `www`
   - 種別: `CNAME`
   - 内容: `nakanaka07.github.io`

#### Cloudflare設定

1. DNS管理 → レコード追加
2. CNAME設定:
   - 名前: `www`
   - ターゲット: `nakanaka07.github.io`
   - プロキシ状況: 🟠 DNS only（重要！）

### 8. カスタムドメインの利点

#### 🌟 **ビジネスメリット**

- **プロフェッショナルなブランディング**: `sado-gourmet.com` のような覚えやすいURL
- **SEO効果向上**: 独自ドメインによる検索エンジン評価向上
- **ユーザー信頼性**: GitHub サブドメインより信頼感のあるURL
- **将来性**: ホスティング変更時もURLを維持可能

#### ⚡ **技術的メリット**

- **無料SSL証明書**: Let's Encrypt自動更新
- **CDN配信**: Fastly による世界中の高速配信
- **HTTPS強制**: セキュアな通信の保証
- **DNS管理**: 柔軟なサブドメイン設定

### 9. 注意点・制約事項

#### ⚠️ **設定時の注意**

- **DNS伝播時間**: 最大24-48時間必要
- **Cloudflare注意**: プロキシ機能はOFF必須（🟠 DNS only）
- **HTTPS有効化**: DNS検証完了後のみ可能
- **サブパス制限**: GitHub Pagesはサブパス未対応

#### 💰 **コスト考慮**

- **ドメイン取得費**: 年間 500-3,000円程度
- **DNS管理**: 多くのプロバイダで無料
- **SSL証明書**: GitHub Pages完全無料
- **CDN配信**: GitHub Pages完全無料

## 📊 **本番環境URL比較**

| 項目 | GitHub Pages標準 | カスタムドメイン |
|------|------------------|------------------|
| **URL** | `nakanaka07.github.io/sado-restaurant-map/` | `www.sado-gourmet.com` |
| **SSL証明書** | ✅ 無料・自動 | ✅ 無料・自動 |
| **CDN配信** | ✅ Fastly | ✅ Fastly |
| **SEO効果** | 🟡 標準 | ✅ 向上 |
| **ブランディング** | 🟡 GitHub依存 | ✅ 独自性 |
| **コスト** | 🟢 完全無料 | 🟡 ドメイン代のみ |
| **設定難易度** | 🟢 簡単 | 🟡 中程度 |

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

## 🔧 **カスタムドメイン トラブルシューティング**

### よくある問題と解決方法

#### 🚨 **「DNS設定が見つかりません」エラー**

**原因**: DNS伝播が未完了

**解決方法**:

```bash
# DNS伝播確認
nslookup www.your-domain.com
# または
dig www.your-domain.com

# GitHub Pages IP到達確認
ping www.your-domain.com
```

#### 🚨 **「SSL証明書エラー」**

**原因**: HTTPS有効化タイミングが早すぎる

**解決方法**:

1. DNS検証完了まで待機（最大48時間）
2. GitHub Pages設定で「Enforce HTTPS」を一旦無効化
3. DNS完全伝播後に再有効化

#### 🚨 **「Cloudflareでアクセスできない」**

**原因**: プロキシ機能が有効になっている

**解決方法**:

1. Cloudflare DNS設定を確認
2. プロキシ状況を 🟠 **DNS only** に変更
3. 🌩️ Proxied は使用禁止

### 設定確認コマンド

```bash
# 最終動作確認
curl -I https://www.your-domain.com
# 期待値: HTTP/2 200

# リダイレクト確認
curl -I http://www.your-domain.com
# 期待値: 301 → https

# SSL証明書詳細確認
openssl s_client -connect www.your-domain.com:443
```

---

**🎉 完了**: カスタムドメイン設定完了！独自ドメインでの佐渡飲食店マップ公開成功！

## 📊 **Google Analytics 4 設定（オプション）**

### 10. Google Analytics導入手順

#### Step 1: アカウント作成

1. [Google Analytics](https://analytics.google.com/) にアクセス
2. 「測定を開始」→ アカウント名: `佐渡飲食店マップ`
3. プロパティ名: `sado-restaurant-map`
4. 業種: `旅行・観光` → 測定ID取得

#### Step 2: 環境変数設定

```bash
# .env.local に追加
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### Step 3: GitHub Secrets追加

1. GitHub → Settings → Secrets and variables → Actions
2. Name: `GA_MEASUREMENT_ID` / Secret: `G-XXXXXXXXXX`

#### Step 4: コード実装

詳細な実装手順は `GOOGLE_ANALYTICS_GUIDE.md` を参照

### 📈 **取得できるデータ例**

- **🗺️ 地理分析**: 佐渡島内 vs 島外アクセス
- **🍽️ 人気店舗**: マーカークリック数ランキング  
- **🔍 検索行動**: よく検索される料理ジャンル
- **📱 デバイス**: モバイル vs デスクトップ利用率
- **⏰ 時系列**: 観光シーズンの利用パターン
