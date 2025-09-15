/**
 * アクセシビリティ自動テストセットアップ
 * WCAG 2.2 AA準拠の継続的保証システム
 */

import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll } from "vitest";

// テスト環境セットアップ
beforeAll(() => {
  // Mock Google Maps API for testing
  (global as any).google = {
    maps: {
      Map: vi.fn(() => ({
        setCenter: vi.fn(),
        setZoom: vi.fn(),
        addListener: vi.fn(),
      })),
      Marker: vi.fn(() => ({
        setPosition: vi.fn(),
        setMap: vi.fn(),
        addListener: vi.fn(),
      })),
      InfoWindow: vi.fn(() => ({
        setContent: vi.fn(),
        open: vi.fn(),
        close: vi.fn(),
      })),
      event: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  };
});

afterEach(() => {
  cleanup();
});
