/* @vitest-environment jsdom */
import type { MapPoint } from "@/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CircularMarkerContainer } from "../CircularMarkerContainer";

// シンプルな駐車場ポイントモック
// district 型 (SadoDistrict) をテスト用に文字列で代替する場合、型整合のため型主張を限定的に使用
// 本番列挙に含まれる想定の値をそのまま使用し、unsafe any は避ける
const parkingPoint: MapPoint = {
  id: "parking-test-1",
  type: "parking",
  name: "テスト駐車場",
  district: "佐和田" as unknown as MapPoint["district"],
  address: "佐渡市佐和田123",
  coordinates: { lat: 38.0, lng: 138.4 },
  features: ["24時間", "無料"],
  lastUpdated: new Date().toISOString(),
  description: "テスト用の駐車場です",
  capacity: 50,
  fee: "無料",
};

// react-google-maps を最小モック: Map/AdvancedMarker/InfoWindow の DOM をシンプル化
vi.mock("@vis.gl/react-google-maps", () => ({
  Map: ({ children }: { children?: ReactNode }) => (
    <div data-testid="mock-map">{children}</div>
  ),
  // Wrapper only; actual interactive element is CircularMarker's <button>
  AdvancedMarker: ({ children }: { children?: ReactNode }) => (
    <span data-testid="advanced-marker" style={{ display: "inline-block" }}>
      {children}
    </span>
  ),
  InfoWindow: ({ children }: { children?: ReactNode }) => (
    <div role="dialog">{children}</div>
  ),
}));

// Wrapper: CircularMarkerContainer を直接利用
import { useState, type ReactNode } from "react";
function Wrapper() {
  const [selected, setSelected] = useState<MapPoint | null>(null);
  return (
    <div>
      <CircularMarkerContainer
        points={[parkingPoint]}
        markerSize="medium"
        onPointClick={p => setSelected(p)}
        selectedPoint={selected}
        showInfoWindow={!!selected}
        onInfoWindowClose={() => setSelected(null)}
      />
    </div>
  );
}

describe("Parking marker InfoWindow integration", () => {
  it("駐車場マーカークリックで InfoWindow が表示される", async () => {
    render(<Wrapper />);

    const markerButton = await screen.findByRole("button", {
      name: /駐車場: テスト駐車場/,
    });

    fireEvent.click(markerButton);

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      // InfoWindow 内コンテンツ (MapInfoWindow 経由) の一部を検証 (柔軟な空白許容)
      expect(dialog).toHaveTextContent("テスト駐車場");
      expect(dialog).toHaveTextContent(/容量:\s*50\s*台/);
      expect(dialog).toHaveTextContent(/料金:\s*無料/);
    });
  });
});
