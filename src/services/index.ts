/**
 * @fileoverview Services barrel export
 * 外部サービス・API通信モジュールの統一エクスポート
 */

// Sheets Service
export {
  SheetsApiError,
  checkDataFreshness,
  fetchAllMapPoints,
  fetchParkingsFromSheets,
  fetchRestaurantsFromSheets,
  fetchToiletsFromSheets,
  type SheetRestaurantData,
} from "./sheets/sheetsService";

// Abstract Services (Phase C2: Dependency Inversion)
export {
  AbstractDataService,
  MapDataService,
  ParkingService,
  RestaurantService,
  ServiceFactory,
  ToiletService,
} from "./abstractions/AbstractDataService";

// Re-export types for convenience
export type { SheetsApiConfig, SheetsApiResponse } from "@/types";
