# Copilot Repository Instructions

(短く・再利用可能。AI は不足時のみ検索。空行で区切るが送信時統合される。)

## 1. Project Overview

`sado-restaurant-map`: 佐渡島の飲食店/トイレ/駐車場等 POI を React 19 + TypeScript + Vite で表示する PWA。重点: パフォーマンス / アクセシビリティ / 型安全 / オフライン許容。フロント主体、`data-platform/` に Python ETL/整形コードを含む。

## 2. Tech Stack & Key Tools

Frontend: React 19 (concurrent features), TypeScript 5.7 strict, Vite 7, vitest + Testing Library, vite-plugin-pwa (Workbox), axe / jest-axe。
CI: GitHub Actions (`ci.yml` build+lint+test+size-limit, `coverage-badge.yml`, `lighthouse-ci.yml`).
Performance: manualChunks (`react-vendor`, `google-maps`), size-limit, Lighthouse CI budgets, rollup-plugin-visualizer (ANALYZE flag)。

## 3. Build & Validation (ALWAYS follow order)

1. `pnpm install` (必ず最初)
2. `pnpm type-check` (早期失敗)
3. `pnpm lint` (エラー 0)
4. `pnpm test:run` or `pnpm test` (watch)
5. Optional: `pnpm test:coverage` (line >=50% target)
6. `pnpm build` → `pnpm preview`
7. Bundle 分析: `ANALYZE=true pnpm build` or `pnpm analyze`
8. Accessibility subset: `pnpm test:accessibility`
   Never skip steps 1–4 for PR changes.

## 4. Directory Landmarks

`src/components` UI / `src/pages` 画面 / `src/hooks` 再利用ロジック / `src/services` 外部 API & ドメイン操作 / `src/utils` 汎用 / `src/test` setup & a11y / `public` 静的 / `config` 各種設定 / `.github/workflows` CI / `data-platform` Python ETL。エイリアス: `@`, `@components`, `@hooks`, `@utils`, `@types`, `@data`, `@assets`, `@services`。

## 5. Type & Lint Policies

Strict TS (exactOptionalPropertyTypes 等)。`@typescript-eslint/no-explicit-any` 禁止。未使用変数は `_` prefix を除きエラー。React Hooks exhaustive-deps 警告。優先: 小さく純粋な関数 + 明確境界。Public 型は `src/types/` へ抽出検討。

## 6. Testing Guidelines

Unit/Component: vitest + jsdom。`src/test/setup.ts` を経由。アクセシビリティ: jest-axe / @axe-core/react。Coverage reporters: text/json/json-summary/html。大きな新ロジック → 最低: happy path + エッジ (空データ/エラー) 追加。Map 集約描画は将来 E2E (Playwright) 予定、現状はユニット差分でフォロー。

## 7. Performance & Bundle

Main chunk gzip <250KB 目標 (Glossary 参照)。`react-vendor` / `google-maps` 手動分割済み。不要巨大依存を追加しない。画像は hashed ファイルネーミング済み。重い新機能は dynamic import (`import()` + Suspense) を検討。

## 8. PWA / Service Worker Notes

Import 仮想モジュールは必ず静的文字列。`injectRegister:false` → 登録ラッパで `registerSW` 明示 (参照: `pwa-implementation-notes.md`)。API Keys を runtimeCaching キャッシュキーから除去（`cacheKeyWillBeUsed` 実装済）。開発で PWA 有効化必要なら `ENABLE_PWA_DEV=true`. Offline fallback まだ未実装。

## 9. Accessibility Principles

WCAG AA コントラスト / キーボード操作全経路 / 余計な ARIA 付与禁止 / 視覚的フォーカスリング維持 (`outline` 無効化禁止)。インタラクティブ要素はネイティブ HTML 優先。新コンポーネント: role / aria-\* を必要最小に。

## 10. CI & Quality Gates

CI で lint / type-check / tests / coverage artifact / size-limit / lighthouse (後続 workflow)。失敗時は原因最短修正。カバレッジ基準 line≥50% (将来段階的引き上げ)。Size baseline は `metrics/size-limit.json` 自動更新 (main push)。

## 11. AI Collaboration Rules

Always: 最小差分 / 破壊的変更時 README or Glossary 更新提案。検索前に本ファイルと Glossary/COLLAB_PROMPT を参照。大量ファイル一括リネーム・自動整形は明示承認なしで行わない。失敗/不確実: 早期 Blocker 報告。

## 12. Common Pitfalls

- 動的生成した仮想モジュール文字列 (禁止) → 404 fetch 発生。
- `ANALYZE=true` で visualizer 未インストール→ try/catch で無害化済 (追加入れ不要)。
- 画像キャッシュキー query 差異 → plugins が query 削除処理済。

## 13. When to Refactor

条件: 関数 >150行 / 重複 3回+ / hook 再レンダー > 想定回数 (dev tools)。Refactor 前後でテスト緑維持が必須。大規模再構成は段階PR。

## 14. Search Strategy for Agent

Trust these instructions first. Only grep/search if: (a) 未定義の新規 API 参照が必要, (b) ビルド失敗メッセージがここで言及されない, (c) 依存バージョン不整合。過剰探索を避ける。

## 15. Future Work Markers

`// TODO(debt:reason)` コメントで技術的負債。週次棚卸し (手動)。

## 16. Python Subtree Quick Note

`data-platform/` は独立Python環境 (requirements.txt)。Node ワークフローから独立。将来: matrix で pytest 追加予定。JavaScript 側から直接 import なし。

(End of instructions)
