# src/components/common: 監査レポート (2025-10-06)

対象: `src/components/common`

## 概要

- 目的: 冗長性・整合性・有効性（型/アクセシビリティ/動作）を点検し、最小リスクでの改善を実施
- 実施内容: コード精査 + 小規模修正（3点） + 提案の整理

## 変更点（実装済み）

1. GoogleMapsLinkButton の疑似クラス問題を修正
   - 問題: inline style に `:hover`, `:focus`, `:active` を含めていたため無効
   - 対応: 擬似クラスは CSS (`src/styles/index.css`) に定義し、コンポーネント側からは削除
   - 追加CSS:
     - `.google-maps-link-button:hover { filter: brightness(0.98) }`
     - `.google-maps-link-button:active { transform: translateY(1px) }`
     - `.google-maps-link-button:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px }`

2. BusinessStatusBadge の要素を semantic に修正
   - 変更: `<output>` → `<span>` へ置換
   - 目的: output はフォーム出力向け要素のため。aria-label は維持

3. barrel export の整備
   - 追加: `LoadingSpinner`, `OptimizedImage` を `src/components/common/index.ts` からもエクスポート
   - ねらい: 共通コンポーネントの集約ポイントとしての一貫性

## 所見（概要）

- 良い点: ErrorBoundary/Hours/Badge/LastUpdated は責務分離が明快。ARIA も配慮あり
- 気付き: SkipLink/AccessibleButton のフォーカス可視リング、FocusTrap の堅牢化、OptimizedImage の srcset/sizes 拡張余地
- 重複懸念: AccessibleLoadingSpinner と LoadingSpinner の機能重複

## 推奨アクション（未実施）

- CSS: `.skip-link:focus` による表示制御へ移行（JS onFocus/onBlur の撤廃）
- AccessibleButton: `:focus-visible` でのフォーカスリング追加
- FocusTrap: sentinel 導入、document ではなくコンテナ基準の keydown、初期/復帰フォーカス
- OptimizedImage: `sizes`/`srcset` オプション対応、width/height の必須化検討
- コントラスト検証: badge/chip の配色を `scripts/check-contrast.js` に追加して CI で検証
- Spinner 統一: `LoadingSpinner` に統合し、`AccessibleLoadingSpinner` は非推奨化

## 互換性・影響

- 破壊的変更なし（GoogleMapsLinkButton/Badge は DOM 役割維持）
- スタイルの視覚変化は軽微（フォーカス可視性向上）

## 参考

- WCAG 2.1 (Focus Visible / Color Contrast)
- React A11y Patterns (Skip Link / Live Region / Spinner)
