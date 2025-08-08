/**
 * @fileoverview PWA register mock for testing
 * テスト用PWAレジスターモック
 */

import { vi } from "vitest";

export const useRegisterSW = vi.fn(() => ({
  needRefresh: [false, vi.fn()],
  offlineReady: [false, vi.fn()],
  updateServiceWorker: vi.fn(() => Promise.resolve()),
}));
