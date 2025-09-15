/**
 * 🎌 ICOOON MONO統一マーカーコンポーネント
 * 全10カテゴリ完全統一・WCAG 2.2 AA準拠
 */

import { useCallback, useState, type FC } from "react";
import {
  getIcooonMarkerConfig,
  getIcooonMarkerStats,
} from "../../config/icooonMarkerConfig";
import type { IcooonMarkerCategory } from "../../types/icooonMarker.types";

// ==============================
// Props 型定義
// ==============================

interface IcooonMarkerProps {
  readonly category: IcooonMarkerCategory;
  readonly restaurant?: {
    readonly id: string;
    readonly name: string;
    readonly latitude: number;
    readonly longitude: number;
  };
  readonly size?: "small" | "medium" | "large";
  readonly isSelected?: boolean;
  readonly isHovered?: boolean;
  readonly onClick?: () => void;
  readonly onHover?: (hovered: boolean) => void;
  readonly showLabel?: boolean;
  readonly ariaDescribedBy?: string;
}

// ==============================
// ICOOON MONO統一マーカーコンポーネント
// ==============================

export const IcooonMarker: FC<IcooonMarkerProps> = ({
  category,
  restaurant,
  size = "medium",
  isSelected = false,
  isHovered = false,
  onClick,
  onHover,
  showLabel = false,
  ariaDescribedBy,
}) => {
  const [isIconLoaded, setIsIconLoaded] = useState(false);
  const [hasIconError, setHasIconError] = useState(false);

  // マーカー設定取得
  const config = getIcooonMarkerConfig(category);

  // サイズ設定
  const sizeConfig = {
    small: { width: 24, height: 24, fontSize: "12px", padding: "4px" },
    medium: { width: 32, height: 32, fontSize: "16px", padding: "6px" },
    large: { width: 40, height: 40, fontSize: "20px", padding: "8px" },
  }[size];

  // 状態に基づくスタイル
  const getMarkerStyle = useCallback(() => {
    const baseStyle = {
      width: `${sizeConfig.width}px`,
      height: `${sizeConfig.height}px`,
      backgroundColor: config.color,
      borderColor: config.borderColor,
      color: config.textColor,
      borderWidth: isSelected ? "3px" : "2px",
      borderStyle: "solid",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "all 0.2s ease-in-out",
      fontSize: sizeConfig.fontSize,
      fontFamily: '"Noto Sans JP", sans-serif',
      boxShadow: isHovered
        ? "0 4px 12px rgba(0,0,0,0.3)"
        : "0 2px 6px rgba(0,0,0,0.15)",
      transform: isHovered ? "scale(1.1)" : "scale(1)",
      zIndex: isSelected ? 1000 : isHovered ? 999 : 1,
      position: "relative" as const,
      overflow: "hidden" as const,
    };

    return baseStyle;
  }, [config, isSelected, isHovered, sizeConfig]);

  // アイコン読み込み処理
  const handleIconLoad = useCallback(() => {
    setIsIconLoaded(true);
    setHasIconError(false);
  }, []);

  const handleIconError = useCallback(() => {
    setHasIconError(true);
    setIsIconLoaded(false);
  }, []);

  // マウスイベント処理
  const handleMouseEnter = useCallback(() => {
    onHover?.(true);
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover?.(false);
  }, [onHover]);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onClick?.();
    },
    [onClick]
  );

  // キーボードイベント処理
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick?.();
      }
    },
    [onClick]
  );

  return (
    <div className="icooon-marker-wrapper">
      {/* メインマーカー */}
      <div
        style={getMarkerStyle()}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`${config.accessibility.ariaLabel}${restaurant ? `: ${restaurant.name}` : ""}`}
        aria-describedby={ariaDescribedBy}
        aria-pressed={isSelected}
        data-testid={`icooon-marker-${category}`}
      >
        {/* ICOOON MONOアイコン表示 */}
        {!hasIconError && (
          <img
            src={config.iconPath}
            alt=""
            role="presentation"
            style={{
              width: `${Math.floor(sizeConfig.width * 0.6)}px`,
              height: `${Math.floor(sizeConfig.height * 0.6)}px`,
              filter: "brightness(0) saturate(100%)",
              display: isIconLoaded ? "block" : "none",
            }}
            onLoad={handleIconLoad}
            onError={handleIconError}
          />
        )}

        {/* フォールバック絵文字 */}
        {(hasIconError || !isIconLoaded) && (
          <span
            role="img"
            aria-hidden="true"
            style={{
              fontSize: sizeConfig.fontSize,
              lineHeight: 1,
            }}
          >
            {config.emoji}
          </span>
        )}

        {/* 選択状態インジケーター */}
        {isSelected && (
          <div
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              width: "8px",
              height: "8px",
              backgroundColor: "#ff4444",
              borderRadius: "50%",
              border: "2px solid white",
              zIndex: 2,
            }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* ラベル表示 */}
      {showLabel && restaurant && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: "4px",
            padding: "2px 6px",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            fontSize: "12px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
            maxWidth: "200px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontFamily: '"Noto Sans JP", sans-serif',
            zIndex: 1001,
          }}
          aria-hidden="true"
        >
          {restaurant.name}
        </div>
      )}
    </div>
  );
};

// ==============================
// 統計情報表示コンポーネント
// ==============================

export const IcooonMarkerStats: FC = () => {
  const stats = getIcooonMarkerStats();

  return (
    <div
      className="icooon-marker-stats"
      style={{
        padding: "16px",
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSize: "14px",
      }}
    >
      <h3 style={{ margin: "0 0 12px 0", color: "#333" }}>
        🎌 ICOOON MONO統一マーカー統計
      </h3>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}
      >
        <div>
          総カテゴリ数: <strong>{stats.totalCategories}個</strong>
        </div>
        <div>
          レストラン: <strong>{stats.restaurantCategories}種類</strong>
        </div>
        <div>
          施設: <strong>{stats.facilityCategories}種類</strong>
        </div>
        <div>
          アイコン統一: <strong>{stats.iconSource}</strong>
        </div>
        <div>
          デザイン: <strong>{stats.designConsistency}</strong>
        </div>
        <div>
          アクセシビリティ: <strong>{stats.accessibility}</strong>
        </div>
      </div>
    </div>
  );
};

export default IcooonMarker;
