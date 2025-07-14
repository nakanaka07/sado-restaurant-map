// Google Analytics 4 設定
export const GA_MEASUREMENT_ID = import.meta.env
  .VITE_GA_MEASUREMENT_ID as string;

// Google Analytics gtag設定の型定義
interface GtagConfig {
  page_title?: string;
  page_location?: string;
  custom_map?: Record<string, string>;
  measurement_id?: string;
  [key: string]: unknown;
}

// gtag関数の型定義
declare global {
  interface Window {
    gtag: (
      command: "config" | "event",
      targetId: string,
      config?: GtagConfig
    ) => void;
    dataLayer: unknown[];
  }
}

// Google Analytics初期化
export const initGA = () => {
  if (!GA_MEASUREMENT_ID || typeof GA_MEASUREMENT_ID !== "string") {
    if (import.meta.env.DEV) {
      console.warn("GA_MEASUREMENT_ID が設定されていません");
    }
    return;
  }

  // 開発環境でのみ詳細ログ出力
  if (import.meta.env.DEV) {
    console.log("開発環境でのGoogle Analytics初期化:", GA_MEASUREMENT_ID);
  }

  // gtag script動的追加
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // gtag設定
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_title: "佐渡飲食店マップ",
    page_location: window.location.href,
    send_page_view: true,
    custom_map: {
      custom_parameter_1: "restaurant_id",
      custom_parameter_2: "search_query",
      custom_parameter_3: "filter_category",
    },
  });

  // 本番環境では測定IDを表示しない
  if (import.meta.env.DEV) {
    console.log("Google Analytics 4 初期化完了:", GA_MEASUREMENT_ID);
  } else {
    console.log("Google Analytics 4 初期化完了");
  }

  // 初期化完了を確認するためのテストイベント送信
  setTimeout(() => {
    trackPageView("アプリ初期化完了");
    trackEvent("app_initialized", {
      app_name: "佐渡飲食店マップ",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  }, 1000);
};

// カスタムイベント送信
export const trackEvent = (
  eventName: string,
  parameters: Record<string, unknown> = {}
) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) {
    if (import.meta.env.DEV) {
      console.warn("Google Analytics が初期化されていません");
    }
    return;
  }

  // イベント送信
  window.gtag("event", eventName, {
    ...parameters,
  } as GtagConfig);

  // 開発環境でのみ詳細ログ、本番環境では簡潔なログ
  if (import.meta.env.DEV) {
    console.log("GA Event (Dev):", eventName, parameters);
  } else {
    // 本番環境では特定のイベントのみ簡潔にログ出力
    if (eventName === "app_initialized" || eventName === "page_view") {
      console.log("GA Event:", eventName);
    }
  }
};

// 佐渡飲食店マップ専用イベント関数
export const trackRestaurantClick = (restaurant: {
  id: string;
  name: string;
  category: string;
  priceRange: string;
}) => {
  trackEvent("restaurant_click", {
    restaurant_id: restaurant.id,
    restaurant_name: restaurant.name,
    restaurant_category: restaurant.category,
    price_range: restaurant.priceRange,
    event_category: "restaurant_interaction",
  });
};

export const trackSearch = (query: string, resultCount: number) => {
  trackEvent("search", {
    search_term: query,
    result_count: resultCount,
    event_category: "search_interaction",
  });
};

export const trackFilter = (filterType: string, filterValue: string) => {
  trackEvent("filter_applied", {
    filter_type: filterType,
    filter_value: filterValue,
    event_category: "filter_interaction",
  });
};

export const trackMapInteraction = (
  action: "zoom" | "pan" | "marker_click"
) => {
  trackEvent("map_interaction", {
    interaction_type: action,
    event_category: "map_usage",
  });
};

// PWA関連追跡
export const trackPWAUsage = (action: "install" | "standalone_mode") => {
  trackEvent("pwa_usage", {
    pwa_action: action,
    event_category: "pwa_interaction",
  });
};

// ページビュー追跡（SPA対応）
export const trackPageView = (pageName: string) => {
  trackEvent("page_view", {
    page_title: pageName,
    page_location: window.location.href,
    event_category: "navigation",
  });
};
