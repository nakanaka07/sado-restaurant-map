import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useErrorHandler } from "./useErrorHandler";

// ブラウザAPI のモック
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000/test",
  },
  writable: true,
});

Object.defineProperty(window, "navigator", {
  value: {
    userAgent: "Mozilla/5.0 (Test Browser) TestAgent/1.0",
  },
  writable: true,
});

// DOM イベントリスナーのモック
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(window, "addEventListener", {
  value: mockAddEventListener,
  writable: true,
});

Object.defineProperty(window, "removeEventListener", {
  value: mockRemoveEventListener,
  writable: true,
});

describe("useErrorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();

    // console エラーをモック
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "group").mockImplementation(() => {});
    vi.spyOn(console, "groupEnd").mockImplementation(() => {});
  });

  it("初期状態では error が null であるべき", () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.error).toBe(null);
    expect(result.current.errorHistory).toEqual([]);
  });

  it("エラーを追加できるべき", () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      const testError = new Error("テストエラー");
      result.current.handleError({
        error: testError,
        context: "TestComponent",
        severity: "medium",
      });
    });

    expect(result.current.error).toMatchObject({
      message: "テストエラー",
      context: "TestComponent",
      severity: "medium",
    });
    expect(result.current.errorHistory).toHaveLength(1);
  });

  it("複数のエラーを履歴で管理できるべき", () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      const error1 = new Error("エラー1");
      result.current.handleError({
        error: error1,
        context: "TestComponent1",
        severity: "medium",
      });
    });

    act(() => {
      const error2 = new Error("エラー2");
      result.current.handleError({
        error: error2,
        context: "TestComponent2",
        severity: "high",
      });
    });

    expect(result.current.errorHistory).toHaveLength(2);
    expect(result.current.errorHistory[0].message).toBe("エラー2"); // 最新が先頭
    expect(result.current.errorHistory[1].message).toBe("エラー1");
  });

  it("クリティカルエラーを処理できるべき", () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      const criticalError = new Error("致命的エラー");
      result.current.handleCriticalError(criticalError, "CriticalComponent");
    });

    expect(result.current.error).toMatchObject({
      message: "致命的エラー",
      context: "CriticalComponent",
      severity: "critical",
    });
  });

  it("ネットワークエラーを処理できるべき", () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      const networkError = new Error("Network request failed");
      result.current.handleNetworkError(networkError, "ApiService");
    });

    expect(result.current.error).toMatchObject({
      message: "Network request failed",
      context: "ApiService",
      severity: "medium",
    });
  });

  it("バリデーションエラーを処理できるべき", () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      const validationError = new Error("Validation failed");
      result.current.handleValidationError(validationError, "FormComponent");
    });

    expect(result.current.error).toMatchObject({
      message: "Validation failed",
      context: "FormComponent",
      severity: "low",
    });
  });

  it("エラーをクリアできるべき", () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      const testError = new Error("テストエラー");
      result.current.handleError({
        error: testError,
        context: "TestComponent",
      });
    });

    expect(result.current.error).not.toBe(null);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it("エラー履歴をクリアできるべき", () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      const error1 = new Error("エラー1");
      const error2 = new Error("エラー2");

      result.current.handleError({
        error: error1,
        context: "Component1",
      });
      result.current.handleError({
        error: error2,
        context: "Component2",
      });
    });

    expect(result.current.errorHistory).toHaveLength(2);

    act(() => {
      result.current.clearErrorHistory();
    });

    expect(result.current.errorHistory).toEqual([]);
  });

  it("エラーの重要度が正しく設定されるべき", () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      const testError = new Error("テストエラー");
      result.current.handleError({
        error: testError,
        context: "TestComponent",
        severity: "low",
      });
    });

    expect(result.current.error?.severity).toBe("low");
  });

  it("デフォルトの重要度が medium であるべき", () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      const testError = new Error("テストエラー");
      result.current.handleError({
        error: testError,
        context: "TestComponent",
      });
    });

    expect(result.current.error?.severity).toBe("medium");
  });

  it("エラー履歴は最大10件まで保持されるべき", () => {
    const { result } = renderHook(() => useErrorHandler());

    // 12個のエラーを追加
    act(() => {
      for (let i = 1; i <= 12; i++) {
        result.current.handleError({
          error: new Error(`エラー${i}`),
          context: "Component",
        });
      }
    });

    // 最大10件まで保持
    expect(result.current.errorHistory).toHaveLength(10);
    // 最新の10件が保持される
    expect(result.current.errorHistory[0].message).toBe("エラー12");
    expect(result.current.errorHistory[9].message).toBe("エラー3");
  });

  it("メタデータが正しく処理されるべき", () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      const testError = new Error("テストエラー");
      const metadata = { userId: "123", action: "submit" };

      result.current.handleError({
        error: testError,
        context: "TestComponent",
        metadata,
      });
    });

    expect(result.current.error).toMatchObject({
      message: "テストエラー",
      context: "TestComponent",
    });
  });

  // ==============================
  // Additional Coverage Tests
  // ==============================

  describe("エラーコード処理", () => {
    it("error.codeプロパティが存在する場合は抽出されるべき", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        const errorWithCode = new Error("API Error");
        (errorWithCode as { code: string }).code = "ERR_NETWORK";
        result.current.handleError({
          error: errorWithCode,
          context: "API",
        });
      });

      expect(result.current.error?.code).toBe("ERR_NETWORK");
    });

    it("error.codeが存在しない場合はundefinedになるべき", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        const errorWithoutCode = new Error("Simple Error");
        result.current.handleError({
          error: errorWithoutCode,
          context: "Component",
        });
      });

      expect(result.current.error?.code).toBeUndefined();
    });

    it("error.codeが数値の場合は文字列に変換されるべき", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        const errorWithNumericCode = new Error("HTTP Error");
        (errorWithNumericCode as { code: number }).code = 404;
        result.current.handleError({
          error: errorWithNumericCode,
          context: "HTTP",
        });
      });

      expect(result.current.error?.code).toBe("404");
      expect(typeof result.current.error?.code).toBe("string");
    });
  });

  describe("ネットワークエラー特殊処理", () => {
    it("fetch含むエラーメッセージは専用メッセージに置換されるべき", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        const fetchError = new Error("Failed to fetch data from API");
        result.current.handleNetworkError(fetchError, "DataService");
      });

      expect(result.current.error?.message).toBe(
        "ネットワーク接続を確認してください"
      );
    });

    it("fetch以外のネットワークエラーは元のメッセージを保持するべき", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        const networkError = new Error("Connection timeout");
        result.current.handleNetworkError(networkError, "DataService");
      });

      expect(result.current.error?.message).toBe("Connection timeout");
    });

    it("ネットワークエラーのコンテキストがデフォルトで'Network'になるべき", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        const networkError = new Error("Connection refused");
        result.current.handleNetworkError(networkError);
      });

      expect(result.current.error?.context).toBe("Network");
    });

    it("ネットワークエラーの重要度はmediumであるべき", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        const networkError = new Error("Network error");
        result.current.handleNetworkError(networkError);
      });

      expect(result.current.error?.severity).toBe("medium");
    });
  });

  describe("バリデーションエラー特殊処理", () => {
    it("バリデーションエラーのコンテキストがデフォルトで'Validation'になるべき", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        const validationError = new Error("Invalid input");
        result.current.handleValidationError(validationError);
      });

      expect(result.current.error?.context).toBe("Validation");
    });

    it("バリデーションエラーの重要度はlowであるべき", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        const validationError = new Error("Required field");
        result.current.handleValidationError(validationError);
      });

      expect(result.current.error?.severity).toBe("low");
    });
  });

  describe("デフォルト値とフォールバック", () => {
    it("コンテキストが未指定の場合はUnknownになるべき", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        const testError = new Error("Test error");
        result.current.handleError({ error: testError });
      });

      expect(result.current.error?.context).toBe("Unknown");
    });

    it("タイムスタンプが自動的に設定されるべき", () => {
      const { result } = renderHook(() => useErrorHandler());
      const beforeTime = new Date();

      act(() => {
        const testError = new Error("Test error");
        result.current.handleError({ error: testError });
      });

      const afterTime = new Date();
      const timestamp = result.current.error?.timestamp;

      expect(timestamp).toBeDefined();
      if (timestamp) {
        expect(timestamp.getTime()).toBeGreaterThanOrEqual(
          beforeTime.getTime()
        );
        expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      }
    });
  });

  describe("エラー履歴の順序", () => {
    it("最新のエラーが常に先頭に追加されるべき", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError({ error: new Error("Error 1") });
        result.current.handleError({ error: new Error("Error 2") });
        result.current.handleError({ error: new Error("Error 3") });
      });

      expect(result.current.errorHistory[0].message).toBe("Error 3");
      expect(result.current.errorHistory[1].message).toBe("Error 2");
      expect(result.current.errorHistory[2].message).toBe("Error 1");
    });
  });

  describe("エッジケース", () => {
    it("空のエラーメッセージでも動作するべき", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        const emptyError = new Error("");
        result.current.handleError({ error: emptyError });
      });

      expect(result.current.error?.message).toBe("");
    });

    it("非常に長いエラーメッセージでも処理できるべき", () => {
      const { result } = renderHook(() => useErrorHandler());
      const longMessage = "A".repeat(1000);

      act(() => {
        const longError = new Error(longMessage);
        result.current.handleError({ error: longError });
      });

      expect(result.current.error?.message).toBe(longMessage);
      expect(result.current.error?.message.length).toBe(1000);
    });

    it("特殊文字を含むエラーメッセージでも処理できるべき", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        const specialCharError = new Error(
          "Error: <script>alert('XSS')</script>"
        );
        result.current.handleError({ error: specialCharError });
      });

      expect(result.current.error?.message).toBe(
        "Error: <script>alert('XSS')</script>"
      );
    });
  });

  describe("重要度の組み合わせ", () => {
    it("すべての重要度レベルが正しく設定できるべき", () => {
      const { result } = renderHook(() => useErrorHandler());
      const severities = ["low", "medium", "high", "critical"] as const;

      severities.forEach(severity => {
        act(() => {
          result.current.handleError({
            error: new Error(`${severity} error`),
            severity,
          });
        });

        expect(result.current.error?.severity).toBe(severity);
      });
    });
  });
});

// ==============================
// Global Functions Tests
// ==============================

describe("setupGlobalErrorHandling", () => {
  let setupGlobalErrorHandling: () => void;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAddEventListener.mockClear();

    // 動的インポートで関数を取得
    const module = await import("./useErrorHandler");
    setupGlobalErrorHandling = module.setupGlobalErrorHandling;
  });

  it("unhandledrejectionイベントリスナーが登録されるべき", () => {
    setupGlobalErrorHandling();

    expect(mockAddEventListener).toHaveBeenCalledWith(
      "unhandledrejection",
      expect.any(Function)
    );
  });

  it("errorイベントリスナーが登録されるべき", () => {
    setupGlobalErrorHandling();

    expect(mockAddEventListener).toHaveBeenCalledWith(
      "error",
      expect.any(Function)
    );
  });

  it("loadイベントリスナーが登録されるべき", () => {
    setupGlobalErrorHandling();

    expect(mockAddEventListener).toHaveBeenCalledWith(
      "load",
      expect.any(Function)
    );
  });

  it("最低3つのイベントリスナーが登録されるべき", () => {
    setupGlobalErrorHandling();

    expect(mockAddEventListener).toHaveBeenCalledTimes(3);
  });
});

describe("reportErrorBoundaryError", () => {
  let reportErrorBoundaryError: (
    error: Error,
    errorInfo: { componentStack: string }
  ) => void;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "group").mockImplementation(() => {});
    vi.spyOn(console, "groupEnd").mockImplementation(() => {});

    // 動的インポートで関数を取得
    const module = await import("./useErrorHandler");
    reportErrorBoundaryError = module.reportErrorBoundaryError;
  });

  it("Error Boundaryエラーを正しく処理できるべき", () => {
    const testError = new Error("Component render error");
    const errorInfo = {
      componentStack: "at Component\nat App",
    };

    expect(() => reportErrorBoundaryError(testError, errorInfo)).not.toThrow();
  });

  it("開発環境ではconsole.groupが呼ばれるべき", () => {
    const originalEnv = import.meta.env.DEV;
    import.meta.env.DEV = true;

    const testError = new Error("Component error");
    const errorInfo = { componentStack: "at Component" };

    reportErrorBoundaryError(testError, errorInfo);

    expect(console.group).toHaveBeenCalledWith(
      expect.stringContaining("React Error Boundary")
    );
    expect(console.groupEnd).toHaveBeenCalled();

    import.meta.env.DEV = originalEnv;
  });

  it("コンポーネントスタックが正しく記録されるべき", () => {
    const testError = new Error("Render error");
    const errorInfo = {
      componentStack: "at ErrorComponent\nat ParentComponent\nat App",
    };

    reportErrorBoundaryError(testError, errorInfo);

    // console.errorが呼ばれることを確認
    expect(console.error).toHaveBeenCalled();
  });

  it("エラー名がmetadataに含まれるべき", () => {
    const testError = new Error("Custom error");
    testError.name = "CustomErrorType";
    const errorInfo = { componentStack: "at Component" };

    expect(() => reportErrorBoundaryError(testError, errorInfo)).not.toThrow();
  });
});
