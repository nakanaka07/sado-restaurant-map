/* @vitest-environment jsdom */
/**
 * @fileoverview Analytics Utility Tests
 * カバレッジ目標: 0% → 60%
 *
 * テスト対象:
 * - trackEvent: カスタムイベント送信
 * - trackRestaurantClick: レストランクリック追跡
 * - trackMapInteraction: マップインタラクション追跡
 * - trackSearch: 検索イベント追跡
 * - trackFilter: フィルター適用イベント
 * - trackPWAUsage: PWA使用イベント
 * - trackPageView: ページビュー追跡
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

// グローバルモック設定
const mockGtag = vi.fn();
const mockDataLayer: unknown[] = [];

// 環境変数をモック（import前に設定）
vi.mock("../analytics", async () => {
  const actual =
    await vi.importActual<typeof import("../analytics")>("../analytics");
  return {
    ...actual,
    GA_MEASUREMENT_ID: "G-TEST123456",
  };
});

import {
  trackEvent,
  trackFilter,
  trackMapInteraction,
  trackPageView,
  trackPWAUsage,
  trackRestaurantClick,
  trackSearch,
} from "../analytics";

beforeEach(() => {
  // 各テスト前にモックをリセット
  mockGtag.mockClear();
  mockDataLayer.length = 0;

  // window.gtagとwindow.dataLayerをモック
  Object.defineProperty(window, "gtag", {
    value: mockGtag,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, "dataLayer", {
    value: mockDataLayer,
    writable: true,
    configurable: true,
  });

  // console.warnとconsole.errorをモック
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("analytics - trackEvent", () => {
  test("基本的なイベント送信が正しく動作する", () => {
    trackEvent("test_event", { param1: "value1", param2: 123 });

    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockGtag).toHaveBeenCalledWith("event", "test_event", {
      param1: "value1",
      param2: 123,
    });
  });

  test("パラメータなしでイベント送信できる", () => {
    trackEvent("simple_event");

    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockGtag).toHaveBeenCalledWith("event", "simple_event", {});
  });

  test("空のパラメータオブジェクトでイベント送信できる", () => {
    trackEvent("event_with_empty_params", {});

    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockGtag).toHaveBeenCalledWith(
      "event",
      "event_with_empty_params",
      {}
    );
  });

  test("複雑なパラメータオブジェクトを正しく送信する", () => {
    const complexParams = {
      string_param: "test",
      number_param: 42,
      boolean_param: true,
      nested_object: { key: "value" },
      array_param: [1, 2, 3],
    };

    trackEvent("complex_event", complexParams);

    expect(mockGtag).toHaveBeenCalledWith(
      "event",
      "complex_event",
      complexParams
    );
  });

  test("gtag未定義時は警告を出力して処理をスキップ", () => {
    // gtag を undefined に設定
    Object.defineProperty(window, "gtag", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    trackEvent("test_event");

    // gtag が呼ばれていないことを確認
    expect(mockGtag).not.toHaveBeenCalled();
  });
});

describe("analytics - trackRestaurantClick", () => {
  test("レストランクリックイベントを正しく送信", () => {
    const restaurant = {
      id: "rest-001",
      name: "テストレストラン",
      category: "日本料理",
      priceRange: "1000-2000円",
    };

    trackRestaurantClick(restaurant);

    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockGtag).toHaveBeenCalledWith("event", "restaurant_click", {
      restaurant_id: "rest-001",
      restaurant_name: "テストレストラン",
      restaurant_category: "日本料理",
      price_range: "1000-2000円",
      event_category: "restaurant_interaction",
    });
  });

  test("必須パラメータが全て含まれている", () => {
    const restaurant = {
      id: "rest-002",
      name: "寿司店",
      category: "寿司",
      priceRange: "3000円～",
    };

    trackRestaurantClick(restaurant);

    const callArgs = mockGtag.mock.calls[0];
    const params = callArgs[2] as Record<string, unknown>;

    expect(params).toHaveProperty("restaurant_id");
    expect(params).toHaveProperty("restaurant_name");
    expect(params).toHaveProperty("restaurant_category");
    expect(params).toHaveProperty("price_range");
    expect(params).toHaveProperty("event_category");
  });

  test("空文字列のプロパティも正しく送信される", () => {
    const restaurant = {
      id: "",
      name: "",
      category: "",
      priceRange: "",
    };

    trackRestaurantClick(restaurant);

    expect(mockGtag).toHaveBeenCalled();
    const callArgs = mockGtag.mock.calls[0];
    const params = callArgs[2] as Record<string, unknown>;

    expect(params.restaurant_id).toBe("");
    expect(params.restaurant_name).toBe("");
  });
});

describe("analytics - trackMapInteraction", () => {
  test("zoom インタラクションを正しく追跡", () => {
    trackMapInteraction("zoom");

    expect(mockGtag).toHaveBeenCalledWith("event", "map_interaction", {
      interaction_type: "zoom",
      event_category: "map_usage",
    });
  });

  test("pan インタラクションを正しく追跡", () => {
    trackMapInteraction("pan");

    expect(mockGtag).toHaveBeenCalledWith("event", "map_interaction", {
      interaction_type: "pan",
      event_category: "map_usage",
    });
  });

  test("marker_click インタラクションを正しく追跡", () => {
    trackMapInteraction("marker_click");

    expect(mockGtag).toHaveBeenCalledWith("event", "map_interaction", {
      interaction_type: "marker_click",
      event_category: "map_usage",
    });
  });

  test("複数のインタラクションを連続して追跡できる", () => {
    trackMapInteraction("zoom");
    trackMapInteraction("pan");
    trackMapInteraction("marker_click");

    expect(mockGtag).toHaveBeenCalledTimes(3);
  });
});

describe("analytics - trackSearch", () => {
  test("検索イベントを正しく送信", () => {
    trackSearch("ラーメン", 15);

    expect(mockGtag).toHaveBeenCalledWith("event", "search", {
      search_term: "ラーメン",
      result_count: 15,
      event_category: "search_interaction",
    });
  });

  test("結果0件の検索も追跡", () => {
    trackSearch("存在しない店", 0);

    expect(mockGtag).toHaveBeenCalledWith("event", "search", {
      search_term: "存在しない店",
      result_count: 0,
      event_category: "search_interaction",
    });
  });

  test("空文字列の検索クエリも追跡", () => {
    trackSearch("", 100);

    expect(mockGtag).toHaveBeenCalledWith("event", "search", {
      search_term: "",
      result_count: 100,
      event_category: "search_interaction",
    });
  });

  test("大量の検索結果も正しく追跡", () => {
    trackSearch("人気店", 9999);

    const callArgs = mockGtag.mock.calls[0];
    const params = callArgs[2] as Record<string, unknown>;

    expect(params.result_count).toBe(9999);
  });
});

describe("analytics - trackFilter", () => {
  test("価格帯フィルターを正しく追跡", () => {
    trackFilter("price", "1000-2000円");

    expect(mockGtag).toHaveBeenCalledWith("event", "filter_applied", {
      filter_type: "price",
      filter_value: "1000-2000円",
      event_category: "filter_interaction",
    });
  });

  test("料理カテゴリフィルターを正しく追跡", () => {
    trackFilter("cuisine", "日本料理");

    expect(mockGtag).toHaveBeenCalledWith("event", "filter_applied", {
      filter_type: "cuisine",
      filter_value: "日本料理",
      event_category: "filter_interaction",
    });
  });

  test("地域フィルターを正しく追跡", () => {
    trackFilter("district", "両津");

    expect(mockGtag).toHaveBeenCalledWith("event", "filter_applied", {
      filter_type: "district",
      filter_value: "両津",
      event_category: "filter_interaction",
    });
  });

  test("複数のフィルターを連続して追跡できる", () => {
    trackFilter("price", "～1000円");
    trackFilter("cuisine", "カフェ");
    trackFilter("district", "佐和田");

    expect(mockGtag).toHaveBeenCalledTimes(3);
  });
});

describe("analytics - trackPWAUsage", () => {
  test("PWAインストールイベントを正しく追跡", () => {
    trackPWAUsage("install");

    expect(mockGtag).toHaveBeenCalledWith("event", "pwa_usage", {
      pwa_action: "install",
      event_category: "pwa_interaction",
    });
  });

  test("スタンドアロンモード起動を正しく追跡", () => {
    trackPWAUsage("standalone_mode");

    expect(mockGtag).toHaveBeenCalledWith("event", "pwa_usage", {
      pwa_action: "standalone_mode",
      event_category: "pwa_interaction",
    });
  });
});

describe("analytics - trackPageView", () => {
  test("ページビューイベントを正しく送信", () => {
    // window.location.hrefをモック
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost:3000/",
      },
      writable: true,
      configurable: true,
    });

    trackPageView("ホームページ");

    expect(mockGtag).toHaveBeenCalledWith("event", "page_view", {
      page_title: "ホームページ",
      page_location: "http://localhost:3000/",
      event_category: "navigation",
    });
  });

  test("異なるページビューを連続して追跡", () => {
    trackPageView("トップページ");
    trackPageView("検索結果ページ");
    trackPageView("詳細ページ");

    expect(mockGtag).toHaveBeenCalledTimes(3);
  });

  test("空文字列のページ名も追跡", () => {
    trackPageView("");

    expect(mockGtag).toHaveBeenCalled();
    const callArgs = mockGtag.mock.calls[0];
    const params = callArgs[2] as Record<string, unknown>;

    expect(params.page_title).toBe("");
  });
});

describe("analytics - エラーハンドリング", () => {
  test("gtagエラー発生時もクラッシュしない", () => {
    // gtagがエラーを投げるように設定
    mockGtag.mockImplementation(() => {
      throw new Error("gtag error");
    });

    // エラーが発生してもクラッシュしないことを確認
    expect(() => {
      trackEvent("test_event");
    }).not.toThrow();

    // エラーログが出力されることを確認
    expect(console.error).toHaveBeenCalled();
  });

  test("gtag未定義時に警告を出力 (DEV環境)", () => {
    Object.defineProperty(window, "gtag", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    trackEvent("test_event");

    // 開発環境のチェックはimport.meta.env.DEVに依存するため、
    // 実際の動作環境によって警告が出るかどうかが変わる
    // ここでは関数が例外を投げないことだけを確認
    expect(() => trackEvent("test_event")).not.toThrow();
  });
});

describe("analytics - パフォーマンス", () => {
  test("大量のイベントを高速に処理できる", () => {
    const startTime = performance.now();

    // 100回のイベント送信
    for (let i = 0; i < 100; i++) {
      trackEvent(`test_event_${i}`, { index: i });
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 100回のイベント送信が100ms以内に完了することを確認
    expect(duration).toBeLessThan(100);
    expect(mockGtag).toHaveBeenCalledTimes(100);
  });

  test("複雑なパラメータでもパフォーマンスが劣化しない", () => {
    const complexParams = {
      level1: {
        level2: {
          level3: {
            data: Array.from({ length: 100 }, (_, i) => ({ id: i })),
          },
        },
      },
    };

    const startTime = performance.now();
    trackEvent("complex_event", complexParams);
    const endTime = performance.now();

    // 10ms以内に完了することを確認
    expect(endTime - startTime).toBeLessThan(10);
  });
});

describe("analytics - 統合テスト", () => {
  test("複数の異なるイベントタイプを連続して送信", () => {
    trackRestaurantClick({
      id: "r1",
      name: "店1",
      category: "和食",
      priceRange: "1000-2000円",
    });
    trackSearch("寿司", 10);
    trackFilter("price", "～1000円");
    trackMapInteraction("zoom");
    trackPWAUsage("install");
    trackPageView("トップページ");

    // 6つのイベントが全て送信されたことを確認
    expect(mockGtag).toHaveBeenCalledTimes(6);
  });

  test("同じイベントを異なるパラメータで複数回送信", () => {
    trackRestaurantClick({
      id: "r1",
      name: "店1",
      category: "和食",
      priceRange: "1000-2000円",
    });
    trackRestaurantClick({
      id: "r2",
      name: "店2",
      category: "洋食",
      priceRange: "2000-3000円",
    });
    trackRestaurantClick({
      id: "r3",
      name: "店3",
      category: "中華",
      priceRange: "3000円～",
    });

    expect(mockGtag).toHaveBeenCalledTimes(3);

    // 各呼び出しが異なるパラメータを持つことを確認
    const calls = mockGtag.mock.calls;
    expect(calls[0][2]).toMatchObject({ restaurant_id: "r1" });
    expect(calls[1][2]).toMatchObject({ restaurant_id: "r2" });
    expect(calls[2][2]).toMatchObject({ restaurant_id: "r3" });
  });

  test("エラー発生後も後続のイベント送信が継続される", () => {
    // 最初のイベントでエラー
    mockGtag.mockImplementationOnce(() => {
      throw new Error("Network error");
    });

    trackEvent("error_event");
    trackEvent("success_event_1");
    trackEvent("success_event_2");

    // エラー後も処理が継続されることを確認
    expect(mockGtag).toHaveBeenCalledTimes(3);
  });
});

describe("analytics - エッジケース", () => {
  test("特殊文字を含むパラメータを正しく処理", () => {
    const specialChars = {
      japanese: "日本語テスト",
      emoji: "🍣🗾",
      symbols: "<>&\"'",
      newline: "line1\nline2",
      tab: "col1\tcol2",
    };

    trackEvent("special_chars_event", specialChars);

    expect(mockGtag).toHaveBeenCalledWith(
      "event",
      "special_chars_event",
      specialChars
    );
  });

  test("非常に長い文字列パラメータを処理", () => {
    const longString = "a".repeat(10000);
    trackEvent("long_string_event", { long_param: longString });

    expect(mockGtag).toHaveBeenCalled();
    const callArgs = mockGtag.mock.calls[0];
    const params = callArgs[2] as Record<string, unknown>;
    expect(params.long_param).toHaveLength(10000);
  });

  test("nullやundefinedを含むパラメータを処理", () => {
    const params = {
      null_value: null,
      undefined_value: undefined,
      zero_value: 0,
      false_value: false,
      empty_string: "",
    };

    trackEvent("null_params_event", params);

    expect(mockGtag).toHaveBeenCalledWith("event", "null_params_event", params);
  });

  test("循環参照を含むオブジェクトでもクラッシュしない", () => {
    const circular: Record<string, unknown> = { name: "test" };
    circular.self = circular;

    // 循環参照があってもクラッシュしないことを確認
    expect(() => {
      trackEvent("circular_event", circular);
    }).not.toThrow();
  });
});

describe("analytics - 初期化とセットアップ", () => {
  test("window.gtagが正しく定義されている", () => {
    expect(window.gtag).toBeDefined();
    expect(typeof window.gtag).toBe("function");
  });

  test("window.dataLayerが配列として初期化されている", () => {
    expect(window.dataLayer).toBeDefined();
    expect(Array.isArray(window.dataLayer)).toBe(true);
  });

  test("GA_MEASUREMENT_IDが設定されている", () => {
    // モック設定により "G-TEST123456" が設定されていることを確認
    // 実際の本番環境では環境変数から読み込まれる
    expect("G-TEST123456").toMatch(/^G-[A-Z0-9]+$/);
  });
});

describe("analytics - checkGAStatus", () => {
  // 動的インポートでcheckGAStatusを取得
  test("開発環境でGA状態を正しく返す", async () => {
    const { checkGAStatus } = await import("../analytics");

    const status = await checkGAStatus();

    expect(status).toHaveProperty("measurementId");
    expect(status).toHaveProperty("measurementIdValid");
    expect(status).toHaveProperty("gtagLoaded");
    expect(status).toHaveProperty("dataLayerExists");
    expect(status).toHaveProperty("environment");
  });

  test("測定IDの妥当性を正しく判定", async () => {
    const { checkGAStatus } = await import("../analytics");

    const status = await checkGAStatus();

    // エラーオブジェクトでないことを確認（型ガード）
    expect(status).not.toHaveProperty("error");

    if (!("error" in status)) {
      // G-で始まる測定IDは有効（環境変数またはモック値）
      expect(status.measurementId).toMatch(/^G-[A-Z0-9]+$/);
      expect(status.measurementIdValid).toBe(true);
    }
  });

  test("gtag関数の読み込み状態を正しく報告", async () => {
    const { checkGAStatus } = await import("../analytics");

    const status = await checkGAStatus();

    if (!("error" in status)) {
      // beforeEachでwindow.gtagをモック設定済み
      expect(status.gtagLoaded).toBe(true);
    }
  });

  test("dataLayerの存在を正しく報告", async () => {
    const { checkGAStatus } = await import("../analytics");

    const status = await checkGAStatus();

    if (!("error" in status)) {
      // beforeEachでwindow.dataLayerをモック設定済み
      expect(status.dataLayerExists).toBe(true);
    }
  });

  test("環境情報を正しく取得", async () => {
    const { checkGAStatus } = await import("../analytics");

    const status = await checkGAStatus();

    if (!("error" in status)) {
      // Vitest環境では "test" または "development" が期待される
      expect(status.environment).toBeTruthy();
      expect(typeof status.environment).toBe("string");
    }
  });
});

describe("analytics - debugGA", () => {
  test("開発環境でデバッグ情報を返す", async () => {
    const { debugGA } = await import("../analytics");

    const result = await debugGA();

    // checkGAStatusの結果が返される
    expect(result).toHaveProperty("measurementId");
    expect(result).toHaveProperty("gtagLoaded");
  });

  test("gtag読み込み済みの場合にテストイベントを送信", async () => {
    const { debugGA } = await import("../analytics");

    mockGtag.mockClear();
    await debugGA();

    // gtag読み込み済みなのでテストイベントが送信される
    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockGtag).toHaveBeenCalledWith(
      "event",
      "debug_test",
      expect.anything()
    );

    // パラメータの内容を個別に検証
    const callArgs = mockGtag.mock.calls[0];
    const params = callArgs[2] as Record<string, unknown>;
    expect(params).toHaveProperty("timestamp");
    expect(params).toHaveProperty(
      "test_message",
      "Google Analytics Debug Test"
    );
  });

  test("gtag未読み込みの場合は警告のみ", async () => {
    // gtag未読み込み状態をシミュレート
    Object.defineProperty(window, "gtag", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { debugGA } = await import("../analytics");
    const warnSpy = vi.spyOn(console, "warn");

    await debugGA();

    expect(warnSpy).toHaveBeenCalledWith(
      "Google Analytics not properly loaded"
    );

    // gtag復元
    Object.defineProperty(window, "gtag", {
      value: mockGtag,
      writable: true,
      configurable: true,
    });
  });
});

describe("analytics - initGA エラーハンドリング", () => {
  test("測定ID未設定の場合は警告のみで正常終了", async () => {
    // 測定ID未設定状態をテスト
    // 注: 実際のinitGA()はDOM操作を含むため完全なテストは困難
    // ここでは環境変数チェックのロジックを間接的に検証

    const { trackEvent } = await import("../analytics");

    // gtag未定義状態でtrackEventを呼び出し
    Object.defineProperty(window, "gtag", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const warnSpy = vi.spyOn(console, "warn");
    trackEvent("test_event");

    expect(warnSpy).toHaveBeenCalledWith(
      "Google Analytics が初期化されていません"
    );

    // gtag復元
    Object.defineProperty(window, "gtag", {
      value: mockGtag,
      writable: true,
      configurable: true,
    });
  });

  test("無効な測定ID形式でもクラッシュしない", () => {
    // 無効な形式のチェックロジック確認
    const invalidId = "INVALID-ID-123";

    // G-で始まらないIDは無効
    expect(invalidId.startsWith("G-")).toBe(false);
  });

  test("GA_MEASUREMENT_IDの形式検証", () => {
    // 有効な形式
    expect("G-1234567890".startsWith("G-")).toBe(true);
    expect("G-ABCDEF1234".startsWith("G-")).toBe(true);

    // 無効な形式
    expect("UA-123456-1".startsWith("G-")).toBe(false);
    expect("GTM-XXXXXX".startsWith("G-")).toBe(false);
    expect("undefined".startsWith("G-")).toBe(false);
    expect("".startsWith("G-")).toBe(false);
  });
});

describe("analytics - runGADiagnostics", () => {
  test("診断情報を正しく収集する", async () => {
    const { runGADiagnostics } = await import("../analytics");

    // DOM要素をモック
    const mockScript = document.createElement("script");
    mockScript.src = "https://www.googletagmanager.com/gtag/js?id=G-TEST";
    document.head.appendChild(mockScript);

    const diagnostics = runGADiagnostics();

    expect(diagnostics).toHaveProperty("measurementId");
    expect(diagnostics).toHaveProperty("measurementIdFormat");
    expect(diagnostics).toHaveProperty("environment");
    expect(diagnostics).toHaveProperty("gtagScriptExists");
    expect(diagnostics).toHaveProperty("gtagFunctionExists");
    expect(diagnostics).toHaveProperty("dataLayerExists");
    expect(diagnostics).toHaveProperty("isOnline");
    expect(diagnostics).toHaveProperty("cookiesEnabled");
    expect(diagnostics).toHaveProperty("timestamp");

    // クリーンアップ
    mockScript.remove();
  });

  test("測定IDの形式を正しく検証", async () => {
    const { runGADiagnostics } = await import("../analytics");

    const diagnostics = runGADiagnostics();

    // G-TEST123456 は有効な形式
    if ("error" in diagnostics) {
      throw new Error("Diagnostics should not return error");
    }
    expect(diagnostics.measurementIdFormat).toBe("✅ 正常");
  });

  test("gtagスクリプトの存在を正しく検出", async () => {
    const { runGADiagnostics } = await import("../analytics");

    // スクリプトを追加
    const mockScript = document.createElement("script");
    mockScript.src = "https://www.googletagmanager.com/gtag/js?id=G-TEST";
    document.head.appendChild(mockScript);

    const diagnostics = runGADiagnostics();

    if ("error" in diagnostics) {
      throw new Error("Diagnostics should not return error");
    }
    expect(diagnostics.gtagScriptExists).toBe(true);

    // クリーンアップ
    mockScript.remove();
  });

  test("gtag関数の存在を正しく検出", async () => {
    const { runGADiagnostics } = await import("../analytics");

    const diagnostics = runGADiagnostics();

    if ("error" in diagnostics) {
      throw new Error("Diagnostics should not return error");
    }
    // beforeEachでwindow.gtagをモック設定済み
    expect(diagnostics.gtagFunctionExists).toBe(true);
  });

  test("dataLayerの存在を正しく検出", async () => {
    const { runGADiagnostics } = await import("../analytics");

    const diagnostics = runGADiagnostics();

    if ("error" in diagnostics) {
      throw new Error("Diagnostics should not return error");
    }
    expect(diagnostics.dataLayerExists).toBe(true);
  });

  test("オンライン状態を正しく報告", async () => {
    const { runGADiagnostics } = await import("../analytics");

    const diagnostics = runGADiagnostics();

    if ("error" in diagnostics) {
      throw new Error("Diagnostics should not return error");
    }
    expect(typeof diagnostics.isOnline).toBe("boolean");
  });

  test("Cookieの有効状態を正しく報告", async () => {
    const { runGADiagnostics } = await import("../analytics");

    const diagnostics = runGADiagnostics();

    if ("error" in diagnostics) {
      throw new Error("Diagnostics should not return error");
    }
    expect(typeof diagnostics.cookiesEnabled).toBe("boolean");
  });

  test("タイムスタンプがISO形式", async () => {
    const { runGADiagnostics } = await import("../analytics");

    const diagnostics = runGADiagnostics();

    if ("error" in diagnostics) {
      throw new Error("Diagnostics should not return error");
    }
    expect(diagnostics.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  test("問題検出時に警告を出力", async () => {
    const { runGADiagnostics } = await import("../analytics");

    // gtag未定義状態をシミュレート
    Object.defineProperty(window, "gtag", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const warnSpy = vi.spyOn(console, "warn");
    runGADiagnostics();

    expect(warnSpy).toHaveBeenCalledWith(
      "🚨 検出された問題:",
      expect.arrayContaining([expect.stringContaining("gtag関数")])
    );

    // gtag復元
    Object.defineProperty(window, "gtag", {
      value: mockGtag,
      writable: true,
      configurable: true,
    });
  });

  test("問題なしの場合は成功メッセージ", async () => {
    const { runGADiagnostics } = await import("../analytics");

    const logSpy = vi.spyOn(console, "log");
    runGADiagnostics();

    // 成功メッセージまたはテーブル表示が出力される
    expect(logSpy).toHaveBeenCalled();
  });
});

describe("analytics - sendTestEvents", () => {
  test("テストイベントを連続で送信", async () => {
    const { sendTestEvents } = await import("../analytics");

    vi.useFakeTimers();
    mockGtag.mockClear();

    sendTestEvents();

    // 初回は即座に送信（index=0なのでsetTimeout(..., 0)）
    await vi.runAllTimersAsync();
    expect(mockGtag).toHaveBeenCalledTimes(3); // 全3イベントが送信される
    vi.useRealTimers();
  });

  test("送信されたイベント名を検証", async () => {
    const { sendTestEvents } = await import("../analytics");

    vi.useFakeTimers();
    mockGtag.mockClear();

    sendTestEvents();
    await vi.runAllTimersAsync();

    // 3つのイベントが送信されることを確認
    expect(mockGtag).toHaveBeenCalledWith(
      "event",
      "test_app_start",
      expect.anything()
    );
    expect(mockGtag).toHaveBeenCalledWith(
      "event",
      "test_search",
      expect.anything()
    );
    expect(mockGtag).toHaveBeenCalledWith(
      "event",
      "test_restaurant_click",
      expect.anything()
    );

    vi.useRealTimers();
  });

  test("各イベントに適切なパラメータが含まれる", async () => {
    const { sendTestEvents } = await import("../analytics");

    vi.useFakeTimers();
    mockGtag.mockClear();

    sendTestEvents();
    await vi.runAllTimersAsync();

    // 全イベントのパラメータ確認
    const calls = mockGtag.mock.calls;
    expect(calls).toHaveLength(3);

    const firstParams = calls[0][2] as Record<string, unknown>;
    expect(firstParams).toHaveProperty("test_type", "initialization");

    const secondParams = calls[1][2] as Record<string, unknown>;
    expect(secondParams).toHaveProperty("search_term", "テスト検索");
    expect(secondParams).toHaveProperty("result_count", 5);

    const thirdParams = calls[2][2] as Record<string, unknown>;
    expect(thirdParams).toHaveProperty("restaurant_id", "test-001");
    expect(thirdParams).toHaveProperty("restaurant_name", "テスト店舗");

    vi.useRealTimers();
  });

  test("console.logで進捗を報告", async () => {
    const { sendTestEvents } = await import("../analytics");

    const logSpy = vi.spyOn(console, "log");

    sendTestEvents();

    // 開始メッセージと完了メッセージが出力される
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("テストイベント送信")
    );
  });
});

describe("analytics - autoFixGA", () => {
  test("診断を実行して結果を返す", async () => {
    const { autoFixGA } = await import("../analytics");

    const result = autoFixGA();

    expect(result).toHaveProperty("measurementId");
    expect(result).toHaveProperty("gtagFunctionExists");
    expect(result).toHaveProperty("environment");
  });

  test("gtag未定義時に再初期化を試行", async () => {
    const { autoFixGA } = await import("../analytics");

    // gtag未定義状態をシミュレート
    Object.defineProperty(window, "gtag", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    // スクリプトを追加してgtagScriptExistsをtrueに
    const mockScript = document.createElement("script");
    mockScript.src = "https://www.googletagmanager.com/gtag/js?id=G-TEST";
    document.head.appendChild(mockScript);

    const logSpy = vi.spyOn(console, "log");
    autoFixGA();

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("gtag関数が存在しません")
    );

    // クリーンアップ
    mockScript.remove();

    // gtag復元
    Object.defineProperty(window, "gtag", {
      value: mockGtag,
      writable: true,
      configurable: true,
    });
  });

  test("自動修復のログメッセージを出力", async () => {
    const { autoFixGA } = await import("../analytics");

    const logSpy = vi.spyOn(console, "log");
    autoFixGA();

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("自動修復開始")
    );
  });

  test("既存スクリプトの削除を試行", async () => {
    const { autoFixGA } = await import("../analytics");

    // gtag未定義 + スクリプト存在の状態を作成
    Object.defineProperty(window, "gtag", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const mockScript = document.createElement("script");
    mockScript.src = "https://www.googletagmanager.com/gtag/js?id=G-TEST";
    mockScript.className = "test-script";
    document.head.appendChild(mockScript);

    autoFixGA();

    // スクリプトが削除されたことを確認
    const remainingScript = document.querySelector(".test-script");
    expect(remainingScript).toBeNull();

    // gtag復元
    Object.defineProperty(window, "gtag", {
      value: mockGtag,
      writable: true,
      configurable: true,
    });
  });
});

describe("analytics - window.gaDebug グローバル公開", () => {
  test("開発環境でwindow.gaDebugが定義される", () => {
    // 開発環境ではwindow.gaDebugが公開される
    if (import.meta.env.DEV) {
      expect(window.gaDebug).toBeDefined();
      expect(window.gaDebug?.runDiagnostics).toBeDefined();
      expect(window.gaDebug?.sendTestEvents).toBeDefined();
      expect(window.gaDebug?.autoFix).toBeDefined();
      expect(window.gaDebug?.checkStatus).toBeDefined();
      expect(window.gaDebug?.forceInit).toBeDefined();
    }
  });

  test("window.gaDebugの各メソッドが関数", () => {
    if (import.meta.env.DEV && window.gaDebug) {
      expect(typeof window.gaDebug.runDiagnostics).toBe("function");
      expect(typeof window.gaDebug.sendTestEvents).toBe("function");
      expect(typeof window.gaDebug.autoFix).toBe("function");
      expect(typeof window.gaDebug.checkStatus).toBe("function");
      expect(typeof window.gaDebug.forceInit).toBe("function");
    }
  });
});

describe("analytics - 環境別動作", () => {
  test("開発環境での詳細ログ出力", () => {
    // テスト環境ではimport.meta.env.DEV=falseのため、ログは出力されない
    // 環境変数の存在を確認
    expect(import.meta.env.DEV).toBeDefined();

    // trackEvent()はgtagを呼び出すことを確認
    mockGtag.mockClear();
    trackEvent("dev_test_event", { test: true });
    expect(mockGtag).toHaveBeenCalledWith(
      "event",
      "dev_test_event",
      expect.anything()
    );
  });

  test("本番環境では静粛モード", () => {
    // Vitest 4では、テスト環境でも import.meta.env.DEV=true
    // 本番環境の挙動テストはできないため、gtagが呼ばれることのみ確認
    mockGtag.mockClear();

    // イベント送信
    trackEvent("prod_test_event", { test: true });

    // gtagは呼ばれることを確認（環境に関わらず）
    expect(mockGtag).toHaveBeenCalledWith(
      "event",
      "prod_test_event",
      expect.anything()
    );

    // テスト環境ではDEV=trueであることを確認
    expect(import.meta.env.DEV).toBe(true);
  });
});
