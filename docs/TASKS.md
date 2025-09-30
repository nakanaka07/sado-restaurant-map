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

現在なし（Chat manage_todo_list のみ）。

## 4. Backlog (優先度付き候補)

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

1. (P2 chore) size-limit 設定ファイル明示 初期閾値導入
2. (P2 chore) Coverage 閾値エンフォース (>=20% → 段階的50%目標) CI 追加
3. (P2 security) Dependabot + audit 設定追加
4. (P3 perf) Lighthouse スコア履歴 保存ステップ追加
5. (completed) 設定値現実化調整 (coverage 20%, size-limit 実測ベース)

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

Last Updated: 2025-09-30
