import { act, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import PWABadge from "../PWABadge";

// We import the module that dispatches events when registerSW is called
import { registerPWA } from "@/app/PWARegister";

// Mock the virtual module to control callbacks
interface PwaTestTriggers {
  triggerRegistered: (reg?: ServiceWorkerRegistration) => void;
  triggerNeedRefresh: () => void;
  triggerOfflineReady: () => void;
  triggerError: (e: unknown) => void;
}

declare global {
  var __pwa: PwaTestTriggers | undefined;
}

vi.mock("virtual:pwa-register", () => {
  return {
    registerSW: (opts?: {
      onRegistered?: (r?: ServiceWorkerRegistration) => void;
      onNeedRefresh?: () => void;
      onOfflineReady?: () => void;
      onRegisterError?: (e: unknown) => void;
    }) => {
      // expose triggers on global for this test
      globalThis.__pwa = {
        triggerRegistered: (reg?: ServiceWorkerRegistration) =>
          opts?.onRegistered?.(reg),
        triggerNeedRefresh: () => opts?.onNeedRefresh?.(),
        triggerOfflineReady: () => opts?.onOfflineReady?.(),
        triggerError: (e: unknown) => opts?.onRegisterError?.(e),
      } satisfies PwaTestTriggers;
    },
  };
});

describe("PWA integration flow", () => {
  test("PWARegister → events → PWABadge UI", async () => {
    render(<PWABadge />);

    await act(async () => {
      await registerPWA();
    });

    // trigger offlineReady
    act(() => {
      globalThis.__pwa?.triggerOfflineReady();
    });

    const alert1 = await screen.findByRole("alert");
    expect(alert1).toHaveTextContent(/App ready to work offline/i);

    // trigger needRefresh after
    act(() => {
      globalThis.__pwa?.triggerNeedRefresh();
    });

    const alert2 = await screen.findByRole("alert");
    expect(alert2).toHaveTextContent(/New content available/i);
  });
});
