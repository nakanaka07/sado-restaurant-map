/**
 * Google Maps URL生成関連のユーティリティ関数
 * 各種Google MapsリンクやAPIリクエストURL生成に使用
 */

import type { LatLngLiteral } from "@/types";

/**
 * Google Maps公式ページのURLを生成
 */
export function generateGoogleMapsUrl(
  name: string,
  coordinates: LatLngLiteral,
  options: {
    mode?: "search" | "directions" | "streetview";
    zoom?: number;
    placeId?: string;
  } = {}
): string {
  const { mode = "search", zoom = 17, placeId } = options;
  const { lat, lng } = coordinates;

  switch (mode) {
    case "search": {
      if (placeId) {
        return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
      } else {
        const query = encodeURIComponent(`${name} ${lat},${lng}`);
        return `https://www.google.com/maps/search/${query}/@${lat},${lng},${zoom}z`;
      }
    }

    case "directions": {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${placeId || ""}`;
    }

    case "streetview": {
      return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}&heading=0&pitch=0`;
    }

    default: {
      const defaultQuery = encodeURIComponent(name);
      return `https://www.google.com/maps/search/${defaultQuery}/@${lat},${lng},${zoom}z`;
    }
  }
}

/**
 * Google Maps埋め込み用のURLを生成
 */
export function generateGoogleMapsEmbedUrl(
  coordinates: LatLngLiteral,
  options: {
    zoom?: number;
    mode?: "place" | "view" | "directions" | "search";
    query?: string;
    apiKey?: string;
  } = {}
): string {
  const { zoom = 15, mode = "place", query = "", apiKey } = options;
  const { lat, lng } = coordinates;

  const baseUrl = "https://www.google.com/maps/embed/v1/";
  const params = new URLSearchParams();

  if (apiKey) {
    params.append("key", apiKey);
  }

  params.append("zoom", zoom.toString());

  const coordString = `${lat},${lng}`;

  switch (mode) {
    case "place":
      params.append("q", query || coordString);
      return `${baseUrl}place?${params.toString()}`;

    case "view":
      params.append("center", coordString);
      return `${baseUrl}view?${params.toString()}`;

    case "directions":
      params.append("destination", coordString);
      return `${baseUrl}directions?${params.toString()}`;

    case "search":
      params.append("q", query || coordString);
      return `${baseUrl}search?${params.toString()}`;

    default:
      params.append("q", coordString);
      return `${baseUrl}place?${params.toString()}`;
  }
}

/**
 * モバイル用Google Mapsアプリのディープリンクを生成
 */
export function generateMobileGoogleMapsUrl(
  coordinates: LatLngLiteral,
  options: {
    mode?: "navigate" | "search" | "display";
    query?: string;
  } = {}
): {
  ios: string;
  android: string;
  fallback: string;
} {
  const { mode = "display", query = "" } = options;
  const { lat, lng } = coordinates;
  const coordinateString = `${lat},${lng}`;
  const searchQuery = query || coordinateString;

  let iosUrl: string;
  let androidUrl: string;

  switch (mode) {
    case "navigate":
      iosUrl = `comgooglemaps://?daddr=${coordinateString}&directionsmode=driving`;
      androidUrl = `google.navigation:q=${coordinateString}&mode=d`;
      break;

    case "search":
      iosUrl = `comgooglemaps://?q=${searchQuery}`;
      androidUrl = `geo:0,0?q=${searchQuery}`;
      break;

    case "display":
    default:
      iosUrl = `comgooglemaps://?center=${coordinateString}&zoom=17`;
      androidUrl = `geo:${coordinateString}?z=17`;
      break;
  }

  const fallbackUrl = generateGoogleMapsUrl(query, coordinates);

  return {
    ios: iosUrl,
    android: androidUrl,
    fallback: fallbackUrl,
  };
}

/**
 * ルート案内用URLを生成
 */
export function generateRouteUrl(
  destination: LatLngLiteral,
  options: {
    origin?: LatLngLiteral;
    mode?: "driving" | "walking" | "transit" | "bicycling";
    avoidTolls?: boolean;
    avoidHighways?: boolean;
  } = {}
): string {
  const {
    origin,
    mode = "driving",
    avoidTolls = false,
    avoidHighways = false,
  } = options;

  const params = new URLSearchParams();
  params.append("api", "1");

  const destinationCoords = `${destination.lat},${destination.lng}`;
  params.append("destination", destinationCoords);

  if (origin) {
    const originCoords = `${origin.lat},${origin.lng}`;
    params.append("origin", originCoords);
  }

  params.append("travelmode", mode);

  if (avoidTolls) {
    params.append("avoid", "tolls");
  }

  if (avoidHighways) {
    const avoid = params.get("avoid");
    if (avoid) {
      params.set("avoid", `${avoid}|highways`);
    } else {
      params.append("avoid", "highways");
    }
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Place IDからGoogle Maps URLを生成
 */
export function generatePlaceUrl(
  placeId: string,
  options: {
    mode?: "details" | "reviews" | "photos";
  } = {}
): string {
  const { mode = "details" } = options;

  const baseUrl = "https://www.google.com/maps/place/";
  const params = new URLSearchParams();
  params.append("place_id", placeId);

  switch (mode) {
    case "reviews":
      params.append("tab", "reviews");
      break;

    case "photos":
      params.append("tab", "photos");
      break;

    case "details":
    default:
      // デフォルトは詳細表示（追加パラメータなし）
      break;
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * 電話番号から通話用URLを生成
 */
export function generatePhoneUrl(phoneNumber: string): string {
  // 電話番号の正規化（ハイフン、スペース、括弧を削除）
  const cleanedPhone = phoneNumber.replace(/[-\s()]/g, "");
  return `tel:${cleanedPhone}`;
}

/**
 * ウェブサイトURLの正規化
 */
export function normalizeWebsiteUrl(url: string): string {
  if (!url) return "";

  // プロトコルがない場合はhttpsを追加
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }

  return url;
}

/**
 * URLが有効かどうかをチェック
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Google Maps共有URLからPlace IDを抽出
 */
export function extractPlaceIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // place_idパラメータから直接取得
    const placeIdParam = urlObj.searchParams.get("place_id");
    if (placeIdParam) {
      return placeIdParam;
    }

    // URL パスから抽出を試行
    const pathMatch = url.match(/\/place\/.*?\/.*?([A-Za-z0-9_-]{27})/);
    if (pathMatch) {
      return pathMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}
