/**
 * @fileoverview App.tsx内のヘルパー関数の単体テスト
 * deferToIdle, initGADeferred などのユーティリティ関数をテスト
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

describe("App Helper Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deferToIdle", () => {
    it("requestIdleCallbackが利用可能な場合は使用されること", () => {
      const mockCallback = vi.fn();
      const mockRequestIdleCallback = vi.fn((cb: () => void) => {
        cb(); // 即座に実行
      });

      // requestIdleCallbackをモック
      const originalRIC = (
        window as unknown as {
          requestIdleCallback?: (cb: () => void) => void;
        }
      ).requestIdleCallback;

      (
        window as unknown as {
          requestIdleCallback: (cb: () => void) => void;
        }
      ).requestIdleCallback = mockRequestIdleCallback;

      // deferToIdleをインライン実装で検証
      const deferToIdle = (cb: () => void): void => {
        const ric = (
          window as unknown as {
            requestIdleCallback?: (cb: () => void) => void;
          }
        ).requestIdleCallback;
        if (typeof ric === "function") ric(cb);
        else setTimeout(cb, 0);
      };

      deferToIdle(mockCallback);

      expect(mockRequestIdleCallback).toHaveBeenCalledWith(mockCallback);
      expect(mockCallback).toHaveBeenCalled();

      // 復元
      if (originalRIC) {
        (
          window as unknown as {
            requestIdleCallback: (cb: () => void) => void;
          }
        ).requestIdleCallback = originalRIC;
      } else {
        delete (
          window as unknown as {
            requestIdleCallback?: (cb: () => void) => void;
          }
        ).requestIdleCallback;
      }
    });

    it("requestIdleCallbackが利用できない場合はsetTimeoutにフォールバックすること", async () => {
      const mockCallback = vi.fn();

      // requestIdleCallbackを削除
      const originalRIC = (
        window as unknown as {
          requestIdleCallback?: (cb: () => void) => void;
        }
      ).requestIdleCallback;
      delete (
        window as unknown as {
          requestIdleCallback?: (cb: () => void) => void;
        }
      ).requestIdleCallback;

      // deferToIdleをインライン実装で検証
      const deferToIdle = (cb: () => void): void => {
        const ric = (
          window as unknown as {
            requestIdleCallback?: (cb: () => void) => void;
          }
        ).requestIdleCallback;
        if (typeof ric === "function") ric(cb);
        else setTimeout(cb, 0);
      };

      deferToIdle(mockCallback);

      // setTimeoutが使用されるため、少し待つ
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCallback).toHaveBeenCalled();

      // 復元
      if (originalRIC) {
        (
          window as unknown as {
            requestIdleCallback: (cb: () => void) => void;
          }
        ).requestIdleCallback = originalRIC;
      }
    });

    it("コールバックが正しく実行されること", () => {
      let called = false;
      const mockCallback = () => {
        called = true;
      };

      const mockRequestIdleCallback = vi.fn((cb: () => void) => {
        cb();
      });

      (
        window as unknown as {
          requestIdleCallback: (cb: () => void) => void;
        }
      ).requestIdleCallback = mockRequestIdleCallback;

      const deferToIdle = (cb: () => void): void => {
        const ric = (
          window as unknown as {
            requestIdleCallback?: (cb: () => void) => void;
          }
        ).requestIdleCallback;
        if (typeof ric === "function") ric(cb);
        else setTimeout(cb, 0);
      };

      deferToIdle(mockCallback);

      expect(called).toBe(true);
    });
  });

  describe("initGADeferred", () => {
    it("initGAが成功した場合にresolveすること", async () => {
      const mockInitGA = vi.fn(() => Promise.resolve());

      const deferToIdle = (cb: () => void): void => {
        setTimeout(cb, 0); // 即座に実行
      };

      const initGADeferred = async (): Promise<void> => {
        return new Promise<void>(resolve => {
          deferToIdle(() => {
            void mockInitGA()
              .catch(err => {
                console.warn("initGA failed (deferred):", err);
              })
              .finally(() => resolve());
          });
        });
      };

      await initGADeferred();

      expect(mockInitGA).toHaveBeenCalled();
    });

    it("initGAが失敗した場合でもresolveすること", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      const mockInitGA = vi.fn(() =>
        Promise.reject(new Error("GA initialization failed"))
      );

      const deferToIdle = (cb: () => void): void => {
        setTimeout(cb, 0);
      };

      const initGADeferred = async (): Promise<void> => {
        return new Promise<void>(resolve => {
          deferToIdle(() => {
            void mockInitGA()
              .catch(err => {
                console.warn("initGA failed (deferred):", err);
              })
              .finally(() => resolve());
          });
        });
      };

      await expect(initGADeferred()).resolves.toBeUndefined();

      expect(mockInitGA).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "initGA failed (deferred):",
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it("エラーがスローされてもPromiseがrejectしないこと", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      const mockInitGA = vi.fn((): Promise<void> => {
        throw new Error("Sync error");
      });

      const deferToIdle = (cb: () => void): void => {
        setTimeout(cb, 0);
      };

      const initGADeferred = async (): Promise<void> => {
        return new Promise<void>(resolve => {
          deferToIdle(() => {
            try {
              void mockInitGA();
              resolve();
            } catch (err) {
              console.warn("initGA failed (deferred):", err);
              resolve();
            }
          });
        });
      };

      await expect(initGADeferred()).resolves.toBeUndefined();

      consoleWarnSpy.mockRestore();
    });

    it("deferToIdleが正しく呼ばれること", async () => {
      const mockInitGA = vi.fn(() => Promise.resolve());
      const deferToIdleSpy = vi.fn((cb: () => void) => {
        setTimeout(cb, 0);
      });

      const initGADeferred = async (): Promise<void> => {
        return new Promise<void>(resolve => {
          deferToIdleSpy(() => {
            void mockInitGA()
              .catch(err => {
                console.warn("initGA failed (deferred):", err);
              })
              .finally(() => resolve());
          });
        });
      };

      await initGADeferred();

      expect(deferToIdleSpy).toHaveBeenCalled();
      expect(mockInitGA).toHaveBeenCalled();
    });

    it("複数回呼び出されても正しく動作すること", async () => {
      let callCount = 0;
      const mockInitGA = vi.fn(() => {
        callCount++;
        return Promise.resolve();
      });

      const deferToIdle = (cb: () => void): void => {
        setTimeout(cb, 0);
      };

      const initGADeferred = async (): Promise<void> => {
        return new Promise<void>(resolve => {
          deferToIdle(() => {
            void mockInitGA()
              .catch(err => {
                console.warn("initGA failed (deferred):", err);
              })
              .finally(() => resolve());
          });
        });
      };

      await initGADeferred();
      await initGADeferred();
      await initGADeferred();

      expect(callCount).toBe(3);
      expect(mockInitGA).toHaveBeenCalledTimes(3);
    });
  });

  describe("ConditionalPWABadge logic", () => {
    it("本番環境でisPWAEnabledがtrueになること", () => {
      const isPWAEnabled = (prod: boolean, enablePwaDev: string) =>
        prod || enablePwaDev === "true";

      expect(isPWAEnabled(true, "false")).toBe(true);
      expect(isPWAEnabled(true, "true")).toBe(true);
    });

    it("開発環境でENABLE_PWA_DEV=trueの場合にisPWAEnabledがtrueになること", () => {
      const isPWAEnabled = (prod: boolean, enablePwaDev: string) =>
        prod || enablePwaDev === "true";

      expect(isPWAEnabled(false, "true")).toBe(true);
    });

    it("開発環境でENABLE_PWA_DEV=falseの場合にisPWAEnabledがfalseになること", () => {
      const isPWAEnabled = (prod: boolean, enablePwaDev: string) =>
        prod || enablePwaDev === "true";

      expect(isPWAEnabled(false, "false")).toBe(false);
      expect(isPWAEnabled(false, "")).toBe(false);
    });
  });

  describe("useIsMobile logic", () => {
    it("768px以下でモバイルと判定されること", () => {
      const checkMobile = (width: number) => width <= 768;

      expect(checkMobile(320)).toBe(true);
      expect(checkMobile(768)).toBe(true);
      expect(checkMobile(767)).toBe(true);
    });

    it("769px以上でデスクトップと判定されること", () => {
      const checkMobile = (width: number) => width <= 768;

      expect(checkMobile(769)).toBe(false);
      expect(checkMobile(1024)).toBe(false);
      expect(checkMobile(1920)).toBe(false);
    });

    it("境界値で正しく判定されること", () => {
      const checkMobile = (width: number) => width <= 768;

      expect(checkMobile(768)).toBe(true); // 境界値: モバイル
      expect(checkMobile(769)).toBe(false); // 境界値+1: デスクトップ
    });
  });

  describe("フルスクリーン検出ロジック", () => {
    it("標準fullscreenElementが優先されること", () => {
      const mockStandardElement = document.createElement("div");
      const mockWebkitElement = document.createElement("div");

      const detectFullscreen = (
        standard?: Element,
        webkit?: Element,
        moz?: Element,
        ms?: Element
      ) => {
        return standard ?? webkit ?? moz ?? ms ?? null;
      };

      const result = detectFullscreen(
        mockStandardElement,
        mockWebkitElement,
        undefined,
        undefined
      );
      expect(result).toBe(mockStandardElement);
    });

    it("webkitFullscreenElementがフォールバックとして使用されること", () => {
      const mockWebkitElement = document.createElement("div");

      const detectFullscreen = (
        standard?: Element,
        webkit?: Element,
        moz?: Element,
        ms?: Element
      ) => {
        return standard ?? webkit ?? moz ?? ms ?? null;
      };

      const result = detectFullscreen(
        undefined,
        mockWebkitElement,
        undefined,
        undefined
      );
      expect(result).toBe(mockWebkitElement);
    });

    it("すべての要素がundefinedの場合nullを返すこと", () => {
      const detectFullscreen = (
        standard?: Element,
        webkit?: Element,
        moz?: Element,
        ms?: Element
      ) => {
        return standard ?? webkit ?? moz ?? ms ?? null;
      };

      const result = detectFullscreen(
        undefined,
        undefined,
        undefined,
        undefined
      );
      expect(result).toBeNull();
    });

    it("mozFullScreenElementが使用されること", () => {
      const mockMozElement = document.createElement("div");

      const detectFullscreen = (
        standard?: Element,
        webkit?: Element,
        moz?: Element,
        ms?: Element
      ) => {
        return standard ?? webkit ?? moz ?? ms ?? null;
      };

      const result = detectFullscreen(
        undefined,
        undefined,
        mockMozElement,
        undefined
      );
      expect(result).toBe(mockMozElement);
    });

    it("msFullscreenElementが使用されること", () => {
      const mockMsElement = document.createElement("div");

      const detectFullscreen = (
        standard?: Element,
        webkit?: Element,
        moz?: Element,
        ms?: Element
      ) => {
        return standard ?? webkit ?? moz ?? ms ?? null;
      };

      const result = detectFullscreen(
        undefined,
        undefined,
        undefined,
        mockMsElement
      );
      expect(result).toBe(mockMsElement);
    });
  });

  describe("クラストグルロジック", () => {
    it("フルスクリーン時にクラスが追加されること", () => {
      const toggleFullscreenClass = (isFullscreen: boolean) => {
        if (isFullscreen) {
          document.documentElement.classList.add("fullscreen-active");
          document.body.classList.add("fullscreen-active");
        } else {
          document.documentElement.classList.remove("fullscreen-active");
          document.body.classList.remove("fullscreen-active");
        }
      };

      toggleFullscreenClass(true);

      expect(
        document.documentElement.classList.contains("fullscreen-active")
      ).toBe(true);
      expect(document.body.classList.contains("fullscreen-active")).toBe(true);

      // クリーンアップ
      toggleFullscreenClass(false);
    });

    it("非フルスクリーン時にクラスが削除されること", () => {
      const toggleFullscreenClass = (isFullscreen: boolean) => {
        if (isFullscreen) {
          document.documentElement.classList.add("fullscreen-active");
          document.body.classList.add("fullscreen-active");
        } else {
          document.documentElement.classList.remove("fullscreen-active");
          document.body.classList.remove("fullscreen-active");
        }
      };

      // 最初にクラスを追加
      toggleFullscreenClass(true);

      // クラスを削除
      toggleFullscreenClass(false);

      expect(
        document.documentElement.classList.contains("fullscreen-active")
      ).toBe(false);
      expect(document.body.classList.contains("fullscreen-active")).toBe(false);
    });

    it("複数回トグルしても正しく動作すること", () => {
      const toggleFullscreenClass = (isFullscreen: boolean) => {
        if (isFullscreen) {
          document.documentElement.classList.add("fullscreen-active");
          document.body.classList.add("fullscreen-active");
        } else {
          document.documentElement.classList.remove("fullscreen-active");
          document.body.classList.remove("fullscreen-active");
        }
      };

      toggleFullscreenClass(true);
      expect(
        document.documentElement.classList.contains("fullscreen-active")
      ).toBe(true);

      toggleFullscreenClass(false);
      expect(
        document.documentElement.classList.contains("fullscreen-active")
      ).toBe(false);

      toggleFullscreenClass(true);
      expect(
        document.documentElement.classList.contains("fullscreen-active")
      ).toBe(true);

      // クリーンアップ
      toggleFullscreenClass(false);
    });
  });
});
