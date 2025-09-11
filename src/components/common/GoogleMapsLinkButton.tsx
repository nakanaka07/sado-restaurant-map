/**
 * Google Maps リンクボタンコンポーネント
 * Google Maps公式ページへのリンクボタン
 */

import type { LatLngLiteral } from "@/types";
import { generateGoogleMapsUrl, generateMobileGoogleMapsUrl } from "@/utils";
import React, { useCallback, useMemo } from "react";

// Type aliases for better maintainability
type MapMode = "search" | "directions" | "streetview";
type ButtonVariant = "primary" | "secondary" | "text";
type ButtonSize = "small" | "medium" | "large";

interface GoogleMapsLinkButtonProps {
  readonly name: string;
  readonly coordinates: LatLngLiteral;
  readonly placeId?: string;
  readonly mode?: MapMode;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly showIcon?: boolean;
  readonly className?: string;
}

export const GoogleMapsLinkButton = React.memo<GoogleMapsLinkButtonProps>(
  ({
    name,
    coordinates,
    placeId,
    mode = "search",
    variant = "primary",
    size = "medium",
    showIcon = true,
    className = "",
  }) => {
    // URLの生成をメモ化
    const urls = useMemo(() => {
      const options: Parameters<typeof generateGoogleMapsUrl>[2] = {
        mode,
        zoom: 17,
      };

      if (placeId) {
        options.placeId = placeId;
      }

      const desktopUrl = generateGoogleMapsUrl(name, coordinates, options);

      const mobileUrls = generateMobileGoogleMapsUrl(coordinates, {
        mode: mode === "directions" ? "navigate" : "display",
        query: name,
      });

      return {
        desktop: desktopUrl,
        mobile: mobileUrls,
      };
    }, [name, coordinates, placeId, mode]);

    // クリックハンドラー
    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        // モバイル判定
        const isMobile =
          /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          );

        if (isMobile) {
          // モバイルの場合、アプリを試してからフォールバック
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          const targetUrl = isIOS ? urls.mobile.ios : urls.mobile.android;

          // アプリリンクを試す
          window.location.href = targetUrl;

          // フォールバックを少し遅れて設定
          setTimeout(() => {
            window.open(urls.mobile.fallback, "_blank", "noopener,noreferrer");
          }, 1000);
        } else {
          // デスクトップの場合、新しいタブで開く
          window.open(urls.desktop, "_blank", "noopener,noreferrer");
        }
      },
      [urls]
    );

    const styleConfig = getStyleConfig(variant, size);
    const iconConfig = getIconConfig(mode);

    return (
      <button
        type="button"
        onClick={handleClick}
        className={`google-maps-link-button ${className}`}
        style={styleConfig}
        aria-label={`Google Mapsで${name}を${getModeText(mode)}`}
        title={`Google Mapsで${getModeText(mode)}`}
      >
        {showIcon && (
          <span style={{ fontSize: styleConfig.iconSize }} aria-hidden="true">
            {iconConfig.icon}
          </span>
        )}
        <span>{iconConfig.text}</span>
      </button>
    );
  }
);

GoogleMapsLinkButton.displayName = "GoogleMapsLinkButton";

/**
 * スタイル設定を取得
 */
function getStyleConfig(
  variant: "primary" | "secondary" | "text",
  size: "small" | "medium" | "large"
) {
  const sizeConfig = getSizeConfig(size);
  const variantConfig = getVariantConfig(variant);

  return {
    ...variantConfig,
    ...sizeConfig,
    border: variantConfig.border,
    borderRadius: "6px",
    fontWeight: "500",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    textDecoration: "none",
    fontFamily: "inherit",
    lineHeight: "1",
    outline: "none",
    position: "relative" as const,
    userSelect: "none" as const,

    // ホバー・フォーカス効果
    ":hover": variantConfig.hover,
    ":focus": {
      outline: "2px solid #3b82f6",
      outlineOffset: "2px",
    },
    ":active": variantConfig.active,
  };
}

/**
 * サイズ設定を取得
 */
function getSizeConfig(size: "small" | "medium" | "large") {
  switch (size) {
    case "small":
      return {
        padding: "6px 12px",
        fontSize: "12px",
        iconSize: "14px",
        minHeight: "28px",
      };

    case "large":
      return {
        padding: "12px 24px",
        fontSize: "16px",
        iconSize: "18px",
        minHeight: "44px",
      };

    case "medium":
    default:
      return {
        padding: "8px 16px",
        fontSize: "14px",
        iconSize: "16px",
        minHeight: "36px",
      };
  }
}

/**
 * バリアント設定を取得
 */
function getVariantConfig(variant: "primary" | "secondary" | "text") {
  switch (variant) {
    case "primary":
      return {
        backgroundColor: "#1976d2", // Material Design primary blue
        color: "#ffffff",
        border: "1px solid #1976d2",
        hover: {
          backgroundColor: "#1565c0",
          borderColor: "#1565c0",
        },
        active: {
          backgroundColor: "#0d47a1",
          borderColor: "#0d47a1",
        },
      };

    case "secondary":
      return {
        backgroundColor: "#ffffff",
        color: "#1976d2",
        border: "1px solid #1976d2",
        hover: {
          backgroundColor: "#f3f4f6",
          borderColor: "#1565c0",
          color: "#1565c0",
        },
        active: {
          backgroundColor: "#e5e7eb",
          borderColor: "#0d47a1",
          color: "#0d47a1",
        },
      };

    case "text":
    default:
      return {
        backgroundColor: "transparent",
        color: "#1976d2",
        border: "1px solid transparent",
        hover: {
          backgroundColor: "#f3f4f6",
          color: "#1565c0",
        },
        active: {
          backgroundColor: "#e5e7eb",
          color: "#0d47a1",
        },
      };
  }
}

/**
 * アイコン設定を取得
 */
function getIconConfig(mode: "search" | "directions" | "streetview") {
  switch (mode) {
    case "directions":
      return {
        icon: "🗺️",
        text: "ルート案内",
      };

    case "streetview":
      return {
        icon: "👁️",
        text: "ストリートビュー",
      };

    case "search":
    default:
      return {
        icon: "📍",
        text: "Google Mapsで開く",
      };
  }
}

/**
 * モードに応じたテキストを取得
 */
function getModeText(mode: "search" | "directions" | "streetview"): string {
  switch (mode) {
    case "directions":
      return "ルート案内する";
    case "streetview":
      return "ストリートビューで見る";
    case "search":
    default:
      return "表示する";
  }
}
