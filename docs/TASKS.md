# TASKS (Active / Backlog / Done)

このファイルは軽量なタスク可視化レイヤー。Issue 運用と Chat 補助の間を埋め、週次で同期する。**単一情報源は最終的に GitHub Issues** であり、本ファイルはスナップショット。大きくなり過ぎる場合はアーカイブへ移動。

## 0. 運用ポリシー

- 粒度: 1 PR (最大でも ~1 日作業) で完了可能な単位。巨大化したら分割。
- ライフサイクル: Ideation → (Issue化) Backlog → Active → In Review → Done → (Optional) Retrospect
- 反映タイミング: PR マージ直後 or 週次レビュー時に同期。Chat manage_todo_list 変更時に差分をできるだけ反映。
- 優先度: Glossary の P0-P3。`[P2]-feat` などの接頭辞推奨 (角括弧は誤検知回避のため区切り変換可)。
- ソース: Active に昇格したら GitHub Issue を必ず作成 (または既存 Issue 番号記載)。

## 1. ラベル指針 (Issue)

| Prefix   | カテゴリ         | 例                     | 追加条件       |
| -------- | ---------------- | ---------------------- | -------------- |
| feat     | 機能             | 新 Marker 切替 UI      | AC 必須        |
| fix      | 不具合           | PWA offline 再登録失敗 | 再現手順       |
| perf     | 性能             | main chunk 圧縮        | 指標差分対象   |
| refactor | 構造             | Hook 分離              | 挙動不変テスト |
| chore    | 付帯             | 依存更新               | 影響範囲記述   |
| docs     | 文書             | README 追加            | リンク検証     |
| test     | テスト           | map hook 追加テスト    | カバレッジ向上 |
| a11y     | アクセシビリティ | フォーカス順改善       | axe 重大違反 0 |
| security | セキュリティ     | dependabot 設定        | 影響評価       |

## 2. テンプレ (Issue Body)

```
<カテゴリ:feat/...> <短い要約>
背景:
目的:
AC:
優先度: P?
補足:
```

## 3. Active (作業中)

- **(P0 perf) Phase 8 Task 2: Unused JavaScript削減** [Issue #TBD] - 378 KiB削減、TBT <8,000ms目標、開始準備完了

## 4. Backlog (優先度付き候補)

### Phase 8: JavaScript 最適化 (進行中)

- (P3 perf) **Dashboard遅延化** [Issue #TBD] – React.lazy + Suspense、初期ロード高速化(Task 1.2.4スキップ: Dashboard未実装のため将来対応)
- (P1 perf) **Long Tasks分割** [Issue #TBD] – processInChunks実装、623 POI分割処理、TBT -2,000ms（Phase 8 Task 3）
- (P1 perf) **Google Maps API遅延化** [Issue #TBD] – useGoogleMapsLoader + Intersection Observer、TBT -5,000ms（Phase 8 Task 4）
- (P2 perf) **その他最適化** [Issue #TBD] – Terser強化、Render Blocking解消（Phase 8 Task 5）

### その他最適化

- (P1 test) E2Eテスト基盤 (Playwright) [Issue #TBD] – マーカー描画・クリック・選択状態検証（Phase 9検討）
- (P2 chore) Pre-commit Hook導入 (husky + lint-staged) [Issue #TBD] – 自動lint/type-check、CI失敗削減
- (P2 feat) Path-specific Copilot instructions 追加 (`.github/instructions/frontend.instructions.md`) – AI 検索コスト低減
- (P2 chore) Pre-commit (husky + lint-staged) 導入 – 失敗早期化
- (P3 perf) Lighthouse スコア履歴 metrics 追加 – トレンド可視化
- (P3 a11y) キーボードタブ順 smoke テスト (Playwright 準備 Issue) – 実ブラウザ検証
- (P3 refactor) services 層の I/O 分離 (API fetch と整形の関数分割) – テスト容易性
- (P3 docs) PWA offline fallback 設計ドラフト – UX 改善準備
- (P3 test) Map 集約ロジック edge ケースユニット強化 – 安定性

## 5. In Review

なし

## 6. Done (最近 7 件のみ保持)

1. **(P0 perf) Phase 8 Task 1.2.4: Dashboard遅延化** ⏭️ (2025-10-05)
   - ステータス: スキップ (Dashboard未実装)
   - 理由: 現在は単一ページSPA、Dashboard不要
   - 対応: 将来Dashboard実装時に再検討
   - Task 2に直接進行
2. **(P2 refactor) Legacy Code & Docs Cleanup** ✅ (2025-10-05)
   - legacy/ ディレクトリ完全削除: 11ファイル (推定 -30~40 KB)
   - 古いドキュメントアーカイブ: ACTIONABLE_TASKS.md, AUTO_PRIORITY_REPORT.md
   - コードベース整理: -2,000行程度
   - 参照0件確認済み、品質ゲート全通過
3. **(P0 perf) Phase 8 Task 1.2: LoadingSpinner/ErrorBoundary** ✅ (2025-10-05)
   - LoadingSpinner: 16テスト全通過、WCAG AA準拠
   - ErrorBoundary: React 19互換、GA連携、本番対応
   - App.tsx統合完了、UX改善
4. **(P0 perf) Phase 8 Task 1.1: manualChunks最適化** ✅ (2025-10-05)
   - チャンク分離: markers, data-processing, ui-components (6チャンク)
   - バンドルサイズ: +5.17 KB (+0.29%) ※分割オーバーヘッド
   - TBT改善: -0.8% (Mobile), +10.6% (Desktop) - 期待外れ
   - 教訓: チャンク分割だけでは不十分、Unused JS削減が必要
5. **(P1 perf) Phase 6: PNG Auto-Optimization (vite-plugin-image-optimizer)** ✅ (2025-10-05)
   - 残り17 PNGを自動最適化: 平均51%削減
   - 総削減量: -594.73 KB (-25.17%)
   - Baseline比累積: -48.88% (目標-14%を大幅超過)
   - vite.config.ts: ViteImageOptimizer設定追加
   - Quality Gates: 416 tests passing, 0 errors
   - vite-plugin-image-optimizer導入完了
6. **(P1 perf) Phase 5: Image Optimization (ICOOON-MONO SVG)** ✅ (2025-10-04)
   - 6アイコンPNG→SVG置換: cafe/ramen/bar/fastfood/japanese/steak (-773 KB)
   - 総削減量: -788.20 KB (-25.01%)
   - Baseline比累積: -31.69%
   - getCuisineIconUrl: SVG優先ロジック追加
   - テスト環境: 画像モック設定追加 (fileMock.ts)
7. **(P1 perf) Phase 4.5: Selective Optimization** ✅ (2025-01-XX)
   - 選択的動的Importロールバック: CustomMapControls, FilterPanel インライン化
   - Barrel Export確認: hooks/utils/services/components 全て最適化済み
   - チャンク数削減: 59 → 55 files (-4 files)
   - 総バンドル: -3.59 KB (-0.11%) 削減達成
   - 累積削減: -8.91% (Phase 4: -8.80% → Phase 4.5: -8.91%)
   - Quality Gates全通過 (394 tests, 0 errors)

## 7. Retrospect メモ (任意)

- 反復的に friction 高い領域: pre-commit 欠如 → 無駄 CI 失敗
- 近々の KPI: main bundle 安定 <250KB, Lighthouse perf >70 維持

## 8. 同期手順 (AI/人間)

1. 新アイデア → Backlog 追記 (+ Issue 起票)
2. 着手決定 → Issue を Active に移動 (ラベル/優先度調整)
3. PR 作成 → Active から In Review へ
4. マージ → Done へ (上限 5 超過で最古削除)
5. 週次: Backlog 優先度見直し / Glossary 更新要否検討

## 9. Chat 連携

- manage_todo_list は 現在作業中のみ を反映。
- 複数タスク並列禁止。行き詰まり → Blocker コメント化 → Backlog 戻し。

Last Updated: 2025-10-05 (Phase 8 Task 1-2完了、Legacy削除完了、Task 2開始準備完了 �)
