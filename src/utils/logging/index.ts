/**
 * @fileoverview Logging utilities barrel export
 * LogManager統合後のエントリーポイント
 */

export {
  // メインクラス
  LogManager,
  // ロガー取得
  getLogger,
  initializeDevLogging,
  // 初期化関数
  initializeLogging,
  // デフォルトインスタンス
  logManager,
  logger,
  restoreLogs,
  // 後方互換性関数
  suppressLogs,
  type LogCategory,
  type LogConfig,
  type LogEntry,
  // 型定義
  type LogLevel,
} from "./LogManager";
