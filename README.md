# 🗾 佐渡飲食店マップ

> **佐渡島の美味しい飲食店を発見できるインタラクティブマップアプリケーション**  
> React 19 + TypeScript 5.9 + Google Maps Advanced Markers v2 + PWA対応

![佐渡飲食店マップ](./docs/assets/sado-restaurant-map-preview.jpg)

## 🎯 **プロジェクト概要**

佐渡島の飲食店情報をリアルタイムで表示するモダンなWebアプリケーションです。Google Places API (New) v1から取得した正確なデータを元に、Advanced Markers v2を使用した高度なマップ表示を実現しています。

### ✨ **主要機能**

- 🗺️ **インタラクティブマップ**: Google Maps JavaScript API + Advanced Markers v2
- 🍽️ **詳細な店舗情報**: 営業時間・評価・レビュー・料理ジャンル
- 🔍 **高度な検索・フィルタ**: 地区・料理ジャンル・価格帯・特徴での絞り込み
- 📱 **レスポンシブ対応**: PC・タブレット・スマートフォンで最適表示
- ⚡ **高速表示**: キャッシュ機能による瞬間的データ読み込み
- 🛠️ **PWA対応**: オフライン機能・インストール可能

## 🏗️ **技術スタック**

### **フロントエンド**

- **React 19.1** - 最新のConcurrent Features対応
- **TypeScript 5.9** - 厳格な型安全性
- **Vite 8.0** - 高速ビルドツール（Rolldown統合）
- **@vis.gl/react-google-maps v3** - React Google Maps統合

### **地図・データ**

- **Google Maps JavaScript API** - 地図表示
- **Advanced Markers v2** - 次世代マーカー表示
- **Places API (New) v1** - 最新の店舗情報API
- **Google Sheets API v4** - データベース連携

### **開発・品質**

- **Vitest 4.0** - テストフレームワーク
- **ESLint v9** - コード品質管理
- **Prettier v3** - コードフォーマット

## 🚀 **クイックスタート**

### **1. リポジトリのクローン**

```bash
git clone https://github.com/nakanaka07/sado-restaurant-map.git
cd sado-restaurant-map
```

### **2. 依存関係のインストール**

```bash
# Node.js依存関係
pnpm install

# Python環境（データ更新用）
cd tools/scraper
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### **3. 環境変数の設定**

```bash
# 設定ファイルをコピー
Copy-Item .env.local.example .env.local

# .env.localを編集してAPIキーを設定
# VITE_GOOGLE_MAPS_API_KEY=your_api_key
# VITE_GOOGLE_SHEETS_API_KEY=your_sheets_api_key
# VITE_SPREADSHEET_ID=your_spreadsheet_id
```

### **4. 開発サーバー起動**

```bash
# 手軽な運用コマンド（推奨）
.\database-operations.ps1 dev

# または直接実行
pnpm dev
```

ブラウザで `http://localhost:5173` にアクセス

## 📊 **データベース運用**

### **💡 推奨運用パターン**

このプロジェクトは**手動データ更新**によるAPI料金コントロールに対応しています。

#### **🔹 日常開発（API料金なし）**

```powershell
# 既存のスプレッドシートデータを活用
.\database-operations.ps1 dev
```

#### **🔹 データ更新（月1回程度推奨）**

```powershell
# 1. 小規模テスト実行（料金: ~$4）
.\database-operations.ps1 update-test

# 2. 結果確認後、全データ更新（料金: ~$7-10）
.\database-operations.ps1 update-all

# 3. データ確認
.\database-operations.ps1 dev
```

### **🗄️ データベース管理コマンド**

```powershell
# 現在のデータベース状態確認
.\database-operations.ps1 status

# 個別カテゴリ更新
.\database-operations.ps1 restaurants  # 飲食店のみ（~$4）
.\database-operations.ps1 parkings     # 駐車場のみ（~$1-2）
.\database-operations.ps1 toilets      # 公衆トイレのみ（~$1-2）

# ヘルプ表示
.\database-operations.ps1 help
```

## 🔧 **詳細設定ガイド**

### **PWAアイコン更新**

アプリのロゴやアイコンを変更する場合：

1. **ソースアイコンの更新**

   ```bash
   # public/favicon.svg を新しいロゴに置き換え
   # SVG形式推奨（高品質でリサイズ可能）
   ```

2. **PWAアイコンの再生成**

   ```bash
   # 全サイズのアイコンを自動生成
   pnpm generate:pwa-assets
   ```

3. **生成されるアイコン**
   - `favicon.ico` (48x48) - ブラウザのファビコン
   - `pwa-64x64.png` - Windows PWAアイコン
   - `pwa-192x192.png` - Android PWAアイコン
   - `pwa-512x512.png` - 高解像度PWAアイコン
   - `maskable-icon-512x512.png` - Android適応アイコン
   - `apple-touch-icon-180x180.png` - iOS/macOSアイコン

4. **確認・テスト**

   ```bash
   pnpm build    # ビルドして確認
   pnpm preview  # プレビューでテスト
   ```

> 💡 **Tips**: `public/favicon.svg`を更新するだけで、全てのプラットフォーム向けアイコンが2025年PWA標準に準拠して自動生成されます。

### **Google Sheets API設定**

詳細な設定手順は [`docs/sheets-integration-setup.md`](./docs/sheets-integration-setup.md) を参照してください。

### **プロジェクト構造**

```text
src/
├── components/           # Reactコンポーネント
│   ├── common/          # 汎用UIコンポーネント
│   ├── map/             # 地図関連コンポーネント
│   └── restaurant/      # 飲食店関連コンポーネント
├── config/              # 設定・定数管理
├── hooks/               # カスタムHooks
├── services/            # 外部API連携
├── styles/              # CSSファイル集約
├── types/               # TypeScript型定義
├── utils/               # ユーティリティ関数
└── data/                # 静的データ

config/                  # 設定ファイル
├── eslint.config.js     # ESLint設定
├── vitest.config.ts     # テスト設定
└── pwa-assets.config.ts # PWA設定

tools/                   # 開発ツール
└── scraper/             # データ収集スクリプト
    ├── places_data_updater.py  # メインスクレイパー
    ├── restaurants.txt      # 検索対象飲食店リスト
    ├── parkings.txt         # 検索対象駐車場リスト
    └── toilets.txt          # 検索対象公衆トイレリスト

scripts/                 # 運用スクリプト
├── database-operations.ps1  # データベース操作
└── test-integration.ps1     # 統合テスト
```

## 🧪 **テスト・デプロイ**

### **テスト実行**

```bash
# 単体テスト
pnpm test

# テストカバレッジ
pnpm test:coverage

# 統合テスト
.\test-integration.ps1
```

### **本番ビルド**

```bash
# 本番用ビルド
pnpm build

# ビルド結果プレビュー
pnpm preview
```

## 📈 **API料金管理**

### **料金体系**

- **Google Places Text Search (New)**: $0.017 USD/リクエスト
- **推定コスト**:
  - 飲食店のみ更新: 約$4-5 USD
  - 全データ更新: 約$7-10 USD

### **コスト最適化**

1. **定期実行を控える**: 月1回程度の手動更新
2. **段階的更新**: テスト実行 → 全更新
3. **カテゴリ別更新**: 必要な部分のみ更新
4. **キャッシュ活用**: 日常開発時はキャッシュデータを使用

## 🤝 **貢献ガイド**

1. リポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 **ライセンス**

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 🔗 **関連リンク**

- **プロジェクトURL**: <https://github.com/nakanaka07/sado-restaurant-map>
- **デモサイト**: [Coming Soon]
- **Google Maps API ドキュメント**: <https://developers.google.com/maps/documentation/javascript>
- **React 19 ドキュメント**: <https://react.dev/>

---

**最終更新**: 2025年8月2日  
**バージョン**: 1.0.0  
**開発者**: [@nakanaka07](https://github.com/nakanaka07)
