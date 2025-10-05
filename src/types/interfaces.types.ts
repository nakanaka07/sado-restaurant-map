/**
 * @fileoverview Interface Segregation Principle implementations
 * インターフェース分離原則に基づく抽象化定義
 * Phase C2: モジュール結合度最適化
 */

import type { LatLngLiteral } from "./core.types";
import type { MapPoint, Restaurant } from "./restaurant.types";

// ==============================
// データアクセス抽象化
// ==============================

/**
 * データソース共通インターフェース
 */
export interface IDataSource<T> {
  /** データ取得 */
  fetch(): Promise<T[]>;
  /** データ検証 */
  validate(data: T[]): boolean;
  /** キャッシュクリア */
  clearCache(): void;
}

/**
 * 飲食店データソースインターフェース
 */
export interface IRestaurantDataSource extends IDataSource<Restaurant> {
  /** ID指定取得 */
  fetchById(id: string): Promise<Restaurant | null>;
  /** エリア指定取得 */
  fetchByArea(bounds: google.maps.LatLngBounds): Promise<Restaurant[]>;
}

/**
 * マップポイントプロバイダーインターフェース
 */
export interface IMapPointProvider {
  /** 全マップポイント取得 */
  getAllMapPoints(): Promise<MapPoint[]>;
  /** タイプ別取得 */
  getMapPointsByType(
    type: "restaurant" | "parking" | "toilet"
  ): Promise<MapPoint[]>;
  /** 位置ベース検索 */
  searchNearby(center: LatLngLiteral, radius: number): Promise<MapPoint[]>;
}

// ==============================
// UI状態管理抽象化
// ==============================

/**
 * フィルター状態管理インターフェース
 */
export interface IFilterStateManager<T> {
  /** フィルター状態 */
  readonly filters: T;
  /** フィルター更新 */
  updateFilter<K extends keyof T>(key: K, value: T[K]): void;
  /** フィルターリセット */
  resetFilters(): void;
  /** フィルター適用 */
  applyFilters<D>(data: D[]): D[];
}

/**
 * マップ状態管理インターフェース
 */
export interface IMapStateManager {
  /** 地図中心位置 */
  readonly center: LatLngLiteral;
  /** ズームレベル */
  readonly zoom: number;
  /** 選択されたマーカー */
  readonly selectedMarker: MapPoint | null;

  /** 中心位置更新 */
  setCenter(center: LatLngLiteral): void;
  /** ズーム更新 */
  setZoom(zoom: number): void;
  /** マーカー選択 */
  selectMarker(marker: MapPoint | null): void;
}

// ==============================
// バリデーション抽象化
// ==============================

/**
 * バリデーション結果
 */
export interface IValidationResult {
  /** 有効性 */
  readonly isValid: boolean;
  /** エラーメッセージ */
  readonly errors: string[];
  /** 警告メッセージ */
  readonly warnings: string[];
}

/**
 * バリデーターインターフェース
 */
export interface IValidator<T> {
  /** データ検証 */
  validate(data: T): IValidationResult;
  /** スキーマ検証 */
  validateSchema(data: unknown): data is T;
}

/**
 * 飲食店データバリデーター
 */
export interface IRestaurantValidator extends IValidator<Restaurant> {
  /** 座標検証 */
  validateCoordinates(lat: number, lng: number): boolean;
  /** 営業時間検証 */
  validateOpeningHours(hours: string): boolean;
}

// ==============================
// エラーハンドリング抽象化
// ==============================

/**
 * エラーハンドラーインターフェース
 */
export interface IErrorHandler {
  /** エラー処理 */
  handle(error: Error, context?: Record<string, unknown>): void;
  /** クリティカルエラー処理 */
  handleCritical(error: Error, context?: Record<string, unknown>): void;
  /** ネットワークエラー処理 */
  handleNetwork(error: Error, retry?: () => Promise<void>): void;
}

// ==============================
// キャッシュ管理抽象化
// ==============================

/**
 * キャッシュプロバイダーインターフェース
 */
export interface ICacheProvider<T> {
  /** データ取得 */
  get(key: string): Promise<T | null>;
  /** データ保存 */
  set(key: string, value: T, ttl?: number): Promise<void>;
  /** データ削除 */
  delete(key: string): Promise<void>;
  /** キャッシュクリア */
  clear(): Promise<void>;
}
