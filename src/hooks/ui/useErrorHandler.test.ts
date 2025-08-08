import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useErrorHandler } from "./useErrorHandler";

describe("useErrorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    result.current.clearErrorHistory();

    expect(result.current.errorHistory).toEqual([]);
  });

  it("エラーの重要度が正しく設定されるべき", () => {
    const { result } = renderHook(() => useErrorHandler());

    const testError = new Error("テストエラー");
    result.current.handleError({
      error: testError,
      context: "TestComponent",
      severity: "low",
    });

    expect(result.current.error?.severity).toBe("low");
  });

  it("デフォルトの重要度が medium であるべき", () => {
    const { result } = renderHook(() => useErrorHandler());

    const testError = new Error("テストエラー");
    result.current.handleError({
      error: testError,
      context: "TestComponent",
    });

    expect(result.current.error?.severity).toBe("medium");
  });

  it("エラー履歴は最大10件まで保持されるべき", () => {
    const { result } = renderHook(() => useErrorHandler());

    // 12個のエラーを追加
    for (let i = 1; i <= 12; i++) {
      result.current.handleError({
        error: new Error(`エラー${i}`),
        context: "Component",
      });
    }

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
});
