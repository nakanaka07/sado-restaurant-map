# 環境変数設定ガイド

このディレクトリには、プロジェクトで使用する環境変数の設定例が含まれています。

## 📁 ファイル構成

```text
env/
├── .env.example                 # 基本環境設定例
├── .env.development.example     # 開発環境用設定例
├── .env.integration.example     # 統合環境用設定例
├── .env.production.example      # 本番環境用設定例
└── README.md                    # このファイル
```

## 🚀 クイックスタート

### 1. 開発環境セットアップ

```bash
# 開発用環境設定ファイルを作成
cp env/.env.development.example .env.local

# 必要な値を設定
# VITE_GOOGLE_MAPS_API_KEY=あなたのAPIキー
```

### 2. 統合テスト環境セットアップ

```bash
# 統合テスト用環境設定ファイルを作成
cp env/.env.integration.example .env.integration

# 統合テスト用の値を設定
```

### 3. 本番環境セットアップ

```bash
# 本番用環境設定ファイルを作成
cp env/.env.production.example .env.production

# 本番環境用の値を設定（CI/CDで安全に）
```

## 📋 必須環境変数

| 変数名                     | 説明                         | 環境       |
| -------------------------- | ---------------------------- | ---------- |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API キー         | 全環境     |
| `VITE_BASE_URL`            | アプリケーションのベース URL | 全環境     |
| `REDIS_PASSWORD`           | Redis 認証パスワード         | 統合・本番 |
| `CELERY_BROKER_URL`        | Celery ブローカー設定        | 統合・本番 |

## 🔐 セキュリティ注意事項

### ⚠️ 重要なルール

1. **実際の環境設定ファイルは Git にコミットしない**

   - `.env.local`
   - `.env.development`
   - `.env.integration`
   - `.env.production`

2. **API キーやパスワードは定期的にローテーション**

3. **本番環境では CI/CD パイプラインで安全に設定**

4. **開発環境でも本物の認証情報は使用しない**

### 🛡️ 安全な管理方法

```bash
# 良い例：サンプルファイルから実際の設定を作成
cp env/.env.development.example .env.local
# 必要な値のみを編集

# 悪い例：実際の認証情報をサンプルファイルに書く
# ❌ これはしないでください
```

## 🔧 環境別設定詳細

### 開発環境 (.env.local)

- デバッグモード有効
- モックデータ使用可能
- ホットリロード有効
- 詳細ログ出力

### 統合環境 (.env.integration)

- Redis クラスター設定
- Celery 分散処理設定
- 監視ツール連携
- テスト用設定

### 本番環境 (.env.production)

- 最適化された設定
- セキュリティ強化
- パフォーマンス監視
- エラー追跡設定

## 🛠️ トラブルシューティング

### よくある問題

1. **Google Maps が表示されない**

   ```bash
   # API キーの確認
   echo $VITE_GOOGLE_MAPS_API_KEY
   ```

2. **ビルドエラーが発生**

   ```bash
   # 必須変数の確認
   npm run env:check
   ```

3. **統合テストが失敗**

   ```bash
   # Redis接続確認
   docker exec redis-master-1 redis-cli ping
   ```

### 問題解決手順

1. `.env.*` ファイルの存在確認
2. 必須変数が設定されているか確認
3. 変数名のタイポチェック
4. 値に不正文字が含まれていないか確認

## 📞 サポート

環境設定で問題が発生した場合：

1. この README を再確認
2. `docs/development/guides/environment-setup.md` を参照
3. プロジェクトの Issue を確認
4. 新しい Issue を作成

---

**最終更新**: 2025 年 9 月 7 日
**対応プロジェクト**: 佐渡飲食店マップアプリケーション
