/**
 * @fileoverview Map Error Boundary HOC
 * Higher-Order Component for wrapping map components with error boundary
 */

import React from "react";
import type { MapErrorBoundaryProps } from "./MapErrorBoundary";
import { MapErrorBoundary } from "./MapErrorBoundary";

/**
 * HOC: マップコンポーネントをError Boundaryで包む
 */
export function withMapErrorBoundary<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  errorBoundaryProps?: Omit<MapErrorBoundaryProps, "children">
) {
  const WrappedWithErrorBoundary = (props: T) => (
    <MapErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </MapErrorBoundary>
  );

  WrappedWithErrorBoundary.displayName = `withMapErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return WrappedWithErrorBoundary;
}
