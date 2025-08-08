# 環境変数設定ガイド

> 🎯 **目的**: 佐渡飲食店マップの開発・本番環境での環境変数設定ガイド  
> **対象**: 開発者・CI/CD・デプロイメント担当者  
> **最終更新**: 2025 年 8 月 8 日

## 必須環境変数一覧

### Google Maps API（必須）

```bash
# Google Maps JavaScript API
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# マップスタイル用のMap ID
VITE_GOOGLE_MAPS_MAP_ID=your_google_maps_map_id_here
```

### Google Sheets API（必須）

```bash
# Google Sheets API v4 キー
VITE_GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key_here

# places_data_updater.pyで生成されたスプレッドシートID
VITE_SPREADSHEET_ID=your_spreadsheet_id_here
```

### Google Analytics（オプション）

```bash
# GA4測定ID
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 設定方法

### 1. ローカル開発環境

1. `.env.local`ファイルを作成

   ```bash
   cp .env.local.example .env.local
   ```

2. 実際の値を設定

   - `.env.local.example`を参考に各値を設定
   - Google Cloud Console で取得した API キーを入力

3. 設定確認

   ```bash
   pnpm dev
   # エラーがなければ設定完了
   ```

### 2. GitHub Actions（CI/CD）

1. リポジトリの Secrets に登録

   - `Settings > Secrets and variables > Actions`
   - 以下のシークレットを追加：

   ```text
   GOOGLE_MAPS_API_KEY          # Google Maps APIキー
   GOOGLE_MAPS_MAP_ID           # Map ID
   GOOGLE_SHEETS_API_KEY        # Google Sheets APIキー
   SPREADSHEET_ID               # スプレッドシートID
   GA_MEASUREMENT_ID            # Google Analytics ID（オプション）
   ```

2. ワークフローでの使用

   ```yaml
   env:
     VITE_GOOGLE_MAPS_API_KEY: ${{ secrets.GOOGLE_MAPS_API_KEY }}
     VITE_GOOGLE_MAPS_MAP_ID: ${{ secrets.GOOGLE_MAPS_MAP_ID }}
     VITE_GOOGLE_SHEETS_API_KEY: ${{ secrets.GOOGLE_SHEETS_API_KEY }}
     VITE_SPREADSHEET_ID: ${{ secrets.SPREADSHEET_ID }}
     VITE_GA_MEASUREMENT_ID: ${{ secrets.GA_MEASUREMENT_ID }}
   ```

### 3. 本番環境（Netlify/Vercel 等）

1. 環境変数の設定

   - プラットフォームの環境変数設定画面で登録
   - すべて`VITE_`プレフィックス付きで設定

2. ビルド時の確認

   ```bash
   pnpm build
   # 警告やエラーがないことを確認
   ```

## トラブルシューティング

### よくあるエラーと解決方法

#### 1. `Google Sheets API設定が不完全です`

```bash
# 原因: 環境変数が未設定
# 解決: .env.localファイルを確認

# 設定確認コマンド
echo $VITE_SPREADSHEET_ID
echo $VITE_GOOGLE_SHEETS_API_KEY
```

#### 2. `403 Forbidden` エラー

```bash
# 原因: APIキーの制限設定
# 解決: Google Cloud Console でAPIキー制限を確認

# 必要な設定:
# - HTTPリファラー制限の追加
# - Maps JavaScript API, Sheets API の有効化
```

#### 3. `スプレッドシートへのアクセス権限がありません`

```bash
# 原因: スプレッドシートの共有設定
# 解決: スプレッドシートを「リンクを知っている全員が閲覧可能」に設定
```

#### 4. テスト失敗

```bash
# 原因: テスト環境の環境変数未設定
# 解決: vi.stubEnv()でモック設定（既に実装済み）

# テスト実行
pnpm test src/services/sheets/sheetsService.test.ts
```

## 設定確認チェックリスト

### ローカル開発

- [ ] `.env.local`ファイルが存在する
- [ ] 4 つの必須環境変数が設定されている
- [ ] `pnpm dev`でエラーが発生しない
- [ ] マップが正常に表示される
- [ ] 飲食店データが読み込まれる

### CI/CD

- [ ] GitHub Secrets に必要な値が登録されている
- [ ] ワークフローが正常に実行される
- [ ] ビルドが成功する
- [ ] テストがパスする

### 本番環境

- [ ] 本番用 API キーが設定されている
- [ ] マップが正常に動作する
- [ ] データが正しく表示される
- [ ] Analytics（設定時）が動作する

## セキュリティ考慮事項

### 重要な注意点

1. **API キー制限**

   - 本番環境では必ず HTTP リファラー制限を設定
   - 開発環境でも不要な API を無効化

2. **スプレッドシート共有**

   - 「編集可能」ではなく「閲覧のみ」に設定
   - 機密データは別途管理

3. **環境変数管理**
   - `.env.local`は`.gitignore`で除外済み
   - 本番用 API キーとは別のキーを開発で使用推奨

## 参考リンク

- [Google Cloud Console](https://console.cloud.google.com/) - API キー管理
- [Google Sheets API](https://developers.google.com/sheets/api) - 使用方法
- [Vite 環境変数](https://vitejs.dev/guide/env-and-mode.html) - 設定詳細
- [GitHub Actions Secrets](https://docs.github.com/actions/security-guides/encrypted-secrets) - CI/CD 設定

---

**注意**: このファイルには実際の API キーやシークレットを記載しないでください。設定方法のみを記述してください。
