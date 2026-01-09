/**
 * @fileoverview UnifiedMarker - Strategy Pattern-based marker coordinator
 *
 * Phase 1: 9種類のマーカー実装を3つに統合する統一インターフェース
 *
 * Strategy Pattern:
 * - PinMarker: シンプルピン版（Google Maps標準風）
 * - IconMarker: ICOOON MONO版（既存CircularMarker相当）
 * - SVGMarker: スケーラブル版（完全SVG描画）
 *
 * A/Bテスト統合: `variant` propで動的切替
 *
 * @see docs/design/unified-marker-design.md
 */

import type { MapPoint } from "@/types";
import { memo, useMemo } from "react";
import { IconMarker } from "./markers/IconMarker";
import { PinMarker } from "./markers/PinMarker";
import { SVGMarker } from "./markers/SVGMarker";

// ==============================
// Types
// ==============================

export type MarkerVariant = "pin" | "icon" | "svg";
export type MarkerSize = "small" | "medium" | "large";

export interface UnifiedMarkerProps {
  /** 表示するマップポイント */
  readonly point: MapPoint;
  /** マーカークリック時のハンドラー */
  readonly onClick: (point: MapPoint) => void;
  /** マーカーの表示形式（A/Bテストで切替） */
  readonly variant?: MarkerVariant;
  /** マーカーのサイズ */
  readonly size?: MarkerSize;
  /** 選択状態 */
  readonly isSelected?: boolean;
  /** ホバー状態 */
  readonly isHovered?: boolean;
  /** カスタムARIAラベル */
  readonly ariaLabel?: string;
}

/**
 * 各Strategy実装で共有する基本Props
 */
export interface MarkerStrategyProps {
  readonly point: MapPoint;
  readonly onClick: (point: MapPoint) => void;
  readonly size: MarkerSize;
  readonly isSelected?: boolean | undefined;
  readonly isHovered?: boolean | undefined;
  readonly ariaLabel?: string | undefined;
}

// ==============================
// UnifiedMarker Component
// ==============================

/**
 * UnifiedMarker - マーカー表示のStrategyパターン実装
 *
 * `variant` propに基づいて適切なマーカー実装を選択・描画
 *
 * @example
 * ```tsx
 * <UnifiedMarker
 *   point={restaurant}
 *   onClick={handleClick}
 *   variant="icon"
 *   size="medium"
 * />
 * ```
 */
function UnifiedMarkerImpl({
  point,
  onClick,
  variant = "icon", // デフォルトは既存実装と同等のアイコン版
  size = "medium",
  isSelected,
  isHovered,
  ariaLabel,
}: UnifiedMarkerProps) {
  // Strategy Patternでマーカー実装を動的選択
  const MarkerComponent = useMemo(() => {
    switch (variant) {
      case "pin":
        return PinMarker;
      case "icon":
        return IconMarker;
      case "svg":
        return SVGMarker;
      default:
        return IconMarker; // フォールバック
    }
  }, [variant]);

  // Strategy Props構築
  const strategyProps: MarkerStrategyProps = {
    point,
    onClick,
    size,
    isSelected,
    isHovered,
    ariaLabel,
  };

  return <MarkerComponent {...strategyProps} />;
}

// ==============================
// React.memo with Custom Comparator
// ==============================

/**
 * マーカー623個に対するパフォーマンス最適化
 *
 * カスタム比較関数で必要な場合のみ再レンダリング
 * - point.id: マーカーのアイデンティティ
 * - variant/size: 表示形式
 * - isSelected/isHovered: インタラクション状態
 *
 * @see docs/design/ab-test-marker-sync.md
 */
function arePropsEqual(
  prevProps: UnifiedMarkerProps,
  nextProps: UnifiedMarkerProps
): boolean {
  // ポイントIDが同じかつ他のpropsも同じなら再レンダリング不要
  return (
    prevProps.point.id === nextProps.point.id &&
    prevProps.variant === nextProps.variant &&
    prevProps.size === nextProps.size &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.ariaLabel === nextProps.ariaLabel
    // onClick参照は安定していることを期待（useCallback使用前提）
  );
}

export const UnifiedMarker = memo(UnifiedMarkerImpl, arePropsEqual);

// デフォルトエクスポート
export default UnifiedMarker;
