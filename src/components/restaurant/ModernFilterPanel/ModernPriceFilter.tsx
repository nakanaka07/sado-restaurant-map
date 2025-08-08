/**
 * @fileoverview Modern price filter component
 * モダンな価格フィルターコンポーネント
 */

import type { PriceRange } from "@/types";

interface ModernPriceFilterProps {
  value: PriceRange | "";
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const PRICE_OPTIONS: PriceRange[] = [
  "～1000円",
  "1000-2000円",
  "2000-3000円",
  "3000円～",
];

export function ModernPriceFilter({ value, onChange }: ModernPriceFilterProps) {
  return (
    <div className="filter-section">
      <label htmlFor="modern-price" className="filter-label">
        <span
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "var(--color-text-primary)",
          }}
        >
          💰 価格帯
        </span>
      </label>
      <select
        id="modern-price"
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
        onFocus={(e) => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e5e7eb";
          e.target.style.boxShadow = "none";
        }}
        aria-describedby="price-help"
      >
        <option value="">すべての価格帯</option>
        {PRICE_OPTIONS.map((price) => (
          <option key={price} value={price}>
            {price}
          </option>
        ))}
      </select>
      <div id="price-help" className="sr-only">
        価格帯でフィルタリングします
      </div>
    </div>
  );
}
