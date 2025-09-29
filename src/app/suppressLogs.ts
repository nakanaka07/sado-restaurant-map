/**
 * 一時的に console 出力を抑制するユーティリティ。
 * Vite 環境変数 `VITE_SUPPRESS_DEV_LOGS` が 'true' の場合、
 * 指定レベル以下 (log/info/debug) を no-op に差し替える。
 *
 * error / warn はデフォルト残す (致命 / 注意喚起) が、
 * 必要ならオプションで拡張可能。
 */
type SuppressOptions = {
  /** warn も抑制するか (error は常に残す) */
  suppressWarn?: boolean;
  /** error まで抑制 (推奨しない) */
  suppressError?: boolean;
};

let restored = false;
let originalConsole: Partial<typeof console> | null = null;

export function suppressLogs(options: SuppressOptions = {}) {
  if (typeof window === "undefined") return; // SSR 将来対応余地
  if (originalConsole) return; // 二重適用防止

  originalConsole = { ...console };

  // 基本 no-op
  const noop = () => {};
  (console as any).log = noop;
  (console as any).info = noop;
  (console as any).debug = noop;

  if (options.suppressWarn) {
    (console as any).warn = noop;
  }
  if (options.suppressError) {
    (console as any).error = noop;
  }
}

export function restoreLogs() {
  if (!originalConsole || restored) return;
  Object.assign(console, originalConsole);
  restored = true;
}

// 自動適用: VITE_SUPPRESS_DEV_LOGS === 'true'
// build 時にも使えるよう import 副作用で実行せず、 main で明示呼び出し。

export function autoApplySuppression() {
  if (import.meta.env?.VITE_SUPPRESS_DEV_LOGS === "true") {
    suppressLogs({ suppressWarn: false });
  }
}

// 型補助: 将来 logger ラッパ導入時に差し替え予定
export const logger = {
  log: (...args: any[]) => console.log(...args),
  info: (...args: any[]) => console.info(...args),
  debug: (...args: any[]) => console.debug(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};
