# sado-restaurant-map

![CI](https://github.com/nakanaka07/sado-restaurant-map/actions/workflows/ci.yml/badge.svg)
![Coverage](https://raw.githubusercontent.com/nakanaka07/sado-restaurant-map/HEAD/assets/coverage-badge.svg)

佐渡島のレストラン / トイレ / 駐車場などの地点情報を快適に閲覧できる Web マップアプリケーション。React 19 + TypeScript + Vite + PWA + アクセシビリティ最適化を重視しています。

## ✨ 特徴

- React 19 / Concurrent 対応構成
- Vite 7 による高速 HMR
- Vitest + Testing Library によるユニット/コンポーネントテスト
- PWA 対応 (vite-plugin-pwa / workbox)
- アクセシビリティ検査 (axe, jest-axe)
- 型安全 & 厳格 TS コンパイラ設定

## 🚀 クイックスタート

```bash
pnpm install
pnpm dev
```

ビルド:

```bash
pnpm build && pnpm preview
```

テスト:

```bash
pnpm test
pnpm test:coverage
pnpm test:accessibility
```

型/静的解析:

```bash
pnpm type-check
pnpm lint
```

PWA アセット生成:

```bash
pnpm generate:pwa-assets
```

## 🧭 ディレクトリ概要 (抜粋)

```
src/
  components/  UI コンポーネント
  pages/       ページ/ルーティング単位
  hooks/       再利用ロジック
  services/    外部 API / ドメインロジック
  test/        テストセットアップ/ユーティリティ
config/        eslint / vitest / ts / accessibility 設定
public/        静的ファイル
scripts/       分析・デプロイ支援スクリプト

```

## 🛡 品質ゲート (初期基準)

| ゲート     | 基準            | 最低ライン     | 備考                      |
| ---------- | --------------- | -------------- | ------------------------- |
| Lint       | ESLint error 0  | 100%           | `pnpm lint`               |
| Type Check | tsc             | error 0        | `pnpm type-check`         |
| Tests      | Vitest          | pass rate 90%+ | `pnpm test`               |
| Coverage   | line            | ≥50%           | `pnpm test:coverage`      |
| A11y       | axe             | 重大違反 0     | `pnpm test:accessibility` |
| Bundle     | main chunk gzip | <250KB         | `pnpm analyze`            |

詳細/将来ターゲットは `docs/SHARED_GLOSSARY.md` を参照。

## 📄 重要ドキュメント

| ファイル                  | 目的                                      |
| ------------------------- | ----------------------------------------- |
| `docs/SHARED_GLOSSARY.md` | 用語 / 優先度 / 品質ゲート / 依頼テンプレ |
| `docs/COLLAB_PROMPT.md`   | AI 協業プロンプト / レビュー観点 / 方針   |

## 🗂 タスク依頼テンプレ (抜粋)

```text
<カテゴリ(feat/fix/refactor/...)> <短い要約>
背景:
目的:
AC:
制約:(任意)
優先度: P0-P3
補足:(任意)
```

例:

```text
feat: Google Map マーカーの遅延ロード最適化
背景: 初回レンダで120マーカー同時追加しフリーズ
目的: 初期 UX と CPU 使用率低減
AC:
 - 画面ロード <2s (dev)
 - スクロールで追加ロード
 - パフォーマンスログ console.info 出力
優先度: P1
```

## 🔄 更新ワークフロー要約

1. ブランチ: `feat/*`, `fix/*`, `docs/*` など命名
2. 変更: 小さな論理単位でコミット (Conventional 前置語推奨)
3. PR: タイトルにカテゴリ + 要約, 説明に 背景/目的/AC
4. CI (予定): lint / type-check / test すべてパス
5. マージ: squash or rebase (個人開発なので柔軟)

## 🔍 将来ロードマップ(抜粋)

- GitHub Actions: CI ワークフロー (lint / typecheck / test / size-limit)
- Issue Forms 導入 (カテゴリ定形化)
- Lighthouse CI & Bundle Size バジェット
- Storybook / Visual Regression
- E2E (Playwright) 地図インタラクション

## 🤝 コントリビュート

個人開発ですがフィードバック歓迎。Issue か PR で提案してください。用語/ルール更新は `docs(glossary): ...` 形式推奨。

## 🛠 使用主要ライブラリ

| 分類   | ライブラリ                   |
| ------ | ---------------------------- |
| ビルド | Vite                         |
| UI     | React 19                     |
| 型     | TypeScript 5.7               |
| テスト | Vitest / @testing-library/\* |
| a11y   | axe-core / jest-axe          |
| PWA    | vite-plugin-pwa / workbox    |

## 📜 ライセンス

MIT License — 詳細は `LICENSE` を参照。

---

Generated: 2025-09-27
