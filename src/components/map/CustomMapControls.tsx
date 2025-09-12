/**
 * @fileoverview Custom Map Controls for Google Maps
 * Google Maps APIのカスタムコントロール機能を使用したフィルターボタン
 */

import type { CompactModalFilterProps } from "@/types";
import { useMap } from "@vis.gl/react-google-maps";
import { memo, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { CompactModalFilter } from "../ui/CompactModalFilter";

interface CustomMapControlsProps extends CompactModalFilterProps {
  readonly position?: google.maps.ControlPosition;
}

/**
 * Google Maps内にカスタムコントロールとしてフィルターボタンを配置
 * フルスクリーン時でも確実に表示される
 */
export const CustomMapControls = memo<CustomMapControlsProps>(
  function CustomMapControls({
    position = google.maps?.ControlPosition?.BOTTOM_LEFT || 10,
    ...filterProps
  }) {
    const map = useMap();
    const controlElementRef = useRef<HTMLDivElement | null>(null);
    const reactRootRef = useRef<ReturnType<typeof createRoot> | null>(null);

    useEffect(() => {
      if (!map) return;

      // カスタムコントロール要素を作成
      const controlElement = document.createElement("div");
      controlElement.style.margin = "10px";
      controlElement.style.zIndex = "1000";
      controlElementRef.current = controlElement;

      // React コンポーネントをカスタムコントロール内にレンダリング
      const reactRoot = createRoot(controlElement);
      reactRootRef.current = reactRoot;

      reactRoot.render(
        <CompactModalFilter
          {...filterProps}
          className="map-custom-filter-control"
        />
      );

      // Google Maps にカスタムコントロールを追加
      map.controls[position].push(controlElement);

      // クリーンアップ関数
      return () => {
        if (controlElementRef.current) {
          // マップからコントロールを削除
          const controlIndex = map.controls[position]
            .getArray()
            .indexOf(controlElementRef.current);
          if (controlIndex > -1) {
            map.controls[position].removeAt(controlIndex);
          }
        }

        // React Root を unmount
        if (reactRootRef.current) {
          reactRootRef.current.unmount();
          reactRootRef.current = null;
        }
      };
    }, [map, position, filterProps]);

    // コンポーネント自体は何もレンダリングしない（カスタムコントロールとしてマップに直接配置される）
    return null;
  }
);

CustomMapControls.displayName = "CustomMapControls";
