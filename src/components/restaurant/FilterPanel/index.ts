/**
 * @fileoverview FilterPanel barrel exports
 * FilterPanelディレクトリの統一エクスポート
 */

// Legacy FilterPanel (for backward compatibility)
export { CuisineFilter } from "./CuisineFilter";
export { DistrictFilter } from "./DistrictFilter";
export { FeatureFilter } from "./FeatureFilter";
export { FilterPanel } from "./FilterPanel";
export { MapLegend } from "./MapLegend";
export { PriceFilter } from "./PriceFilter";
export { SearchFilter } from "./SearchFilter";
export { useFilterState } from "./useFilterState";

// New Compound Components Pattern (Week 2 P2-1)
export { FilterPanelCompound, FullFilterPanel } from "./FilterPanelCompound";

// Context-Connected Components (Week 2 P2-2)
export { ConnectedFilterPanel } from "./ConnectedFilterPanel";

export type { FilterHandlers } from "./useFilterState";
