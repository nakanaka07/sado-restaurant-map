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

/** ユーザーセグメント */
export type UserSegment =
  | "early-adopter"
  | "beta-tester"
  | "general"
  | "control";

/** A/Bテスト設定 */
export interface ABTestConfig {
  readonly enabled: boolean;
  readonly currentPhase: RolloutPhase;
  readonly rolloutPercentage: number;
  readonly defaultVariant: ABTestVariant;
  readonly testingModeEnabled: boolean;
  readonly forceVariant?: ABTestVariant; // 開発者強制設定
}

/** ユーザー分類結果 */
export interface UserClassification {
  readonly segment: UserSegment;
  readonly variant: ABTestVariant;
  readonly isInTest: boolean;
  readonly testingModeAvailable: boolean;
}

// ==============================
// A/Bテスト設定定数
// ==============================

/** 現在のA/Bテスト設定 */
export const CURRENT_AB_TEST_CONFIG: ABTestConfig = {
  enabled: true,
  currentPhase: "phase2", // Phase 3開始: 50%ロールアウト
  rolloutPercentage: 50, // 50%のユーザーに新機能展開
  defaultVariant: "enhanced-png", // デフォルトは改良PNG
  testingModeEnabled: true, // テストモード有効
  // forceVariant: 'testing', // 開発時の強制設定（本番では無効化）
} as const;

/** フェーズ別ロールアウト設定 */
export const ROLLOUT_PHASES: Record<
  RolloutPhase,
  {
    percentage: number;
    description: string;
    targetSegments: UserSegment[];
  }
> = {
  phase1: {
    percentage: 20,
    description: "Early Adopter向け限定リリース",
    targetSegments: ["early-adopter"],
  },
  phase2: {
    percentage: 50,
    description: "Beta Testing拡大リリース",
    targetSegments: ["early-adopter", "beta-tester"],
  },
  phase3: {
    percentage: 80,
    description: "General User段階展開",
    targetSegments: ["early-adopter", "beta-tester", "general"],
  },
  phase4: {
    percentage: 100,
    description: "Phase 4: UX最適化・クラスタリング機能",
    targetSegments: ["early-adopter", "beta-tester"],
  },
  complete: {
    percentage: 100,
    description: "全ユーザー完全展開",
    targetSegments: ["early-adopter", "beta-tester", "general", "control"],
  },
} as const;

// ==============================
// ユーザー分類ロジック
// ==============================

/**
 * ユーザーIDに基づくハッシュ生成
 * 一貫したユーザー分類のため
 */
function generateUserHash(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit整数に変換
  }
  return Math.abs(hash);
}

/**
 * ユーザーIDからセグメントを決定
 */
function getUserSegment(userId: string): UserSegment {
  const hash = generateUserHash(userId);
  const percentage = hash % 100;

  // セグメント分類（確率的分散）
  if (percentage < 10) return "early-adopter"; // 10%
  if (percentage < 30) return "beta-tester"; // 20%
  if (percentage < 80) return "general"; // 50%
  return "control"; // 20%
}

/**
 * 現在のフェーズとセグメントに基づくバリアント決定
 */
function getVariantForUser(
  segment: UserSegment,
  config: ABTestConfig
): ABTestVariant {
  const phaseConfig = ROLLOUT_PHASES[config.currentPhase];

  // 強制バリアント設定がある場合（開発用）
  if (config.forceVariant && import.meta.env.DEV) {
    return config.forceVariant;
  }

  // 現在フェーズの対象セグメントかチェック
  const isInTargetSegment = phaseConfig.targetSegments.includes(segment);

  if (isInTargetSegment) {
    // セグメント別バリアント分配
    switch (segment) {
      case "early-adopter":
        // Phase 4の場合は新機能を優先
        return config.currentPhase === "phase4" ? "phase4-enhanced" : "svg";
      case "beta-tester":
        return config.currentPhase === "phase4"
          ? "phase4-enhanced"
          : "enhanced-png";
      case "general":
        return Math.random() < 0.5 ? "enhanced-png" : "original";
      case "control":
      default:
        return "original"; // 従来のマーカー
    }
  }

  return config.defaultVariant;
}

// ==============================
// メイン分類関数
// ==============================

/**
 * ユーザーを分類しA/Bテストバリアントを決定
 */
export function classifyUser(
  userId?: string,
  config: ABTestConfig = CURRENT_AB_TEST_CONFIG
): UserClassification {
  // A/Bテストが無効の場合
  if (!config.enabled) {
    return {
      segment: "control",
      variant: config.defaultVariant,
      isInTest: false,
      testingModeAvailable: false,
    };
  }

  // ユーザーIDが未設定の場合は匿名ユーザーとして処理
  const actualUserId = userId || `anonymous-${Date.now()}-${Math.random()}`;

  // セグメント決定
  const segment = getUserSegment(actualUserId);

  // バリアント決定
  const variant = getVariantForUser(segment, config);

  // テスト参加判定
  const phaseConfig = ROLLOUT_PHASES[config.currentPhase];
  const isInTest = phaseConfig.targetSegments.includes(segment);

  return {
    segment,
    variant,
    isInTest,
    testingModeAvailable:
      config.testingModeEnabled &&
      (segment === "early-adopter" ||
        segment === "beta-tester" ||
        import.meta.env.DEV),
  };
}

// ==============================
// ローカルストレージ管理
// ==============================

const AB_TEST_STORAGE_KEY = "sado-restaurant-map-ab-test";

/** A/Bテスト状態をローカルストレージに保存 */
export function saveABTestState(classification: UserClassification): void {
  try {
    const state = {
      ...classification,
      timestamp: Date.now(),
      version: "1.0",
    };
    localStorage.setItem(AB_TEST_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("A/Bテスト状態の保存に失敗:", error);
  }
}

/** ローカルストレージからA/Bテスト状態を読み込み */
export function loadABTestState(): UserClassification | null {
  try {
    const stored = localStorage.getItem(AB_TEST_STORAGE_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored) as {
      timestamp?: number;
      segment?: UserSegment;
      variant?: ABTestVariant;
      isInTest?: boolean;
      testingModeAvailable?: boolean;
    };

    // 24時間以内のデータのみ有効
    const isValid =
      state.timestamp && Date.now() - state.timestamp < 24 * 60 * 60 * 1000;

    if (!isValid) {
      localStorage.removeItem(AB_TEST_STORAGE_KEY);
      return null;
    }

    return {
      segment: state.segment as UserSegment,
      variant: state.variant as ABTestVariant,
      isInTest: state.isInTest as boolean,
      testingModeAvailable: state.testingModeAvailable as boolean,
    };
  } catch (error) {
    console.warn("A/Bテスト状態の読み込みに失敗:", error);
    return null;
  }
}

// ==============================
// Analytics統合
// ==============================

/** A/Bテストイベントの記録 */
export function trackABTestEvent(
  eventType: "assigned" | "interaction" | "conversion",
  data: {
    variant: ABTestVariant;
    segment: UserSegment;
    phase: RolloutPhase;
    metadata?: Record<string, unknown>;
  }
): void {
  try {
    // Google Analytics 4イベント
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "ab_test_event", {
        event_category: "ab_testing",
        event_label: eventType,
        custom_parameter_variant: data.variant,
        custom_parameter_segment: data.segment,
        custom_parameter_phase: data.phase,
        ...data.metadata,
      });
    }

    // コンソールログ（開発環境）
    if (import.meta.env.DEV) {
      console.log("🧪 A/B Test Event:", {
        type: eventType,
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.warn("A/Bテストイベントの記録に失敗:", error);
  }
}

// ==============================
// 開発者ユーティリティ
// ==============================

/**
 * A/Bテストの現在状態をコンソールに出力（開発用）
 */
export function debugABTestStatus(): void {
  if (!import.meta.env.DEV) return;

  const classification = classifyUser();
  const config = CURRENT_AB_TEST_CONFIG;
  const phaseConfig = ROLLOUT_PHASES[config.currentPhase];

  console.group("🧪 A/B Test Status Debug");
  console.log("📊 Current Configuration:", config);
  console.log("🎯 User Classification:", classification);
  console.log("📈 Current Phase:", phaseConfig);
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
if (import.meta.env.DEV) {
  // @ts-expect-error - 開発環境のwindowオブジェクト拡張
  window.debugABTest = debugABTestStatus;
  // @ts-expect-error - 開発環境のwindowオブジェクト拡張
  window.resetABTest = resetABTestState;
}
