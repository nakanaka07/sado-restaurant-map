import { useState } from "react";
import type {
  CuisineType,
  PriceRange,
  SadoDistrict,
  SortOrder,
  MapPointType,
} from "../../types/restaurant.types";
import { trackSearch, trackFilter } from "@/utils/analytics";

interface FilterPanelProps {
  loading?: boolean;
  resultCount?: number;
  onCuisineFilter?: (cuisine: CuisineType | "") => void;
  onPriceFilter?: (price: PriceRange | "") => void;
  onDistrictFilter?: (districts: SadoDistrict[]) => void;
  onRatingFilter?: (minRating: number | undefined) => void;
  onOpenNowFilter?: (openNow: boolean) => void;
  onSearchFilter?: (search: string) => void;
  onSortChange?: (sort: SortOrder) => void;
  onFeatureFilter?: (features: string[]) => void;
  onPointTypeFilter?: (pointTypes: MapPointType[]) => void;
  onResetFilters?: () => void;
}

export function FilterPanel({
  loading = false,
  resultCount = 0,
  onCuisineFilter,
  onPriceFilter,
  onDistrictFilter,
  onRatingFilter,
  onOpenNowFilter,
  onSearchFilter,
  onSortChange,
  onFeatureFilter,
  onPointTypeFilter,
  onResetFilters,
}: FilterPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType | "">("");
  const [selectedPrice, setSelectedPrice] = useState<PriceRange | "">("");
  const [selectedDistricts, setSelectedDistricts] = useState<SadoDistrict[]>(
    []
  );
  const [selectedRating, setSelectedRating] = useState<number | undefined>(
    undefined
  );
  const [openNow, setOpenNow] = useState(false);
  const [selectedSort, setSelectedSort] = useState<SortOrder>("name");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedPointTypes, setSelectedPointTypes] = useState<MapPointType[]>([
    "restaurant",
    "parking",
    "toilet",
  ]);

  const cuisineTypes: CuisineType[] = [
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
    "その他",
  ];

  const priceRanges: PriceRange[] = [
    "～1000円",
    "1000-2000円",
    "2000-3000円",
    "3000円～",
  ];

  const districts: SadoDistrict[] = [
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

  const ratingOptions = [
    { value: undefined, label: "評価指定なし" },
    { value: 3.0, label: "⭐ 3.0以上" },
    { value: 3.5, label: "⭐ 3.5以上" },
    { value: 4.0, label: "⭐ 4.0以上" },
    { value: 4.5, label: "⭐ 4.5以上" },
  ];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchFilter?.(value);

    // Analytics: 検索追跡
    if (value.trim() !== "") {
      trackSearch(value, resultCount);
    }
  };

  const handleCuisineChange = (value: CuisineType | "") => {
    setSelectedCuisine(value);
    onCuisineFilter?.(value);

    // Analytics: フィルター追跡
    trackFilter("cuisine", value || "all");
  };

  const handlePriceChange = (value: PriceRange | "") => {
    setSelectedPrice(value);
    onPriceFilter?.(value);

    // Analytics: フィルター追跡
    trackFilter("price_range", value || "all");
  };

  const handleDistrictToggle = (district: SadoDistrict) => {
    const newDistricts = selectedDistricts.includes(district)
      ? selectedDistricts.filter((d) => d !== district)
      : [...selectedDistricts, district];
    setSelectedDistricts(newDistricts);
    onDistrictFilter?.(newDistricts);

    // Analytics: 地区フィルター追跡
    trackFilter("districts", newDistricts.join(",") || "all");
  };

  const handleRatingChange = (value: number | undefined) => {
    setSelectedRating(value);
    onRatingFilter?.(value);

    // Analytics: 評価フィルター追跡
    trackFilter("rating", value ? value.toString() : "all");
  };

  const handleOpenNowChange = (value: boolean) => {
    setOpenNow(value);
    onOpenNowFilter?.(value);

    // Analytics: 営業中フィルター追跡
    trackFilter("open_now", value ? "open_only" : "all");
  };

  const handleSortChange = (value: SortOrder) => {
    setSelectedSort(value);
    onSortChange?.(value);

    // Analytics: ソート追跡
    trackFilter("sort_order", value);
  };

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = selectedFeatures.includes(feature)
      ? selectedFeatures.filter((f) => f !== feature)
      : [...selectedFeatures, feature];
    setSelectedFeatures(newFeatures);
    onFeatureFilter?.(newFeatures);

    // Analytics: 特徴フィルター追跡
    trackFilter("features", newFeatures.join(",") || "none");
  };

  // ポイントタイプフィルターハンドラー
  const handlePointTypeChange = (pointType: MapPointType) => {
    const newPointTypes = selectedPointTypes.includes(pointType)
      ? selectedPointTypes.filter((type) => type !== pointType)
      : [...selectedPointTypes, pointType];

    setSelectedPointTypes(newPointTypes);
    onPointTypeFilter?.(newPointTypes);

    // Analytics: ポイントタイプフィルター追跡
    trackFilter("point_type", pointType);
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCuisine("");
    setSelectedPrice("");
    setSelectedDistricts([]);
    setSelectedRating(undefined);
    setOpenNow(false);
    setSelectedSort("name");
    setSelectedFeatures([]);
    setSelectedPointTypes(["restaurant", "parking", "toilet"]);
    onResetFilters?.();

    // Analytics: リセット追跡
    trackFilter("reset", "all_filters_cleared");
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "1rem",
          background: "#f8fafc",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              border: "2px solid #e2e8f0",
              borderTop: "2px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ margin: 0, color: "#64748b" }}>
            フィルターを読み込み中...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1.5rem",
        background: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        marginBottom: "1rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <h2
        style={{
          margin: "0 0 1rem 0",
          fontSize: "1.25rem",
          fontWeight: "600",
          color: "#1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          �️ マップポイントを探す
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: "normal",
              color: "#64748b",
              backgroundColor: "#f1f5f9",
              padding: "0.25rem 0.5rem",
              borderRadius: "9999px",
            }}
          >
            {resultCount}件
          </span>
        </span>
        <button
          onClick={handleReset}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            fontSize: "0.875rem",
            cursor: "pointer",
            color: "#64748b",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f1f5f9";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#f8fafc";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          リセット
        </button>
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* 検索バー */}
        <div>
          <label
            htmlFor="search"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#374151",
            }}
          >
            店舗名で検索
          </label>
          <input
            id="search"
            type="text"
            placeholder="店舗名を入力..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "1rem",
              outline: "none",
              transition: "border-color 0.2s",
              backgroundColor: "#ffffff",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
          />
        </div>

        {/* ポイントタイプ選択 */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "0.5rem",
            }}
          >
            🗺️ 表示する施設
          </label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            {[
              {
                type: "restaurant" as MapPointType,
                label: "🍽️ 飲食店",
                color: "#ff6b6b",
              },
              {
                type: "parking" as MapPointType,
                label: "🅿️ 駐車場",
                color: "#4caf50",
              },
              {
                type: "toilet" as MapPointType,
                label: "🚽 トイレ",
                color: "#2196f3",
              },
            ].map(({ type, label, color }) => (
              <label
                key={type}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: selectedPointTypes.includes(type)
                    ? color
                    : "#f8fafc",
                  color: selectedPointTypes.includes(type)
                    ? "#ffffff"
                    : "#64748b",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  transition: "all 0.2s",
                  border: `1px solid ${
                    selectedPointTypes.includes(type) ? color : "#e2e8f0"
                  }`,
                }}
                onMouseEnter={(e) => {
                  if (!selectedPointTypes.includes(type)) {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedPointTypes.includes(type)) {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedPointTypes.includes(type)}
                  onChange={() => handlePointTypeChange(type)}
                  style={{ display: "none" }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* フィルター */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {/* ジャンル選択 */}
          <div>
            <label
              htmlFor="cuisine"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              ジャンル
            </label>
            <select
              id="cuisine"
              value={selectedCuisine}
              onChange={(e) =>
                handleCuisineChange(e.target.value as CuisineType | "")
              }
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
                backgroundColor: "#ffffff",
                outline: "none",
              }}
            >
              <option value="">すべてのジャンル</option>
              {cuisineTypes.map((cuisine) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </select>
          </div>

          {/* 価格帯選択 */}
          <div>
            <label
              htmlFor="price"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              価格帯
            </label>
            <select
              id="price"
              value={selectedPrice}
              onChange={(e) =>
                handlePriceChange(e.target.value as PriceRange | "")
              }
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
                backgroundColor: "#ffffff",
                outline: "none",
              }}
            >
              <option value="">すべての価格帯</option>
              {priceRanges.map((price) => (
                <option key={price} value={price}>
                  {price}
                </option>
              ))}
            </select>
          </div>

          {/* ソート選択 */}
          <div>
            <label
              htmlFor="sort"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              並び順
            </label>
            <select
              id="sort"
              value={selectedSort}
              onChange={(e) => handleSortChange(e.target.value as SortOrder)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
                backgroundColor: "#ffffff",
                outline: "none",
              }}
            >
              <option value="name">店名順</option>
              <option value="rating">評価順</option>
              <option value="priceRange">価格順</option>
              <option value="distance">距離順</option>
            </select>
          </div>

          {/* 評価フィルター */}
          <div>
            <label
              htmlFor="rating"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              評価
            </label>
            <select
              id="rating"
              value={selectedRating || ""}
              onChange={(e) =>
                handleRatingChange(
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
                backgroundColor: "#ffffff",
                outline: "none",
              }}
            >
              {ratingOptions.map((option) => (
                <option key={option.value || "all"} value={option.value || ""}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 営業中フィルター */}
          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151",
                padding: "0.75rem",
                backgroundColor: openNow ? "#f0f9ff" : "#f8fafc",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: openNow ? "#3b82f6" : "#e2e8f0",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!openNow) {
                  e.currentTarget.style.backgroundColor = "#f1f5f9";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }
              }}
              onMouseLeave={(e) => {
                if (!openNow) {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }
              }}
            >
              <input
                type="checkbox"
                checked={openNow}
                onChange={(e) => handleOpenNowChange(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "#3b82f6",
                }}
              />
              <span
                style={{
                  color: openNow ? "#1e40af" : "#374151",
                  fontWeight: openNow ? "600" : "500",
                }}
              >
                🕐 現在営業中
              </span>
            </label>
          </div>
        </div>

        {/* 地区選択 */}
        <div>
          <p
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#374151",
            }}
          >
            地区選択
            {selectedDistricts.length > 0 && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: "normal",
                  color: "#6b7280",
                  backgroundColor: "#f3f4f6",
                  padding: "0.125rem 0.375rem",
                  borderRadius: "0.375rem",
                }}
              >
                {selectedDistricts.length}件選択中
              </span>
            )}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {districts.map((district) => (
              <label
                key={district}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  padding: "0.375rem 0.75rem",
                  backgroundColor: selectedDistricts.includes(district)
                    ? "#dbeafe"
                    : "#f8fafc",
                  borderRadius: "0.5rem",
                  border: "1px solid",
                  borderColor: selectedDistricts.includes(district)
                    ? "#3b82f6"
                    : "#e2e8f0",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!selectedDistricts.includes(district)) {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedDistricts.includes(district)) {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedDistricts.includes(district)}
                  onChange={() => handleDistrictToggle(district)}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "#3b82f6",
                  }}
                />
                <span
                  style={{
                    color: selectedDistricts.includes(district)
                      ? "#1e40af"
                      : "#374151",
                    fontWeight: selectedDistricts.includes(district)
                      ? "500"
                      : "normal",
                  }}
                >
                  {district}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* クイックフィルター - 実際のデータベースに基づく特徴 */}
        <div>
          <p
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#374151",
            }}
          >
            こだわり条件
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {[
              "テイクアウト可",
              "デリバリー可",
              "店内飲食可",
              "朝食提供",
              "昼食提供",
              "夕食提供",
              "ビール提供",
              "ワイン提供",
              "カクテル提供",
              "コーヒー提供",
              "ベジタリアン対応",
              "子供向けメニュー",
              "デザート提供",
              "屋外席",
              "音楽あり",
              "トイレあり",
              "駐車場あり",
              "バリアフリー",
              "子供連れ歓迎",
              "ペット同伴可",
              "グループ利用可",
              "スポーツ観戦可",
              "禁煙",
              "個室あり",
              "テラス席",
              "Wi-Fiあり",
              "クレジットカード可",
              "予約可能",
            ].map((feature) => (
              <label
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  padding: "0.25rem 0.5rem",
                  backgroundColor: selectedFeatures.includes(feature)
                    ? "#dbeafe"
                    : "#f8fafc",
                  borderRadius: "6px",
                  border: "1px solid",
                  borderColor: selectedFeatures.includes(feature)
                    ? "#3b82f6"
                    : "#e2e8f0",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!selectedFeatures.includes(feature)) {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedFeatures.includes(feature)) {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(feature)}
                  onChange={() => handleFeatureToggle(feature)}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "#3b82f6",
                  }}
                />
                <span
                  style={{
                    color: selectedFeatures.includes(feature)
                      ? "#1e40af"
                      : "#374151",
                  }}
                >
                  {feature}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* マーカーレジェンド */}
        <div style={{ marginBottom: "24px" }}>
          <h4
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "12px",
              color: "#374151",
            }}
          >
            🎨 マーカー色分け
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "8px",
              fontSize: "12px",
            }}
          >
            {[
              { cuisine: "日本料理", color: "#ff9800" },
              { cuisine: "寿司", color: "#e91e63" },
              { cuisine: "海鮮", color: "#2196f3" },
              { cuisine: "焼肉・焼鳥", color: "#d32f2f" },
              { cuisine: "ラーメン", color: "#ff5722" },
              { cuisine: "そば・うどん", color: "#795548" },
              { cuisine: "中華", color: "#f44336" },
              { cuisine: "イタリアン", color: "#4caf50" },
              { cuisine: "カフェ・喫茶店", color: "#607d8b" },
              { cuisine: "その他", color: "#9e9e9e" },
            ].map(({ cuisine, color }) => (
              <div
                key={cuisine}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: color,
                    borderRadius: "50%",
                    border: "1px solid #fff",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  }}
                />
                <span style={{ color: "#374151" }}>{cuisine}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "12px" }}>
            <h5
              style={{
                fontSize: "14px",
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              💰 サイズ = 価格帯
            </h5>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>
              小 = ～1000円 | 中 = 1000-2000円 | 大 = 2000-3000円 | 特大 =
              3000円～
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
