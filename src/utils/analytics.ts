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
    console.warn("GA_MEASUREMENT_ID が設定されていません");
    return;
  }

  // 本番環境以外では初期化しない（オプション）
  if (import.meta.env.DEV) {
    console.log("開発環境のため Google Analytics は無効化されています");
    return;
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
    custom_map: {
      custom_parameter_1: "restaurant_id",
      custom_parameter_2: "search_query",
      custom_parameter_3: "filter_category",
    },
  });

  console.log("Google Analytics 4 初期化完了:", GA_MEASUREMENT_ID);
};

// カスタムイベント送信
export const trackEvent = (
  eventName: string,
  parameters: Record<string, unknown> = {}
) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;

  // 開発環境ではコンソールログのみ
  if (import.meta.env.DEV) {
    console.log("GA Event (Dev):", eventName, parameters);
    return;
  }

  window.gtag("event", eventName, {
    measurement_id: GA_MEASUREMENT_ID,
    ...parameters,
  } as GtagConfig);
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
