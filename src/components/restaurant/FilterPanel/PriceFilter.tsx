/**
 * @fileoverview Price filter component
 * 価格帯フィルターコンポーネント
 */

import type { PriceRange } from "@/types";

interface PriceFilterProps {
  value: PriceRange | "";
  onChange: (price: PriceRange | "") => void;
}

const PRICE_OPTIONS: { value: PriceRange | ""; label: string }[] = [
  { value: "", label: "すべての価格帯" },
  { value: "～1000円", label: "～1000円" },
  { value: "1000-2000円", label: "1000-2000円" },
  { value: "2000-3000円", label: "2000-3000円" },
  { value: "3000円～", label: "3000円～" },
];

export function PriceFilter({ value, onChange }: PriceFilterProps) {
  return (
    <div className="filter-price">
      <label htmlFor="price-select" className="filter-label">
        価格帯
      </label>
      <select
        id="price-select"
        value={value}
        onChange={(e) => onChange(e.target.value as PriceRange | "")}
        className="price-select"
        aria-describedby="price-help"
      >
        {PRICE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p id="price-help" className="filter-help">
        予算に合わせてお店を絞り込み
      </p>
    </div>
  );
}
