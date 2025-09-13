/**
 * @fileoverview 最適化されたマーカーコンポーネント
 * パフォーマンスとメモリ効率を最優先に設計
 */

import type { Restaurant } from "@/types";
import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { memo, useCallback } from "react";
import { getMarkerColorByCuisine, getMarkerSizeByPrice } from "./utils";

interface OptimizedRestaurantMarkerProps {
  readonly restaurant: Restaurant;
  readonly onClick: (restaurant: Restaurant) => void;
}

/**
 * 最適化されたレストランマーカー
 * React.memo でレンダリング最適化
 */
export const OptimizedRestaurantMarker = memo<OptimizedRestaurantMarkerProps>(
  ({ restaurant, onClick }) => {
    // クリックハンドラーをメモ化
    const handleClick = useCallback(() => {
      onClick(restaurant);
    }, [onClick, restaurant]);

    // マーカーの視覚設定をメモ化
    const markerSettings = {
      background: getMarkerColorByCuisine(restaurant.cuisineType),
      scale: getMarkerSizeByPrice(restaurant.priceRange) / 35,
    };

    return (
      <AdvancedMarker
        position={restaurant.coordinates}
        title={restaurant.name}
        onClick={handleClick}
        zIndex={1}
      >
        <Pin
          background={markerSettings.background}
          borderColor="#fff"
          glyphColor="#fff"
          scale={markerSettings.scale}
        />
      </AdvancedMarker>
    );
  }
);

OptimizedRestaurantMarker.displayName = "OptimizedRestaurantMarker";
