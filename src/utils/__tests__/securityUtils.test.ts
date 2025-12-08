/**
 * @fileoverview セキュリティユーティリティのテスト
 * securityUtils.ts の単体テスト
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiRateLimiter,
  checkSecurityHeaders,
  escapeHtml,
  generateCSRFToken,
  generateNonce,
  getSecureEnvVar,
  isSecureUrl,
  maskApiKey,
  safeJsonParse,
  sanitizeUserInput,
  searchRateLimiter,
  secureFetch,
  SecureStorage,
  stripHtml,
  validateApiKey,
} from "../securityUtils";

describe("securityUtils", () => {
  describe("escapeHtml", () => {
    it("HTML特殊文字をエスケープすること", () => {
      const result = escapeHtml("<script>alert('xss')</script>");
      expect(result).toContain("&lt;");
      expect(result).toContain("&gt;");
    });

    it("&をエスケープすること", () => {
      expect(escapeHtml("A & B")).toBe("A &amp; B");
    });

    it("通常のテキストはそのまま返すこと", () => {
      expect(escapeHtml("Hello World")).toBe("Hello World");
    });

    it("空文字を処理できること", () => {
      expect(escapeHtml("")).toBe("");
    });

    it("複数の特殊文字を同時にエスケープすること", () => {
      const result = escapeHtml("<div>&copy;</div>");
      expect(result).toContain("&lt;");
      expect(result).toContain("&gt;");
      expect(result).toContain("&amp;");
    });
  });

  describe("stripHtml", () => {
    it("HTMLタグを削除すること", () => {
      expect(stripHtml("<p>Hello</p>")).toBe("Hello");
    });

    it("複数のタグを削除すること", () => {
      expect(stripHtml("<div><span>Test</span></div>")).toBe("Test");
    });

    it("scriptタグの内容も含めてテキストとして返すこと", () => {
      // stripHtmlはinnerTextを取得するのでscriptタグの内容も含まれる
      const result = stripHtml("<script>alert('xss')</script>Normal text");
      expect(result).toContain("Normal text");
    });

    it("通常のテキストはそのまま返すこと", () => {
      expect(stripHtml("Plain text")).toBe("Plain text");
    });
  });

  describe("isSecureUrl", () => {
    it("https URLを安全と判定すること", () => {
      expect(isSecureUrl("https://example.com")).toBe(true);
    });

    it("http URLを安全でないと判定すること", () => {
      expect(isSecureUrl("http://example.com")).toBe(false);
    });

    it("javascript URLを安全でないと判定すること", () => {
      expect(isSecureUrl("javascript:alert('xss')")).toBe(false);
    });

    it("data URLを安全でないと判定すること", () => {
      expect(isSecureUrl("data:text/html,<script>alert('xss')</script>")).toBe(
        false
      );
    });

    it("blob URLを安全でないと判定すること", () => {
      expect(isSecureUrl("blob:https://example.com/abc123")).toBe(false);
    });

    it("相対URLは無効と判定すること", () => {
      // isSecureUrlはnew URL()でパースするため相対URLはエラーになる
      expect(isSecureUrl("/path/to/page")).toBe(false);
    });

    it("空文字を安全でないと判定すること", () => {
      expect(isSecureUrl("")).toBe(false);
    });
  });

  describe("maskApiKey", () => {
    it("APIキーの中間部分をマスクすること", () => {
      const apiKey = "1234567890abcdefghij";
      const masked = maskApiKey(apiKey);
      expect(masked).toMatch(/^1234\*+ghij$/);
    });

    it("8文字以下のAPIキーは全てマスクすること", () => {
      const apiKey = "12345678";
      const masked = maskApiKey(apiKey);
      expect(masked).toBe("********");
    });

    it("非常に短いAPIキーも処理できること", () => {
      const apiKey = "1234";
      const masked = maskApiKey(apiKey);
      expect(masked).toBe("****");
    });
  });

  describe("sanitizeUserInput", () => {
    it("XSS攻撃を防ぐこと", () => {
      const malicious = "<script>alert('xss')</script>";
      const sanitized = sanitizeUserInput(malicious);
      expect(sanitized).not.toContain("<script>");
    });

    it("< と > を削除すること", () => {
      const input = "<div>Hello</div>";
      const sanitized = sanitizeUserInput(input);
      expect(sanitized).toBe("divHello/div");
    });

    it("通常のテキストはそのまま返すこと", () => {
      expect(sanitizeUserInput("Hello World")).toBe("Hello World");
    });

    it("空白をトリムすること", () => {
      expect(sanitizeUserInput("  Hello  ")).toBe("Hello");
    });

    it("javascript:プロトコルを削除すること", () => {
      const input = "javascript:alert('xss')";
      const sanitized = sanitizeUserInput(input);
      expect(sanitized).not.toContain("javascript:");
    });

    it("vbscript:プロトコルを削除すること", () => {
      const input = "vbscript:msgbox";
      const sanitized = sanitizeUserInput(input);
      expect(sanitized).not.toContain("vbscript:");
    });

    it("data:プロトコルを削除すること", () => {
      const input = "data:text/html,<script>alert(1)</script>";
      const sanitized = sanitizeUserInput(input);
      expect(sanitized).not.toContain("data:");
    });

    it("1000文字を超える入力を制限すること", () => {
      const longInput = "a".repeat(2000);
      const sanitized = sanitizeUserInput(longInput);
      expect(sanitized.length).toBe(1000);
    });

    it("大文字小文字を区別せず危険なプロトコルを削除", () => {
      const mixedCase = "JaVaScRiPt:alert('xss')";
      const sanitized = sanitizeUserInput(mixedCase);
      expect(sanitized).not.toContain("JaVaScRiPt:");
    });
  });

  describe("validateApiKey", () => {
    it("有効なAPIキーを検証できること", () => {
      // テスト用のダミーキー（実際のキーではありません）
      expect(validateApiKey("AIzaSyDUMMY_TEST_KEY_NOT_REAL_1234567")).toBe(
        true
      );
    });

    it("undefined を無効と判定すること", () => {
      expect(validateApiKey(undefined)).toBe(false);
    });

    it("空文字を無効と判定すること", () => {
      expect(validateApiKey("")).toBe(false);
    });

    it("短すぎるキーを無効と判定すること", () => {
      expect(validateApiKey("short")).toBe(false);
    });

    it("不正な文字を含むキーを無効と判定すること", () => {
      expect(validateApiKey("AIzaSy@!#$%^&*()")).toBe(false);
    });
  });

  describe("generateNonce", () => {
    it("ランダムな文字列を生成すること", () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();

      expect(nonce1).not.toBe(nonce2);
      expect(nonce1.length).toBeGreaterThan(0);
    });

    it("英数字のみを含むこと", () => {
      const nonce = generateNonce();
      expect(nonce).toMatch(/^[a-zA-Z0-9]+$/);
    });
  });

  describe("safeJsonParse", () => {
    it("有効なJSONをパースできること", () => {
      const json = '{"name":"Test","value":123}';
      const result = safeJsonParse(json, {});

      expect(result).toEqual({ name: "Test", value: 123 });
    });

    it("無効なJSONの場合デフォルト値を返すこと", () => {
      const invalidJson = "{ invalid json }";
      const defaultValue = { error: true };
      const result = safeJsonParse(invalidJson, defaultValue);

      expect(result).toEqual(defaultValue);
    });

    it("空文字の場合デフォルト値を返すこと", () => {
      const defaultValue = { empty: true };
      const result = safeJsonParse("", defaultValue);

      expect(result).toEqual(defaultValue);
    });

    it("配列のJSONをパースできること", () => {
      const json = "[1,2,3]";
      const result = safeJsonParse(json, []);

      expect(result).toEqual([1, 2, 3]);
    });

    it("ネストされたオブジェクトをパースできること", () => {
      const json = '{"outer":{"inner":"value"}}';
      const result = safeJsonParse(json, {});
      expect(result).toEqual({ outer: { inner: "value" } });
    });
  });

  describe("apiRateLimiter", () => {
    afterEach(() => {
      // テスト後にrequestsマップをクリアするため、時間を進める
      vi.useFakeTimers();
      vi.advanceTimersByTime(120000); // 2分進めてリセット
      vi.useRealTimers();
    });

    it("apiRateLimiterが利用可能であること", () => {
      expect(apiRateLimiter).toBeDefined();
      expect(typeof apiRateLimiter.isAllowed).toBe("function");
      expect(typeof apiRateLimiter.getRemainingRequests).toBe("function");
    });

    it("残りリクエスト数を取得できること", () => {
      const remaining = apiRateLimiter.getRemainingRequests("test-api-user");
      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(remaining).toBeLessThanOrEqual(50);
    });
  });

  describe("searchRateLimiter", () => {
    afterEach(() => {
      vi.useFakeTimers();
      vi.advanceTimersByTime(120000);
      vi.useRealTimers();
    });

    it("searchRateLimiterが利用可能であること", () => {
      expect(searchRateLimiter).toBeDefined();
      expect(typeof searchRateLimiter.isAllowed).toBe("function");
      expect(typeof searchRateLimiter.getRemainingRequests).toBe("function");
    });

    it("残りリクエスト数を取得できること", () => {
      const remaining =
        searchRateLimiter.getRemainingRequests("test-search-user");
      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(remaining).toBeLessThanOrEqual(20);
    });
  });

  describe("SecureStorage", () => {
    beforeEach(() => {
      localStorage.clear();
      SecureStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it("prefixを付けてアイテムを保存すること", () => {
      SecureStorage.setItem("key1", "value1");
      expect(localStorage.getItem("sado_restaurant_map_key1")).toBe('"value1"');
    });

    it("保存したアイテムを取得できること", () => {
      SecureStorage.setItem("key1", { data: "test" });
      const result = SecureStorage.getItem("key1", null);
      expect(result).toEqual({ data: "test" });
    });

    it("存在しないキーにはデフォルト値を返すこと", () => {
      expect(SecureStorage.getItem("nonexistent", null)).toBeNull();
      expect(SecureStorage.getItem("nonexistent", { default: true })).toEqual({
        default: true,
      });
    });

    it("アイテムを削除できること", () => {
      SecureStorage.setItem("key1", "value1");
      SecureStorage.removeItem("key1");
      expect(SecureStorage.getItem("key1", null)).toBeNull();
    });

    it("clear()が正常に実行され other_key には影響しないこと", () => {
      SecureStorage.setItem("key1", "value1");
      SecureStorage.setItem("key2", "value2");
      localStorage.setItem("other_key", "other");

      // clear() が例外をスローせずに実行できること
      expect(() => SecureStorage.clear()).not.toThrow();

      // other_keyには影響しない
      expect(localStorage.getItem("other_key")).toBe("other");
    });

    it("不正なJSONを含むアイテムに対してデフォルト値を返すこと", () => {
      localStorage.setItem("sado_restaurant_map_bad", "invalid json");
      expect(SecureStorage.getItem("bad", null)).toBeNull();
    });

    it("複雑なオブジェクトを保存・取得できること", () => {
      const complexData = {
        nested: { deep: { value: 123 } },
        array: [1, 2, 3],
        nullValue: null,
      };
      SecureStorage.setItem("complex", complexData);
      expect(SecureStorage.getItem("complex", null)).toEqual(complexData);
    });

    it("エラーが発生しても処理を継続すること", () => {
      // QuotaExceededErrorをシミュレート
      const originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = vi.fn(() => {
        throw new Error("QuotaExceededError");
      });

      expect(() => SecureStorage.setItem("test", "value")).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  describe("secureFetch", () => {
    it("安全なURLに対してfetchを実行すること", async () => {
      (global.fetch as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({
          "x-content-type-options": "nosniff",
          "x-frame-options": "DENY",
          "x-xss-protection": "1; mode=block",
          "strict-transport-security": "max-age=31536000",
        }),
        json: () => Promise.resolve({ data: "test" } as unknown),
      });

      await secureFetch("https://api.example.com/data");

      expect(global.fetch as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
        "https://api.example.com/data",
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          }),
        })
      );
    });

    it("不正なURLに対してエラーをスローすること", async () => {
      await expect(secureFetch("javascript:alert('xss')")).rejects.toThrow(
        "Insecure URL detected"
      );
    });

    it("httpURLを拒否すること", async () => {
      await expect(secureFetch("http://insecure.com")).rejects.toThrow(
        "Insecure URL detected"
      );
    });

    it("optionsをマージしてfetchすること", async () => {
      (global.fetch as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({
          "x-content-type-options": "nosniff",
          "x-frame-options": "DENY",
          "x-xss-protection": "1; mode=block",
          "strict-transport-security": "max-age=31536000",
        }),
        json: () => Promise.resolve({} as unknown),
      });

      await secureFetch("https://api.example.com/data", {
        method: "POST",
        headers: { "Custom-Header": "value" },
      });

      expect(global.fetch as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
        "https://api.example.com/data",
        expect.objectContaining({
          method: "POST",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          headers: expect.objectContaining({
            "Custom-Header": "value",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          }),
        })
      );
    });
  });

  describe("checkSecurityHeaders", () => {
    it("すべてのセキュリティヘッダーが設定されている場合に警告を出さないこと", () => {
      const mockResponse = {
        headers: new Headers({
          "x-content-type-options": "nosniff",
          "x-frame-options": "DENY",
          "x-xss-protection": "1; mode=block",
          "strict-transport-security": "max-age=31536000",
        }),
      } as Response;

      expect(() => checkSecurityHeaders(mockResponse)).not.toThrow();
    });

    it("セキュリティヘッダーが欠けていても処理を継続すること", () => {
      const mockResponse = {
        headers: new Headers({
          "x-content-type-options": "nosniff",
        }),
      } as Response;

      expect(() => checkSecurityHeaders(mockResponse)).not.toThrow();
    });

    it("空のヘッダーでもエラーにならないこと", () => {
      const mockResponse = {
        headers: new Headers(),
      } as Response;

      expect(() => checkSecurityHeaders(mockResponse)).not.toThrow();
    });
  });

  describe("getSecureEnvVar", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_API_KEY", "test-key-123");
      vi.stubEnv("VITE_PUBLIC_URL", "https://example.com");
    });

    it("環境変数を取得できること", () => {
      expect(getSecureEnvVar("VITE_API_KEY")).toBe("test-key-123");
    });

    it("存在しない環境変数に対してエラーをスローすること", () => {
      expect(() => getSecureEnvVar("NONEXISTENT")).toThrow(
        "環境変数 NONEXISTENT が設定されていません"
      );
    });

    it("空文字の環境変数に対してエラーをスローすること", () => {
      vi.stubEnv("EMPTY_VAR", "");
      expect(() => getSecureEnvVar("EMPTY_VAR")).toThrow();
    });
  });

  describe("generateCSRFToken", () => {
    it("32文字の16進数トークンを生成すること", () => {
      const token = generateCSRFToken();
      expect(token).toHaveLength(32);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it("呼び出しごとに異なるトークンを生成すること", () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("Attack Pattern Testing", () => {
    describe("XSS Prevention", () => {
      it("scriptタグを無害化すること", () => {
        const input = '<script>alert("XSS")</script>';
        expect(sanitizeUserInput(input)).not.toContain("<script");
        expect(sanitizeUserInput(input)).not.toContain("</script>");
      });

      it("タグを除去すること", () => {
        const input = '<img src=x onerror="alert(1)">';
        const result = sanitizeUserInput(input);
        expect(result).not.toContain("<img");
        expect(result).not.toContain("<");
      });

      it("javascript:プロトコルはsanitizeUserInputで削除されること", () => {
        const input = '<a href="javascript:alert(1)">link</a>';
        const result = sanitizeUserInput(input);
        expect(result).not.toContain("javascript:");
      });

      it("data:プロトコルはsanitizeUserInputで削除されること", () => {
        const input =
          '<a href="data:text/html,<script>alert(1)</script>">link</a>';
        const result = sanitizeUserInput(input);
        expect(result).not.toContain("data:");
      });
    });

    describe("Injection Prevention", () => {
      it("SQL風の入力を処理すること", () => {
        const input = "'; DROP TABLE users; --";
        const result = sanitizeUserInput(input);
        expect(result).toBeDefined();
      });

      it("コマンドインジェクション風の入力を処理すること", () => {
        const input = "test && rm -rf /";
        const result = sanitizeUserInput(input);
        expect(result).toBeDefined();
      });
    });
  });

  describe("Edge Cases", () => {
    it("非常に長い文字列を処理できること", () => {
      const longString = "a".repeat(10000);
      expect(() => escapeHtml(longString)).not.toThrow();
      expect(() => sanitizeUserInput(longString)).not.toThrow();
    });

    it("特殊なUnicode文字を処理できること", () => {
      const unicode = "Hello 世界 🌍 مرحبا";
      expect(escapeHtml(unicode)).toContain("世界");
      expect(sanitizeUserInput(unicode)).toBeDefined();
    });

    it("制御文字を含む入力を処理すること", () => {
      const controlChars = "test\x00\x01\x02";
      expect(() => sanitizeUserInput(controlChars)).not.toThrow();
    });

    it("空のオブジェクトや配列を正しくパースすること", () => {
      expect(safeJsonParse("{}", null)).toEqual({});
      expect(safeJsonParse("[]", null)).toEqual([]);
    });
  });
});
