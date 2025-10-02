import { AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import React, { useMemo } from "react";
import type { IcooonMarkerCategory } from "../../../types/icooonMarker.types";
import {
  MapPoint,
  Parking,
  Restaurant,
  Toilet,
} from "../../../types/restaurant.types";
import { CircularMarker } from "../markers/CircularMarker";
import { MapInfoWindow } from "./MapInfoWindow";

export interface CircularMarkerContainerProps {
  /** 表示するマップポイントの配列 */
  points: MapPoint[];
  /** マーカーのサイズ */
  markerSize?: "small" | "medium" | "large" | "xlarge";
  /** 表示するマーカータイプのフィルタ */
  visibleTypes?: Array<"restaurant" | "parking" | "toilet">;
  /** マーカークリック時のハンドラー */
  onPointClick?: (point: MapPoint) => void;
  /** InfoWindow表示状態 */
  showInfoWindow?: boolean;
  /** 現在選択されたポイント */
  selectedPoint?: MapPoint | null;
  /** InfoWindow閉じるハンドラー */
  onInfoWindowClose?: () => void;
}

/**
 * Type guards for MapPoint union type
 */
function isRestaurant(point: MapPoint): point is Restaurant {
  return point.type === "restaurant";
}

function isParking(point: MapPoint): point is Parking {
  return point.type === "parking";
}

function isToilet(point: MapPoint): point is Toilet {
  return point.type === "toilet";
}

/**
 * 各型に応じてアクセシビリティラベルを生成
 */
function getPointAriaLabel(point: MapPoint): string {
  if (isRestaurant(point)) {
    return `${point.name} - ${point.cuisineType}`;
  } else if (isParking(point)) {
    return `駐車場: ${point.name}`;
  } else if (isToilet(point)) {
    return `トイレ: ${point.name}`;
  }
  return "不明なポイント";
}

/**
 * 料理タイプ → ICOOON MONOカテゴリのマッピング
 * 既存のMapPointを新しいCircularMarkerカテゴリに変換
 */
function mapPointToIcooonCategory(point: MapPoint): IcooonMarkerCategory {
  // MapPointの型に応じて分岐
  if (isParking(point)) {
    return "parking";
  }

  if (isToilet(point)) {
    return "toilet";
  }

  // Restaurant型の場合、cuisineTypeでマッピング
  if (isRestaurant(point)) {
    const cuisineType = point.cuisineType;
    const mappingTable: Record<string, IcooonMarkerCategory> = {
      // 和食系
      日本料理: "japanese",
      寿司: "japanese",

      // 麺類系
      ラーメン: "noodles",
      "そば・うどん": "noodles",

      // 焼肉・グリル系
      "焼肉・焼鳥": "yakiniku",
      "ステーキ・洋食": "yakiniku",

      // 多国籍料理系
      中華: "international",
      イタリアン: "international",
      フレンチ: "international",
      "カレー・エスニック": "international",

      // カフェ・軽食系
      "カフェ・喫茶店": "cafe",
      "デザート・スイーツ": "cafe",

      // 居酒屋・バー系
      "バー・居酒屋": "izakaya",

      // ファストフード系
      ファストフード: "fastfood",
      "弁当・テイクアウト": "fastfood",

      // その他・一般
      レストラン: "general",
      その他: "general",
      海鮮: "general",
    };

    return mappingTable[cuisineType] || "general";
  }

  return "general";
}

/**
 * CircularMarkerContainer
 *
 * ICOOON MONO SVGアイコンを使用したマーカーを
 * Google Mapsに表示するためのコンテナコンポーネント
 */
export const CircularMarkerContainer: React.FC<
  CircularMarkerContainerProps
> = ({
  points,
  markerSize = "medium",
  visibleTypes = ["restaurant", "parking", "toilet"],
  onPointClick,
  showInfoWindow = false,
  selectedPoint = null,
  onInfoWindowClose,
}) => {
  // フィルタリングロジック
  const filteredPoints = useMemo(() => {
    return points.filter(point => visibleTypes.includes(point.type));
  }, [points, visibleTypes]);

  // InfoWindow閉じるハンドラー
  const handleInfoWindowClose = () => {
    onInfoWindowClose?.();
  };

  return (
    <>
      {filteredPoints.map(point => {
        const category = mapPointToIcooonCategory(point);

        const handleClick = () => {
          // デバッグ用ログ（開発時のみ）: 駐車場だけ InfoWindow が開かない問題調査
          if (import.meta.env.DEV) {
            console.debug("[CircularMarkerContainer] marker click", {
              id: point.id,
              type: point.type,
              name: point.name,
            });
          }
          onPointClick?.(point);
        };

        return (
          <AdvancedMarker
            key={point.id} // 安定したキー: index 依存を排除し再マウントによる state 喪失を防止
            position={point.coordinates}
            // AdvancedMarker 自体にもフォールバック onClick を付与（ボタンが何らかでイベント阻害された場合の保険）
            onClick={handleClick}
            style={{ cursor: "pointer" }}
          >
            <CircularMarker
              category={category}
              size={markerSize}
              ariaLabel={getPointAriaLabel(point)}
              onClick={handleClick}
            />
          </AdvancedMarker>
        );
      })}

      {showInfoWindow && selectedPoint && (
        <InfoWindow
          position={selectedPoint.coordinates}
          onCloseClick={handleInfoWindowClose}
        >
          <div>
            <MapInfoWindow point={selectedPoint} />
          </div>
        </InfoWindow>
      )}
    </>
  );
};
