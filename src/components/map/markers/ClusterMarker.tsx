/**
 * 🎯 ClusterMarker - マーカークラスター表示コンポーネント
 *
 * Phase 4: 密集マーカーの効率的な表示・ユーザビリティ向上
 * 数に応じた動的サイズ調整・グラデーション・アニメーション効果
 */

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import React, { useCallback, useMemo } from "react";
import type { ClusterData } from "./clusterUtils";

/**
 * クラスターマーカープロパティ
 */
/**
 * ClusterMarker component props
 */
interface ClusterMarkerProps {
  readonly cluster: ClusterData;
  readonly size?: number;
  readonly ariaLabel?: string;
  /**
   * Optional callback for cluster click. If omitted, a `CustomEvent` named
   * `sado:cluster-click` will be dispatched on `window` with the cluster
   * detail so parent code can handle zooming or expansion.
   */
  readonly onClusterClick?: (cluster: ClusterData) => void;
}

export const ClusterMarker: React.FC<ClusterMarkerProps> = ({
  cluster,
  size = 48,
  ariaLabel,
  onClusterClick,
}) => {
  const { position, count } = cluster;

  const handleClick = useCallback(() => {
    // 親が handler を渡していれば呼び出す
    if (typeof onClusterClick === "function") {
      try {
        onClusterClick(cluster);
        return;
      } catch (err) {
        console.error("Error in onClusterClick prop:", err);
      }
    }

    // フォールバック: 親が prop を渡していない場合は CustomEvent を dispatch
    try {
      const detail = {
        id: cluster.id,
        position: cluster.position,
        count: cluster.count,
      };
      const ev = new CustomEvent("sado:cluster-click", { detail });
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(ev);
      }

      if (process.env.NODE_ENV === "development") {
        console.log("Cluster clicked (dispatched):", detail);
      }
    } catch (err) {
      console.error("Cluster clicked error:", err);
    }
  }, [cluster, onClusterClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        handleClick();
      }
    },
    [handleClick]
  );

  const gradientColors = useMemo(() => {
    return { start: "#FF8A65", end: "#FF3D00" };
  }, []);

  const defaultAriaLabel = `${count}軒のレストランクラスター。クリックして詳細表示。`;

  return (
    <AdvancedMarker position={position} onClick={handleClick}>
      <div
        className="cluster-marker"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${gradientColors.start} 0%, ${gradientColors.end} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
          border: "3px solid rgba(255, 255, 255, 0.4)",
          position: "relative",
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          zIndex: 1000,
        }}
        tabIndex={0}
        role="button"
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel || defaultAriaLabel}
      >
        <div
          style={{
            fontSize: Math.max(12, Math.min(20, size * 0.25)),
            lineHeight: 1,
            marginBottom: count >= 100 ? "2px" : "0px",
          }}
        >
          {count}
        </div>

        <div
          style={{
            fontSize: Math.max(8, Math.min(12, size * 0.15)),
            opacity: 0.9,
            fontWeight: "500",
          }}
        >
          軒
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
          .cluster-marker:hover { transform: scale(1.15) rotate(5deg); }
          .cluster-marker:hover .cluster-tooltip { opacity: 1; }
          .cluster-marker:active { transform: scale(1.05) rotate(2deg); }
          .cluster-marker:focus { outline: 3px solid #4A90E2; }
        `,
          }}
        />
      </div>
    </AdvancedMarker>
  );
};

// (default export is at file end)

export default ClusterMarker;
