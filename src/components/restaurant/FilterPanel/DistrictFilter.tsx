/**
 * @fileoverview District filter component
 * モダンな地区フィルターコンポーネント
 */

import { memo, useMemo, useCallback } from "react";
import type { SadoDistrict } from "@/types";

interface DistrictFilterProps {
  readonly selectedDistricts: SadoDistrict[];
  onToggle: (district: SadoDistrict) => void;
  readonly isExpanded: boolean;
  onToggleExpanded: () => void;
}

const DISTRICTS: readonly SadoDistrict[] = [
  "両津",
  "相川",
  "佐和田",
  "金井",
  "新穂",
  "畑野",
  "真野",
  "小木",
  "羽茂",
  "赤泊",
  "その他",
];

export const DistrictFilter = memo<DistrictFilterProps>(
  function DistrictFilter({
    selectedDistricts,
    onToggle,
    isExpanded,
    onToggleExpanded,
  }) {
    const handleDistrictToggle = useCallback(
      (district: SadoDistrict) => () => {
        onToggle(district);
      },
      [onToggle]
    );

    const districtCheckboxes = useMemo(
      () =>
        DISTRICTS.map((district) => (
          <label
            key={district}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "var(--color-text-primary)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={selectedDistricts.includes(district)}
              onChange={handleDistrictToggle(district)}
              style={{
                width: "16px",
                height: "16px",
                accentColor: "#3b82f6",
              }}
            />
            {district}
          </label>
        )),
      [selectedDistricts, handleDistrictToggle]
    );

    return (
      <div className="filter-section">
        <button
          type="button"
          onClick={onToggleExpanded}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "10px 12px",
            border: "2px solid #e5e7eb",
            borderRadius: "8px",
            backgroundColor: "#f9fafb",
            fontSize: "14px",
            fontWeight: "600",
            color: "var(--color-text-primary)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f3f4f6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#f9fafb";
          }}
          aria-expanded={isExpanded}
          aria-controls="district-options"
        >
          <span>
            🗺️ 地域{" "}
            {selectedDistricts.length > 0 && `(${selectedDistricts.length})`}
          </span>
          <span
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.2s",
            }}
          >
            ▼
          </span>
        </button>

        {isExpanded && (
          <div
            id="district-options"
            style={{
              marginTop: "8px",
              padding: "12px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              backgroundColor: "#fff",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            {districtCheckboxes}
          </div>
        )}
      </div>
    );
  }
);
