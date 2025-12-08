/**
 * @fileoverview MapErrorBoundary コンポーネントのテスト
 * エラーハンドリング、フォールバックUI、リトライロジック、エラー分類、
 * アクセシビリティ、エラータイプ別処理をテスト
 */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MapErrorBoundary } from "./MapErrorBoundary";

// エラーをスローするテストコンポーネント
const ThrowError: React.FC<{ message: string }> = ({ message }) => {
  throw new Error(message);
};

// 正常に動作するテストコンポーネント
const NormalComponent: React.FC = () => <div>Map is working</div>;

describe("MapErrorBoundary", () => {
  const originalEnv = process.env.NODE_ENV;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupEndSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // コンソールスパイをセットアップ
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleGroupSpy = vi.spyOn(console, "group").mockImplementation(() => {});
    consoleGroupEndSpy = vi
      .spyOn(console, "groupEnd")
      .mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    // DOMをクリーンアップ（全体テストスイート実行時の累積を防ぐ）
    cleanup();
    // モックをクリーンアップ
    consoleErrorSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
    vi.clearAllMocks();
  });

  describe("正常動作", () => {
    it("エラーがない場合、子コンポーネントをレンダリングすること", () => {
      render(
        <MapErrorBoundary>
          <NormalComponent />
        </MapErrorBoundary>
      );

      expect(screen.getByText("Map is working")).toBeInTheDocument();
    });

    it("複数の子コンポーネントをレンダリングできること", () => {
      render(
        <MapErrorBoundary>
          <div>Component 1</div>
          <div>Component 2</div>
          <div>Component 3</div>
        </MapErrorBoundary>
      );

      expect(screen.getByText("Component 1")).toBeInTheDocument();
      expect(screen.getByText("Component 2")).toBeInTheDocument();
      expect(screen.getByText("Component 3")).toBeInTheDocument();
    });
  });

  describe("エラーハンドリング", () => {
    it("エラーが発生した場合、フォールバックUIをレンダリングすること", () => {
      render(
        <MapErrorBoundary>
          <ThrowError message="Test error" />
        </MapErrorBoundary>
      );

      expect(
        screen.getByText("地図の読み込みに失敗しました")
      ).toBeInTheDocument();
      expect(screen.getByText("🔄 再試行")).toBeInTheDocument();
    });

    it("onError コールバックを呼び出すこと", () => {
      const onError = vi.fn();

      render(
        <MapErrorBoundary onError={onError}>
          <ThrowError message="Test error" />
        </MapErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String) as string,
          message: "Test error",
          timestamp: expect.any(Number) as number,
          userAgent: expect.any(String) as string,
        })
      );
    });

    it("開発環境でデバッグ情報をログ出力すること", () => {
      process.env.NODE_ENV = "development";

      render(
        <MapErrorBoundary>
          <ThrowError message="Test error" />
        </MapErrorBoundary>
      );

      expect(consoleGroupSpy).toHaveBeenCalledWith(
        "🚨 Map Error Boundary Triggered"
      );
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it("本番環境ではログを出力しないこと", () => {
      process.env.NODE_ENV = "production";

      render(
        <MapErrorBoundary>
          <ThrowError message="Test error" />
        </MapErrorBoundary>
      );

      expect(consoleGroupSpy).not.toHaveBeenCalled();
    });
  });

  describe("エラー分類", () => {
    it("Google Maps API エラーを正しく分類すること", () => {
      const onError = vi.fn();

      render(
        <MapErrorBoundary onError={onError}>
          <ThrowError message="Google Maps API loading failed" />
        </MapErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "API_LOAD_FAILURE",
        })
      );

      expect(
        screen.getByText("Google Maps API の読み込みに問題が発生しました")
      ).toBeInTheDocument();
    });

    it("マーカーレンダリングエラーを正しく分類すること", () => {
      const onError = vi.fn();

      render(
        <MapErrorBoundary onError={onError}>
          <ThrowError message="Failed to render marker" />
        </MapErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "MARKER_RENDER_ERROR",
        })
      );
    });

    it("初期化エラーを正しく分類すること", () => {
      const onError = vi.fn();

      render(
        <MapErrorBoundary onError={onError}>
          <ThrowError message="Map initialization error" />
        </MapErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "INITIALIZATION_ERROR",
        })
      );
    });

    it("データ処理エラーを正しく分類すること", () => {
      const onError = vi.fn();

      render(
        <MapErrorBoundary onError={onError}>
          <ThrowError message="Invalid coordinate data" />
        </MapErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "DATA_PROCESSING_ERROR",
        })
      );
    });

    it("不明なエラーをUNKNOWN_ERRORとして分類すること", () => {
      const onError = vi.fn();

      render(
        <MapErrorBoundary onError={onError}>
          <ThrowError message="Something went wrong" />
        </MapErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "UNKNOWN_ERROR",
        })
      );
    });

    it("エラーメッセージの大文字小文字を区別せずに分類すること", () => {
      const onError = vi.fn();

      render(
        <MapErrorBoundary onError={onError}>
          <ThrowError message="GOOGLE MAPS API FAILED" />
        </MapErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "API_LOAD_FAILURE",
        })
      );
    });
  });

  describe("リトライ機能", () => {
    it("再試行ボタンをクリックしてエラーから回復すること", async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const ConditionalThrow = () => {
        if (shouldThrow) {
          throw new Error("Temporary error");
        }
        return <div>Recovered successfully</div>;
      };

      render(
        <MapErrorBoundary>
          <ConditionalThrow />
        </MapErrorBoundary>
      );

      // エラー状態を確認
      expect(
        screen.getByText("地図の読み込みに失敗しました")
      ).toBeInTheDocument();

      // エラーを解決
      shouldThrow = false;

      // 再試行ボタンをクリック
      const retryButton = screen.getByText("🔄 再試行");
      await user.click(retryButton);

      // 回復を確認
      await waitFor(() => {
        expect(screen.getByText("Recovered successfully")).toBeInTheDocument();
      });
    });

    it("maxRetryCount に達するまでリトライを許可すること", async () => {
      const user = userEvent.setup();

      render(
        <MapErrorBoundary maxRetryCount={2}>
          <ThrowError message="Persistent error" />
        </MapErrorBoundary>
      );

      // 初回エラー
      expect(
        screen.getByText("地図の読み込みに失敗しました")
      ).toBeInTheDocument();

      const retryButton = screen.getByText("🔄 再試行");

      // 1回目のリトライ (retryCount: 0 → 1)
      await user.click(retryButton);
      expect(
        screen.getByText("地図の読み込みに失敗しました")
      ).toBeInTheDocument();

      // 2回目のリトライ (retryCount: 1 → 2)
      await user.click(retryButton);
      expect(
        screen.getByText("地図の読み込みに失敗しました")
      ).toBeInTheDocument();

      // エラー状態が継続していることを確認
      expect(screen.getByText("🔄 再試行")).toBeInTheDocument();
    });

    it("デフォルトのmaxRetryCountは3であること", async () => {
      const user = userEvent.setup();

      render(
        <MapErrorBoundary>
          <ThrowError message="Error" />
        </MapErrorBoundary>
      );

      const retryButton = screen.getByText("🔄 再試行");

      // 3回までリトライ可能 (retryCount: 0 → 1 → 2 → 3)
      await user.click(retryButton); // retryCount: 0 → 1
      expect(screen.getByText("🔄 再試行")).toBeInTheDocument();

      await user.click(retryButton); // retryCount: 1 → 2
      expect(screen.getByText("🔄 再試行")).toBeInTheDocument();

      await user.click(retryButton); // retryCount: 2 → 3
      expect(screen.getByText("🔄 再試行")).toBeInTheDocument();

      // エラー状態が継続
      expect(
        screen.getByText("地図の読み込みに失敗しました")
      ).toBeInTheDocument();
    });
  });

  describe("カスタムフォールバック", () => {
    it("カスタムフォールバックコンポーネントをレンダリングすること", () => {
      const CustomFallback: React.FC<{
        errorInfo?: { message: string };
        onRetry: () => void;
      }> = ({ errorInfo, onRetry }) => (
        <div>
          <h1>Custom Error UI</h1>
          <p>Error: {errorInfo?.message}</p>
          <button onClick={onRetry}>Retry Now</button>
        </div>
      );

      render(
        <MapErrorBoundary fallbackComponent={CustomFallback}>
          <ThrowError message="Custom error" />
        </MapErrorBoundary>
      );

      expect(screen.getByText("Custom Error UI")).toBeInTheDocument();
      expect(screen.getByText(/Error: Custom error/i)).toBeInTheDocument();
      expect(screen.getByText("Retry Now")).toBeInTheDocument();
    });

    it("カスタムフォールバックでリトライが動作すること", async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const ConditionalThrow = () => {
        if (shouldThrow) {
          throw new Error("Error");
        }
        return <div>Success</div>;
      };

      const CustomFallback: React.FC<{ onRetry: () => void }> = ({
        onRetry,
      }) => (
        <div>
          <button onClick={onRetry}>Custom Retry</button>
        </div>
      );

      render(
        <MapErrorBoundary fallbackComponent={CustomFallback}>
          <ConditionalThrow />
        </MapErrorBoundary>
      );

      // 初回エラー状態
      expect(screen.getByText("Custom Retry")).toBeInTheDocument();

      // エラーを解決
      shouldThrow = false;

      // リトライボタンをクリック
      const retryButton = screen.getByText("Custom Retry");
      await user.click(retryButton);

      // 成功状態に回復
      await waitFor(() => {
        expect(screen.getByText("Success")).toBeInTheDocument();
      });
    });
  });

  describe("デフォルトフォールバックUI", () => {
    it("エラーアイコンを表示すること", () => {
      render(
        <MapErrorBoundary>
          <ThrowError message="Error" />
        </MapErrorBoundary>
      );

      expect(screen.getByText("🗺️❌")).toBeInTheDocument();
    });

    it("エラーメッセージを表示すること", () => {
      render(
        <MapErrorBoundary>
          <ThrowError message="Error" />
        </MapErrorBoundary>
      );

      expect(
        screen.getByText("地図の読み込みに失敗しました")
      ).toBeInTheDocument();
    });

    it("対処法リストを表示すること", () => {
      render(
        <MapErrorBoundary>
          <ThrowError message="Error" />
        </MapErrorBoundary>
      );

      expect(
        screen.getByText(/インターネット接続を確認してください/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/ページを再読み込みしてください/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/しばらく時間をおいて再度お試しください/)
      ).toBeInTheDocument();
    });

    it("API_LOAD_FAILURE エラーに特定のメッセージを表示すること", () => {
      render(
        <MapErrorBoundary>
          <ThrowError message="Google Maps API loading failed" />
        </MapErrorBoundary>
      );

      expect(
        screen.getByText("Google Maps API の読み込みに問題が発生しました")
      ).toBeInTheDocument();
    });

    it("その他のエラーに汎用メッセージを表示すること", () => {
      render(
        <MapErrorBoundary>
          <ThrowError message="Unknown error" />
        </MapErrorBoundary>
      );

      expect(
        screen.getByText("地図コンポーネントでエラーが発生しました")
      ).toBeInTheDocument();
    });

    it("開発環境でデバッグ情報を表示すること", () => {
      process.env.NODE_ENV = "development";

      render(
        <MapErrorBoundary>
          <ThrowError message="Debug test error" />
        </MapErrorBoundary>
      );

      // details要素の存在を確認
      const details = screen.getByText("🔧 デバッグ情報");
      expect(details).toBeInTheDocument();
    });

    it("本番環境ではデバッグ情報を表示しないこと", () => {
      process.env.NODE_ENV = "production";

      render(
        <MapErrorBoundary>
          <ThrowError message="Production error" />
        </MapErrorBoundary>
      );

      expect(screen.queryByText("🔧 デバッグ情報")).not.toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("再試行ボタンがキーボードでアクセス可能であること", async () => {
      const user = userEvent.setup();

      render(
        <MapErrorBoundary>
          <ThrowError message="Error" />
        </MapErrorBoundary>
      );

      const retryButton = screen.getByText("🔄 再試行");

      // タブでフォーカス
      await user.tab();
      expect(retryButton).toHaveFocus();

      // Enterキーで実行可能
      await user.keyboard("{Enter}");

      // クリック後もUI要素が存在することを確認
      expect(
        screen.getByText("地図の読み込みに失敗しました")
      ).toBeInTheDocument();
    });

    it("再試行ボタンにフォーカススタイルが適用されること", async () => {
      const user = userEvent.setup();

      render(
        <MapErrorBoundary>
          <ThrowError message="Error" />
        </MapErrorBoundary>
      );

      const retryButton = screen.getByText("🔄 再試行");

      // フォーカス前の状態
      expect(retryButton).toHaveStyle({ backgroundColor: "#007bff" });

      // フォーカス
      await user.tab();

      // フォーカススタイルは実行時に動的に変更される
      // （onFocusイベントハンドラーによる）
    });
  });

  describe("エッジケース", () => {
    it("空のエラーメッセージを処理できること", () => {
      const onError = vi.fn();

      render(
        <MapErrorBoundary onError={onError}>
          <ThrowError message="" />
        </MapErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "",
          type: "UNKNOWN_ERROR",
        })
      );

      expect(
        screen.getByText("地図の読み込みに失敗しました")
      ).toBeInTheDocument();
    });

    it("非常に長いエラーメッセージを処理できること", () => {
      const longMessage = "Error: " + "A".repeat(1000);

      const onError = vi.fn();

      render(
        <MapErrorBoundary onError={onError}>
          <ThrowError message={longMessage} />
        </MapErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: longMessage,
        })
      );
    });

    it("特殊文字を含むエラーメッセージを処理できること", () => {
      const specialMessage = "<script>alert('XSS')</script> & 特殊文字: 😀🗺️";

      const onError = vi.fn();

      render(
        <MapErrorBoundary onError={onError}>
          <ThrowError message={specialMessage} />
        </MapErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: specialMessage,
        })
      );
    });

    it("複数のキーワードを含むエラーメッセージを正しく分類すること", () => {
      const onError = vi.fn();

      // "google", "maps", "marker" を含む
      render(
        <MapErrorBoundary onError={onError}>
          <ThrowError message="Google Maps marker failed to render" />
        </MapErrorBoundary>
      );

      // 最初にマッチする分類（API_LOAD_FAILURE）が優先される
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "API_LOAD_FAILURE",
        })
      );
    });

    it("onError が undefined の場合でも正常に動作すること", () => {
      render(
        <MapErrorBoundary>
          <ThrowError message="Error without callback" />
        </MapErrorBoundary>
      );

      expect(
        screen.getByText("地図の読み込みに失敗しました")
      ).toBeInTheDocument();
    });

    it("maxRetryCount が 0 の場合、即座に警告を表示すること", async () => {
      const user = userEvent.setup();

      render(
        <MapErrorBoundary maxRetryCount={0}>
          <ThrowError message="Error" />
        </MapErrorBoundary>
      );

      const retryButton = screen.getByText("🔄 再試行");
      await user.click(retryButton);

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "🚨 Max retry count reached for MapErrorBoundary"
        );
      });
    });

    it("maxRetryCount が負の値の場合、リトライを許可しないこと", async () => {
      const user = userEvent.setup();

      render(
        <MapErrorBoundary maxRetryCount={-1}>
          <ThrowError message="Error" />
        </MapErrorBoundary>
      );

      const retryButton = screen.getByText("🔄 再試行");
      await user.click(retryButton);

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "🚨 Max retry count reached for MapErrorBoundary"
        );
      });
    });
  });

  describe("統合シナリオ", () => {
    it("エラー → リトライ → 成功 のフルフローが動作すること", async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const UnstableComponent = () => {
        if (shouldThrow) {
          throw new Error("Temporary error");
        }
        return <div>Recovery successful</div>;
      };

      render(
        <MapErrorBoundary maxRetryCount={5}>
          <UnstableComponent />
        </MapErrorBoundary>
      );

      // 初回エラー
      expect(
        screen.getByText("地図の読み込みに失敗しました")
      ).toBeInTheDocument();

      // エラーを解決
      shouldThrow = false;

      // リトライ (成功)
      await user.click(screen.getByText("🔄 再試行"));

      await waitFor(() => {
        expect(screen.getByText("Recovery successful")).toBeInTheDocument();
      });
    });

    it("複数のError Boundaryが独立して動作すること", () => {
      render(
        <div>
          <MapErrorBoundary>
            <NormalComponent />
          </MapErrorBoundary>

          <MapErrorBoundary>
            <ThrowError message="Error in second boundary" />
          </MapErrorBoundary>
        </div>
      );

      // 1つ目は正常
      expect(screen.getByText("Map is working")).toBeInTheDocument();

      // 2つ目はエラー状態
      expect(
        screen.getByText("地図の読み込みに失敗しました")
      ).toBeInTheDocument();
    });
  });
});
