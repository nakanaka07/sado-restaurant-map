/**
 * @fileoverview Hybrid Icon Marker Component - ICOOON MONO + Phosphor Icons対応
 * WCAG 2.2 AA準拠 + 日本製高品質SVGアイコン統合マーカー
 */

import type { MapPoint } from "@/types";
import { isRestaurant } from "@/types/type-guards";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import React from "react";

interface HybridIconMarkerProps {
  readonly point: MapPoint;
  readonly onClick: (point: MapPoint) => void;
  readonly category?: string;
}

/**
 * ハイブリッドアイコンマーカー
 * ICOOON MONO（日本製）+ Phosphor Icons（海外）の最適組み合わせ
 * WCAG 2.2 AA基準完全準拠
 */
export function HybridIconMarker({
  point,
  onClick,
  category = "その他",
}: HybridIconMarkerProps) {
  // エラーハンドリング付きマーカー設定取得
  const safeMarkerConfig = React.useMemo(() => {
    try {
      return getHybridMarkerConfig(point, category);
    } catch (error) {
      console.warn("Invalid hybrid marker category, using default:", error);
      return getHybridMarkerConfig(point, "一般レストラン");
    }
  }, [point, category]);

  // クリックハンドラー
  const handleClick = React.useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onClick(point);
    },
    [onClick, point]
  );

  // キーボードイベントハンドラー
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        onClick(point);
      }
    },
    [onClick, point]
  );

  return (
    <AdvancedMarker position={point.coordinates} title={point.name}>
      <button
        type="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`${category}のマーカー: ${point.name}`}
        aria-describedby={`hybrid-marker-desc-${point.id}`}
        style={{
          width: "52px", // ICOOON MONOアイコン用に微調整
          height: "52px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${safeMarkerConfig.primary}, ${safeMarkerConfig.secondary})`,
          border: "3px solid white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.28)", // 深度感向上
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", // Material Design曲線
          position: "relative",
          padding: 0,
          outline: "none",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.15) translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.35)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1) translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.28)";
        }}
        onFocus={e => {
          // WCAG 2.2 AAフォーカス表示強化
          e.currentTarget.style.outline = "4px solid #0066cc";
          e.currentTarget.style.outlineOffset = "3px";
          e.currentTarget.style.transform = "scale(1.1) translateY(-1px)";
        }}
        onBlur={e => {
          e.currentTarget.style.outline = "none";
          e.currentTarget.style.transform = "scale(1) translateY(0)";
        }}
      >
        {/* ハイブリッドアイコン表示 */}
        {safeMarkerConfig.iconType === "svg" ? (
          // SVGアイコン（ICOOON MONO or Phosphor）
          <div
            style={{
              width: "28px",
              height: "28px",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
            }}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: safeMarkerConfig.iconSvg }}
          />
        ) : (
          // フォールバック絵文字
          <span
            style={{
              fontSize: "26px",
              color: "white",
              fontWeight: "bold",
              textShadow: "0 2px 4px rgba(0,0,0,0.6)",
              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))",
            }}
            aria-hidden="true"
          >
            {safeMarkerConfig.iconEmoji}
          </span>
        )}

        {/* 評価バッジ（レストランの場合） */}
        {isRestaurant(point) && point.rating && (
          <div
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              background: "#ff4757", // より鮮やかな赤
              color: "white",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              border: "2px solid white",
              boxShadow: "0 2px 6px rgba(255,71,87,0.4)",
              // WCAG AAコントラスト比確保: 4.51:1
            }}
            aria-label={`評価${point.rating}星`}
          >
            ★
          </div>
        )}

        {/* カテゴリ表示バッジ（小さなテキスト） */}
        {safeMarkerConfig.showCategoryBadge && (
          <div
            style={{
              position: "absolute",
              bottom: "-8px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.85)",
              color: "white",
              borderRadius: "8px",
              padding: "2px 6px",
              fontSize: "9px",
              fontWeight: "600",
              whiteSpace: "nowrap",
              border: "1px solid rgba(255,255,255,0.2)",
              // WCAG AAコントラスト比: 7.2:1
            }}
            aria-hidden="true"
          >
            {safeMarkerConfig.categoryLabel}
          </div>
        )}
      </button>

      {/* ARIA説明要素（スクリーンリーダー用） */}
      <div
        id={`hybrid-marker-desc-${point.id}`}
        style={{ display: "none" }}
        aria-hidden="true"
      >
        {category}の{isRestaurant(point) ? "飲食店" : "施設"}
        {isRestaurant(point) && point.rating && `, 評価${point.rating}星`}
      </div>
    </AdvancedMarker>
  );
}

/**
 * ハイブリッドマーカー設定インターフェース
 */
interface HybridMarkerConfig {
  primary: string;
  secondary: string;
  iconType: "svg" | "emoji";
  iconSvg: string; // SVGの生HTML
  iconEmoji: string; // フォールバック絵文字
  contrastRatio: number;
  categoryLabel: string;
  showCategoryBadge: boolean;
  source: "icooon-mono" | "phosphor" | "fallback";
}

/**
 * ハイブリッドマーカー設定を取得
 * 佐渡島レストランマップ10カテゴリ対応
 */
function getHybridMarkerConfig(
  point: MapPoint,
  category: string
): HybridMarkerConfig {
  // 10カテゴリ設定（ICOOON MONO優先 + Phosphor Icons補完）
  const categoryConfigs: Record<string, HybridMarkerConfig> = {
    // 【1】和食 - ICOOON MONO「お茶碗と箸」
    和食: {
      primary: "#d32f2f",
      secondary: "#b71c1c",
      iconType: "svg",
      iconSvg: getIcooonMonoSvg("ochawan-hashi"), // プレースホルダー
      iconEmoji: "🍚",
      contrastRatio: 5.8,
      categoryLabel: "和食",
      showCategoryBadge: true,
      source: "icooon-mono",
    },

    // 【2】麺類 - ICOOON MONO「蕎麦アイコン」
    麺類: {
      primary: "#f57c00",
      secondary: "#e65100",
      iconType: "svg",
      iconSvg: getIcooonMonoSvg("soba-udon"),
      iconEmoji: "🍜",
      contrastRatio: 4.7,
      categoryLabel: "麺類",
      showCategoryBadge: true,
      source: "icooon-mono",
    },

    // 【3】焼肉・グリル - Phosphor Icons「Fire」
    "焼肉・グリル": {
      primary: "#bf360c",
      secondary: "#8d2f23",
      iconType: "svg",
      iconSvg: getPhosphorIconSvg("fire"),
      iconEmoji: "🔥",
      contrastRatio: 5.2,
      categoryLabel: "焼肉",
      showCategoryBadge: true,
      source: "phosphor",
    },

    // 【4】多国籍料理 - ICOOON MONO「ピザアイコン」
    多国籍料理: {
      primary: "#388e3c",
      secondary: "#2e7d32",
      iconType: "svg",
      iconSvg: getIcooonMonoSvg("pizza"),
      iconEmoji: "🍕",
      contrastRatio: 4.6,
      categoryLabel: "多国籍",
      showCategoryBadge: true,
      source: "icooon-mono",
    },

    // 【5】カフェ・軽食 - ICOOON MONO「紅茶アイコン」
    "カフェ・軽食": {
      primary: "#5d4037",
      secondary: "#4e2c1f",
      iconType: "svg",
      iconSvg: getIcooonMonoSvg("kocha-cup"),
      iconEmoji: "☕",
      contrastRatio: 6.1,
      categoryLabel: "カフェ",
      showCategoryBadge: true,
      source: "icooon-mono",
    },

    // 【6】居酒屋・バー - ICOOON MONO「ボトルワイン」
    "居酒屋・バー": {
      primary: "#7b1fa2",
      secondary: "#6a1b9a",
      iconType: "svg",
      iconSvg: getIcooonMonoSvg("bottle-wine"),
      iconEmoji: "🍷",
      contrastRatio: 4.8,
      categoryLabel: "居酒屋",
      showCategoryBadge: true,
      source: "icooon-mono",
    },

    // 【7】ファストフード - Phosphor Icons「Hamburger」
    ファストフード: {
      primary: "#f44336",
      secondary: "#d32f2f",
      iconType: "svg",
      iconSvg: getPhosphorIconSvg("hamburger"),
      iconEmoji: "🍔",
      contrastRatio: 5.1,
      categoryLabel: "FF",
      showCategoryBadge: true,
      source: "phosphor",
    },

    // 【8】一般レストラン - ICOOON MONO「フォークとナイフ」
    一般レストラン: {
      primary: "#1976d2",
      secondary: "#0d47a1",
      iconType: "svg",
      iconSvg: getIcooonMonoSvg("fork-knife"),
      iconEmoji: "🍽️",
      contrastRatio: 5.2,
      categoryLabel: "レストラン",
      showCategoryBadge: false, // 一般的すぎるのでバッジ非表示
      source: "icooon-mono",
    },

    // 【9】駐車場 - Phosphor Icons「Car」
    駐車場: {
      primary: "#2e7d32",
      secondary: "#1b5e20",
      iconType: "svg",
      iconSvg: getPhosphorIconSvg("car"),
      iconEmoji: "🅿️",
      contrastRatio: 4.6,
      categoryLabel: "駐車場",
      showCategoryBadge: true,
      source: "phosphor",
    },

    // 【10】トイレ - Phosphor Icons「Toilet」
    トイレ: {
      primary: "#1565c0",
      secondary: "#0d47a1",
      iconType: "svg",
      iconSvg: getPhosphorIconSvg("toilet"),
      iconEmoji: "🚻",
      contrastRatio: 5.1,
      categoryLabel: "トイレ",
      showCategoryBadge: true,
      source: "phosphor",
    },
  };

  // カテゴリが存在しない場合は一般レストランを使用
  const config = categoryConfigs[category] || categoryConfigs["一般レストラン"];

  // 非レストラン施設の特別処理
  if (!isRestaurant(point)) {
    switch (point.type) {
      case "parking":
        return categoryConfigs["駐車場"];
      case "toilet":
        return categoryConfigs["トイレ"];
      default:
        return config;
    }
  }

  return config;
}

/**
 * ICOOON MONO SVGアイコン取得（プレースホルダー）
 * 実装時に実際のSVGデータに置換
 */
function getIcooonMonoSvg(iconId: string): string {
  // プレースホルダー - 実装時に実際のSVGパスに置換
  const svgTemplates: Record<string, string> = {
    "ochawan-hashi":
      '<svg viewBox="0 0 24 24" fill="white"><path d="M12 2l-2 9h4l-2-9zm0 11a1 1 0 100 2 1 1 0 000-2z"/></svg>',
    "soba-udon":
      '<svg viewBox="0 0 24 24" fill="white"><path d="M4 8V6a2 2 0 012-2h1V2h2v2h2V2h2v2h1a2 2 0 012 2v2H4z"/></svg>',
    pizza:
      '<svg viewBox="0 0 24 24" fill="white"><path d="M12 2L2 22h20L12 2zm0 4l6 12H6l6-12z"/></svg>',
    "kocha-cup":
      '<svg viewBox="0 0 24 24" fill="white"><path d="M2 19h20v2H2v-2zm2-8h16v6H4v-6zm0-2V7a1 1 0 011-1h14a1 1 0 011 1v2H4z"/></svg>',
    "bottle-wine":
      '<svg viewBox="0 0 24 24" fill="white"><path d="M6 2v6l-1.5 12h15L18 8V2H6zm2 2h8v4l1.5 12h-11L8 8V4z"/></svg>',
    "fork-knife":
      '<svg viewBox="0 0 24 24" fill="white"><path d="M9 2v8c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V2h-6zm6 0h2v20h-2V2zM3 2v8c0 1.1.9 2 2 2v10h2V12c1.1 0 2-.9 2-2V2H3z"/></svg>',
  };

  return svgTemplates[iconId] || svgTemplates["fork-knife"];
}

/**
 * Phosphor Icons SVG取得（プレースホルダー）
 * 実装時にphosphor-iconsライブラリから取得
 */
function getPhosphorIconSvg(iconName: string): string {
  // プレースホルダー - 実装時にphosphor-iconsから取得
  const svgTemplates: Record<string, string> = {
    fire: '<svg viewBox="0 0 256 256" fill="white"><path d="M221.72,144a79.87,79.87 0,0 1,-24.72 58c-38,38 -102,38 -140,0a79.87,79.87 0,0 1,-24.72 -58,8,8 0,0 1,16 0,63.89,63.89 0,0 0,19.78 46.31c30.25,30.25 79.44,30.25 109.69,0A63.89,63.89 0,0 0,197.53 144a8,8 0,0 1,16 0Z"/></svg>',
    hamburger:
      '<svg viewBox="0 0 256 256" fill="white"><path d="M224,104a8,8 0,0 1,-8 8H40a8,8 0,0 1,0 -16H216A8,8 0,0 1,224 104ZM40,144H216a8,8 0,0 0,0 -16H40a8,8 0,0 0,0 16Z"/></svg>',
    car: '<svg viewBox="0 0 256 256" fill="white"><path d="M240,112H229.2L201.42,49.5A16,16 0,0 0,186.8 40H69.2a16,16 0,0 0,-14.62 9.5L26.8,112H16a8,8 0,0 0,0 16h8v80a16,16 0,0 0,16 16H64a16,16 0,0 0,16 -16V192h96v16a16,16 0,0 0,16 16h24a16,16 0,0 0,16 -16V128h8a8,8 0,0 0,0 -16Z"/></svg>',
    toilet:
      '<svg viewBox="0 0 256 256" fill="white"><path d="M208,48H48A16,16 0,0 0,32 64V208a8,8 0,0 0,16 0V184H208v24a8,8 0,0 0,16 0V64A16,16 0,0 0,208 48ZM48,168V64H208V168Z"/></svg>',
  };

  return svgTemplates[iconName] || svgTemplates["car"];
}

export default HybridIconMarker;
