# AI Assistant Prompts for Code Improvement

> 🎯 **目的**: React+TypeScript開発での効率的なAIアシスタント活用  
> **最終更新**: 2025年8月2日 | **バージョン**: 5.0 **[2025年最新版]**

## 📖 目次

- [🚀 クイックスタート](#-クイックスタート)
- [🔧 基本指示 (1-6)](#-基本指示-1-6)
- [🎯 専門指示 (7-9)](#-専門指示-7-9)
- [🔍 診断・メンテナンス (10-12)](#-診断メンテナンス-10-12)
- [📋 クイックリファレンス](#-クイックリファレンス)

## 🚀 クイックスタート

### 💡 使い分けの基本原則

| 状況                 | 使用する指示    | 目的               |
| -------------------- | --------------- | ------------------ |
| **エラー・バグ発生** | #1 修正・強化   | 問題解決           |
| **コードが汚い**     | #2 整理・清掃   | 品質向上           |
| **動作が重い**       | #3 最適化       | パフォーマンス改善 |
| **構造を改善**       | #4 リファクタ   | 設計改善           |
| **最新技術適用**     | #5 モダナイズ   | 技術更新           |
| **総合的改善**       | #6 包括改善     | 全面的向上         |
| **設定・環境**       | #7 環境最適化   | 開発環境改善       |
| **プロジェクト分析** | #10 診断        | 現状把握           |
| **緊急時**           | #12 緊急対応    | 即座の問題解決     |

### 🎯 使用時の重要な区別

- **「修正」**: エラー・バグ・問題の解決
- **「最適化」**: 動作するコードの改善
- **「整理」**: 見た目・構造の清掃
- **「リファクタリング」**: 設計・アーキテクチャの改善

## 🔧 基本指示 (1-6)

### 1. 🛠️ 修正・強化指示

**使用場面**: エラー・バグ・脆弱性対応

```text
このコードを修正・強化してください：
- TypeScript型エラーの解決
- 実行時エラー・バグの修正
- セキュリティ脆弱性の対応
- エラーハンドリングの追加
- バリデーション強化
- アクセシビリティ問題の修正
```

### 2. 🧹 整理・清掃指示

**使用場面**: コードレビュー前、品質向上

```text
このコードを整理・清掃してください：
- 未使用要素の削除（インポート・変数・関数）
- デッドコードの除去
- フォーマット・命名規則の統一
- コメントアウトコードの削除
- 重複コードの統合（DRY原則）
```

### 3. ⚡ 最適化指示

**使用場面**: パフォーマンス改善

```text
このコードを最適化してください：
- 実行速度・レンダリング性能の向上
- メモリ使用量・バンドルサイズの削減
- API呼び出し・ネットワーク処理の効率化
- キャッシュ戦略の実装
- 遅延読み込み・コード分割の適用
```

### 4. 🔧 リファクタリング指示

**使用場面**: 設計・構造改善

```text
このコードをリファクタリングしてください：
- 関数・コンポーネントの適切な分割
- 責任分離（単一責任原則）
- 複雑なロジックの簡素化
- 可読性・保守性の向上
- 拡張性を考慮した設計
```

### 5. 🆕 モダナイズ指示

**使用場面**: 技術更新・最新化

```text
このコードをモダナイズしてください：
- React 19.1最新機能の採用（React Compiler Stable、Concurrent Features）
- Google Maps Advanced Markers v2 への移行
- TypeScript 5.9新機能の活用
- 最新JavaScript/ES2025機能の採用
- モダンなReactパターンの適用（use hook、Activity API、Server Components対応）
- 非推奨API・ライブラリの置き換え
- View Transitions API対応
- Web Vitals 2025基準への最適化
- PWA Manifest v3対応
- CSS4新機能（Container Queries、color-mix、CSS Nesting）の活用
- 型安全性の向上
- 最新セキュリティベストプラクティスの適用
```

### 6. 📈 包括改善指示

**使用場面**: 総合的な品質向上

```text
このコードを包括的に改善してください：
- ユーザビリティ・UXの向上
- テストカバレッジの充実
- パフォーマンス・セキュリティの強化
- アクセシビリティ対応
- 国際化・多言語対応
- ドキュメント整備
```

## 🎯 専門指示 (7-9)

### 7. ⚙️ 環境最適化指示

**使用場面**: 開発環境・設定の改善

```text
開発環境を最適化してください：

【VS Code設定】
- 拡張機能の整理（不要削除・必要追加）
- 設定の最適化（自動保存・フォーマット・TypeScript）
- デバッグ設定の改善

【環境変数管理】
- .env系ファイルの整理・セキュリティ強化
- 型定義・バリデーションの追加
- 機密情報の適切な分離

【Git設定】
- .gitignore の最適化
- 機密情報・一時ファイルの除外
- 品質管理ファイルの整理

【ビルド設定】
- Vite 8.0・TypeScript設定の最適化（Rolldown統合）
- 依存関係・プラグインの整理
- ビルド性能の向上
- ESLint v9・Prettier v3最適化
```

### 8. 🎨 フロントエンド特化指示

**使用場面**: UI/UX・スタイリング改善

```text
フロントエンドを最適化してください：

【CSS・スタイリング】
- Critical CSS の最適化
- CSS4新機能の活用（Container Queries、color-mix、CSS Nesting）
- CSS View Transitions API実装
- レスポンシブ・モバイルファースト対応（iOS 18 / Android 15）
- アニメーション・インタラクションの改善
- CSS変数・デザイントークンの整理
- モダンCSS機能（logical properties、:has()セレクタ）の活用

【アクセシビリティ】
- WCAG 2.2 AA準拠の実装
- キーボードナビゲーション対応
- スクリーンリーダー・支援技術対応
- カラーコントラスト・フォントサイズ最適化
- 動作縮小設定（prefers-reduced-motion）対応

【PWA・モバイル対応】
- PWA機能の強化（Manifest v3対応）
- オフライン対応・キャッシュ戦略
- Push Notifications API対応
- タッチ操作・ジェスチャー対応
- Safe Area・ノッチ対応
- Web Share API統合
```

### 9. 🗂️ プロジェクト構造指示

**使用場面**: アーキテクチャ・ファイル構成改善

```text
プロジェクト構造を最適化してください：

【ディレクトリ構造】
- ファイル・フォルダの再編成
- 関連要素のグループ化
- 命名規則・パス構造の統一
- import/export の整理

【依存関係管理】
- 不要な依存関係の削除
- 軽量な代替ライブラリへの置き換え
- モジュール間の結合度最適化
- 循環依存の解消

【型定義・共通化】
- 型定義の整理・統合
- 共通コンポーネント・ユーティリティの抽出
- 設定・定数の一元管理
```

## 🔍 診断・メンテナンス (10-12)

### 10. 🔍 プロジェクト診断指示

**使用場面**: 定期的な健康チェック・現状把握

```text
このプロジェクトを診断してください：

【全体評価】
- ファイル・機能の必要性評価
- 過剰な抽象化・設計の特定
- 使用頻度の低い機能の洗い出し
- 技術的負債の特定
- 「本当に必要か？」の観点で見直し

【品質指標】
- コード行数対機能価値の比率
- 依存関係の複雑さ分析
- テストカバレッジ・品質スコア
- パフォーマンス指標の確認
- セキュリティ脆弱性のチェック

【改善提案】
- 優先度付きの改善項目リスト
- 具体的な実装方針
- 工数・リスク評価
```

### 11. 📁 ディレクトリ診断指示

**使用場面**: 特定ディレクトリの詳細分析

```text
このディレクトリを詳細診断してください：

【ファイル分析】
- 各ファイルの役割・必要性評価
- ファイル間の依存関係分析
- 重複機能・コードの特定
- 使用頻度・価値の評価

【構造最適化】
- ディレクトリ構造の適切性
- 命名規則の一貫性
- 他ディレクトリとの結合度
- グループ化・分割の提案
```

### 12. 🚨 緊急対応指示

**使用場面**: 本番障害・クリティカル問題

```text
緊急事態に対応してください：

【即座の対応】
- 危険な部分の即座停止・無効化
- 最小限の変更での問題修正
- 一時的な回避策の実装
- 影響範囲の最小化

【事後対応】
- 根本原因の特定・分析
- 恒久対策の計画・実装
- 再発防止策の検討
- 監視・アラートの強化
- TODO・課題の明記
```

## 📋 クイックリファレンス

### 🎯 シーン別指示選択

```text
# 日常開発
#1: エラー・バグ修正
#2: コード清掃
#3: 速度改善
#4: 設計改善

# 定期メンテナンス
#10: プロジェクト診断（月1回）
#11: ディレクトリ診断（週1回）
#7: 環境最適化（設定変更時）

# 専門作業
#5: 技術更新・モダナイズ
#6: 総合品質向上
#8: UI/UX・アクセシビリティ
#9: アーキテクチャ改善

# 緊急時
#12: 緊急対応・障害対応
```

### 📊 指示の組み合わせパターン

```text
# パフォーマンス改善フロー
#10診断 → #3最適化 → #2清掃

# 品質向上フロー  
#11診断 → #4リファクタ → #1修正 → #2清掃

# モダナイズフロー
#10診断 → #5モダナイズ → #4リファクタ → #3最適化

# 新機能開発前
#10診断 → #9構造最適化 → #7環境整備

# リリース前
#2清掃 → #1修正 → #3最適化 → #8フロントエンド
```

### ⚠️ 使用上の注意

- **段階的適用**: 大きな変更は小分けして実行
- **テスト実行**: 各変更後は必ずテスト実行
- **バックアップ**: 重要な変更前はコミット
- **チーム合意**: 大きな変更は事前議論

## 🔗 開発リソース

### 📚 **技術ドキュメント（必須参照）**

#### ⚛️ **React & TypeScript**

- **React 19.1 公式**: <https://react.dev/> - 最新機能・ベストプラクティス
- **React Compiler Stable**: <https://react.dev/learn/react-compiler> - パフォーマンス自動最適化
- **TypeScript 5.9**: <https://www.typescriptlang.org/> - 型安全性・新機能
- **React DevTools**: <https://github.com/facebook/react/tree/main/packages/react-devtools>
- **React Activity API**: <https://react.dev/reference/react/experimental> - Concurrent Features
- **View Transitions API**: <https://developer.mozilla.org/docs/Web/API/View_Transitions_API> - 画面遷移

#### 🗺️ **Google Maps API（核心技術）**

- **Maps JavaScript API**: <https://developers.google.com/maps/documentation/javascript> - 日本語ドキュメント
- **Advanced Markers v2**: <https://developers.google.com/maps/documentation/javascript/advanced-markers/overview> - 次世代マーカー（推奨）
- **@vis.gl/react-google-maps v3**: <https://visgl.github.io/react-google-maps/> - React統合ライブラリ
- **3D Maps & WebGL**: <https://developers.google.com/maps/documentation/javascript/3d/overview> - 3D地図機能
- **Places API (New) v1**: <https://developers.google.com/places/web-service/overview> - 最新Places API
- **Marker Clustering v2**: <https://developers.google.com/maps/documentation/javascript/marker-clustering> - マーカークラスタリング

#### 🍽️ **佐渡飲食店データベース（プロジェクト特化）**

- **Google Sheets API v4**: <https://developers.google.com/sheets/api> - スプレッドシート連携（2025年8月最新）
- **JavaScript クイックスタート**: <https://developers.google.com/workspace/sheets/api/quickstart/js> - React実装基礎
- **データソース**: プロジェクト用Google Sheetsスプレッドシート（環境変数で設定）

##### 📊 **データアクセス方法（優先順）**

1. **CSVエクスポート（推奨）**: `ファイル → ダウンロード → カンマ区切り値(.csv、現在のシート)`
2. **Web公開**: `ファイル → 共有 → ウェブに公開` - API不要の直接アクセス
3. **共有リンク**: `共有ボタン → リンクを知っている全員が閲覧可` - 正しい設定必須

##### 🔧 **共有設定トラブルシューティング**

- **問題**: ログイン要求・アクセス拒否 → **解決策**: <https://support.google.com/docs/answer/2494822>
- **確認手順**: スプレッドシート内で「共有」ボタン → 「一般的なアクセス」→「リンクを知っている全員が閲覧可」
- **重要**: 「制限付きアクセス」を必ずオフにする
- **代替方法**: ウェブ公開機能（<https://support.google.com/docs/answer/183965>）

##### 🛠️ **技術実装**

###### 🔌 **API方式（リアルタイム・推奨）**

```typescript
// Google Sheets API v4 - リアルタイムデータ取得
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const SHEET_NAME = 'まとめータベース';

const fetchRestaurantData = async () => {
  const range = `${SHEET_NAME}!A:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
  const response = await fetch(url);
  return response.json();
};
```

###### 📁 **静的方式（開発用・バックアップ）**

- **API認証設定**: Google Cloud Console → API有効化 → OAuth設定 → APIキー作成
- **CSV Export**: スプレッドシート → ファイル → ダウンロード → CSV形式（静的データ用）
- **JSON変換**: <https://www.convertcsv.com/csv-to-json.htm> - CSV→JSON変換ツール
- **Geocoding API**: <https://developers.google.com/maps/documentation/geocoding> - 住所→座標変換
- **読み取り専用スコープ**: `https://www.googleapis.com/auth/spreadsheets.readonly`

#### ⚡ **ビルド・開発ツール**

- **Vite 8.0**: <https://vitejs.dev/> - 高速ビルドツール・最新版（Rolldown統合）
- **Vite Configuration**: <https://vitejs.dev/config/> - 設定リファレンス
- **Vite Plugins**: <https://vitejs.dev/plugins/> - 公式プラグイン一覧
- **Vite PWA v0.20**: <https://vite-pwa-org.netlify.app/guide/> - PWA統合ガイド
- **vite-plugin-pwa**: <https://github.com/vite-pwa/vite-plugin-pwa> - PWAプラグイン
- **Vitest 4.0**: <https://vitest.dev/> - テストフレームワーク
- **PWA Guide 2025**: <https://web.dev/progressive-web-apps/> - プログレッシブWebアプリ
- **Web Vitals 2025**: <https://web.dev/vitals/> - 最新パフォーマンス指標

##### ⚙️ **プロジェクト設定リファレンス**

###### 🌍 **環境変数設定**

```bash
# .env.local
VITE_GOOGLE_MAPS_API_KEY=your_api_key
VITE_GOOGLE_SHEETS_API_KEY=your_sheets_key
VITE_SPREADSHEET_ID=your_spreadsheet_id
```

###### 🚀 **開発・ビルドコマンド**

```bash
# 開発サーバー起動
pnpm dev

# 本番ビルド
pnpm build

# プレビュー
pnpm preview
```

### 🛠️ **開発支援サイト**

#### 💬 **コミュニティ・サポート**

- **Stack Overflow (Google Maps)**: <https://stackoverflow.com/questions/tagged/google-maps-api-3>
- **React Community**: <https://react.dev/community>
- **TypeScript Discord**: <https://discord.gg/typescript>

#### 📖 **学習・リファレンス**

- **MDN Web Docs**: <https://developer.mozilla.org/> - Web標準リファレンス
- **Can I Use**: <https://caniuse.com/> - ブラウザ互換性確認
- **Web.dev**: <https://web.dev/> - パフォーマンス・品質ガイド

### 🎯 **プロンプト連携活用法**

```text
# 2025年最新技術調査時の組み合わせ例
"#10診断 + React 19.1公式サイト確認" → 現状分析と最新ベストプラクティス比較
"#5モダナイズ + React Compiler Stable" → パフォーマンス自動最適化の適用
"#5モダナイズ + Advanced Markers v2" → Google Maps最新マーカーAPIへの移行
"#8フロントエンド + Web Vitals 2025" → 最新パフォーマンス指標対応
"#3最適化 + View Transitions API" → 最新UI遷移技術の実装

# Google Maps特化連携
"#3最適化 + Maps 3D & WebGL" → 3D地図・WebGL機能の活用
"#1修正 + Advanced Markers移行" → 非推奨マーカーAPIからの移行
"#4リファクタ + マーカークラスタリング最適化" → 大量マーカー表示の改善

# React 19.1連携
"#5モダナイズ + Activity API" → Concurrent Features・並行レンダリング
"#3最適化 + React Compiler Stable" → 自動メモ化・最適化の活用
"#1修正 + 新Hooks API" → use hookなど最新機能への対応

# 佐渡飲食店データベース連携
"#10診断 + Google Sheets API v4" → スプレッドシートデータ構造の分析
"#5モダナイズ + Places API (New) v1" → 最新Places APIへの移行
"#3最適化 + Geocoding API" → 住所から座標への効率的変換
"#4リファクタ + 店舗データ型定義" → TypeScript型安全なデータ管理
"#8フロントエンド + 店舗カード表示" → データ可視化の改善
```

---

**連携**: `copilot-instructions.md` (自動) + `ai-prompts.md` (手動)
