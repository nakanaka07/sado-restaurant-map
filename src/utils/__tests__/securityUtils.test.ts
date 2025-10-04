/**
 * @fileoverview セキュリティユーティリティのテスト
 * securityUtils.ts の単体テスト
 */

import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  generateNonce,
  isSecureUrl,
  maskApiKey,
  safeJsonParse,
  sanitizeUserInput,
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
  });
});
