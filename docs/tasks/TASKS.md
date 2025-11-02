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

なし（Phase 8.3完了、カバレッジ50%達成準備中）

## 4. Backlog (優先度付き候補)

### カバレッジ50%達成タスク（現在40.52%）

- (P1 test) **RestaurantMap.tsx統合テスト** [Issue #TBD] – マップ初期化・マーカー表示テスト、推定+2-3%
  - 現状: 0% (361行、未テスト)
  - 効果: カバレッジ大幅向上
  - 方法: React Testing Library + Google Maps Mock

- (P1 test) **FilterPanel.txテスト** [Issue #TBD] – フィルターUI操作テスト、推定+2-3%
  - 現状: 0% (390行、未テスト)
  - 効果: カバレッジ大幅向上
  - 方法: React Testing Library + ユーザーインタラクション

- (P2 test) **OptimizedInfoWindow.txテスト** [Issue #TBD] – InfoWindow表示・非表示テスト、推定+1-2%
  - 現状: 0% (255行、未テスト)
  - 効果: カバレッジ中程度向上
  - 方法: React Testing Library + Google Maps Mock

### Phase 8 残タスク

- (P2 perf) **React.lazy遅延化** [Issue #TBD] – FilterPanel, CustomMapControls遅延読み込み、初期バンドル削減
  - 現状: 未実装（Phase 8で計画されたが実装されず）
  - 効果: 初期ロード -40KB見込み
  - 方法: React.lazy + Suspense

### Phase 9: Long Tasks & Rendering Optimization (次フェーズ候補)

- (P1 perf) **Long Tasks分割** [Issue #TBD] – processInChunks実装、623 POI分割処理、TBT -2,000ms
- (P1 perf) **Google Maps API遅延化** [Issue #TBD] – useGoogleMapsLoader + Intersection Observer、TBT -5,000ms
- (P2 perf) **Render Blocking解消** [Issue #TBD] – Font Display最適化、Critical CSS Inline化
- (P3 perf) **Dashboard遅延化** [Issue #TBD] – React.lazy + Suspense、初期ロード高速化（Dashboard実装時）

## 6. Done (最近 10 件のみ保持)

1. **(P2 test) Phase 8.3: Code Quality Improvement** ✅ (2025-11-03)
   - IntegratedMapView.tsx: exhaustive-deps warning修正（useCallback化）
   - App.test.tsx: +2テストケース（エラーハンドリング、フィルター機能）
   - useMapPoints.test.ts: +3テストケース（統計情報、フィルター、エラー処理）
   - Total tests: 405 → 410 (+5 tests, +1.2%)
   - Coverage: 40.34% → 40.52% (+0.18%)
   - ESLint warnings: 1 → 0 (100%解消)
   - useMapPoints.ts coverage: 49.66% → 58.33% (+8.67%)
2. **(P2 perf) OptimizedImage統合** ✅ (2025-11-01)
   - IcooonMarker.tsx: `<img>` → OptimizedImage置換
   - AVIF → WebP → PNG フォールバックチェーン実装
   - Quality Gates全通過: 405 tests, 0 errors
   - Size Limit全チャンク制限内: markers 4.32KB (20KB制限)
   - 画像最適化効果: -50% (611KB削減)

- (P3 a11y) キーボードタブ順 smoke テスト (Playwright 準備 Issue) – 実ブラウザ検証
- (P3 refactor) services 層の I/O 分離 (API fetch と整形の関数分割) – テスト容易性
- (P3 docs) PWA offline fallback 設計ドラフト – UX 改善準備
- (P3 test) Map 集約ロジック edge ケースユニット強化 – 安定性

## 5. In Review

なし

## 6. Done (最近 10 件のみ保持)

1. **(P2 perf) OptimizedImage統合** ✅ (2025-11-01)
   - IcooonMarker.tsx: `<img>` → OptimizedImage置換
   - AVIF → WebP → PNG フォールバックチェーン実装
   - Quality Gates全通過: 405 tests, 0 errors
   - Size Limit全チャンク制限内: markers 4.32KB (20KB制限)
   - 画像最適化効果: -50% (611KB削減)
2. **(P0 perf) Phase 8 Task 2.5: Minification強化** ✅ (2025-10-19)
   - Terser passes:2 + inline:2追加
   - 全チャンクで追加削減: -1.07 KB
   - App: 11.61→11.39 KB, data-processing: 34.81→34.50 KB, react-vendor: 208.71→208.45 KB
   - 2パス圧縮による品質向上
3. **(P0 perf) Phase 8 Task 2.4: Code Splitting検証** ✅ (2025-10-19)
   - stats.html再生成・バンドル構造分析完了
   - 重複チャンク検証: 重複なし、manualChunks戦略最適
   - 8チャンク構成確認: react-vendor(203KB), data-processing(34KB), ui-components(33KB),
     IntegratedMapView(21KB), markers(15KB), CustomMapControls(9KB), App(11KB), index(3KB)
4. **(P0 perf) Phase 8 Task 2.3: Dynamic Imports強化** ✅ (2025-10-19)
   - FilterPanel & CustomMapControlsをReact.lazy化
   - App.tsx: 19.56→11.61 KB (-7.95 KB, -40.6%)
   - CustomMapControls: 8.86 KB新規分離
   - 初期ロード削減: 約-40 KB (条件付き-78%)
   - Suspenseフォールバック実装
5. **(P0 perf) Phase 8 Task 2.2: Tree-Shaking改善** ✅ (2025-10-19)
   - Barrel exports削除: src/hooks/index.ts, src/components/index.ts
   - 直接import化: CompactModalFilter.tsx, App.tsx (2箇所)
   - モジュール数削減: 130→126 (-4)
   - Development-only code削除確認: console.log 0件
   - Terser drop_console効果検証完了
6. **(P0 perf) Phase 8 Task 2.1: Bundle Analysis** ✅ (2025-10-19)
   - stats.html生成成功 (vite.config.ts修正: require→static import)
   - React名前付きインポート統一: MarkerMigration.tsx, ToiletHistogram.tsx, ParkingInfoWindow.test.tsx
   - バンドル構成可視化完了
   - react-vendor(208KB)最大チャンク特定
7. **(P0 perf) Phase 8 Task 1.2.4: Dashboard遅延化** ⏭️ (2025-10-05)
   - ステータス: スキップ (Dashboard未実装)
   - 理由: 現在は単一ページSPA、Dashboard不要
   - 対応: 将来Dashboard実装時に再検討
   - Task 2に直接進行
8. **(P2 refactor) Legacy Code & Docs Cleanup** ✅ (2025-10-05)
   - legacy/ ディレクトリ完全削除: 11ファイル (推定 -30~40 KB)
   - 古いドキュメントアーカイブ: ACTIONABLE_TASKS.md, AUTO_PRIORITY_REPORT.md
   - コードベース整理: -2,000行程度
   - 参照0件確認済み、品質ゲート全通過
9. **(P0 perf) Phase 8 Task 1.2: LoadingSpinner/ErrorBoundary** ✅ (2025-10-05)
   - LoadingSpinner: 16テスト全通過、WCAG AA準拠
   - ErrorBoundary: React 19互換、GA連携、本番対応
   - App.tsx統合完了、UX改善
10. **(P0 perf) Phase 8 Task 1.1: manualChunks最適化** ✅ (2025-10-05)
    - チャンク分離: markers, data-processing, ui-components (6チャンク)
    - バンドルサイズ: +5.17 KB (+0.29%) ※分割オーバーヘッド
    - TBT改善: -0.8% (Mobile), +10.6% (Desktop) - 期待外れ
    - 教訓: チャンク分割だけでは不十分、Unused JS削減が必要
11. **(P1 perf) Phase 6: PNG Auto-Optimization (vite-plugin-image-optimizer)** ✅ (2025-10-05)

- 残り17 PNGを自動最適化: 平均51%削減
- 総削減量: -594.73 KB (-25.17%)
- Baseline比累積: -48.88% (目標-14%を大幅超過)
- vite.config.ts: ViteImageOptimizer設定追加
- Quality Gates: 416 tests passing, 0 errors
- vite-plugin-image-optimizer導入完了

**(P1 perf) Phase 5: Image Optimization (ICOOON-MONO SVG)** ✅ (2025-10-04)

- 6アイコンPNG→SVG置換: cafe/ramen/bar/fastfood/japanese/steak (-773 KB)
- 総削減量: -788.20 KB (-25.01%)
- Baseline比累積: -31.69%
- getCuisineIconUrl: SVG優先ロジック追加
- テスト環境: 画像モック設定追加 (fileMock.ts)

**(P1 perf) Phase 4.5: Selective Optimization** ✅ (2025-01-XX)

Last Updated: 2025-11-03 (Phase 8.3完了: ESLint警告0件達成、テスト410件、カバレッジ40.52%。カバレッジ50%達成に向けた追加テスト準備中)

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

Last Updated: 2025-11-01 (OptimizedImage統合完了。IcooonMarker.tsx統合、画像50%削減達成。Phase 9準備完了)
