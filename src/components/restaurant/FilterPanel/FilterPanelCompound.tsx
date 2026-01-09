/**
 * @fileoverview FilterPanel Compound Components
 * React 19 Compound Components Pattern + Context最適化
 *
 * Week 2 P2-1: Compound Componentsパターン実装
 *
 * 使用例:
 * ```tsx
 * <FilterPanel.Root>
 *   <FilterPanel.Header />
 *   <FilterPanel.Search />
 *   <FilterPanel.Cuisine />
 *   <FilterPanel.Price />
 *   <FilterPanel.Rating />
 *   <FilterPanel.OpenNow />
 *   <FilterPanel.Districts />
 *   <FilterPanel.Features />
 *   <FilterPanel.PointTypes />
 *   <FilterPanel.Sort />
 *   <FilterPanel.Reset />
 *   <FilterPanel.Legend />
 * </FilterPanel.Root>
 * ```
 */

import {
  useFilterContext,
  useFilterCuisine,
  useFilterDistricts,
  useFilterFeatures,
  useFilterOpenNow,
  useFilterPointTypes,
  useFilterPrice,
  useFilterRating,
  useFilterReset,
  useFilterSearch,
  useFilterSort,
  useFilterStats,
} from "@/contexts/FilterContext";
import type { MapPointType } from "@/types";
import { memo, type ReactNode } from "react";

// ============================================================================
// Styles (shared)
// ============================================================================

const styles = {
  container: {
    position: "fixed" as const,
    top: "20px",
    left: "20px",
    width: "320px",
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto" as const,
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
    zIndex: 1000,
    border: "1px solid #e5e7eb",
  },
  content: {
    padding: "20px",
  },
  section: {
    marginBottom: "16px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600" as const,
    color: "var(--color-text-primary)",
    marginBottom: "8px",
    display: "block",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "#fff",
    transition: "all 0.2s ease",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "#fff",
    transition: "all 0.2s ease",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    accentColor: "#3b82f6",
  },
  checkboxSmall: {
    width: "16px",
    height: "16px",
    accentColor: "#3b82f6",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  flexWrap: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "8px",
  },
};

// ============================================================================
// Root Component
// ============================================================================

interface RootProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * FilterPanel.Root - コンテナコンポーネント
 */
const Root = memo<RootProps>(function FilterPanelRoot({ children, className }) {
  return (
    <>
      <style>
        {`
          .filter-section { margin-bottom: 16px; }
          .filter-label { display: block; margin-bottom: 6px; }
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }
        `}
      </style>
      <div style={styles.container} className={className}>
        <div style={styles.content}>{children}</div>
      </div>
    </>
  );
});

// ============================================================================
// Header Component
// ============================================================================

/**
 * FilterPanel.Header - ヘッダー（件数表示含む）
 */
const Header = memo(function FilterPanelHeader() {
  const { loading, resultCount, stats } = useFilterStats();

  return (
    <div
      style={{
        marginBottom: "20px",
        paddingBottom: "16px",
        borderBottom: "2px solid #f3f4f6",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          🔍 フィルター
        </h2>
        <div
          aria-live="polite"
          style={{
            fontSize: "13px",
            color: "var(--color-text-secondary)",
            fontWeight: "600",
          }}
        >
          {loading ? "⏳ 読込中..." : `📊 ${resultCount}件`}
        </div>
      </div>

      {stats && resultCount > 0 && (
        <div
          style={{
            fontSize: "12px",
            color: "var(--color-text-secondary)",
            fontWeight: "500",
            padding: "8px 12px",
            backgroundColor: "var(--color-background-secondary, #f8f9fa)",
            borderRadius: "8px",
            border: "1px solid var(--color-border-light, #e9ecef)",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <span>🍽️ {stats.restaurants}</span>
          <span>🅿️ {stats.parkings}</span>
          <span>🚻 {stats.toilets}</span>
        </div>
      )}

      {resultCount === 0 && !loading && (
        <div
          style={{
            fontSize: "12px",
            color: "var(--color-text-muted, #6c757d)",
            fontStyle: "italic",
            padding: "8px 12px",
            backgroundColor: "var(--color-background-secondary, #f8f9fa)",
            borderRadius: "8px",
            border: "1px solid var(--color-border-light, #e9ecef)",
          }}
        >
          条件に一致するポイントが見つかりませんでした
        </div>
      )}
    </div>
  );
});

// ============================================================================
// Search Component
// ============================================================================

/**
 * FilterPanel.Search - 検索フィルター
 */
const Search = memo(function FilterPanelSearch() {
  const { searchQuery, setSearchQuery } = useFilterSearch();
  const { loading } = useFilterContext();

  return (
    <div style={styles.section}>
      <label htmlFor="filter-search" style={styles.label}>
        🔎 検索
      </label>
      <input
        id="filter-search"
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="店名・キーワードで検索..."
        style={styles.input}
        disabled={loading}
        onFocus={e => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }}
        onBlur={e => {
          e.target.style.borderColor = "#e5e7eb";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
});

// ============================================================================
// Cuisine Component
// ============================================================================

/**
 * FilterPanel.Cuisine - 料理ジャンルフィルター
 */
const Cuisine = memo(function FilterPanelCuisine() {
  const { selectedCuisine, setCuisine } = useFilterCuisine();

  return (
    <div style={styles.section}>
      <label htmlFor="filter-cuisine" style={styles.label}>
        🍽️ 料理ジャンル
      </label>
      <select
        id="filter-cuisine"
        value={selectedCuisine}
        onChange={e => setCuisine(e.target.value as typeof selectedCuisine)}
        style={styles.select}
        onFocus={e => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }}
        onBlur={e => {
          e.target.style.borderColor = "#e5e7eb";
          e.target.style.boxShadow = "none";
        }}
      >
        <option value="">すべてのジャンル</option>
        <option value="日本料理">日本料理</option>
        <option value="寿司">寿司</option>
        <option value="海鮮">海鮮</option>
        <option value="ラーメン">ラーメン</option>
        <option value="そば・うどん">そば・うどん</option>
        <option value="カフェ・喜茶店">カフェ・喜茶店</option>
        <option value="バー・居酒屋">バー・居酒屋</option>
        <option value="中華">中華</option>
        <option value="その他">その他</option>
      </select>
    </div>
  );
});

// ============================================================================
// Price Component
// ============================================================================

/**
 * FilterPanel.Price - 価格フィルター
 */
const Price = memo(function FilterPanelPrice() {
  const { selectedPrice, setPrice } = useFilterPrice();

  return (
    <div style={styles.section}>
      <label htmlFor="filter-price" style={styles.label}>
        💰 価格帯
      </label>
      <select
        id="filter-price"
        value={selectedPrice}
        onChange={e => setPrice(e.target.value as typeof selectedPrice)}
        style={styles.select}
        onFocus={e => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }}
        onBlur={e => {
          e.target.style.borderColor = "#e5e7eb";
          e.target.style.boxShadow = "none";
        }}
      >
        <option value="">すべての価格帯</option>
        <option value="～1000円">～1,000円</option>
        <option value="1000-2000円">1,000～2,000円</option>
        <option value="2000-3000円">2,000～3,000円</option>
        <option value="3000円～">3,000円～</option>
      </select>
    </div>
  );
});

// ============================================================================
// Rating Component
// ============================================================================

/**
 * FilterPanel.Rating - 評価フィルター
 */
const Rating = memo(function FilterPanelRating() {
  const { selectedRating, setRating } = useFilterRating();

  return (
    <div style={styles.section}>
      <label htmlFor="filter-rating" style={styles.label}>
        ⭐ 評価
      </label>
      <select
        id="filter-rating"
        value={selectedRating?.toString() ?? ""}
        onChange={e =>
          setRating(e.target.value ? Number(e.target.value) : undefined)
        }
        style={styles.select}
        onFocus={e => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }}
        onBlur={e => {
          e.target.style.borderColor = "#e5e7eb";
          e.target.style.boxShadow = "none";
        }}
      >
        <option value="">すべての評価</option>
        <option value="4">4.0以上</option>
        <option value="3">3.0以上</option>
        <option value="2">2.0以上</option>
      </select>
    </div>
  );
});

// ============================================================================
// OpenNow Component
// ============================================================================

/**
 * FilterPanel.OpenNow - 営業中フィルター
 */
const OpenNow = memo(function FilterPanelOpenNow() {
  const { openNow, setOpenNow } = useFilterOpenNow();

  return (
    <div style={styles.section}>
      <label
        style={{
          ...styles.label,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={openNow}
          onChange={e => setOpenNow(e.target.checked)}
          style={styles.checkbox}
        />
        <span>🕐 営業中のみ表示</span>
      </label>
    </div>
  );
});

// ============================================================================
// Districts Component
// ============================================================================

/**
 * FilterPanel.Districts - 地域フィルター
 */
const Districts = memo(function FilterPanelDistricts() {
  const {
    selectedDistricts,
    toggleDistrict,
    isDistrictExpanded,
    toggleDistrictExpanded,
  } = useFilterDistricts();

  // SadoDistrict型に合わせた日本語の地区名
  const districts = [
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
  ] as const;

  const visibleDistricts = isDistrictExpanded
    ? districts
    : districts.slice(0, 4);

  return (
    <div style={styles.section}>
      <div style={styles.label}>📍 地域</div>
      <div style={styles.flexWrap}>
        {visibleDistricts.map(district => (
          <label
            key={district}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              fontSize: "13px",
              color: "var(--color-text-primary)",
            }}
          >
            <input
              type="checkbox"
              checked={selectedDistricts.includes(district)}
              onChange={() => toggleDistrict(district)}
              style={styles.checkboxSmall}
            />
            <span>{district}</span>
          </label>
        ))}
      </div>
      {districts.length > 4 && (
        <button
          type="button"
          onClick={toggleDistrictExpanded}
          style={{
            marginTop: "8px",
            background: "none",
            border: "none",
            color: "#3b82f6",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          {isDistrictExpanded ? "▲ 閉じる" : "▼ もっと見る"}
        </button>
      )}
    </div>
  );
});

// ============================================================================
// Features Component
// ============================================================================

/**
 * FilterPanel.Features - 特徴フィルター
 */
const Features = memo(function FilterPanelFeatures() {
  const {
    selectedFeatures,
    toggleFeature,
    isFeatureExpanded,
    toggleFeatureExpanded,
  } = useFilterFeatures();

  const features = [
    { id: "parking", label: "駐車場あり" },
    { id: "wifi", label: "Wi-Fi" },
    { id: "card", label: "カード可" },
    { id: "reservation", label: "予約可" },
    { id: "takeout", label: "テイクアウト" },
    { id: "delivery", label: "デリバリー" },
  ] as const;

  const visibleFeatures = isFeatureExpanded ? features : features.slice(0, 4);

  return (
    <div style={styles.section}>
      <div style={styles.label}>✨ 特徴</div>
      <div style={styles.flexWrap}>
        {visibleFeatures.map(feature => (
          <label
            key={feature.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              fontSize: "13px",
              color: "var(--color-text-primary)",
            }}
          >
            <input
              type="checkbox"
              checked={selectedFeatures.includes(feature.id)}
              onChange={() => toggleFeature(feature.id)}
              style={styles.checkboxSmall}
            />
            <span>{feature.label}</span>
          </label>
        ))}
      </div>
      {features.length > 4 && (
        <button
          type="button"
          onClick={toggleFeatureExpanded}
          style={{
            marginTop: "8px",
            background: "none",
            border: "none",
            color: "#3b82f6",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          {isFeatureExpanded ? "▲ 閉じる" : "▼ もっと見る"}
        </button>
      )}
    </div>
  );
});

// ============================================================================
// PointTypes Component
// ============================================================================

/**
 * FilterPanel.PointTypes - ポイントタイプフィルター
 */
const PointTypes = memo(function FilterPanelPointTypes() {
  const { selectedPointTypes, togglePointType } = useFilterPointTypes();

  const pointTypes = [
    { id: "restaurant", label: "🍽️ 飲食店" },
    { id: "parking", label: "🅿️ 駐車場" },
    { id: "toilet", label: "🚻 トイレ" },
  ] as const;

  return (
    <div style={styles.section}>
      <div style={styles.label}>📍 表示ポイント</div>
      <div style={styles.flexWrap}>
        {pointTypes.map(pointType => (
          <label
            key={pointType.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              fontSize: "13px",
              color: "var(--color-text-primary)",
            }}
          >
            <input
              type="checkbox"
              checked={selectedPointTypes.includes(
                pointType.id as MapPointType
              )}
              onChange={() => togglePointType(pointType.id as MapPointType)}
              style={styles.checkboxSmall}
            />
            <span>{pointType.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
});

// ============================================================================
// Sort Component
// ============================================================================

/**
 * FilterPanel.Sort - 並び順
 */
const Sort = memo(function FilterPanelSort() {
  const { selectedSort, setSort } = useFilterSort();

  return (
    <div style={styles.section}>
      <label htmlFor="filter-sort" style={styles.label}>
        📊 並び順
      </label>
      <select
        id="filter-sort"
        value={selectedSort}
        onChange={e => setSort(e.target.value as typeof selectedSort)}
        style={styles.select}
        onFocus={e => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }}
        onBlur={e => {
          e.target.style.borderColor = "#e5e7eb";
          e.target.style.boxShadow = "none";
        }}
      >
        <option value="name">名前順</option>
        <option value="rating">評価順</option>
        <option value="distance">距離順</option>
      </select>
    </div>
  );
});

// ============================================================================
// Reset Component
// ============================================================================

/**
 * FilterPanel.Reset - リセットボタン
 */
const Reset = memo(function FilterPanelReset() {
  const { resetFilters, loading } = useFilterReset();

  return (
    <div style={{ marginTop: "20px", marginBottom: "16px" }}>
      <button
        type="button"
        onClick={resetFilters}
        style={styles.button}
        disabled={loading}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = "#dc2626";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = "#ef4444";
        }}
        aria-describedby="reset-help"
      >
        🔄 フィルターをリセット
      </button>
      <div id="reset-help" className="sr-only">
        すべてのフィルター設定をクリアします
      </div>
    </div>
  );
});

// ============================================================================
// Legend Component
// ============================================================================

/**
 * FilterPanel.Legend - マップ凡例
 */
const Legend = memo(function FilterPanelLegend() {
  return (
    <div
      style={{
        borderTop: "2px solid #f3f4f6",
        paddingTop: "16px",
        marginTop: "8px",
      }}
    >
      <div style={styles.label}>🗺️ マップ凡例</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          fontSize: "12px",
          color: "var(--color-text-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#ef4444",
              borderRadius: "50%",
            }}
          />
          <span>飲食店</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#3b82f6",
              borderRadius: "50%",
            }}
          />
          <span>駐車場</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#22c55e",
              borderRadius: "50%",
            }}
          />
          <span>トイレ</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#f59e0b",
              borderRadius: "50%",
            }}
          />
          <span>観光スポット</span>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Compound Component Export
// ============================================================================

/**
 * FilterPanelCompound - Compound Componentsパターンのエクスポート
 *
 * 使用例:
 * ```tsx
 * <FilterProvider>
 *   <FilterPanelCompound.Root>
 *     <FilterPanelCompound.Header />
 *     <FilterPanelCompound.Search />
 *     ...
 *   </FilterPanelCompound.Root>
 * </FilterProvider>
 * ```
 */
export const FilterPanelCompound = {
  Root,
  Header,
  Search,
  Cuisine,
  Price,
  Rating,
  OpenNow,
  Districts,
  Features,
  PointTypes,
  Sort,
  Reset,
  Legend,
};

/**
 * 完全なFilterPanelをレンダリングするショートカット
 */
export const FullFilterPanel = memo(function FullFilterPanel() {
  return (
    <Root>
      <Header />
      <Search />
      <Cuisine />
      <Price />
      <Rating />
      <OpenNow />
      <Districts />
      <Features />
      <PointTypes />
      <Sort />
      <Reset />
      <Legend />
    </Root>
  );
});
