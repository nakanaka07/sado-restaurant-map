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
- � **高精度地区分類**: 佐渡市公式住所表記による正確な10地区分類
- �📱 **レスポンシブ対応**: PC・タブレット・スマートフォンで最適表示
- ⚡ **高速表示**: キャッシュ機能による瞬間的データ読み込み
- 🛠️ **PWA対応**: オフライン機能・インストール可能
- 🔧 **自動データメンテナンス**: API料金を抑えた効率的なデータ品質管理
- 🎯 **スマート検索最適化**: 無駄なAPI呼び出しを削減する改善された検索戦略
- 💰 **コスト管理機能**: 段階的実行モードによる料金コントロール（最大35%削減）

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
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r tools\scraper\requirements.txt
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
.\scripts\database-operations.ps1 dev
```

### **🔹 データ更新（月1回程度推奨）**

```powershell
# 1. 小規模テスト実行（料金: ~$4）
.\scripts\database-operations.ps1 update-test

# 2. 結果確認後、全データ更新（料金: ~$7-10）
.\scripts\database-operations.ps1 update-all

# 3. 最適化実行モードによるコスト削減（推奨）
cd tools\scraper
python run_optimized.py --mode=standard  # 最適化された全件実行
python run_optimized.py --mode=quick     # 高確率クエリのみ（~35%削減）

# 4. データ確認・地区分類メンテナンス
.\scripts\database-operations.ps1 dev
.\scripts\database-operations.ps1 fix-districts  # 必要に応じて実行
```

### **🗄️ データベース管理コマンド**

```powershell
# 現在のデータベース状態確認
.\scripts\database-operations.ps1 status

# 個別カテゴリ更新（API料金発生）
.\scripts\database-operations.ps1 restaurants  # 飲食店のみ（~$4）
.\scripts\database-operations.ps1 parkings     # 駐車場のみ（~$1-2）
.\scripts\database-operations.ps1 toilets      # 公衆トイレのみ（~$1-2）

# データ品質管理（API料金なし）
.\scripts\database-operations.ps1 fix-districts # 「その他」地区データの再分類（$0）

# ヘルプ表示
.\scripts\database-operations.ps1 help

# 最適化された検索実行（API料金削減）
cd tools\scraper
python run_optimized.py --estimate-only    # コスト見積もりのみ
python run_optimized.py --mode=quick       # 高確率クエリのみ（~$5.36）
python run_optimized.py --mode=standard    # 最適化全件（推奨・~$23.60）
python run_optimized.py --mode=comprehensive  # 従来通り（~$24.46）
python run_optimized.py --dry-run          # テスト実行（料金なし）
```

### **🎯 検索最適化機能**

2025年8月に導入された新機能により、API利用料金を大幅に削減できます。

#### **検索結果改善の特徴**

- ✅ **スマートスキップ**: 移転・閉店店舗の検索を自動回避
- ✅ **複数パターン検索**: 店名+地域、店名+業種の組み合わせ
- ✅ **クエリクリーニング**: 括弧・記号の自動除去で検索精度向上
- ✅ **段階的実行**: 用途に応じた3つの実行モード
- ✅ **緯度経度による地域判定**: 住所表記に関係なく、緯度経度で佐渡島内のデータを有効判定

#### **地域判定システム**

- 📍 **緯度経度優先判定**: 住所に「佐渡市」がなくても、緯度経度が佐渡島内なら有効データとして扱う
- 🗺️ **自動シート振り分け**: 佐渡島内外のデータを適切なシートに自動振り分け
- 🎯 **精密な境界判定**: 佐渡島の正確な境界ボックス内での判定

#### **コスト削減効果**

| 実行モード | 説明 | 推定料金 | 削減率 |
|-----------|------|----------|--------|
| **Quick** | 高確率クエリのみ | ~$5.36 | **78%削減** |
| **Standard** | 最適化全件（推奨） | ~$23.60 | **4%削減** |
| **Comprehensive** | 従来通り | ~$24.46 | 参考値 |

#### **使用例**

```powershell
# 実行前のコスト見積もり
python run_optimized.py --estimate-only

# 日常的なデータ確認（高効率）
python run_optimized.py --mode=quick --target=restaurants

# 月次全データ更新（推奨）
python run_optimized.py --mode=standard
```

### **🔧 地区分類メンテナンス**

プロジェクトには佐渡市公式サイトに基づく高精度な地区分類機能が組み込まれています。

#### **自動地区再分類**

```powershell
# 「その他」地区に分類されたデータを正しい地区に再分類
.\scripts\database-operations.ps1 fix-districts
```

**機能詳細:**

- 📍 **佐渡市公式住所表記に基づく正確な地区判定**
- 🎯 **10地区・約350地名に対応** - 両津・相川・佐和田・金井・新穂・畑野・真野・小木・羽茂・赤泊
- 💰 **API料金なし** - 既存データの再分類のみ実行
- ⚡ **高速処理** - 数百件のデータを数分で処理
- 🛡️ **安全設計** - 分析→更新の2段階実行

**使用タイミング:**

- 新規データ追加後の地区分類確認
- 定期的なデータ品質メンテナンス（月1回推奨）
- ユーザーから地区分類の不正確さが報告された場合

**注意事項:**

- Google Sheets API制限（毎分100リクエスト）により、大量データ処理時は中断される場合があります
- 中断時は5-10分待ってから再実行してください

### **🚀 新機能: スマート検索最適化システム**

2025年8月3日に導入された検索最適化機能により、API利用料金を大幅に削減できます。

#### **🎯 主な改善点**

1. **自動スキップ機能**
   - 移転・閉店・廃業情報を含むクエリを自動除外
   - 例: `(現：愛之助)海の見えるレストラン【らぶじゃん】` → スキップ

2. **スマートクエリ生成**
   - 店名+地域名の組み合わせ: `ふわりと 両津`
   - 店名+業種の組み合わせ: `ふわりと レストラン 佐渡`
   - 括弧・記号の自動除去: `カフェ＆バー` → `カフェ バー`

3. **優先順位付き検索**
   - 成功確率の高いパターンから実行
   - 佐渡・地域名を含むクエリを優先

#### **📊 最適化ファイル**

最適化により、以下のファイルが自動生成・更新されます：

```text
tools/scraper/
├── optimized_restaurants.txt  # 最適化された飲食店リスト
├── optimized_parkings.txt     # 最適化された駐車場リスト
├── optimized_toilets.txt      # 最適化された公衆トイレリスト
└── optimization_report.md     # 詳細な改善レポート
```

#### **🎮 使用方法**

```bash
# 1. クエリファイル分析
python query_analyzer.py

# 2. コスト見積もり
python run_optimized.py --estimate-only

# 3. 最適化実行
python run_optimized.py --mode=standard --dry-run  # テスト
python run_optimized.py --mode=standard            # 実行
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

### **GitHub Actions 自動データ更新**

プロジェクトには自動データ更新機能が組み込まれています。

#### **GitHub Secrets設定**

リポジトリの設定で以下のSecretsを設定してください：

```text
PLACES_API_KEY          # Google Places API キー
SPREADSHEET_ID          # Google Sheets スプレッドシートID  
GOOGLE_SERVICE_ACCOUNT_KEY  # サービスアカウントJSONキー（全体）
GOOGLE_MAPS_API_KEY     # フロントエンド用Google Maps APIキー
GOOGLE_MAPS_MAP_ID      # Google Maps マップID（オプション）
GA_MEASUREMENT_ID       # Google Analytics測定ID（オプション）
```

#### **自動実行スケジュール**

- **定期実行**: 毎月1日 11:00 JST（API料金管理のため月1回）
- **手動実行**: GitHub Actions タブから「Run workflow」で実行可能

#### **実行オプション**

- `all`: 全データ更新（飲食店・駐車場・公衆トイレ）
- `restaurants`: 飲食店のみ
- `parkings`: 駐車場のみ  
- `toilets`: 公衆トイレのみ

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
    ├── places_data_updater.py      # メインスクレイパー
    ├── improved_search_strategy.py # 検索最適化戦略
    ├── run_optimized.py           # コスト最適化実行スクリプト
    ├── query_analyzer.py          # クエリファイル分析ツール
    ├── restaurants.txt            # 検索対象飲食店リスト（最適化済み）
    ├── parkings.txt               # 検索対象駐車場リスト
    └── toilets.txt                # 検索対象公衆トイレリスト

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
  - **Quick モード**: 約$5.36 USD（高確率クエリのみ・78%削減）
  - **Standard モード**: 約$23.60 USD（最適化全件・推奨・4%削減）
  - 飲食店のみ更新: 約$4-5 USD
  - 全データ更新: 約$7-10 USD（従来スクリプト使用時）

### **コスト最適化**

1. **最適化実行モードの活用**: `run_optimized.py`による効率的実行
2. **段階的更新**: Quick → Standard → Comprehensive
3. **事前見積もり**: `--estimate-only`オプションでコスト確認
4. **定期実行を控える**: 月1回程度の手動更新
5. **カテゴリ別更新**: 必要な部分のみ更新
6. **キャッシュ活用**: 日常開発時はキャッシュデータを使用

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

**最終更新**: 2025年8月3日  
**バージョン**: 1.2.0  
**新機能**: スマート検索最適化システムによるAPI料金削減（最大78%削減）  
**前回機能**: 佐渡市公式データに基づく高精度地区分類システム  
**開発者**: [@nakanaka07](https://github.com/nakanaka07)
