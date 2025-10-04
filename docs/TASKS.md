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

なし (Phase 6完了、-48.88%累積削減達成、新機能開発へシフト推奨)

## 4. Backlog (優先度付き候補)

### Phase 8: JavaScript 最適化 (計画段階)

- (P0 perf) **manualChunks関数実装** [Issue #TBD] – markers/data-processing分離、TBT -3000ms目標（Phase 8 Task 1.1）
- (P1 feat) **LoadingSpinner/ErrorBoundary作成** [Issue #TBD] – lazy loading UX改善、再利用可能なコンポーネント（Phase 8 Task 1.2.1-1.2.2）
- (P1 perf) **Dashboard遅延化** [Issue #TBD] – React.lazy + Suspense、初期ロード高速化（Phase 8 Task 1.2.4）
- (P2 perf) **Unused JavaScript削減** [Issue #TBD] – 345-359 KiB削減、Tree-shaking強化（Phase 8 Task 2）

### その他最適化

- (P2 perf) Dead Code Elimination [Issue #TBD] – Bundle analyzer実行、未使用コード削除、-20-40 KB削減目標（任意）
- (P2 refactor) UnifiedMarker Phase 5: Legacy完全削除 [Issue #TBD] – A/Bテスト完了後、legacy/削除、-30-40 KB削減目標
- (P1 test) UnifiedMarker E2Eテスト追加 (Playwright) [Issue #TBD] – マーカー描画・クリック・選択状態検証
- (P2 feat) Path-specific Copilot instructions 追加 (`.github/instructions/frontend.instructions.md`) – AI 検索コスト低減
- (P2 chore) Pre-commit (husky + lint-staged) 導入 – 失敗早期化
- (P3 perf) Lighthouse スコア履歴 metrics 追加 – トレンド可視化
- (P3 a11y) キーボードタブ順 smoke テスト (Playwright 準備 Issue) – 実ブラウザ検証
- (P3 refactor) services 層の I/O 分離 (API fetch と整形の関数分割) – テスト容易性
- (P3 docs) PWA offline fallback 設計ドラフト – UX 改善準備
- (P3 test) Map 集約ロジック edge ケースユニット強化 – 安定性

## 5. In Review

なし

## 6. Done (最近 5 件のみ保持)

1. **(P1 perf) Phase 6: PNG Auto-Optimization (vite-plugin-image-optimizer)** ✅ (2025-10-05)
   - 残り17 PNGを自動最適化: 平均51%削減
   - 総削減量: -594.73 KB (-25.17%)
   - Baseline比累積: -48.88% (目標-14%を大幅超過)
   - vite.config.ts: ViteImageOptimizer設定追加
   - Quality Gates: 416 tests passing, 0 errors
   - vite-plugin-image-optimizer導入完了
2. **(P1 perf) Phase 5: Image Optimization (ICOOON-MONO SVG)** ✅ (2025-10-04)
   - 6アイコンPNG→SVG置換: cafe/ramen/bar/fastfood/japanese/steak (-773 KB)
   - 総削減量: -788.20 KB (-25.01%)
   - Baseline比累積: -31.69%
   - getCuisineIconUrl: SVG優先ロジック追加
   - テスト環境: 画像モック設定追加 (fileMock.ts)
3. **(P1 perf) Phase 4.5: Selective Optimization** ✅ (2025-01-XX)
   - 選択的動的Importロールバック: CustomMapControls, FilterPanel インライン化
   - Barrel Export確認: hooks/utils/services/components 全て最適化済み
   - チャンク数削減: 59 → 55 files (-4 files)
   - 総バンドル: -3.59 KB (-0.11%) 削減達成
   - 累積削減: -8.91% (Phase 4: -8.80% → Phase 4.5: -8.91%)
   - Quality Gates全通過 (394 tests, 0 errors)
4. **(P0 refactor) UnifiedMarker Phase 4: Bundle Optimization** ✅ (2025-01-XX)
   - Tree-shaking最適化: 3 barrel files最適化 (sideEffects設定)
   - 動的Import実装: APIProvider/IntegratedMapView/CustomMapControls/FilterPanel
   - App chunk: -67.07% (-80.34 KB) 削減達成
   - 総バンドル: +0.57% (+17.75 KB) ※チャンク分割オーバーヘッド
   - 累積削減: -8.80% (Phase 3: -9.31% → Phase 4: -8.80%)
5. **(P0 refactor) UnifiedMarker Phase 3: Legacy Migration** ✅ (2025-01-XX)
   - 10ファイルをlegacy/へ移行 + deprecation warnings
   - バンドルサイズ: -322.21 KB (-9.31%)
   - App chunk: -14.07 KB (-10.51%)
   - 5ファイル削減 (58→53 files)

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

Last Updated: 2025-10-05 (Phase 6完了、-48.88%累積削減達成、-14%目標の3.5倍達成 🔥)
