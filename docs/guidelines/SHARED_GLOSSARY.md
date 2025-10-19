# Shared Glossary & Alignment Sheet

このドキュメントは、開発者(あなた) と AI アシスタント(本Copilot Chat) 間の用語・品質判断基準・タスク運用ルールの共有ベースラインです。継続的に更新し、PR で差分可視化します。

## 1. 目的

- 認識齟齬の低減 / コミュニケーションコスト削減
- 品質・速度・安全性のトレードオフを明示し意思決定を高速化
- タスク粒度/優先度の標準化による計画とレビュー効率化

## 2. ロール定義

| ロール | 説明                                   | 主責務                             |
| ------ | -------------------------------------- | ---------------------------------- |
| Dev    | 個人開発者。方向性決定・マージ権限保持 | ゴール設定 / 最終判断              |
| AI     | AI コーディングアシスタント            | 代替案提示 / 実装 / 品質ゲート支援 |

## 3. タスク分類スキーマ

| 種別     | 目的                 | 代表例                       | 完了判定              | 推奨ラベル  |
| -------- | -------------------- | ---------------------------- | --------------------- | ----------- |
| feat     | 機能追加             | 新UI, API呼出                | 仕様/AC満たす         | `feat:`     |
| fix      | 不具合修正           | バグ / 例外 / レイアウト崩れ | 再現手順で再現不可    | `fix:`      |
| perf     | 性能改善             | bundle縮小, レイテンシ低減   | 指標改善 ≥ 10%        | `perf:`     |
| refactor | 構造改善             | 責務分離                     | テスト緑/挙動不変     | `refactor:` |
| chore    | 付帯作業             | 依存更新, CI設定             | 目的ファイル差分のみ  | `chore:`    |
| docs     | 文書                 | README更新                   | 内容反映/リンク有効   | `docs:`     |
| test     | テスト強化           | カバレッジ拡大               | 新/既存テスト緑       | `test:`     |
| ci       | 自動化               | GitHub Actions               | 成功/失敗通知         | `ci:`       |
| security | 脆弱性対策           | depアップグレード            | 脆弱性解消            | `security:` |
| a11y     | アクセシビリティ改善 | コントラスト修正             | axe 違反 0/基準クリア | `a11y:`     |

## 4. 優先度レベル

| レベル | 基準                                       | 目安 SLA           |
| ------ | ------------------------------------------ | ------------------ |
| P0     | ビルド不能 / 重大セキュリティ / データ破壊 | 即時 (当日)        |
| P1     | ユーザー影響大 (主要経路不具合)            | 1-2日              |
| P2     | 一般改善 / 機能追加                        | スプリント内       |
| P3     | 将来価値・低緊急                           | backlog / 月次検討 |

## 5. 品質ゲート (提案)

| ゲート      | 指標               | 最低ライン(初期) | 将来目標                   |
| ----------- | ------------------ | ---------------- | -------------------------- |
| Lint        | ESLint error 0     | 100% パス        | 維持                       |
| Type Check  | `tsc --noEmit`     | error 0          | 維持                       |
| Test        | Vitest pass rate   | 90%+ pass        | 95%+                       |
| Coverage    | line               | 50% 以上         | 70% → 80% → 90% 段階引上げ |
| A11y        | axe / 手動チェック | 重大違反 0       | 0 維持                     |
| Bundle      | main chunk         | < 250KB gzip     | < 180KB gzip               |
| Performance | LCP (CI計測)       | < 3.0s           | < 2.0s                     |
| PWA         | Lighthouse PWA     | 70+              | 90+                        |

## 6. 判定基準詳細

- "完了" は PR マージ可能状態+品質ゲート通過
- 例外 (納期/緊急fix) は `// TODO(debt:<理由>)` コメントで技術的負債を明示
- 技術的負債は週次で棚卸し (タグ: `debt`)

## 7. 更新ワークフロー

1. 変更案: Issue/PR で `docs(glossary): update section X` タイトル
2. 理由: 目的/背景/トレードオフ明示 (Why)
3. 承認: Dev がレビュー (軽微ならセルフマージ可)
4. 版管理: セクション末尾に `Last-Updated: YYYY-MM-DD` 追記/更新

## 8. 共通用語 (初期セット)

| 用語                     | 定義                 | 補足                     |
| ------------------------ | -------------------- | ------------------------ |
| AC (Acceptance Criteria) | 受入条件             | Gherkin/箇条書どちらも可 |
| DX                       | Developer Experience | 開発体験指標             |
| Debt                     | 技術的負債           | 優先度再評価対象         |
| Gate                     | 品質関門             | Lint/Test等              |
| Backlog Grooming         | Backlog整理          | 月次レビュー             |
| Fast Fail                | 早期失敗             | 例: 型で事前検出         |
| idempotent               | 冪等性               | 同じ入力で不変な結果     |

## 9. AI へのタスク依頼テンプレ

```
<カテゴリ(feat/fix/refactor/...)> <短い要約>
[背景]
[目的]
[AC]
[制約] (任意)
[優先度] P0-P3
[補足/参考] (任意)
```

### 例

```
feat: Google Map マーカーの遅延ロード最適化
背景: 初回描画で 120 個マーカー同時追加しフリーズ
目的: 初期表示体験改善, 初期 CPU 使用率低下
AC:
 - 画面ロード < 2s (dev 計測)
 - スクロールで追加ロード
 - パフォーマンス計測ログ console.info 出力
優先度: P1
```

\n

## 12. 今後の拡張候補

## 10. AI 応答期待フォーマット

- 最初: 状況 + 次アクション 1文
- 変更時: 差分要約 (delta) を最小表現
- 複雑: TODO リスト運用 + 各タスク単独進行
- 出力: 不要な繰返し/冗長敬語を避け簡潔

## 11. セキュリティ・プライバシー初期方針

| 項目       | 方針                                                  |
| ---------- | ----------------------------------------------------- |
| Secrets    | `.env` (未コミット) / GitHub Actions Encrypted Secret |
| API Keys   | ローカルのみ保持 / 例示は `FAKE_KEY`                  |
| 依存脆弱性 | 月次 `npm audit` / 重大は即時                         |
| データ削除 | 個人情報保持しない方針                                |

## 12. 今後の拡張候補

\n+## 13. テスト環境(jsdom) 運用メモ (Last-Updated: 2025-10-02)

DOM を操作/検証する Vitest テスト (`@testing-library/react` 使用) は必ず jsdom 環境で実行する。

- 原則: グローバル設定で `environment: "jsdom"`
- 例外 (単独実行 / 明示性向上): テストファイル先頭に `/* @vitest-environment jsdom */`
- Fast Fail: `src/test/setup.ts` 冒頭で `document` 未定義なら即例外 → 設定漏れを早期検知
- よくある誤り: コピーした新規テストにディレクティブを入れ忘れ → `document is not defined`

再発防止方針: Fast-fail チェックを維持し、トラブル時はまず `vitest --config config/vitest.config.ts --environment jsdom` 実行で切り分け。

- CI: GitHub Actions ワークフロー (lint/test/build/a11y)
- 自動ラベル: PR タイトルプリフィックスで振分け
- 自動バンドルサイズ監視 (bundlesize / size-limit)
- Lighthouse CI 導入

## 14. バンドル最適化ベストプラクティス (Last-Updated: 2025-10-19)

Phase 8で確立された JavaScript最適化パターンを記録する。

### 14.1. Barrel Exports排除戦略

**問題**: Barrel exports (`export * from './module'`) はTree-shakingを阻害し、未使用コードがバンドルに混入する。

**解決策**: 直接importに統一する。

```typescript
// ❌ Bad: Barrel export (src/hooks/index.ts)
export * from "./map/useMapPoints";
export * from "./ui/useModalFilter";

// ✅ Good: Direct import
import { useMapPoints } from "@/hooks/map/useMapPoints";
import { useModalFilter } from "@/hooks/ui/useModalFilter";
```

**効果**: Phase 8 Task 2.2で -4 モジュール削減達成。

### 14.2. React.lazy + Suspense パターン

**適用条件**:

- 初期表示不要なコンポーネント
- 条件付きレンダリング（モーダル、パネル等）
- 大きなチャンク（>10KB推奨）

**実装パターン**:

```typescript
// App.tsx
const FilterPanel = lazy(() => import('@/components/map/FilterPanel'));
const CustomMapControls = lazy(() => import('@/components/map/CustomMapControls'));

<Suspense fallback={null}>
  {showFilter && <FilterPanel {...props} />}
</Suspense>

<Suspense fallback={null}>
  {showControls && <CustomMapControls {...props} />}
</Suspense>
```

**注意点**:

- Suspense フォールバックは最小限（`null` or 軽量スピナー）
- アクセシビリティ考慮（`role="status"`, `aria-live`）

**効果**: Phase 8 Task 2.3で App.js -43% 削減達成。

### 14.3. Terser 最適化設定

**推奨設定**:

```typescript
// vite.config.ts
terserOptions: {
  compress: {
    drop_console: true,      // console.log 削除
    drop_debugger: true,     // debugger 削除
    pure_funcs: ['console.log', 'console.info'],
    dead_code: true,         // 到達不能コード削除
    conditionals: true,      // 条件式最適化
    passes: 2,               // 2パス圧縮（追加最適化）
  },
  mangle: {
    safari10: true,          // Safari 10互換性
  },
  format: {
    comments: false,         // コメント削除
  },
  inline: 2,                 // 小さい関数のインライン化
}
```

**効果**: Phase 8 Task 2.5で追加 -1.07 KB削減達成。

### 14.4. manualChunks 戦略

**基本方針**:

- React系ライブラリ: `react-vendor`（大きいがキャッシュ効果大）
- 大規模データ処理: `data-processing`（>30KB推奨）
- UI コンポーネント群: `ui-components`（再利用性高）
- ページ/機能単位: 独立チャンク（10-20KB目安）

**Phase 8 最終構成**:

| チャンク            | サイズ (gzip)      | 用途                    |
| ------------------- | ------------------ | ----------------------- |
| `react-vendor`      | 203.56 KB (~65 KB) | React 19 + React Router |
| `data-processing`   | 33.69 KB (~11 KB)  | データ処理ロジック      |
| `ui-components`     | 33.23 KB (~11 KB)  | UI コンポーネント       |
| `IntegratedMapView` | 21.15 KB (~7 KB)   | 地図ビュー              |
| `markers`           | 15.35 KB (~5 KB)   | マーカーロジック        |
| `App`               | 11.13 KB (~4 KB)   | アプリ本体              |
| `CustomMapControls` | 8.64 KB (~3 KB)    | 地図コントロール        |
| `index`             | 2.96 KB (~1 KB)    | エントリーポイント      |

### 14.5. ESM Static Import パターン

**問題**: 動的 `require()` はESMでビルドエラーを引き起こす。

**解決策**: 静的importに統一する。

```typescript
// ❌ Bad: Dynamic require
if (process.env.ANALYZE) {
  plugins.push(require("rollup-plugin-visualizer")());
}

// ✅ Good: Static import + conditional push
import { visualizer } from "rollup-plugin-visualizer";

if (process.env.ANALYZE === "true") {
  plugins.push(
    visualizer({
      /* ... */
    })
  );
}
```

### 14.6. Bundle Analysis フロー

**定期実行**（月次推奨）:

```bash
# Bundle可視化生成
$env:ANALYZE='true'; pnpm build

# dist/stats.html をブラウザで開く
Start-Process "dist\stats.html"

# 確認項目:
# - 重複モジュール検出
# - 大きすぎるチャンク（>100KB）
# - 未使用依存の混入
# - Tree-shakingの効き具合
```

**Phase 8達成指標**:

- App.js: 19.56 KB → 11.13 KB (-43.1%)
- 条件付き初期ロード: -78.7% 削減
- モジュール数: 130 → 126 (-3.1%)

---

Last Updated: 2025-10-19

## 13. 参照ドキュメント

- A/Bテストとマーカー同期仕様: `docs/ab-test-marker-sync.md` (variant→markerType マッピング / override 表示 / イベント定義)
