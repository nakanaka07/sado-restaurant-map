/**
 * @fileoverview Cuisine filter component
 * 料理タイプフィルターコンポーネント
 */

import { memo, useMemo } from "react";
import type { CuisineType } from "@/types";

interface CuisineFilterProps {
  readonly value: CuisineType | "";
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const CUISINE_OPTIONS: readonly CuisineType[] = [
  "日本料理",
  "寿司",
  "海鮮",
  "焼肉・焼鳥",
  "ラーメン",
  "そば・うどん",
  "中華",
  "イタリアン",
  "フレンチ",
  "カフェ・喫茶店",
  "バー・居酒屋",
  "ファストフード",
  "デザート・スイーツ",
  "カレー・エスニック",
  "ステーキ・洋食",
  "弁当・テイクアウト",
  "レストラン",
  "その他",
];

export const CuisineFilter = memo<CuisineFilterProps>(function CuisineFilter({
  value,
  onChange,
}) {
  const cuisineOptions = useMemo(
    () =>
      CUISINE_OPTIONS.map(cuisine => (
        <option key={cuisine} value={cuisine}>
          {cuisine}
        </option>
      )),
    []
  );

  return (
    <div className="filter-section">
      <label htmlFor="modern-cuisine" className="filter-label">
        <span
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "var(--color-text-primary)",
          }}
        >
          🍽️ 料理ジャンル
        </span>
      </label>
      <select
        id="modern-cuisine"
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "2px solid #e5e7eb",
          borderRadius: "8px",
          fontSize: "14px",
          backgroundColor: "#fff",
          transition: "all 0.2s ease",
        }}
        onFocus={e => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }}
        onBlur={e => {
          e.target.style.borderColor = "#e5e7eb";
          e.target.style.boxShadow = "none";
        }}
        aria-describedby="cuisine-help"
      >
        <option value="">すべての料理</option>
        {cuisineOptions}
      </select>
      <div id="cuisine-help" className="sr-only">
        料理ジャンルでフィルタリングします
      </div>
    </div>
  );
});
