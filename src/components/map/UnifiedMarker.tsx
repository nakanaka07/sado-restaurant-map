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
import { useMemo } from "react";
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
export function UnifiedMarker({
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

export default UnifiedMarker;
