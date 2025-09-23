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
export const initGA = async (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      // 環境変数の確認
      if (
        !GA_MEASUREMENT_ID ||
        typeof GA_MEASUREMENT_ID !== "string" ||
        GA_MEASUREMENT_ID === "undefined"
      ) {
        // 開発環境でのみ詳細ログ出力
        if (import.meta.env.DEV) {
          console.warn(
            "GA_MEASUREMENT_ID が設定されていません",
            GA_MEASUREMENT_ID
          );
        }
        resolve(); // エラーではなく正常終了として扱う
        return;
      }

      // 測定IDの形式確認（G- で始まるかチェック）
      if (!GA_MEASUREMENT_ID.startsWith("G-")) {
        // 開発環境でのみ警告
        if (import.meta.env.DEV) {
          console.warn(
            "Google Analytics: 無効な測定ID形式:",
            GA_MEASUREMENT_ID
          );
        }
        resolve(); // エラーではなく正常終了として扱う
        return;
      }

      // 開発環境でのみ詳細ログ出力
      if (import.meta.env.DEV) {
        console.log("開発環境でのGoogle Analytics初期化:", GA_MEASUREMENT_ID);
      }
      // 本番環境では静粛に初期化

      // gtag script動的追加
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      script.onload = () => {
        if (import.meta.env.DEV) {
          console.log("Google Analytics スクリプト読み込み完了");
        }

        // gtag設定
        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag(...args: unknown[]) {
          window.dataLayer.push(args);
        };

        window.gtag("config", GA_MEASUREMENT_ID, {
          page_title: "佐渡飲食店マップ",
          page_location: window.location.href,
          send_page_view: true,
        });

        // 開発環境でのみ詳細ログ
        if (import.meta.env.DEV) {
          console.log("Google Analytics 4 初期化完了:", GA_MEASUREMENT_ID);
        }

        resolve();
      };
      script.onerror = () => {
        const error = new Error("Google Analytics スクリプト読み込み失敗");
        console.error(error.message);
        reject(error);
      };
      document.head.appendChild(script);

      // 初期化確認用のテストイベント（開発環境のみ）
      if (import.meta.env.DEV) {
        setTimeout(() => {
          trackPageView("アプリ初期化完了");
          trackEvent("app_initialized", {
            app_name: "佐渡飲食店マップ",
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            environment: import.meta.env.MODE,
          });
        }, 2000); // 2秒後に送信して確実に初期化を完了
      }
    } catch (error) {
      const initError =
        error instanceof Error
          ? error
          : new Error("Google Analytics 初期化エラー");
      console.error("Google Analytics 初期化エラー:", initError);
      reject(initError);
    }
  });
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

    // 開発環境でのみ詳細ログ、本番環境では重要イベントのみ
    if (import.meta.env.DEV) {
      console.log("GA Event:", eventName, parameters);
    }
    // 本番環境では静粛モード（ログ出力なし）
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

// デバッグ用：Google Analytics状態確認（開発環境限定）
export const checkGAStatus = async () => {
  if (!import.meta.env.DEV) {
    return { error: "開発環境でのみ利用可能" };
  }

  return new Promise<{
    measurementId: string;
    measurementIdValid: boolean | "";
    gtagLoaded: boolean;
    dataLayerExists: boolean;
    environment: string;
  }>(resolve => {
    const status = {
      measurementId: GA_MEASUREMENT_ID,
      measurementIdValid:
        GA_MEASUREMENT_ID && GA_MEASUREMENT_ID.startsWith("G-"),
      gtagLoaded: typeof window !== "undefined" && !!window.gtag,
      dataLayerExists: typeof window !== "undefined" && !!window.dataLayer,
      environment: import.meta.env.MODE,
    };

    console.log("Google Analytics Status:", status);
    resolve(status);
  });
};

// デバッグ用：強制初期化確認（開発環境限定）
export const debugGA = async () => {
  if (!import.meta.env.DEV) {
    console.warn("debugGA: 開発環境でのみ利用可能");
    return { error: "開発環境でのみ利用可能" };
  }

  const status = await checkGAStatus();

  if ("error" in status) {
    return status;
  }

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

// 🔧 リアルタイム診断機能（開発環境限定）
export const runGADiagnostics = () => {
  if (!import.meta.env.DEV) {
    console.warn("診断機能は開発環境でのみ利用可能");
    return { error: "開発環境でのみ利用可能" };
  }

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

    // 軽量化: 重い計算を削除
    isOnline: navigator.onLine,
    cookiesEnabled: navigator.cookieEnabled,

    // タイミング情報（軽量化）
    timestamp: new Date().toISOString(),
  };

  console.table(diagnostics);

  // 軽量化: 基本的な問題チェックのみ
  const issues = [];
  if (!diagnostics.measurementId) issues.push("❌ 測定IDが未設定");
  if (!diagnostics.gtagFunctionExists)
    issues.push("❌ gtag関数が読み込まれていません");
  if (!diagnostics.isOnline) issues.push("⚠️ オフライン状態");

  if (issues.length > 0) {
    console.warn("🚨 検出された問題:", issues);
  } else {
    console.log("✅ 診断完了: Google Analytics は正常に動作可能です");
  }

  return diagnostics;
};

// 🧪 強制テストイベント送信（開発環境限定・軽量化版）
export const sendTestEvents = () => {
  if (!import.meta.env.DEV) {
    console.warn("テストイベント機能は開発環境でのみ利用可能");
    return;
  }

  console.log("🧪 テストイベント送信開始...");

  // 軽量化: 必要最小限のテストイベントのみ
  const testEvents = [
    { name: "test_app_start", data: { test_type: "initialization" } },
    {
      name: "test_search",
      data: { search_term: "テスト検索", result_count: 5 },
    },
    {
      name: "test_restaurant_click",
      data: { restaurant_id: "test-001", restaurant_name: "テスト店舗" },
    },
  ];

  testEvents.forEach((event, index) => {
    setTimeout(() => {
      trackEvent(event.name, event.data);
      console.log(
        `✅ テストイベント ${index + 1}/${testEvents.length} 送信:`,
        event.name
      );
    }, index * 500); // 0.5秒間隔で送信（軽量化）
  });

  console.log(
    "🎯 テストイベント送信完了！Google Analytics リアルタイムレポートで確認してください"
  );
};

// 🔄 自動診断・修復機能（開発環境限定・軽量化版）
export const autoFixGA = () => {
  if (!import.meta.env.DEV) {
    console.warn("自動修復機能は開発環境でのみ利用可能");
    return { error: "開発環境でのみ利用可能" };
  }

  console.log("🔧 Google Analytics 自動修復開始...");

  const diagnostics = runGADiagnostics();

  // エラーハンドリング
  if ("error" in diagnostics) {
    return diagnostics;
  }

  // 軽量化: 基本的な問題の自動修復のみ
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
      void initGA()
        .then(() => {
          console.log("🔄 Google Analytics 再初期化完了");
        })
        .catch(error => {
          console.error("🔄 Google Analytics 再初期化失敗:", error);
        });
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
    "🛠️ 開発環境: window.gaDebug でGoogle Analyticsデバッグ機能を利用可能"
  );
}
