import { useState } from "react";
import type {
  CuisineType,
  PriceRange,
  SadoDistrict,
  SortOrder,
  MapPointType,
} from "../../types/restaurant.types";
import { trackFilter } from "@/utils/analytics";

interface ModernFilterPanelProps {
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

export function ModernFilterPanel({
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
}: ModernFilterPanelProps) {
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
  const [isExpanded, setIsExpanded] = useState(false);

  // オプション定義
  const cuisineOptions: CuisineType[] = [
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

  const availableFeatures = [
    "駐車場あり",
    "禁煙",
    "クレジットカード可",
    "個室あり",
    "Wi-Fi",
    "テラス席",
    "ペット可",
    "テイクアウト",
    "デリバリー",
    "宴会可",
    "ランチあり",
    "ディナーあり",
    "朝食あり",
    "深夜営業",
    "年中無休",
    "予約可",
    "貸切可",
    "バリアフリー",
    "子供連れ歓迎",
    "座敷あり",
    "カウンター席",
    "オープンテラス",
    "景色が良い",
    "海が見える",
    "山が見える",
    "静か",
    "にぎやか",
    "カジュアル",
  ];

  const cuisineColors = [
    { cuisine: "日本料理", color: "#dc2626" },
    { cuisine: "寿司", color: "#0284c7" },
    { cuisine: "海鮮", color: "#0891b2" },
    { cuisine: "焼肉・焼鳥", color: "#ea580c" },
    { cuisine: "ラーメン", color: "#ca8a04" },
    { cuisine: "そば・うどん", color: "#16a34a" },
    { cuisine: "中華", color: "#eab308" },
    { cuisine: "イタリアン", color: "#16a34a" },
    { cuisine: "フレンチ", color: "#2563eb" },
    { cuisine: "カフェ・喫茶店", color: "#0891b2" },
    { cuisine: "バー・居酒屋", color: "#9333ea" },
    { cuisine: "ファストフード", color: "#e11d48" },
    { cuisine: "デザート・スイーツ", color: "#ec4899" },
    { cuisine: "カレー・エスニック", color: "#f59e0b" },
    { cuisine: "ステーキ・洋食", color: "#dc2626" },
    { cuisine: "弁当・テイクアウト", color: "#14b8a6" },
    { cuisine: "レストラン", color: "#8b5cf6" },
    { cuisine: "その他", color: "#6b7280" },
  ];

  // ハンドラー関数
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchFilter?.(value);
  };

  const handleCuisineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as CuisineType | "";
    setSelectedCuisine(value);
    trackFilter("cuisine", value);
    onCuisineFilter?.(value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as PriceRange | "";
    setSelectedPrice(value);
    trackFilter("price", value);
    onPriceFilter?.(value);
  };

  const handleDistrictChange = (district: SadoDistrict) => {
    const newDistricts = selectedDistricts.includes(district)
      ? selectedDistricts.filter((d) => d !== district)
      : [...selectedDistricts, district];
    setSelectedDistricts(newDistricts);
    trackFilter("district", district);
    onDistrictFilter?.(newDistricts);
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? parseFloat(e.target.value) : undefined;
    setSelectedRating(value);
    trackFilter("rating", value?.toString() || "");
    onRatingFilter?.(value);
  };

  const handleOpenNowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;
    setOpenNow(value);
    trackFilter("openNow", value.toString());
    onOpenNowFilter?.(value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as SortOrder;
    setSelectedSort(value);
    onSortChange?.(value);
  };

  const handleFeatureChange = (feature: string) => {
    const newFeatures = selectedFeatures.includes(feature)
      ? selectedFeatures.filter((f) => f !== feature)
      : [...selectedFeatures, feature];
    setSelectedFeatures(newFeatures);
    trackFilter("feature", feature);
    onFeatureFilter?.(newFeatures);
  };

  const handlePointTypeChange = (pointType: MapPointType) => {
    const newPointTypes = selectedPointTypes.includes(pointType)
      ? selectedPointTypes.filter((type) => type !== pointType)
      : [...selectedPointTypes, pointType];
    setSelectedPointTypes(newPointTypes);
    onPointTypeFilter?.(newPointTypes);
  };

  const handleResetFilters = () => {
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
  };

  return (
    <>
      {/* Mobile Toggle Handle */}
      <div
        className="filter-panel-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      />

      <div
        className={`filter-panel ${isExpanded ? "expanded" : ""}`}
        role="complementary"
        aria-label="検索フィルター"
      >
        <div className="filter-panel-header">
          <h2>
            🔍 検索・フィルター
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: "normal",
                color: "var(--color-text-secondary)",
                marginLeft: "8px",
              }}
            >
              ({resultCount}件)
            </span>
          </h2>
        </div>

        <div className="filter-panel-content">
          {/* 検索 */}
          <div className="filter-section">
            <label htmlFor="search-input">🔍 キーワード検索</label>
            <input
              id="search-input"
              type="text"
              placeholder="店名・料理・住所で検索..."
              value={searchQuery}
              onChange={handleSearchChange}
              aria-describedby="search-help"
            />
            <div id="search-help" className="sr-only">
              店名、料理の種類、住所でレストランを検索できます
            </div>
          </div>

          {/* ポイントタイプ選択 */}
          <div className="filter-section">
            <label>📍 表示するポイント</label>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {[
                {
                  type: "restaurant" as MapPointType,
                  label: "🍽️ 飲食店",
                  emoji: "🍽️",
                },
                {
                  type: "parking" as MapPointType,
                  label: "🅿️ 駐車場",
                  emoji: "🅿️",
                },
                {
                  type: "toilet" as MapPointType,
                  label: "🚽 トイレ",
                  emoji: "🚽",
                },
              ].map(({ type, label }) => (
                <label
                  key={type}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "normal",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedPointTypes.includes(type)}
                    onChange={() => handlePointTypeChange(type)}
                    style={{ margin: 0 }}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 料理ジャンル */}
          <div className="filter-section">
            <label htmlFor="cuisine-select">🍽️ 料理ジャンル</label>
            <select
              id="cuisine-select"
              value={selectedCuisine}
              onChange={handleCuisineChange}
              aria-describedby="cuisine-help"
            >
              <option value="">すべての料理</option>
              {cuisineOptions.map((cuisine) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </select>
            <div id="cuisine-help" className="sr-only">
              特定の料理ジャンルのレストランのみを表示します
            </div>
          </div>

          {/* 価格帯 */}
          <div className="filter-section">
            <label htmlFor="price-select">💰 価格帯</label>
            <select
              id="price-select"
              value={selectedPrice}
              onChange={handlePriceChange}
              aria-describedby="price-help"
            >
              <option value="">すべての価格帯</option>
              <option value="～1000円">💰 ～1000円</option>
              <option value="1000～2000円">💰💰 1000～2000円</option>
              <option value="2000～3000円">💰💰💰 2000～3000円</option>
              <option value="3000円～">💰💰💰💰 3000円～</option>
            </select>
            <div id="price-help" className="sr-only">
              予算に応じてレストランを絞り込みます
            </div>
          </div>

          {/* 地区選択 */}
          <div className="filter-section">
            <label>🗺️ 地区</label>
            <div style={{ maxHeight: "120px", overflowY: "auto" }}>
              {districts.map((district) => (
                <label
                  key={district}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "normal",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedDistricts.includes(district)}
                    onChange={() => handleDistrictChange(district)}
                    style={{ margin: 0 }}
                  />
                  <span>{district}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 評価フィルター */}
          <div className="filter-section">
            <label htmlFor="rating-select">⭐ 評価</label>
            <select
              id="rating-select"
              value={selectedRating || ""}
              onChange={handleRatingChange}
              aria-describedby="rating-help"
            >
              <option value="">評価指定なし</option>
              <option value="3.0">⭐ 3.0以上</option>
              <option value="3.5">⭐ 3.5以上</option>
              <option value="4.0">⭐ 4.0以上</option>
              <option value="4.5">⭐ 4.5以上</option>
            </select>
            <div id="rating-help" className="sr-only">
              高評価のレストランのみを表示します
            </div>
          </div>

          {/* 営業中フィルター */}
          <div className="filter-section">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={openNow}
                onChange={handleOpenNowChange}
                style={{ margin: 0 }}
              />
              <span>⏰ 現在営業中のみ表示</span>
            </label>
          </div>

          {/* 特徴フィルター */}
          <div className="filter-section">
            <label>✨ 特徴・サービス</label>
            <div
              style={{
                maxHeight: "150px",
                overflowY: "auto",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "4px",
                fontSize: "13px",
              }}
            >
              {availableFeatures.map((feature) => (
                <label
                  key={feature}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "4px",
                    fontWeight: "normal",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feature)}
                    onChange={() => handleFeatureChange(feature)}
                    style={{ margin: 0, transform: "scale(0.9)" }}
                  />
                  <span>{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ソート */}
          <div className="filter-section">
            <label htmlFor="sort-select">📊 並び順</label>
            <select
              id="sort-select"
              value={selectedSort}
              onChange={handleSortChange}
              aria-describedby="sort-help"
            >
              <option value="name">📝 名前順</option>
              <option value="rating">⭐ 評価順</option>
              <option value="price">💰 価格順</option>
              <option value="distance">📍 距離順</option>
            </select>
            <div id="sort-help" className="sr-only">
              レストランリストの並び順を変更します
            </div>
          </div>

          {/* リセットボタン */}
          <div className="filter-section">
            <button
              onClick={handleResetFilters}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#dc2626";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ef4444";
              }}
              disabled={loading}
              aria-describedby="reset-help"
            >
              🔄 フィルターをリセット
            </button>
            <div id="reset-help" className="sr-only">
              すべてのフィルター設定をクリアします
            </div>
          </div>

          {/* 凡例・説明 */}
          <div className="filter-section">
            <details style={{ fontSize: "13px" }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: "600",
                  marginBottom: "8px",
                  color: "var(--color-text-primary)",
                }}
              >
                🗺️ マップの見方
              </summary>
              <div
                style={{
                  paddingLeft: "16px",
                  color: "var(--color-text-secondary)",
                }}
              >
                <h5
                  style={{
                    fontSize: "13px",
                    marginBottom: "6px",
                    color: "var(--color-text-primary)",
                  }}
                >
                  🎨 色 = 料理ジャンル
                </h5>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "4px",
                    marginBottom: "12px",
                  }}
                >
                  {cuisineColors.map(({ cuisine, color }) => (
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
                      <span style={{ fontSize: "11px" }}>{cuisine}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <h5
                    style={{
                      fontSize: "13px",
                      marginBottom: "6px",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    💰 サイズ = 価格帯
                  </h5>
                  <div style={{ fontSize: "11px" }}>
                    小 = ～1000円 | 中 = 1000-2000円 | 大 = 2000-3000円 | 特大 =
                    3000円～
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </>
  );
}
