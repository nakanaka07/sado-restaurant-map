# TASKS (Active / Backlog / Done)

> **Last Updated**: 2026-01-09
> **現在の状態**: テスト **2114件** 全通過、カバレッジ **71.51%**、E2E **20件**

このファイルは軽量なタスク可視化レイヤー。Issue 運用と Chat 補助の間を埋める。

## 0. 運用ポリシー

- 粒度: 1 PR (最大 ~1日) で完了可能な単位
- ライフサイクル: Backlog → Active → Done
- 優先度: P0-P3 (SHARED_GLOSSARY.md参照)

## 1. 現在のメトリクス

| 指標                   | 値             | 備考        |
| ---------------------- | -------------- | ----------- |
| テスト数               | **2114 tests** | 全通過 ✅   |
| カバレッジ (lines)     | **71.51%**     | 閾値65%以上 |
| カバレッジ (functions) | **73.59%**     |             |
| カバレッジ (branches)  | **65.21%**     |             |
| E2Eテスト              | **20 tests**   | Playwright  |
| スキップテスト         | **0件**        | ✅          |

### 技術スタック (2026-01-09)

| パッケージ | バージョン |
| ---------- | ---------- |
| React      | 19.2.3     |
| Vite       | 7.3.0      |
| TypeScript | 5.9.3      |
| Vitest     | 4.0.16     |
| Playwright | 1.57.0     |

---

## 2. Active (作業中)

現在アクティブなタスクなし

### 検討中タスク

- (P2 fix) **Lighthouse CI修正** – Google Maps API URL制限によるNO_FCP問題
- (P2 perf) **Render Blocking解消** – Font Display最適化
- (P3 perf) **Virtual Scrolling** – 大規模データ対応（将来）

---

## 3. Backlog (優先度付き候補)

### 🎯 Phase 5目標: 80%カバレッジ達成（オプション）

**現状**: カバレッジ **71.51%** (2114 tests) ✅
**次期目標**: 80% (+8.49%)
**注**: Phase 5は品質向上のオプション目標

### 🐍 data-platform (Python ETL)

**現状**: 独立したPython環境
**参照**: [data-platform/README.md](../../data-platform/README.md)

- (P3 test) **Pythonカバレッジ向上** – shared/config.py, core/domain等
- (P3 docs) **data-platform README更新** – セットアップ手順簡略化

---

## 4. Done (最近完了)

### 直近完了 (2026-01)

1. **(P1 refactor) FilterContext + Compound Components + CSS Modules** ✅
   - FilterContext.tsx (~520行): Context + Provider + 12 Selector Hooks
   - FilterPanelCompound.tsx (~700行): 12 Compound Components
   - CSS Modules導入: インラインスタイル排除
   - テスト: +8 tests (2106 → 2114)

2. **(P1 perf) Manual Chunks最適化** ✅
   - react-vendor: 69.21 KB → 59.68 KB (**-13.8%**)
   - 新チャンク: google-maps, hooks, config

3. **(P1 refactor) App.tsx分割 + LogManager + Test Helpers** ✅
   - LogManager: 604行、31テスト
   - Test Helpers: 480行（4ファイル）
   - 総削減: -429行

### 2025 Q1 刷新計画完了

1. **(P1 test) Week 4: Playwright E2E導入** ✅ (2025-12-30)
   - Playwright 1.57.0 + Chromium
   - FilterModal E2E: 20テスト全通過
   - Skipped Tests: 4件 → 0件

2. **(P1 chore) Week 2-3: 依存関係更新** ✅ (2025-12-21)
   - React 19.2.3, Vite 7.3.0, TypeScript 5.9.3
   - Vitest 4.0.16, eslint-plugin-react-hooks 7.0.1
   - TBT改善: Mobile -30%, Desktop -28%

3. **(P0 fix) Week 1: Vitest 4 + Phase 9ロールバック** ✅ (2025-12-09)
   - Vitest 4.0.15マイグレーション
   - 根本原因特定: Google Maps API

---

## 5. アーカイブ (過去Phase)

Phase 1-4 完了履歴

### Phase 4: テスト品質向上 (2025-12-07)

- 71.5% → 72.56%, 1488 tests

### Phase 3: 残存コンポーネントテスト (2025-12-07)

- 64.31% → 71.5%, +276 tests

### Phase 2: インタラクティブUI (2025-12-06)

- 51.12% → 64.31%, +148 tests

### Phase 1: カバレッジ50%達成 (2025-11-04)

- 40.52% → 51.12%, +503 tests

### Phase 8: JavaScript最適化 (2025-10-19)

- App.js: -43.1%, Tree-shaking改善

### Phase 7: Image Optimization (2025-10-XX)

- -594.73 KB (-25.17%)

</details>

---

## 6. 教訓 (Lessons Learned)

### Phase 9失敗から学んだこと

1. **データ規模の誤認識**: 623件は「大規模」ではない
2. **プロファイリング先行**: 測定→最適化の順序を守る
3. **真のボトルネック**: Google Maps API (~900KiB) が支配的

---

## 7. 同期手順

**Last Updated**: 2026-01-09

1. 新アイデア → Backlog追記
2. 着手決定 → Active移動
3. マージ → Done移動
4. 週次: 優先度見直し
