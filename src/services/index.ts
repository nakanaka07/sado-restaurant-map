/**
 * @fileoverview Services barrel export
 * 外部サービス・API通信モジュールの統一エクスポート
 */

// Sheets Service
export {
  fetchRestaurantsFromSheets,
  fetchParkingsFromSheets,
  fetchToiletsFromSheets,
  fetchAllMapPoints,
  checkDataFreshness,
  SheetsApiError,
  type SheetRestaurantData,
} from "./sheets/sheetsService";

// Abstract Services (Phase C2: Dependency Inversion)
export {
  AbstractDataService,
  RestaurantService,
  ParkingService,
  ToiletService,
  ServiceFactory,
  MapDataService,
} from "./abstractions/AbstractDataService";

// Re-export types for convenience
export type { SheetsApiConfig, SheetsApiResponse } from "@/types";
