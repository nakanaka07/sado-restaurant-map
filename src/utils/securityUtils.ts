// セキュリティ関連のユーティリティ関数

/**
 * XSS攻撃対策 - HTMLエスケープ
 */
export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * XSS攻撃対策 - HTMLタグの除去
 */
export function stripHtml(text: string): string {
  const div = document.createElement("div");
  div.innerHTML = text;
  return div.textContent || div.innerText || "";
}

/**
 * URL検証 - 安全なURLかチェック
 */
export function isSecureUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // HTTPS または localhost のみ許可
    return (
      parsedUrl.protocol === "https:" ||
      (parsedUrl.protocol === "http:" && parsedUrl.hostname === "localhost")
    );
  } catch {
    return false;
  }
}

/**
 * APIキーのマスキング - ログ出力時の機密情報保護
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return "*".repeat(apiKey.length);
  return apiKey.slice(0, 4) + "*".repeat(apiKey.length - 8) + apiKey.slice(-4);
}

/**
 * ユーザー入力のサニタイゼーション
 */
export function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // HTML タグの一部を除去
    .replace(/javascript:/gi, "") // JavaScript実行の防止
    .replace(/vbscript:/gi, "") // VBScript実行の防止
    .replace(/data:/gi, "") // Data URI の防止
    .slice(0, 1000); // 長すぎる入力の制限
}

/**
 * CSP (Content Security Policy) 用のnonce生成
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * 環境変数の安全な取得
 */
export function getSecureEnvVar(key: string): string {
  const value = import.meta.env[key] as string | undefined;
  if (!value) {
    throw new Error(`環境変数 ${key} が設定されていません`);
  }
  return value;
}

/**
 * レート制限チェック
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1分
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const userRequests = this.requests.get(identifier);
    if (!userRequests) {
      this.requests.set(identifier, [now]);
      return true;
    }
    // 古いリクエストを削除
    const validRequests = userRequests.filter(
      (timestamp) => timestamp > windowStart
    );

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter(
      (timestamp) => timestamp > windowStart
    );
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

export const apiRateLimiter = new RateLimiter(50, 60000); // API用: 1分間に50回
export const searchRateLimiter = new RateLimiter(20, 60000); // 検索用: 1分間に20回

/**
 * CSRF対策用のトークン生成（将来のフォーム送信用）
 */
export function generateCSRFToken(): string {
  return generateNonce();
}

/**
 * 安全なJSON解析
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    const parsed: unknown = JSON.parse(jsonString);
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

/**
 * ローカルストレージの安全な操作
 */
export class SecureStorage {
  private static prefix = "sado_restaurant_map_";

  static setItem(key: string, value: unknown): void {
    try {
      const secureKey = this.prefix + key;
      const jsonValue = JSON.stringify(value);
      localStorage.setItem(secureKey, jsonValue);
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }

  static getItem<T>(key: string, defaultValue: T): T {
    try {
      const secureKey = this.prefix + key;
      const item = localStorage.getItem(secureKey);
      if (item === null) return defaultValue;
      return safeJsonParse(item, defaultValue);
    } catch (error) {
      console.warn("Failed to read from localStorage:", error);
      return defaultValue;
    }
  }

  static removeItem(key: string): void {
    try {
      const secureKey = this.prefix + key;
      localStorage.removeItem(secureKey);
    } catch (error) {
      console.warn("Failed to remove from localStorage:", error);
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }
  }
}

/**
 * セキュリティヘッダーのチェック
 */
export function checkSecurityHeaders(response: Response): void {
  const securityHeaders = [
    "x-content-type-options",
    "x-frame-options",
    "x-xss-protection",
    "strict-transport-security",
  ];

  securityHeaders.forEach((header) => {
    if (!response.headers.get(header) && import.meta.env.DEV) {
      console.warn(`Missing security header: ${header}`);
    }
  });
}

/**
 * 安全なfetch wrapper
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {},
  rateLimiter?: RateLimiter
): Promise<Response> {
  // URL検証
  if (!isSecureUrl(url)) {
    throw new Error("Insecure URL detected");
  }

  // レート制限チェック
  if (rateLimiter && !rateLimiter.isAllowed(url)) {
    throw new Error("Rate limit exceeded");
  }

  // セキュリティヘッダーの追加
  const secureOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, secureOptions);

    // セキュリティヘッダーのチェック
    checkSecurityHeaders(response);

    return response;
  } catch (error) {
    console.error("Secure fetch failed:", error);
    throw error;
  }
}
