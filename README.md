# 🗾 佐渡飲食店マップ

> **佐渡島の美味しい飲食店を発見できるインタラクティブマップアプリケーション**  
> React 19 + TypeScript 5.9 + Google Maps Advanced Markers v2 + PWA対応

![佐渡飲食店マップ](./docs/assets/sado-restaurant-map-preview.jpg)

## 🎯 **プロジェクト概要**

佐渡島の飲食店情報をリアルタイムで表示するモダンなWebアプリケーションです。Google Places API (New) v1から取得した正確なデータを元に、Advanced Markers v2を使用した高度なマップ表示を実現しています。

### ✨ **主要機能**

- 🗺️ **インタラクティブマップ**: Google Maps JavaScript API + Advanced Markers v2
- 🍽️ **詳細な店舗情報**: Places API (New) v1による包括的データ取得
  - 📍 基本情報（営業時間・評価・レビュー・価格帯・電話番号・ウェブサイト）
  - 🍴 飲食店特化情報（朝食・ランチ・ディナー・ベジタリアン対応・アルコール提供）
  - � サービス形態（イートイン・テイクアウト・宅配・カーブサイドピックアップ）
  - ♿ アクセシビリティ情報（車椅子対応入口等）
  - 🤖 AI生成店舗説明（editorial_summary）
- �🔍 **高度な検索・フィルタ**: 地区・料理ジャンル・価格帯・営業時間・サービス形態での絞り込み
- 🏪 **高精度地区分類**: 佐渡市公式住所表記による正確な10地区分類
- 📱 **レスポンシブ対応**: PC・タブレット・スマートフォンで最適表示
- ⚡ **高速表示**: キャッシュ機能による瞬間的データ読み込み
- 🛠️ **PWA対応**: オフライン機能・インストール可能・Push Notifications
- 🔧 **自動データメンテナンス**: Places API (New) v1統合による高品質データ管理
- 🎯 **スマート検索最適化**: 無駄なAPI呼び出しを削減する改善された検索戦略
- 💰 **コスト管理機能**: 段階的実行モードによる料金コントロール（最大78%削減）
- 🆕 **新店舗自動発見**: 格子状地域分割による新規店舗の自動検出・信頼度評価
- 📊 **詳細データ出力**: スプレッドシートへの構造化データ保存・統計レポート生成

## 🏗️ **技術スタック**

### **フロントエンド**

- **React 19.1** - 最新のConcurrent Features対応
- **TypeScript 5.9** - 厳格な型安全性
- **Vite 8.0** - 高速ビルドツール（Rolldown統合）
- **@vis.gl/react-google-maps v3** - React Google Maps統合

### **地図・データ**

- **Google Maps JavaScript API** - 地図表示（週次版・2025年8月最新）
- **Advanced Markers v2** - 次世代マーカー表示（HTML マーカー・カスタムマーカー対応）
- **Places API (New) v1** - 最新の店舗情報API（包括的飲食店データ取得）
- **Google Sheets API v4** - データベース連携・リアルタイム同期
- **Marker Clustering v2** - 大量マーカーのパフォーマンス最適化
- **3D Maps & WebGL** - 地図高度設定による3D表示最適化

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
# 1. 推奨: 統合実行スクリプトの使用（最新・最適化済み）
cd tools\scraper
python run_unified.py --mode=standard --target=restaurants  # 飲食店（料金: ~$4）
python run_unified.py --mode=standard  # 全データ（料金: ~$7-10）

# 2. 高速モード（CID URLのみ・高精度）
python run_unified.py --mode=quick  # 料金: ~$2-3

# 3. 包括モード（最高精度・全フィールド取得）
python run_unified.py --mode=comprehensive  # 料金: ~$12-15

# 4. 新店舗自動発見（月次推奨）
python run_new_store_discovery.py monthly --validate --save  # 料金: ~$5-8

# 5. ドライラン（見積もり・テスト実行）
python run_unified.py --dry-run  # 料金: $0
```

### **🗄️ データベース管理コマンド**

```powershell
# 現在のデータベース状態確認
.\scripts\database-operations.ps1 status

# 🆕 推奨: 統合実行スクリプト（最新・最適化済み）
cd tools\scraper
python run_unified.py --mode=standard --target=restaurants  # 飲食店のみ（~$4）
python run_unified.py --mode=standard --target=parkings     # 駐車場のみ（~$1-2）
python run_unified.py --mode=standard --target=toilets      # 公衆トイレのみ（~$1-2）

# 新店舗発見システム（NEW!）
python run_new_store_discovery.py daily --save      # 日次発見（高速・主要エリア）
python run_new_store_discovery.py weekly --save     # 週次発見（全島中精度）
python run_new_store_discovery.py monthly --validate --save  # 月次発見（全島高精度）

# データ品質管理（API料金なし）
.\scripts\database-operations.ps1 fix-districts # 「その他」地区データの再分類（$0）

# ヘルプ表示
.\scripts\database-operations.ps1 help

# 旧形式（参考・互換性）
python run_optimized.py --estimate-only    # コスト見積もりのみ
python run_optimized.py --mode=quick       # 高確率クエリのみ（~$5.36）
python run_optimized.py --mode=standard    # 最適化全件（推奨・~$23.60）
python run_optimized.py --mode=comprehensive  # 従来通り（~$24.46）
python run_optimized.py --dry-run          # テスト実行（料金なし）
```

### **🎯 検索最適化機能**

2025年8月に導入された新機能により、API利用料金を大幅に削減できます。

#### **統合実行システム (run_unified.py)**

Places API (New) v1対応の最新統合システム：

```bash
# 📍 推奨: 統合スクリプトを使用
python run_unified.py --mode=standard --target=restaurants

# 高速モード（CID URLのみ）
python run_unified.py --mode=quick

# ドライラン（見積もりのみ）
python run_unified.py --dry-run
```

#### **実行モード比較**

| モード | 説明 | 処理対象 | コスト | 精度 | Places API対応 |
|--------|------|----------|--------|------|----------------|
| **quick** | 高速モード | CID URLのみ | 低 | 高 | ✅ New v1 |
| **standard** | 標準モード | CID URL + 高精度店舗名 | 中 | 高 | ✅ New v1 |
| **comprehensive** | 包括モード | 全データ | 高 | 最高 | ✅ New v1 |

#### **新店舗自動発見システム**

格子状地域分割による新規店舗の自動検出：

- ✅ **格子状地域分割**: 佐渡島全域を網羅的に検索
- ✅ **Places API Nearby Search活用**: 最新のAPI機能を使用
- ✅ **既存データベースとの重複チェック**: 自動重複排除
- ✅ **信頼度スコア**: 新店舗候補の評価システム
- ✅ **自動スプレッドシート保存**: 構造化データ出力

```bash
# 日次発見（主要エリアのみ・高速）
python run_new_store_discovery.py daily --validate --save

# 月次発見（全島高精度・詳細検証付き）
python run_new_store_discovery.py monthly --validate --save
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
├── optimized_restaurants.txt  # 最適化された飲食店リスト（旧形式）
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
└── scraper/             # データ収集スクリプト（v2.1最新版）
    ├── run_unified.py                  # 🆕 統合実行制御（推奨）
    ├── run_new_store_discovery.py      # 🆕 新店舗自動発見システム
    ├── processors/                     # データ処理エンジン
    │   ├── unified_cid_processor.py    # 統合CID・URL・店舗名処理
    │   ├── places_api_client.py        # Places API通信専用
    │   ├── data_validator.py           # データ検証専用
    │   ├── spreadsheet_manager.py      # シート操作専用
    │   ├── location_separator.py       # 佐渡市内外分離処理
    │   ├── data_deduplicator.py        # データ重複除去処理
    │   └── new_store_discoverer.py     # 新店舗発見システム
    ├── utils/                          # 共通ユーティリティ
    │   ├── google_auth.py              # Google API認証統一
    │   ├── translators.py              # レスポンス翻訳機能
    │   └── output_formatter.py         # 出力フォーマット
    ├── data/
    │   └── urls/                       # 🆕 統合クエリファイル（メイン使用）
    │       ├── restaurants_merged.txt  # 飲食店統合（463件）
    │       ├── parkings_merged.txt     # 駐車場統合（111件）
    │       └── toilets_merged.txt      # 公衆トイレ統合（95件）
    ├── tests/                          # テスト環境
    │   ├── test_location_separator.py  # 分離機能テスト
    │   └── __init__.py                 # テストモジュール初期化
    └── _legacy/                        # 非推奨ファイル（2025年9月削除予定）
        └── run_optimized.py            # 旧最適化スクリプト（互換性維持）

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
- **Google Places Nearby Search (New)**: $0.017 USD/リクエスト  
- **推定コスト**:
  - **Quick モード**: 約$2-3 USD（CID URLのみ・最高効率）
  - **Standard モード**: 約$7-10 USD（統合処理・推奨）
  - **Comprehensive モード**: 約$12-15 USD（全フィールド取得・最高精度）
  - **新店舗発見（月次）**: 約$5-8 USD（格子状検索・信頼度評価付き）
  - 飲食店のみ更新: 約$4-5 USD
  - 全データ更新: 約$10-15 USD

### **🆕 Places API (New) v1 取得データ詳細**

#### **基本データ (Basic Data)**

- place_id, name, formatted_address, address_components
- geometry.location (緯度・経度), geometry.viewport
- types, business_status, photos, plus_code
- wheelchair_accessible_entrance

#### **連絡先データ (Contact Data)**

- formatted_phone_number, international_phone_number
- website, opening_hours, current_opening_hours
- secondary_opening_hours (季節営業等)

#### **飲食店特化データ (Atmosphere Data)**

- rating, user_ratings_total, reviews, editorial_summary
- price_level, reservable
- **サービス形態**: dine_in, takeout, delivery, curbside_pickup
- **メニュー時間帯**: serves_breakfast, serves_brunch, serves_lunch, serves_dinner
- **アルコール**: serves_beer, serves_wine
- **特殊対応**: serves_vegetarian_food

### **コスト最適化**

1. **統合実行システムの活用**: `run_unified.py`による効率的実行
2. **段階的更新**: Quick → Standard → Comprehensive
3. **新店舗発見の活用**: 月次実行による継続的データ品質向上
4. **事前見積もり**: `--dry-run`オプションでコスト確認
5. **定期実行を控える**: 月1回程度の手動更新
6. **カテゴリ別更新**: 必要な部分のみ更新
7. **Places API (New) v1の活用**: 従来APIより豊富なデータを効率的に取得

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

**最終更新**: 2025年8月5日  
**バージョン**: 1.3.0  
**最新機能**: Places API (New) v1統合による包括的飲食店データ取得・新店舗自動発見システム・構造化スプレッドシート出力  
**前回機能**: スマート検索最適化システムによるAPI料金削減（最大78%削減）  
**データ品質**: 佐渡市公式データに基づく高精度地区分類システム  
**開発者**: [@nakanaka07](https://github.com/nakanaka07)
