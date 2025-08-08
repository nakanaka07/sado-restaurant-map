/**
 * 佐渡飲食店マップ - 型定義統合エクスポート
 * Barrel Export Pattern - すべての型定義への統一アクセスポイント
 */

// ==============================
// 基盤・共通型
// ==============================
export type {
  LatLngLiteral,
  MapPointType,
  SadoDistrict,
  OpeningHours,
  AsyncState,
  GeolocationState,
  PromiseState,
} from "./core.types";

// ==============================
// インターフェース分離 (Phase C2)
// ==============================
export type {
  IDataSource,
  IRestaurantDataSource,
  IMapPointProvider,
  IFilterStateManager,
  IMapStateManager,
  IAnalyticsEvent,
  IAnalyticsProvider,
  IValidationResult,
  IValidator,
  IRestaurantValidator,
  IErrorHandler,
  ICacheProvider,
  IMapPointFactory,
  IConfigProvider,
  ITypeGuard,
  IUtility,
} from "./interfaces.types";

// ==============================
// 飲食店・マップポイント関連型
// ==============================
export type {
  CuisineType,
  PriceRange,
  Restaurant,
  Parking,
  Toilet,
  MapPoint,
  ExtendedMapFilters,
} from "./restaurant.types";

// ==============================
// Google Maps関連型
// ==============================
export type {
  MarkerState,
  CustomMarkerProps,
  MapSettings,
  AdvancedMarkerConfig,
  MapControlOptions,
  MapStyleConfig,
  WebGLOverlayOptions,
  Map3DSettings,
} from "./map.types";

// ==============================
// API・サービス関連型
// ==============================
export type {
  SheetsApiResponse,
  SheetsApiError,
  SheetsApiConfig,
  ApiError,
  ApiRequestOptions,
  ApiResponse,
  CacheConfig,
  DataSourceConfig,
  BatchConfig,
  PlacesApiConfig,
  PlacesSearchRequest,
  PlacesApiResponse,
} from "./api.types";

// ==============================
// UI・コンポーネント関連型
// ==============================
export type {
  Theme,
  ViewMode,
  SortOrder,
  UIState,
  MapFilters,
  SearchResultConfig,
  BaseComponentProps,
  ButtonProps,
  ModalProps,
  FormFieldProps,
  AccessibilityConfig,
  FocusManagementConfig,
  KeyboardNavConfig,
  AnimationConfig,
  TransitionConfig,
  ViewTransitionConfig,
  BreakpointConfig,
  ResponsiveConfig,
  NotificationType,
  NotificationConfig,
} from "./ui.types";

// ==============================
// アプリケーション状態関連型
// ==============================
export type {
  AppState,
  InitialAppState,
  AppAction,
  AppDispatch,
  AppContextValue,
  PersistedSettings,
  ErrorType,
  StructuredError,
  ErrorState,
  AsyncOperationType,
  AsyncOperationState,
  UserPreferences,
} from "./app.types";

export { LOCAL_STORAGE_KEYS } from "./app.types";

// ==============================
// 定数・設定の再エクスポート
// ==============================

/** 型定義バージョン（互換性チェック用） */
export const TYPE_DEFINITIONS_VERSION = "2.0.0" as const;
