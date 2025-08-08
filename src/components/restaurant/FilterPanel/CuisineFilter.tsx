/**
 * @fileoverview Cuisine filter component
 * 料理分野フィルターコンポーネント
 */

import type { CuisineType } from "@/types";

interface CuisineFilterProps {
  value: CuisineType | "";
  onChange: (cuisine: CuisineType | "") => void;
}

const CUISINE_OPTIONS: { value: CuisineType | ""; label: string }[] = [
  { value: "", label: "すべての料理" },
  { value: "日本料理", label: "日本料理" },
  { value: "寿司", label: "寿司" },
  { value: "海鮮", label: "海鮮" },
  { value: "焼肉・焼鳥", label: "焼肉・焼鳥" },
  { value: "ラーメン", label: "ラーメン" },
  { value: "そば・うどん", label: "そば・うどん" },
  { value: "中華", label: "中華" },
  { value: "イタリアン", label: "イタリアン" },
  { value: "フレンチ", label: "フレンチ" },
  { value: "カフェ・喫茶店", label: "カフェ・喫茶店" },
  { value: "バー・居酒屋", label: "バー・居酒屋" },
  { value: "ファストフード", label: "ファストフード" },
  { value: "デザート・スイーツ", label: "デザート・スイーツ" },
  { value: "カレー・エスニック", label: "カレー・エスニック" },
  { value: "ステーキ・洋食", label: "ステーキ・洋食" },
  { value: "弁当・テイクアウト", label: "弁当・テイクアウト" },
  { value: "レストラン", label: "レストラン" },
  { value: "その他", label: "その他" },
];

export function CuisineFilter({ value, onChange }: CuisineFilterProps) {
  return (
    <div className="filter-cuisine">
      <label htmlFor="cuisine-select" className="filter-label">
        料理分野
      </label>
      <select
        id="cuisine-select"
        value={value}
        onChange={(e) => onChange(e.target.value as CuisineType | "")}
        className="cuisine-select"
        aria-describedby="cuisine-help"
      >
        {CUISINE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p id="cuisine-help" className="filter-help">
        料理の種類でお店を絞り込み
      </p>
    </div>
  );
}
