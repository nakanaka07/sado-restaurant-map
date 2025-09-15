/**
 * @fileoverview Hybrid Marker Configuration - ICOOON MONO + Phosphor Icons統合設定
 * 佐渡島レストランマップ用10カテゴリ完全対応
 */

/**
 * ハイブリッドマーカー設定インターフェース
 */
export interface HybridMarkerConfig {
  id: string;
  name: string;
  primary: string; // メインカラー
  secondary: string; // グラデーション2色目
  iconSource: "icooon-mono" | "phosphor" | "fallback";
  iconId: string; // アイコンID
  iconSvgPath: string; // SVGファイルパス
  iconEmoji: string; // フォールバック絵文字
  contrastRatio: number; // WCAG AAコントラスト比
  categoryLabel: string; // 表示ラベル
  showCategoryBadge: boolean; // カテゴリバッジ表示
  description: string; // アクセシビリティ説明
}

/**
 * 佐渡島レストランマップ10カテゴリ設定
 * ICOOON MONO優先 + Phosphor Icons補完戦略
 */
export const HYBRID_MARKER_CONFIGS: Record<string, HybridMarkerConfig> = {
  // 🍚 【1】和食 - ICOOON MONO最優先（日本料理の表現力）
  和食: {
    id: "japanese-cuisine",
    name: "和食",
    primary: "#d32f2f", // 日本の赤（朱色系）
    secondary: "#b71c1c",
    iconSource: "icooon-mono",
    iconId: "ochawan-hashi", // お茶碗と箸
    iconSvgPath: "/src/assets/markers/icooon-mono/ochawan-hashi.svg",
    iconEmoji: "🍚",
    contrastRatio: 5.8,
    categoryLabel: "和食",
    showCategoryBadge: true,
    description: "和食料理店のマーカー",
  },

  // 🍜 【2】麺類 - ICOOON MONO（蕎麦・うどんアイコン充実）
  麺類: {
    id: "noodles",
    name: "麺類",
    primary: "#f57c00", // 麺の黄金色
    secondary: "#e65100",
    iconSource: "icooon-mono",
    iconId: "soba-udon",
    iconSvgPath: "/src/assets/markers/icooon-mono/soba-udon.svg",
    iconEmoji: "🍜",
    contrastRatio: 4.7,
    categoryLabel: "麺類",
    showCategoryBadge: true,
    description: "ラーメン・そば・うどん店のマーカー",
  },

  // 🔥 【3】焼肉・グリル - Phosphor Icons（Fire表現が秀逸）
  "焼肉・グリル": {
    id: "grill-bbq",
    name: "焼肉・グリル",
    primary: "#bf360c", // 炎の赤
    secondary: "#8d2f23",
    iconSource: "phosphor",
    iconId: "fire",
    iconSvgPath: "/src/assets/markers/phosphor/fire.svg",
    iconEmoji: "🔥",
    contrastRatio: 5.2,
    categoryLabel: "焼肉",
    showCategoryBadge: true,
    description: "焼肉・グリル料理店のマーカー",
  },

  // 🍕 【4】多国籍料理 - ICOOON MONO（ピザ等国際料理）
  多国籍料理: {
    id: "international-cuisine",
    name: "多国籍料理",
    primary: "#388e3c", // 国際的なグリーン
    secondary: "#2e7d32",
    iconSource: "icooon-mono",
    iconId: "pizza",
    iconSvgPath: "/src/assets/markers/icooon-mono/pizza.svg",
    iconEmoji: "🍕",
    contrastRatio: 4.6,
    categoryLabel: "多国籍",
    showCategoryBadge: true,
    description: "イタリアン・エスニックなど多国籍料理店のマーカー",
  },

  // ☕ 【5】カフェ・軽食 - ICOOON MONO（紅茶・コーヒーアイコン）
  "カフェ・軽食": {
    id: "cafe-light-meals",
    name: "カフェ・軽食",
    primary: "#5d4037", // コーヒーブラウン
    secondary: "#4e2c1f",
    iconSource: "icooon-mono",
    iconId: "kocha-cup",
    iconSvgPath: "/src/assets/markers/icooon-mono/kocha-cup.svg",
    iconEmoji: "☕",
    contrastRatio: 6.1,
    categoryLabel: "カフェ",
    showCategoryBadge: true,
    description: "カフェ・喫茶店・軽食店のマーカー",
  },

  // 🍷 【6】居酒屋・バー - ICOOON MONO（酒類アイコン充実）
  "居酒屋・バー": {
    id: "izakaya-bar",
    name: "居酒屋・バー",
    primary: "#7b1fa2", // 紫（夜の色）
    secondary: "#6a1b9a",
    iconSource: "icooon-mono",
    iconId: "bottle-wine",
    iconSvgPath: "/src/assets/markers/icooon-mono/bottle-wine.svg",
    iconEmoji: "🍷",
    contrastRatio: 4.8,
    categoryLabel: "居酒屋",
    showCategoryBadge: true,
    description: "居酒屋・バー・酒場のマーカー",
  },

  // 🍔 【7】ファストフード - Phosphor Icons（ハンバーガー等）
  ファストフード: {
    id: "fast-food",
    name: "ファストフード",
    primary: "#f44336", // 鮮やかな赤
    secondary: "#d32f2f",
    iconSource: "phosphor",
    iconId: "hamburger",
    iconSvgPath: "/src/assets/markers/phosphor/hamburger.svg",
    iconEmoji: "🍔",
    contrastRatio: 5.1,
    categoryLabel: "FF",
    showCategoryBadge: true,
    description: "ファストフード店のマーカー",
  },

  // 🍽️【8】一般レストラン - ICOOON MONO（フォーク・ナイフ）
  一般レストラン: {
    id: "general-restaurant",
    name: "一般レストラン",
    primary: "#1976d2", // 標準的なブルー
    secondary: "#0d47a1",
    iconSource: "icooon-mono",
    iconId: "fork-knife",
    iconSvgPath: "/src/assets/markers/icooon-mono/fork-knife.svg",
    iconEmoji: "🍽️",
    contrastRatio: 5.2,
    categoryLabel: "レストラン",
    showCategoryBadge: false, // 汎用的なのでバッジ非表示
    description: "一般レストランのマーカー",
  },

  // 🅿️ 【9】駐車場 - Phosphor Icons（車・駐車場アイコン）
  駐車場: {
    id: "parking",
    name: "駐車場",
    primary: "#2e7d32", // 緑（駐車場の標識色）
    secondary: "#1b5e20",
    iconSource: "phosphor",
    iconId: "car",
    iconSvgPath: "/src/assets/markers/phosphor/car.svg",
    iconEmoji: "🅿️",
    contrastRatio: 4.6,
    categoryLabel: "駐車場",
    showCategoryBadge: true,
    description: "駐車場のマーカー",
  },

  // 🚻 【10】トイレ - Phosphor Icons（トイレ・設備アイコン）
  トイレ: {
    id: "toilet",
    name: "トイレ",
    primary: "#1565c0", // 青（トイレ表示の標準色）
    secondary: "#0d47a1",
    iconSource: "phosphor",
    iconId: "toilet",
    iconSvgPath: "/src/assets/markers/phosphor/toilet.svg",
    iconEmoji: "🚻",
    contrastRatio: 5.1,
    categoryLabel: "トイレ",
    showCategoryBadge: true,
    description: "トイレ・お手洗いのマーカー",
  },
};

/**
 * レガシー18カテゴリから10カテゴリへのマッピング
 * 既存データ互換性確保
 */
export const LEGACY_CATEGORY_MAPPING: Record<string, string> = {
  // 和食系統合
  和食: "和食",
  寿司: "和食",
  天ぷら: "和食",

  // 麺類統合
  ラーメン: "麺類",
  そば: "麺類",
  うどん: "麺類",

  // 焼肉・グリル統合
  焼肉: "焼肉・グリル",
  焼鳥: "焼肉・グリル",
  鉄板焼き: "焼肉・グリル",

  // 多国籍料理統合
  イタリアン: "多国籍料理",
  フレンチ: "多国籍料理",
  中華: "多国籍料理",
  エスニック: "多国籍料理",

  // カフェ・軽食統合
  カフェ: "カフェ・軽食",
  喫茶店: "カフェ・軽食",
  軽食: "カフェ・軽食",

  // 居酒屋・バー統合
  居酒屋: "居酒屋・バー",
  バー: "居酒屋・バー",
  酒場: "居酒屋・バー",

  // その他レストラン → 一般レストラン
  洋食: "一般レストラン",
  その他: "一般レストラン",
};
