/**
 * 佐渡飲食店マップ - 型定義統合エクスポート
 * Barrel Export Pattern - すべての型定義への統一アクセスポイント
 */

// ==============================
// 基盤・共通型
// ==============================
export type {
  AsyncState,
  GeolocationState,
  LatLngLiteral,
  MapPointType,
  OpeningHours,
  PromiseState,
  SadoDistrict,
} from "./core.types";

// ==============================
// インターフェース分離 (Phase C2)
// ==============================
export type {
  IAnalyticsEvent,
  IAnalyticsProvider,
  ICacheProvider,
  IConfigProvider,
  IDataSource,
  IErrorHandler,
  IFilterStateManager,
  IMapPointFactory,
  IMapPointProvider,
  IMapStateManager,
  IRestaurantDataSource,
  IRestaurantValidator,
  ITypeGuard,
  IUtility,
  IValidationResult,
  IValidator,
} from "./interfaces.types";

// ==============================
// 飲食店・マップポイント関連型
// ==============================
export type {
  CuisineType,
  DetailedOpeningHours,
  ExtendedMapFilters,
  MapPoint,
  Parking,
  PriceRange,
  Restaurant,
  TimeRange,
  Toilet,
} from "./restaurant.types";

export { BusinessStatus, RestaurantCategory } from "./restaurant.types";

// ==============================
// Google Maps関連型
// ==============================
export type {
  AdvancedMarkerConfig,
  CustomMarkerProps,
  Map3DSettings,
  MapControlOptions,
  MapSettings,
  MapStyleConfig,
  MarkerState,
  WebGLOverlayOptions,
} from "./map.types";

// ==============================
// API・サービス関連型
// ==============================
export type {
  ApiError,
  ApiRequestOptions,
  ApiResponse,
  BatchConfig,
  CacheConfig,
  DataSourceConfig,
  PlacesApiConfig,
  PlacesApiResponse,
  PlacesSearchRequest,
  SheetsApiConfig,
  SheetsApiError,
  SheetsApiResponse,
} from "./api.types";

// ==============================
// UI・コンポーネント関連型
// ==============================
export type {
  AccessibilityConfig,
  AnimationConfig,
  BaseComponentProps,
  BreakpointConfig,
  ButtonProps,
  FocusManagementConfig,
  FormFieldProps,
  KeyboardNavConfig,
  MapFilters,
  ModalProps,
  NotificationConfig,
  NotificationType,
  ResponsiveConfig,
  SearchResultConfig,
  SortOrder,
  Theme,
  TransitionConfig,
  UIState,
  ViewMode,
  ViewTransitionConfig,
} from "./ui.types";

// ==============================
// モーダルフィルター関連型 (新規)
// ==============================
export type {
  CompactModalFilterProps,
  FilterAction,
  FilterModalProps,
  FilterTriggerButtonProps,
  ModalFilterState,
  UseModalFilterResult,
} from "./modalFilter.types";

export {
  FilterActionType,
  FilterDisplayMode,
  INITIAL_MODAL_FILTER_STATE,
  ModalState,
  countActiveFilters,
  isValidFilterAction,
  isValidFilterState,
  isValidModalState,
} from "./modalFilter.types";

// ==============================
// アプリケーション状態関連型
// ==============================
export type {
  AppAction,
  AppContextValue,
  AppDispatch,
  AppState,
  AsyncOperationState,
  AsyncOperationType,
  ErrorState,
  ErrorType,
  InitialAppState,
  PersistedSettings,
  StructuredError,
  UserPreferences,
} from "./app.types";

export { LOCAL_STORAGE_KEYS } from "./app.types";

// ==============================
// 定数・設定の再エクスポート
// ==============================

/** 型定義バージョン（互換性チェック用） */
export const TYPE_DEFINITIONS_VERSION = "2.0.0" as const;
