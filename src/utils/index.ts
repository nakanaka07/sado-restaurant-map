/**
 * Utils モジュールの統一エクスポート
 *
 * @fileoverview 各ユーティリティモジュールをまとめてエクスポートする
 * @version 1.0.0
 */

// Google Analytics関連
export {
  autoFixGA,
  checkGAStatus,
  debugGA,
  initGA,
  runGADiagnostics,
  sendTestEvents,
  trackEvent,
  trackFilter,
  trackMapInteraction,
  trackPWAUsage,
  trackPageView,
  trackRestaurantClick,
  trackSearch,
} from "./analytics";

// 地区判定関連
export {
  getAllDistricts,
  getDistrictFromAddress,
  isValidDistrict,
  normalizeDistrict,
} from "./districtUtils";

// バリデーション関連
export {
  createValidationError,
  isArray,
  isCuisineType,
  isLatLngLiteral,
  isNumber,
  isObject,
  isPriceRange,
  isRestaurant,
  isRestaurantArray,
  isSadoDistrict,
  isString,
  isValidApiKey,
  isValidSearchQuery,
  sanitizeInput,
  validateRestaurant,
  type ValidationError,
} from "./lightValidation";

// セキュリティ関連
export {
  SecureStorage,
  apiRateLimiter,
  checkSecurityHeaders,
  escapeHtml,
  generateCSRFToken,
  generateNonce,
  getSecureEnvVar,
  isSecureUrl,
  maskApiKey,
  safeJsonParse,
  sanitizeUserInput,
  searchRateLimiter,
  secureFetch,
  stripHtml,
  validateApiKey,
} from "./securityUtils";

// ログフィルタリング関連
export {
  disableWorkboxLogs,
  default as initializeDevLogging,
  setupLogFiltering,
} from "./logFilter";

// 営業時間・ビジネスロジック関連
export {
  calculateBusinessStatus,
  formatBusinessHoursForDisplay,
  generateGoogleMapsUrl as generateBusinessGoogleMapsUrl,
  mapCategoryToCuisineType,
  organizeDetailedHours,
} from "./businessHours";

// 日付・時間フォーマット関連
export {
  formatDateForDisplay,
  formatDayShort,
  formatOpeningHours,
  formatRelativeTime,
  getCurrentTimeInMinutes,
  isDataFresh,
} from "./dateUtils";

// Google Maps URL生成関連
export {
  extractPlaceIdFromUrl,
  generateGoogleMapsEmbedUrl,
  generateGoogleMapsUrl,
  generateMobileGoogleMapsUrl,
  generatePhoneUrl,
  generatePlaceUrl,
  generateRouteUrl,
  isValidUrl,
  normalizeWebsiteUrl,
} from "./googleMapsUtils";
