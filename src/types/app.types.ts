/**
 * 佐渡飲食店マップ - アプリケーション状態型定義
 * Redux-like State Management + React 19対応
 */

import type { Restaurant } from "./restaurant.types";
import type { MapFilters } from "./ui.types";
import type { MapSettings } from "./map.types";
import type { Theme, ViewMode, SortOrder } from "./ui.types";

// ==============================
// アプリケーション状態
// ==============================

/** アプリの状態 */
export interface AppState {
  readonly restaurants: readonly Restaurant[];
  readonly selectedRestaurant: Restaurant | null;
  readonly filters: MapFilters;
  readonly mapSettings: MapSettings;
  readonly viewMode: ViewMode;
  readonly sortOrder: SortOrder;
  readonly theme: Theme;
  readonly isLoading: boolean;
  readonly error: string | null;
}

/** アプリの初期状態 */
export interface InitialAppState
  extends Omit<AppState, "restaurants" | "selectedRestaurant"> {
  readonly restaurants: readonly [];
  readonly selectedRestaurant: null;
}

// ==============================
// 状態変更アクション
// ==============================

/** アプリケーションアクション */
export type AppAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_RESTAURANTS"; payload: readonly Restaurant[] }
  | { type: "SELECT_RESTAURANT"; payload: Restaurant | null }
  | { type: "UPDATE_FILTERS"; payload: Partial<MapFilters> }
  | { type: "RESET_FILTERS" }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "SET_SORT_ORDER"; payload: SortOrder }
  | { type: "SET_THEME"; payload: Theme }
  | { type: "UPDATE_MAP_SETTINGS"; payload: Partial<MapSettings> };

/** 状態変更のディスパッチャー */
export type AppDispatch = (action: AppAction) => void;

// ==============================
// React Context関連
// ==============================

/** アプリケーションコンテキスト */
export interface AppContextValue {
  readonly state: AppState;
  readonly dispatch: AppDispatch;
  readonly actions: {
    readonly setLoading: (loading: boolean) => void;
    readonly setError: (error: string | null) => void;
    readonly setRestaurants: (restaurants: readonly Restaurant[]) => void;
    readonly selectRestaurant: (restaurant: Restaurant | null) => void;
    readonly updateFilters: (filters: Partial<MapFilters>) => void;
    readonly resetFilters: () => void;
    readonly setViewMode: (mode: ViewMode) => void;
    readonly setSortOrder: (order: SortOrder) => void;
    readonly setTheme: (theme: Theme) => void;
    readonly updateMapSettings: (settings: Partial<MapSettings>) => void;
  };
}

// ==============================
// ローカルストレージ関連
// ==============================

/** ローカルストレージに保存する設定 */
export interface PersistedSettings {
  readonly theme: Theme;
  readonly viewMode: ViewMode;
  readonly sortOrder: SortOrder;
  readonly lastFilters?: Partial<MapFilters>;
  readonly lastMapSettings?: Partial<MapSettings>;
  readonly version: string; // 設定のバージョン管理
}

/** ローカルストレージキー */
export const LOCAL_STORAGE_KEYS = {
  SETTINGS: "sado-restaurant-map-settings",
  CACHE: "sado-restaurant-map-cache",
  USER_PREFERENCES: "sado-restaurant-map-preferences",
} as const;

// ==============================
// エラー状態管理
// ==============================

/** エラーの種類 */
export type ErrorType =
  | "NETWORK_ERROR"
  | "API_ERROR"
  | "PERMISSION_ERROR"
  | "VALIDATION_ERROR"
  | "UNKNOWN_ERROR";

/** 構造化エラー情報 */
export interface StructuredError {
  readonly type: ErrorType;
  readonly message: string;
  readonly code?: string | number;
  readonly timestamp: string;
  readonly context?: Record<string, unknown>;
}

/** エラー状態 */
export interface ErrorState {
  readonly current: StructuredError | null;
  readonly history: readonly StructuredError[];
  readonly dismissed: readonly string[]; // エラーID
}

// ==============================
// 非同期操作状態
// ==============================

/** 非同期操作の種類 */
export type AsyncOperationType =
  | "FETCH_RESTAURANTS"
  | "FETCH_MAP_POINTS"
  | "SAVE_SETTINGS"
  | "LOAD_SETTINGS"
  | "GEOLOCATION";

/** 非同期操作状態 */
export interface AsyncOperationState {
  readonly operations: {
    readonly [K in AsyncOperationType]?: {
      readonly isLoading: boolean;
      readonly error: StructuredError | null;
      readonly lastSuccess?: string; // タイムスタンプ
    };
  };
}

// ==============================
// ユーザー設定・プリファレンス
// ==============================

/** ユーザー設定 */
export interface UserPreferences {
  readonly accessibility: {
    readonly highContrast: boolean;
    readonly reducedMotion: boolean;
    readonly screenReader: boolean;
  };
  readonly map: {
    readonly defaultZoom: number;
    readonly enableClustering: boolean;
    readonly showTraffic: boolean;
    readonly showTransit: boolean;
  };
  readonly ui: {
    readonly compactMode: boolean;
    readonly showTutorial: boolean;
    readonly language: "ja" | "en";
  };
  readonly notifications: {
    readonly enabled: boolean;
    readonly types: readonly string[];
  };
}
