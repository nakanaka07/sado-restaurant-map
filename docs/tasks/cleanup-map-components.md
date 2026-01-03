# Map components cleanup (2025-10-08)

This document tracks the cleanup around `src/components/map` and `src/components/markers`.

## Summary

- Removed ghost exports/imports to non-existent `legacy/*` files.
- Standardized migration fallback to `UnifiedMarker`.
- Kept dev/test-only components in place but avoided exporting them from barrels.

## Decisions

- Barrel (map/MapView/index.ts): removed `../legacy/MapView/MapMarker` export.
- RestaurantMap: replaced legacy `OptimizedRestaurantMarker` usage with `UnifiedMarker`.
- MarkerMigration: removed legacy imports and used `UnifiedMarker` variants:
  `svg` (new), `icon` (legacy), `pin` (final fallback).
- Do not export `MapViewWithTesting` from `map/index.ts` to avoid accidental usage.

## Candidates for deletion (need confirmation)

- `src/components/markers/IcooonMarker.tsx`: no references found in app code.
  If UnifiedMarker/CircularMarker fully replace it, consider deletion or move
  under `experimental/`.
- `src/components/map/markers/ClusterMarker.tsx`: not wired yet; either connect
  it to `useMarkerOptimization` output or remove if not planned.

## Follow-ups

- Consider consolidating `MarkerSize` types to avoid confusion across modules.
- Consider unifying MapErrorBoundary variants.
