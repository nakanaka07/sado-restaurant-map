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
  // 環境変数の確認
  if (
    !GA_MEASUREMENT_ID ||
    typeof GA_MEASUREMENT_ID !== "string" ||
    GA_MEASUREMENT_ID === "undefined"
  ) {
    if (import.meta.env.DEV) {
      console.warn(
        "GA_MEASUREMENT_ID が設定されていません:",
        GA_MEASUREMENT_ID
      );
    } else {
      console.warn("Google Analytics: 測定IDが未設定");
    }
    return;
  }

  // 測定IDの形式確認（G- で始まるかチェック）
  if (!GA_MEASUREMENT_ID.startsWith("G-")) {
    console.warn("Google Analytics: 無効な測定ID形式:", GA_MEASUREMENT_ID);
    return;
  }

  // 開発環境でのみ詳細ログ出力
  if (import.meta.env.DEV) {
    console.log("開発環境でのGoogle Analytics初期化:", GA_MEASUREMENT_ID);
  } else {
    console.log("Google Analytics 初期化開始");
  }

  // gtag script動的追加
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.onload = () => {
    console.log("Google Analytics スクリプト読み込み完了");
  };
  script.onerror = () => {
    console.error("Google Analytics スクリプト読み込み失敗");
  };
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
    // カスタムパラメータの削除（Google Analytics 4では不要）
  });

  // 本番環境では測定IDを表示しない
  if (import.meta.env.DEV) {
    console.log("Google Analytics 4 初期化完了:", GA_MEASUREMENT_ID);
  } else {
    console.log("Google Analytics 4 初期化完了");
  }

  // 初期化確認用のテストイベント（遅延して送信）
  setTimeout(() => {
    trackPageView("アプリ初期化完了");
    trackEvent("app_initialized", {
      app_name: "佐渡飲食店マップ",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
    });
  }, 2000); // 2秒後に送信して確実に初期化を完了
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

  try {
    // イベント送信
    window.gtag("event", eventName, {
      ...parameters,
    } as GtagConfig);

    // 開発環境でのみ詳細ログ、本番環境では簡潔なログ
    if (import.meta.env.DEV) {
      console.log("GA Event (Dev):", eventName, parameters);
    } else {
      // 本番環境では重要なイベントのみ簡潔にログ出力
      if (
        eventName === "app_initialized" ||
        eventName === "page_view" ||
        eventName === "restaurant_click" ||
        eventName === "search" ||
        eventName === "filter_applied"
      ) {
        console.log("GA Event:", eventName);
      }
    }
  } catch (error) {
    console.error("Google Analytics イベント送信エラー:", error);
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

// デバッグ用：Google Analytics状態確認
export const checkGAStatus = () => {
  const status = {
    measurementId: GA_MEASUREMENT_ID,
    measurementIdValid: GA_MEASUREMENT_ID && GA_MEASUREMENT_ID.startsWith("G-"),
    gtagLoaded: typeof window !== "undefined" && !!window.gtag,
    dataLayerExists: typeof window !== "undefined" && !!window.dataLayer,
    environment: import.meta.env.MODE,
  };

  console.log("Google Analytics Status:", status);
  return status;
};

// デバッグ用：強制初期化確認
export const debugGA = () => {
  const status = checkGAStatus();

  if (status.gtagLoaded) {
    // テストイベント送信
    trackEvent("debug_test", {
      timestamp: new Date().toISOString(),
      test_message: "Google Analytics Debug Test",
    });
    console.log("Debug test event sent");
  } else {
    console.warn("Google Analytics not properly loaded");
  }

  return status;
};

// 🔧 追加: リアルタイム診断機能
export const runGADiagnostics = () => {
  console.log("🔍 Google Analytics 診断開始...");

  const diagnostics = {
    // 基本設定チェック
    measurementId: GA_MEASUREMENT_ID,
    measurementIdFormat: GA_MEASUREMENT_ID?.startsWith("G-")
      ? "✅ 正常"
      : "❌ 無効",
    environment: import.meta.env.MODE,

    // スクリプト読み込みチェック
    gtagScriptExists: !!document.querySelector(
      'script[src*="googletagmanager.com/gtag/js"]'
    ),
    gtagFunctionExists:
      typeof window !== "undefined" && typeof window.gtag === "function",
    dataLayerExists:
      typeof window !== "undefined" && Array.isArray(window.dataLayer),

    // ネットワーク接続チェック
    isOnline: navigator.onLine,
    protocol: window.location.protocol,
    httpsRequired:
      window.location.protocol === "https:"
        ? "✅ HTTPS"
        : "⚠️ HTTP (本番では必須)",

    // ブラウザ設定チェック
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === "1" ? "⚠️ DNT有効" : "✅ 追跡許可",

    // タイミング情報
    timestamp: new Date().toISOString(),
    pageLoadTime: performance.now(),
  };

  console.table(diagnostics);

  // 問題がある場合の推奨アクション
  const issues = [];
  if (!diagnostics.measurementId) issues.push("❌ 測定IDが未設定");
  if (!diagnostics.gtagFunctionExists)
    issues.push("❌ gtag関数が読み込まれていません");
  if (!diagnostics.isOnline) issues.push("⚠️ オフライン状態");
  if (diagnostics.doNotTrack === "⚠️ DNT有効")
    issues.push("⚠️ Do Not Track設定が有効");

  if (issues.length > 0) {
    console.warn("🚨 検出された問題:", issues);
  } else {
    console.log("✅ 診断完了: Google Analytics は正常に動作可能です");
  }

  return diagnostics;
};

// 🧪 追加: 強制テストイベント送信
export const sendTestEvents = () => {
  console.log("🧪 テストイベント送信開始...");

  const testEvents = [
    { name: "test_app_start", data: { test_type: "initialization" } },
    {
      name: "test_search",
      data: { search_term: "テスト検索", result_count: 5 },
    },
    {
      name: "test_filter",
      data: { filter_type: "cuisine", filter_value: "寿司" },
    },
    {
      name: "test_restaurant_click",
      data: { restaurant_id: "test-001", restaurant_name: "テスト店舗" },
    },
    {
      name: "test_map_interaction",
      data: { interaction_type: "marker_click" },
    },
  ];

  testEvents.forEach((event, index) => {
    setTimeout(() => {
      trackEvent(event.name, event.data);
      console.log(
        `✅ テストイベント ${index + 1}/${testEvents.length} 送信:`,
        event.name
      );
    }, index * 1000); // 1秒間隔で送信
  });

  console.log(
    "🎯 テストイベント送信完了！Google Analytics リアルタイムレポートで確認してください"
  );
};

// 🔄 追加: 自動診断・修復機能
export const autoFixGA = () => {
  console.log("🔧 Google Analytics 自動修復開始...");

  const diagnostics = runGADiagnostics();

  // 問題の自動修復を試行
  if (!diagnostics.gtagFunctionExists && diagnostics.measurementId) {
    console.log("🔧 gtag関数が存在しません。再初期化を試行...");

    // 既存のスクリプトを削除
    const existingScript = document.querySelector(
      'script[src*="googletagmanager.com/gtag/js"]'
    );
    if (existingScript) {
      existingScript.remove();
    }

    // 再初期化
    setTimeout(() => {
      initGA();
      console.log("🔄 Google Analytics 再初期化完了");
    }, 1000);
  }

  return diagnostics;
};

// 🎯 追加: Window オブジェクトにデバッグ関数を公開（開発環境のみ）
declare global {
  interface Window {
    gaDebug?: {
      runDiagnostics: typeof runGADiagnostics;
      sendTestEvents: typeof sendTestEvents;
      autoFix: typeof autoFixGA;
      checkStatus: typeof checkGAStatus;
      forceInit: typeof initGA;
    };
  }
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  window.gaDebug = {
    runDiagnostics: runGADiagnostics,
    sendTestEvents: sendTestEvents,
    autoFix: autoFixGA,
    checkStatus: checkGAStatus,
    forceInit: initGA,
  };

  console.log(
    "🛠️ Google Analytics デバッグツールを window.gaDebug で利用可能です"
  );
  console.log("使用例:");
  console.log("  window.gaDebug.runDiagnostics() - 診断実行");
  console.log("  window.gaDebug.sendTestEvents() - テストイベント送信");
  console.log("  window.gaDebug.autoFix() - 自動修復実行");
}
