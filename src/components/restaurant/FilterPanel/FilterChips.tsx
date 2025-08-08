/**
 * @fileoverview Filter chips component
 * フィルター選択状態表示コンポーネント
 */

import type {
  CuisineType,
  PriceRange,
  SadoDistrict,
  MapPointType,
} from "@/types";

interface FilterChipsProps {
  searchQuery: string;
  selectedCuisine: CuisineType | "";
  selectedPrice: PriceRange | "";
  selectedDistricts: SadoDistrict[];
  selectedRating: number | undefined;
  openNow: boolean;
  selectedFeatures: string[];
  selectedPointTypes: MapPointType[];
  onClearSearch: () => void;
  onClearCuisine: () => void;
  onClearPrice: () => void;
  onClearDistrict: (district: SadoDistrict) => void;
  onClearRating: () => void;
  onClearOpenNow: () => void;
  onClearFeature: (feature: string) => void;
  onClearPointType: (pointType: MapPointType) => void;
  onClearAll: () => void;
  resultCount: number;
}

export function FilterChips({
  searchQuery,
  selectedCuisine,
  selectedPrice,
  selectedDistricts,
  selectedRating,
  openNow,
  selectedFeatures,
  selectedPointTypes,
  onClearSearch,
  onClearCuisine,
  onClearPrice,
  onClearDistrict,
  onClearRating,
  onClearOpenNow,
  onClearFeature,
  onClearPointType,
  onClearAll,
  resultCount,
}: FilterChipsProps) {
  const hasActiveFilters =
    searchQuery ||
    selectedCuisine ||
    selectedPrice ||
    selectedDistricts.length > 0 ||
    selectedRating !== undefined ||
    openNow ||
    selectedFeatures.length > 0 ||
    selectedPointTypes.length !== 3; // デフォルトは3つすべて

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="filter-chips">
      <div className="chips-header">
        <span className="chips-title">適用中のフィルター</span>
        <span className="result-count">{resultCount}件の結果</span>
        <button
          type="button"
          onClick={onClearAll}
          className="clear-all-button"
          aria-label="すべてのフィルターをクリア"
        >
          すべてクリア
        </button>
      </div>

      <div className="chips-container">
        {searchQuery && (
          <div className="filter-chip">
            <span className="chip-label">検索: {searchQuery}</span>
            <button
              type="button"
              onClick={onClearSearch}
              className="chip-remove"
              aria-label="検索フィルターを削除"
            >
              ×
            </button>
          </div>
        )}

        {selectedCuisine && (
          <div className="filter-chip">
            <span className="chip-label">料理: {selectedCuisine}</span>
            <button
              type="button"
              onClick={onClearCuisine}
              className="chip-remove"
              aria-label="料理フィルターを削除"
            >
              ×
            </button>
          </div>
        )}

        {selectedPrice && (
          <div className="filter-chip">
            <span className="chip-label">価格: {selectedPrice}</span>
            <button
              type="button"
              onClick={onClearPrice}
              className="chip-remove"
              aria-label="価格フィルターを削除"
            >
              ×
            </button>
          </div>
        )}

        {selectedDistricts.map((district) => (
          <div key={district} className="filter-chip">
            <span className="chip-label">地区: {district}</span>
            <button
              type="button"
              onClick={() => onClearDistrict(district)}
              className="chip-remove"
              aria-label={`${district}地区フィルターを削除`}
            >
              ×
            </button>
          </div>
        ))}

        {selectedRating !== undefined && (
          <div className="filter-chip">
            <span className="chip-label">評価: {selectedRating}星以上</span>
            <button
              type="button"
              onClick={onClearRating}
              className="chip-remove"
              aria-label="評価フィルターを削除"
            >
              ×
            </button>
          </div>
        )}

        {openNow && (
          <div className="filter-chip">
            <span className="chip-label">営業中のみ</span>
            <button
              type="button"
              onClick={onClearOpenNow}
              className="chip-remove"
              aria-label="営業中フィルターを削除"
            >
              ×
            </button>
          </div>
        )}

        {selectedFeatures.map((feature) => (
          <div key={feature} className="filter-chip">
            <span className="chip-label">設備: {feature}</span>
            <button
              type="button"
              onClick={() => onClearFeature(feature)}
              className="chip-remove"
              aria-label={`${feature}設備フィルターを削除`}
            >
              ×
            </button>
          </div>
        ))}

        {selectedPointTypes.length < 3 &&
          selectedPointTypes.map((pointType) => (
            <div key={pointType} className="filter-chip">
              <span className="chip-label">
                種類:{" "}
                {pointType === "restaurant"
                  ? "飲食店"
                  : pointType === "parking"
                  ? "駐車場"
                  : "トイレ"}
              </span>
              <button
                type="button"
                onClick={() => onClearPointType(pointType)}
                className="chip-remove"
                aria-label={`${pointType}種類フィルターを削除`}
              >
                ×
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
