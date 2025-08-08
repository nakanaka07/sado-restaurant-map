/**
 * @fileoverview District filter component
 * 地区フィルターコンポーネント
 */

import type { SadoDistrict } from "@/types";

interface DistrictFilterProps {
  selectedDistricts: SadoDistrict[];
  onToggle: (district: SadoDistrict) => void;
}

const DISTRICT_OPTIONS: { value: SadoDistrict; label: string }[] = [
  { value: "両津", label: "両津" },
  { value: "相川", label: "相川" },
  { value: "佐和田", label: "佐和田" },
  { value: "金井", label: "金井" },
  { value: "新穂", label: "新穂" },
  { value: "畑野", label: "畑野" },
  { value: "真野", label: "真野" },
  { value: "小木", label: "小木" },
  { value: "羽茂", label: "羽茂" },
  { value: "赤泊", label: "赤泊" },
];

export function DistrictFilter({
  selectedDistricts,
  onToggle,
}: DistrictFilterProps) {
  return (
    <div className="filter-district">
      <fieldset>
        <legend className="filter-label">地区</legend>
        <div
          className="district-options"
          role="group"
          aria-describedby="district-help"
        >
          {DISTRICT_OPTIONS.map((option) => (
            <label key={option.value} className="district-option">
              <input
                type="checkbox"
                checked={selectedDistricts.includes(option.value)}
                onChange={() => onToggle?.(option.value)}
                className="district-checkbox"
                aria-describedby="district-help"
              />
              <span className="district-label">{option.label}</span>
            </label>
          ))}
        </div>
        <p id="district-help" className="filter-help">
          複数の地区を選択できます
        </p>
      </fieldset>
    </div>
  );
}
