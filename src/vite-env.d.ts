/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

// SVG アセット型定義
declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.svg?url" {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  // Google Maps API設定（必須）
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;

  // Google Sheets API設定（拡張機能用）
  readonly VITE_GOOGLE_SHEETS_API_KEY?: string;
  readonly VITE_SPREADSHEET_ID?: string;

  // アプリケーション設定（オプション）
  readonly VITE_APP_TITLE?: string;
  readonly VITE_APP_DESCRIPTION?: string;

  // 開発・デバッグ設定（オプション）
  readonly VITE_DEBUG_MODE?: string;
  readonly VITE_MOCK_DATA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
