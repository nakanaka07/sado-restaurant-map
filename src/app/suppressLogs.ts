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
  const noop: (..._args: unknown[]) => void = () => {};

  // console メソッドを mutable に扱うための補助型
  type MutableConsole = {
    [K in keyof Console]: Console[K];
  };
  const mConsole = console as unknown as MutableConsole;
  mConsole.log = noop;
  mConsole.info = noop;
  mConsole.debug = noop;

  if (options.suppressWarn) {
    mConsole.warn = noop;
  }
  if (options.suppressError) {
    mConsole.error = noop;
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
  log: (...args: unknown[]) => console.log(...args),
  info: (...args: unknown[]) => console.info(...args),
  debug: (...args: unknown[]) => console.debug(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};
