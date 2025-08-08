/**
 * 佐渡飲食店マップ - API・サービス関連型定義
 * Google Sheets API v4 + REST API対応
 */

// ==============================
// Google Sheets API関連
// ==============================

/** Google Sheets APIのレスポンス */
export interface SheetsApiResponse {
  readonly range: string;
  readonly majorDimension: string;
  readonly values: readonly (readonly string[])[];
}

/** Google Sheets API エラー */
export interface SheetsApiError {
  readonly error: {
    readonly code: number;
    readonly message: string;
    readonly status: string;
    readonly details?: readonly {
      readonly "@type": string;
      readonly reason?: string;
      readonly domain?: string;
      readonly metadata?: Record<string, unknown>;
    }[];
  };
}

/** Google Sheets API リクエスト設定 */
export interface SheetsApiConfig {
  readonly spreadsheetId: string;
  readonly apiKey: string;
  readonly range: string;
  readonly majorDimension?: "ROWS" | "COLUMNS";
  readonly valueRenderOption?:
    | "FORMATTED_VALUE"
    | "UNFORMATTED_VALUE"
    | "FORMULA";
  readonly dateTimeRenderOption?: "SERIAL_NUMBER" | "FORMATTED_STRING";
}

// ==============================
// 汎用API関連
// ==============================

/** APIエラー */
export interface ApiError {
  readonly code: number;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp?: string;
  readonly requestId?: string;
}

/** API リクエストオプション */
export interface ApiRequestOptions {
  readonly timeout?: number;
  readonly retries?: number;
  readonly cache?: boolean;
  readonly signal?: AbortSignal;
}

/** APIレスポンス共通型 */
export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
  readonly meta?: {
    readonly timestamp: string;
    readonly version: string;
    readonly requestId: string;
  };
}

// ==============================
// データフェッチング関連
// ==============================

/** キャッシュ設定 */
export interface CacheConfig {
  readonly maxAge: number; // ミリ秒
  readonly staleWhileRevalidate: number; // ミリ秒
  readonly enabled: boolean;
}

/** データソース設定 */
export interface DataSourceConfig {
  readonly primary: "sheets" | "static" | "api";
  readonly fallback?: "sheets" | "static" | "api";
  readonly cache: CacheConfig;
}

/** バッチ処理設定 */
export interface BatchConfig {
  readonly batchSize: number;
  readonly concurrency: number;
  readonly delayMs: number;
}

// ==============================
// Places API関連 (Future)
// ==============================

/** Google Places API (New) v1 関連型 */
export interface PlacesApiConfig {
  readonly apiKey: string;
  readonly fields: readonly string[];
  readonly language?: string;
  readonly region?: string;
}

/** Places API検索リクエスト */
export interface PlacesSearchRequest {
  readonly query?: string;
  readonly location?: {
    readonly lat: number;
    readonly lng: number;
  };
  readonly radius?: number;
  readonly type?: string;
  readonly openNow?: boolean;
}

/** Places API レスポンス */
export interface PlacesApiResponse {
  readonly candidates: readonly {
    readonly place_id: string;
    readonly name: string;
    readonly rating?: number;
    readonly geometry: {
      readonly location: {
        readonly lat: number;
        readonly lng: number;
      };
    };
    readonly photos?: readonly {
      readonly photo_reference: string;
      readonly height: number;
      readonly width: number;
    }[];
  }[];
  readonly status: string;
}
