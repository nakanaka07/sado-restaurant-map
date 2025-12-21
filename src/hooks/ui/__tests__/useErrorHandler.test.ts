/* @vitest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  reportErrorBoundaryError,
  setupGlobalErrorHandling,
  useErrorHandler,
} from "../useErrorHandler";

describe("useErrorHandler", () => {
  // 型安全なmock spy定義
  type ConsoleSpy = ReturnType<typeof vi.spyOn<Console, "error">>;
  let consoleErrorSpy: ConsoleSpy;
  let consoleGroupSpy: ConsoleSpy;
  let consoleGroupEndSpy: ConsoleSpy;

  beforeEach(() => {
    // console.errorなどのスパイを設定
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleGroupSpy = vi.spyOn(console, "group").mockImplementation(() => {});
    consoleGroupEndSpy = vi
      .spyOn(console, "groupEnd")
      .mockImplementation(() => {});

    // 環境変数をDEVに設定（デフォルト）
    vi.stubEnv("DEV", true);
    vi.stubEnv("PROD", false);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  describe("基本的なエラーハンドリング", () => {
    it("エラーを正しく処理できる", () => {
      const { result } = renderHook(() => useErrorHandler());

      const testError = new Error("Test error");
      act(() => {
        result.current.handleError({
          error: testError,
          context: "Test context",
          severity: "medium",
        });
      });

      expect(result.current.error).toEqual({
        message: "Test error",
        code: undefined,
        timestamp: expect.any(Date) as Date,
        context: "Test context",
        severity: "medium",
      });
    });

    it("エラーコードが含まれる場合は記録される", () => {
      const { result } = renderHook(() => useErrorHandler());

      const errorWithCode = Object.assign(new Error("Error with code"), {
        code: "ERR_001",
      });

      act(() => {
        result.current.handleError({
          error: errorWithCode,
          context: "Test",
          severity: "high",
        });
      });

      expect(result.current.error?.code).toBe("ERR_001");
    });

    it("デフォルト値が正しく適用される", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError({
          error: new Error("Default test"),
        });
      });

      expect(result.current.error).toEqual({
        message: "Default test",
        code: undefined,
        timestamp: expect.any(Date) as Date,
        context: "Unknown",
        severity: "medium",
      });
    });
  });

  describe("エラー履歴管理", () => {
    it("エラー履歴が正しく記録される", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError({
          error: new Error("Error 1"),
          context: "Context 1",
        });
      });

      act(() => {
        result.current.handleError({
          error: new Error("Error 2"),
          context: "Context 2",
        });
      });

      expect(result.current.errorHistory).toHaveLength(2);
      expect(result.current.errorHistory[0]?.message).toBe("Error 2");
      expect(result.current.errorHistory[1]?.message).toBe("Error 1");
    });

    it("エラー履歴は最新10件のみ保持される", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        for (let i = 1; i <= 15; i++) {
          result.current.handleError({
            error: new Error(`Error ${i}`),
            context: `Context ${i}`,
          });
        }
      });

      expect(result.current.errorHistory).toHaveLength(10);
      expect(result.current.errorHistory[0]?.message).toBe("Error 15");
      expect(result.current.errorHistory[9]?.message).toBe("Error 6");
    });

    it("エラー履歴をクリアできる", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError({
          error: new Error("Test error"),
          context: "Test",
        });
      });

      expect(result.current.errorHistory).toHaveLength(1);

      act(() => {
        result.current.clearErrorHistory();
      });

      expect(result.current.errorHistory).toHaveLength(0);
    });
  });

  describe("エラークリア", () => {
    it("エラーをクリアできる", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError({
          error: new Error("Test error"),
        });
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it("エラークリアは履歴に影響しない", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError({
          error: new Error("Test error"),
        });
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.errorHistory).toHaveLength(1);
    });
  });

  describe("レベル別エラーハンドラー", () => {
    it("クリティカルエラーを正しく処理できる", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleCriticalError(
          new Error("Critical error"),
          "Critical context"
        );
      });

      expect(result.current.error?.severity).toBe("critical");
      expect(result.current.error?.context).toBe("Critical context");
    });

    it("ネットワークエラーを正しく処理できる", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleNetworkError(
          new Error("fetch failed"),
          "Network test"
        );
      });

      expect(result.current.error?.severity).toBe("medium");
      expect(result.current.error?.context).toBe("Network test");
      expect(result.current.error?.message).toBe(
        "ネットワーク接続を確認してください"
      );
    });

    it("ネットワークエラーでfetchが含まれない場合は元のメッセージを使用", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleNetworkError(
          new Error("Connection timeout"),
          "Network"
        );
      });

      expect(result.current.error?.message).toBe("Connection timeout");
    });

    it("バリデーションエラーを正しく処理できる", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleValidationError(
          new Error("Invalid input"),
          "Form validation"
        );
      });

      expect(result.current.error?.severity).toBe("low");
      expect(result.current.error?.context).toBe("Form validation");
    });

    it("バリデーションエラーのcontextが未指定の場合はデフォルト値を使用", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleValidationError(new Error("Invalid input"));
      });

      expect(result.current.error?.context).toBe("Validation");
    });
  });

  describe("開発環境でのログ出力", () => {
    it("DEV環境ではエラー詳細をコンソールに出力", () => {
      const { result } = renderHook(() => useErrorHandler());

      const testError = new Error("Dev error");
      act(() => {
        result.current.handleError({
          error: testError,
          context: "Dev context",
          metadata: { foo: "bar" },
        });
      });

      expect(consoleGroupSpy).toHaveBeenCalledWith("🚨 Error in Dev context");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", testError);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Stack:", testError.stack);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Metadata:", { foo: "bar" });
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it("本番環境ではエラーレポートが送信される", () => {
      vi.stubEnv("DEV", false);
      vi.stubEnv("PROD", true);

      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError({
          error: new Error("Prod error"),
          context: "Prod context",
        });
      });

      // 本番環境では簡潔なログのみ
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error:",
        "Prod error",
        "Prod context"
      );
      expect(consoleGroupSpy).not.toHaveBeenCalled();
    });
  });

  describe("setupGlobalErrorHandling", () => {
    it("ブラウザ環境でグローバルエラーハンドラーを設定できる", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");

      setupGlobalErrorHandling();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "unhandledrejection",
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "error",
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "load",
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
    });

    it("未処理のPromise拒否用のイベントリスナーが登録される", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");

      setupGlobalErrorHandling();

      const unhandledRejectionListener = addEventListenerSpy.mock.calls.find(
        call => call[0] === "unhandledrejection"
      );

      expect(unhandledRejectionListener).toBeDefined();
      expect(unhandledRejectionListener?.[1]).toBeInstanceOf(Function);

      addEventListenerSpy.mockRestore();
    });

    it("一般的なエラー用のイベントリスナーが登録される", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");

      setupGlobalErrorHandling();

      const errorListener = addEventListenerSpy.mock.calls.find(
        call => call[0] === "error"
      );

      expect(errorListener).toBeDefined();
      expect(errorListener?.[1]).toBeInstanceOf(Function);

      addEventListenerSpy.mockRestore();
    });
  });

  describe("reportErrorBoundaryError", () => {
    it("React Error Boundaryエラーを正しく報告できる", () => {
      const testError = new Error("Component error");
      const errorInfo = {
        componentStack: "at Component (Component.tsx:10:5)",
      };

      reportErrorBoundaryError(testError, errorInfo);

      expect(consoleGroupSpy).toHaveBeenCalledWith("🔴 React Error Boundary");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", testError);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Component Stack:",
        errorInfo.componentStack
      );
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it("本番環境ではエラー報告サービスに送信される", () => {
      vi.stubEnv("DEV", false);
      vi.stubEnv("PROD", true);

      const testError = new Error("Prod component error");
      const errorInfo = {
        componentStack: "at ProdComponent (ProdComponent.tsx:15:3)",
      };

      reportErrorBoundaryError(testError, errorInfo);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error:",
        "Prod component error",
        "React Error Boundary"
      );
    });
  });

  describe("エラー報告サービス（内部実装）", () => {
    it("本番環境でメタデータ付きエラーを処理できる", () => {
      vi.stubEnv("DEV", false);
      vi.stubEnv("PROD", true);

      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError({
          error: new Error("Error with metadata"),
          context: "Test context",
          metadata: {
            userId: "user123",
            action: "submit",
            timestamp: "2025-12-07T10:00:00Z",
          },
        });
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result.current.error?.message).toBe("Error with metadata");
    });

    it("エラー報告関数は内部で安全に処理される", () => {
      vi.stubEnv("DEV", false);
      vi.stubEnv("PROD", true);

      const { result } = renderHook(() => useErrorHandler());

      // エラー報告は内部のtry-catchで処理されるため、外部には影響しない
      act(() => {
        result.current.handleError({
          error: new Error("Error with reporting"),
          context: "Reporting test",
          metadata: { test: "data" },
        });
      });

      // エラー状態は正常に設定される
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe("Error with reporting");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("ネットワークエラーのcontextが未指定の場合はデフォルト値を使用", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleNetworkError(new Error("fetch failed"));
      });

      expect(result.current.error?.context).toBe("Network");
    });

    it("クリティカルエラーのcontextを記録できる", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleCriticalError(new Error("Critical error"));
      });

      expect(result.current.error?.context).toBe("Unknown");
      expect(result.current.error?.severity).toBe("critical");
    });
  });

  describe("エッジケース", () => {
    it("複数のエラーを連続して処理できる", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError({ error: new Error("Error 1") });
        result.current.handleError({ error: new Error("Error 2") });
        result.current.handleError({ error: new Error("Error 3") });
      });

      expect(result.current.error?.message).toBe("Error 3");
      expect(result.current.errorHistory).toHaveLength(3);
    });

    it("同じエラーを複数回処理できる", () => {
      const { result } = renderHook(() => useErrorHandler());
      const sameError = new Error("Same error");

      act(() => {
        result.current.handleError({ error: sameError });
        result.current.handleError({ error: sameError });
      });

      expect(result.current.errorHistory).toHaveLength(2);
    });

    it("空のメタデータでエラーを処理できる", () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError({
          error: new Error("Error with empty metadata"),
          metadata: {},
        });
      });

      expect(result.current.error?.message).toBe("Error with empty metadata");
    });

    it("非常に長いエラーメッセージを処理できる", () => {
      const { result } = renderHook(() => useErrorHandler());
      const longMessage = "Error: " + "a".repeat(1000);

      act(() => {
        result.current.handleError({
          error: new Error(longMessage),
        });
      });

      expect(result.current.error?.message).toBe(longMessage);
    });
  });
});
