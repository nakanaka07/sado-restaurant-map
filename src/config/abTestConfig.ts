/**
 * @fileoverview A/B Test Configuration
 * A/Bテスト設定管理システム
 *
 * 🎯 機能:
 * 1. 段階的ロールアウト管理 (20% → 50% → 100%)
 * 2. ユーザーセグメント分類
 * 3. マーカータイプ選択制御
 * 4. テスト結果収集
 */

// ==============================
// A/Bテスト設定型定義
// ==============================

/** A/Bテストのバリアント */
export type ABTestVariant =
  | "original"
  | "enhanced-png"
  | "svg"
  | "testing"
  | "phase4-enhanced";

/** ロールアウトフェーズ */
export type RolloutPhase =
  | "phase1"
  | "phase2"
  | "phase3"
  | "phase4"
  | "complete";

/** ユーザーセグメント (開発用簡素化) */
export type UserSegment = "general";

/** A/Bテスト設定 (開発用簡素化) */
export interface ABTestConfig {
  readonly enabled: boolean;
  readonly defaultVariant: ABTestVariant;
  readonly forceVariant?: ABTestVariant; // 開発者強制設定
}

/** ユーザー分類結果 (開発用簡素化) */
export interface UserClassification {
  readonly segment: UserSegment;
  readonly variant: ABTestVariant;
}

// ==============================
// A/Bテスト設定定数
// ==============================

/** 現在のA/Bテスト設定 (開発用簡素化) */
export const CURRENT_AB_TEST_CONFIG: ABTestConfig = {
  enabled: true,
  defaultVariant: "enhanced-png",
  // forceVariant: 'testing', // 開発時の強制設定
} as const;

// ==============================
// ユーザー分類ロジック (簡素化)
// ==============================

// ==============================
// メイン分類関数
// ==============================

/**
 * ユーザーを分類しA/Bテストバリアントを決定 (簡素化版)
 */
export function classifyUser(
  _userId?: string,
  config: ABTestConfig = CURRENT_AB_TEST_CONFIG
): UserClassification {
  // 開発環境では強制バリアント設定を優先
  const variant =
    config.forceVariant && import.meta.env.DEV
      ? config.forceVariant
      : config.defaultVariant;

  return {
    segment: "general",
    variant,
  };
}

// ==============================
// ローカルストレージ管理
// ==============================

const AB_TEST_STORAGE_KEY = "sado-restaurant-map-ab-test";

/** A/Bテスト状態をローカルストレージに保存 (簡素化) */
export function saveABTestState(classification: UserClassification): void {
  try {
    localStorage.setItem(AB_TEST_STORAGE_KEY, JSON.stringify(classification));
  } catch (error) {
    console.warn("A/Bテスト状態の保存に失敗:", error);
  }
}

/** ローカルストレージからA/Bテスト状態を読み込み (簡素化) */
export function loadABTestState(): UserClassification | null {
  try {
    const stored = localStorage.getItem(AB_TEST_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as UserClassification) : null;
  } catch (error) {
    console.warn("A/Bテスト状態の読み込みに失敗:", error);
    return null;
  }
}

// ==============================
// Analytics統合
// ==============================

/** A/Bテストイベントの記録 (簡素化) */
export function trackABTestEvent(
  eventType: string,
  data: {
    variant: ABTestVariant;
    segment: UserSegment;
    metadata?: Record<string, unknown>;
  }
): void {
  // 開発環境のみログ出力
  if (import.meta.env.DEV) {
    console.log("🧪 A/B Test Event:", {
      type: eventType,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}

// ==============================
// 開発者ユーティリティ
// ==============================

// ==============================
// MarkerType 派生ロジック (UI同期用)
// ==============================

/** マーカー描画システムで使用する型 (UI側と共有) */
export type MarkerType =
  | "original"
  | "enhanced-png"
  | "svg"
  | "circular-icooon";

/**
 * A/Bバリアントから実際に使用する MarkerType を決定
 * ※ 現段階では variant と 1:1 だが将来の phase4-enhanced 等を circular-icooon にマッピング
 * @param variant ABTestVariant
 */
export function deriveMarkerType(variant: ABTestVariant): MarkerType {
  // ポリシー: 現在は全バリアント circular-icooon に統一。
  // Sonar 警告回避と将来再拡張を見据え mapping 形式で実装。
  const mapping: Record<ABTestVariant, MarkerType> = {
    original: "circular-icooon",
    "enhanced-png": "circular-icooon",
    svg: "circular-icooon",
    "phase4-enhanced": "circular-icooon",
    testing: "circular-icooon",
  };
  return mapping[variant];
}

/**
 * A/Bテストの現在状態をコンソールに出力（開発用簡素化）
 */
export function debugABTestStatus(): void {
  if (!import.meta.env.DEV) return;

  console.group("🧪 A/B Test Status Debug");
  console.log("📊 Configuration:", CURRENT_AB_TEST_CONFIG);
  console.log("🎯 Classification:", classifyUser());
  console.log("💾 Stored State:", loadABTestState());
  console.groupEnd();
}

/**
 * A/Bテスト設定をリセット（開発用）
 */
export function resetABTestState(): void {
  if (!import.meta.env.DEV) return;

  localStorage.removeItem(AB_TEST_STORAGE_KEY);
  console.log("🔄 A/B Test state has been reset");
}

// 開発環境での自動デバッグ
if (import.meta.env.DEV && typeof window !== "undefined") {
  // @ts-expect-error - 開発環境のwindowオブジェクト拡張
  window.debugABTest = debugABTestStatus;
  // @ts-expect-error - 開発環境のwindowオブジェクト拡張
  window.resetABTest = resetABTestState;
}
