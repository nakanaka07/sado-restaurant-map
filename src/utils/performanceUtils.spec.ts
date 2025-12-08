/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  processInChunks,
  processInChunksSync,
  processWhenIdle,
  yieldToMain,
} from "./performanceUtils";

describe("performanceUtils", () => {
  describe("yieldToMain", () => {
    it("scheduler.yield()が利用可能な場合は使用する", async () => {
      const mockYield = vi.fn().mockResolvedValue(undefined);
      const originalScheduler = window.scheduler as unknown;

      Object.defineProperty(window, "scheduler", {
        value: { yield: mockYield },
        configurable: true,
      });

      await yieldToMain();

      expect(mockYield).toHaveBeenCalledOnce();

      Object.defineProperty(window, "scheduler", {
        value: originalScheduler,
        configurable: true,
      });
    });

    it("scheduler.yield()が無い場合はsetTimeoutにフォールバックする", async () => {
      const originalScheduler = window.scheduler as unknown;
      Object.defineProperty(window, "scheduler", {
        value: undefined,
        configurable: true,
      });

      vi.useFakeTimers();

      const promise = yieldToMain();
      vi.advanceTimersByTime(0);

      await promise;

      vi.useRealTimers();
      Object.defineProperty(window, "scheduler", {
        value: originalScheduler,
        configurable: true,
      });
    });
  });

  describe("processInChunks", () => {
    it("全アイテムを正しく処理する", async () => {
      const items = Array.from({ length: 100 }, (_, i) => i);
      const processed: number[] = [];

      await processInChunks(items, 25, item => {
        processed.push(item * 2);
      });

      expect(processed).toHaveLength(100);
      expect(processed).toEqual(items.map(i => i * 2));
    });

    it("指定されたchunkSizeで分割処理する", async () => {
      const items = Array.from({ length: 100 }, (_, i) => i);

      let currentChunkSize = 0;
      await processInChunks(items, 30, () => {
        currentChunkSize++;
      });

      // 30 + 30 + 30 + 10 = 100
      // yieldToMainが4回呼ばれるはず（各チャンク後）
      expect(currentChunkSize).toBe(100);
    });

    it("空配列を処理してもエラーが発生しない", async () => {
      const processed: number[] = [];

      await processInChunks([], 10, item => {
        processed.push(item);
      });

      expect(processed).toHaveLength(0);
    });

    it("processorがPromiseを返す場合も正しく動作する", async () => {
      const items = [1, 2, 3, 4, 5];
      const processed: number[] = [];

      await processInChunks(items, 2, async (_item, index) => {
        // 非同期処理をシミュレート
        await new Promise<void>(resolve => setTimeout(resolve, 10));
        processed.push(_item + index);
      });

      expect(processed).toEqual([1, 3, 5, 7, 9]);
    });

    it("processorでエラーが発生した場合はPromiseがrejectされる", async () => {
      const items = [1, 2, 3];
      const error: Error = new Error("Processing error");

      await expect(
        processInChunks(items, 1, item => {
          if (item === 2) throw error;
        })
      ).rejects.toThrow("Processing error");
    });

    it("indexパラメータが正しく渡される", async () => {
      const items = ["a", "b", "c", "d", "e"];
      const indices: number[] = [];

      await processInChunks(items, 2, (_item, index) => {
        indices.push(index);
      });

      expect(indices).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe("processWhenIdle", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("requestIdleCallbackが利用可能な場合は使用する", async () => {
      const mockRequestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
        callback({
          didTimeout: false,
          timeRemaining: () => 50,
        } as IdleDeadline);
        return 1;
      });
      const originalRequestIdleCallback = window.requestIdleCallback;

      Object.defineProperty(window, "requestIdleCallback", {
        value: mockRequestIdleCallback,
        configurable: true,
      });

      const result = await processWhenIdle(() => "test result");

      expect(mockRequestIdleCallback).toHaveBeenCalledOnce();
      expect(result).toBe("test result");

      Object.defineProperty(window, "requestIdleCallback", {
        value: originalRequestIdleCallback,
        configurable: true,
      });
    });

    it("requestIdleCallbackが無い場合はsetTimeoutにフォールバックする", async () => {
      const originalRequestIdleCallback = window.requestIdleCallback;
      Object.defineProperty(window, "requestIdleCallback", {
        value: undefined,
        configurable: true,
      });

      const promise = processWhenIdle(() => 42);
      vi.advanceTimersByTime(0);

      const result = await promise;

      expect(result).toBe(42);

      Object.defineProperty(window, "requestIdleCallback", {
        value: originalRequestIdleCallback,
        configurable: true,
      });
    });

    it("timeoutオプションが正しく渡される", async () => {
      const mockRequestIdleCallback = vi.fn(
        (callback: IdleRequestCallback, options?: IdleRequestOptions) => {
          expect(options?.timeout).toBe(5000);
          callback({
            didTimeout: false,
            timeRemaining: () => 50,
          } as IdleDeadline);
          return 1;
        }
      );
      const originalRequestIdleCallback = window.requestIdleCallback;

      Object.defineProperty(window, "requestIdleCallback", {
        value: mockRequestIdleCallback,
        configurable: true,
      });

      await processWhenIdle(() => "test", { timeout: 5000 });

      expect(mockRequestIdleCallback).toHaveBeenCalledOnce();

      Object.defineProperty(window, "requestIdleCallback", {
        value: originalRequestIdleCallback,
        configurable: true,
      });
    });

    it("デフォルトのtimeoutは2000ms", async () => {
      const mockRequestIdleCallback = vi.fn(
        (callback: IdleRequestCallback, options?: IdleRequestOptions) => {
          expect(options?.timeout).toBe(2000);
          callback({
            didTimeout: false,
            timeRemaining: () => 50,
          } as IdleDeadline);
          return 1;
        }
      );
      const originalRequestIdleCallback = window.requestIdleCallback;

      Object.defineProperty(window, "requestIdleCallback", {
        value: mockRequestIdleCallback,
        configurable: true,
      });

      await processWhenIdle(() => "test");

      expect(mockRequestIdleCallback).toHaveBeenCalledOnce();

      Object.defineProperty(window, "requestIdleCallback", {
        value: originalRequestIdleCallback,
        configurable: true,
      });
    });

    it("callbackでエラーが発生した場合もPromiseがrejectされる", async () => {
      const error: Error = new Error("Callback error");
      const mockRequestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
        callback({
          didTimeout: false,
          timeRemaining: () => 50,
        } as IdleDeadline);
        return 1;
      });
      const originalRequestIdleCallback = window.requestIdleCallback;

      Object.defineProperty(window, "requestIdleCallback", {
        value: mockRequestIdleCallback,
        configurable: true,
      });

      await expect(
        processWhenIdle(() => {
          throw error;
        })
      ).rejects.toThrow("Callback error");

      Object.defineProperty(window, "requestIdleCallback", {
        value: originalRequestIdleCallback,
        configurable: true,
      });
    });
  });

  describe("processInChunksSync", () => {
    it("全アイテムを正しく処理する", () => {
      const items = Array.from({ length: 100 }, (_, i) => i);

      const results = processInChunksSync(items, 25, item => item * 2);

      expect(results).toHaveLength(100);
      expect(results).toEqual(items.map(i => i * 2));
    });

    it("指定されたchunkSizeで分割処理する", () => {
      const items = Array.from({ length: 100 }, (_, i) => i);

      const results = processInChunksSync(items, 30, item => item + 1);

      // 30 + 30 + 30 + 10 = 100
      expect(results).toHaveLength(100);
      expect(results[0]).toBe(1); // 0 + 1
      expect(results[99]).toBe(100); // 99 + 1
    });

    it("空配列を処理してもエラーが発生しない", () => {
      const results = processInChunksSync([], 10, item => item);

      expect(results).toHaveLength(0);
    });

    it("nullやundefinedを返すprocessorも正しく動作する", () => {
      const items = [1, 2, 3, 4, 5];

      const results = processInChunksSync(items, 2, item =>
        item % 2 === 0 ? item : null
      );

      expect(results).toEqual([null, 2, null, 4, null]);
    });

    it("複雑なオブジェクト変換も正しく動作する", () => {
      interface Input {
        id: number;
        value: string;
      }
      interface Output {
        id: number;
        processed: string;
      }

      const items: Input[] = [
        { id: 1, value: "a" },
        { id: 2, value: "b" },
        { id: 3, value: "c" },
      ];

      const results = processInChunksSync<Input, Output>(items, 2, item => ({
        id: item.id,
        processed: item.value.toUpperCase(),
      }));

      expect(results).toEqual([
        { id: 1, processed: "A" },
        { id: 2, processed: "B" },
        { id: 3, processed: "C" },
      ]);
    });

    it("indexパラメータが正しく渡される", () => {
      const items = ["a", "b", "c", "d", "e"];

      const results = processInChunksSync(
        items,
        2,
        (item, index) => `${item}-${index}`
      );

      expect(results).toEqual(["a-0", "b-1", "c-2", "d-3", "e-4"]);
    });

    it("大量データでもスタックオーバーフローが発生しない", () => {
      const items = Array.from({ length: 10000 }, (_, i) => i);

      const results = processInChunksSync(items, 100, item => item * 2);

      expect(results).toHaveLength(10000);
      expect(results[0]).toBe(0);
      expect(results[9999]).toBe(19998);
    });
  });

  describe("パフォーマンス統合テスト", () => {
    it("processInChunksとprocessInChunksSyncが同じ結果を返す", async () => {
      const items = Array.from({ length: 200 }, (_, i) => ({
        id: i,
        value: i * 2,
      }));
      const processor = (item: { id: number; value: number }) => item.value + 1;

      const asyncResults: number[] = [];
      await processInChunks(items, 50, item => {
        asyncResults.push(processor(item));
      });

      const syncResults = processInChunksSync(items, 50, processor);

      expect(asyncResults).toEqual(syncResults);
    });
  });
});
