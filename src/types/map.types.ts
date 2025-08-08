/**
 * 佐渡飲食店マップ - Google Maps関連型定義
 * Advanced Markers v2 + React Google Maps対応
 */

import type { LatLngLiteral } from "./core.types";
import type { Restaurant } from "./restaurant.types";

// ==============================
// Google Maps 関連の型定義
// ==============================

/** マーカーの状態 */
export type MarkerState = "default" | "selected" | "highlighted";

/** カスタムマーカーのプロパティ */
export interface CustomMarkerProps {
  readonly restaurant: Restaurant;
  readonly state: MarkerState;
  readonly onClick: (restaurant: Restaurant) => void;
  readonly onHover?: (restaurant: Restaurant | null) => void;
}

/** 地図の表示設定 */
export interface MapSettings {
  readonly center: LatLngLiteral;
  readonly zoom: number;
  readonly mapTypeId: google.maps.MapTypeId;
  readonly showTraffic: boolean;
  readonly showTransit: boolean;
}

/** Advanced Markers v2 関連型 */
export interface AdvancedMarkerConfig {
  readonly position: LatLngLiteral;
  readonly title?: string;
  readonly content?: HTMLElement | google.maps.marker.PinElement;
  readonly gmpDraggable?: boolean;
  readonly gmpClickable?: boolean;
  readonly zIndex?: number;
}

/** 地図制御オプション */
export interface MapControlOptions {
  readonly disableDefaultUI?: boolean;
  readonly zoomControl?: boolean;
  readonly mapTypeControl?: boolean;
  readonly scaleControl?: boolean;
  readonly streetViewControl?: boolean;
  readonly rotateControl?: boolean;
  readonly fullscreenControl?: boolean;
}

/** 地図スタイル設定 */
export interface MapStyleConfig {
  readonly styles?: google.maps.MapTypeStyle[];
  readonly disableDoubleClickZoom?: boolean;
  readonly draggable?: boolean;
  readonly keyboardShortcuts?: boolean;
  readonly scrollwheel?: boolean;
}

/** WebGL オーバーレイ関連型 */
export interface WebGLOverlayOptions {
  readonly anchor: LatLngLiteral;
  readonly altitude?: number;
  readonly altitudeMode?: "ABSOLUTE" | "RELATIVE_TO_GROUND" | "CLAMP_TO_GROUND";
}

/** 3D マップ関連設定 */
export interface Map3DSettings {
  readonly tilt?: number;
  readonly heading?: number;
  readonly altitude?: number;
  readonly enableCloseGesture?: boolean;
}
