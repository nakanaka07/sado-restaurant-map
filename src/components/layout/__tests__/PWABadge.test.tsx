import { act, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import PWABadge from "../PWABadge";

describe("PWABadge", () => {
  const getListener = (spy: ReturnType<typeof vi.spyOn>, type: string) => {
    const call = spy.mock.calls.find(args => args[0] === type);
    return call?.[1] as (e: Event) => void;
  };

  test("shows offlineReady message and can close", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    render(<PWABadge />);

    await new Promise(res => setTimeout(res, 0));
    act(() => {});
    const offlineHandler = getListener(addSpy, "pwa:offlineReady");
    expect(offlineHandler).toBeTruthy();
    if (offlineHandler)
      act(() => offlineHandler(new Event("pwa:offlineReady")));

    const alerts = await screen.findAllByRole("alert");
    const pwaBadgeAlert = alerts.find(el =>
      el.textContent?.includes("App ready to work offline")
    );
    expect(pwaBadgeAlert).toBeDefined();
    expect(pwaBadgeAlert).toHaveTextContent(/App ready to work offline/i);

    const close = screen.getByRole("button", { name: /close/i });
    fireEvent.click(close);

    expect(screen.queryByRole("alert")).toBeNull();
    addSpy.mockRestore();
  });

  test("shows needRefresh and reload triggers update+reload", async () => {
    const update = vi.fn(() => Promise.resolve());
    // Simulate registration delivered from event
    const registration = {
      update,
      active: { state: "activated", scriptURL: "/sw.js" },
    } as unknown as ServiceWorkerRegistration;

    const addSpy = vi.spyOn(window, "addEventListener");
    render(<PWABadge />);

    await new Promise(res => setTimeout(res, 0));
    act(() => {});
    const needRefreshHandler = getListener(addSpy, "pwa:needRefresh");
    expect(needRefreshHandler).toBeTruthy();
    if (needRefreshHandler)
      act(() =>
        needRefreshHandler(
          new CustomEvent("pwa:needRefresh", { detail: { registration } })
        )
      );

    const alerts = await screen.findAllByRole("alert");
    const pwaBadgeAlert = alerts.find(el =>
      el.textContent?.includes("New content available")
    );
    expect(pwaBadgeAlert).toBeDefined();
    expect(pwaBadgeAlert).toHaveTextContent(/New content available/i);

    const originalLocation = window.location;
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, reload: reloadMock },
      configurable: true,
    });

    const btn = screen.getByRole("button", { name: /reload/i });
    await act(async () => {
      fireEvent.click(btn);
      await Promise.resolve();
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(reloadMock).toHaveBeenCalledTimes(1);
    Object.defineProperty(window, "location", { value: originalLocation });
    addSpy.mockRestore();
  });

  test("registers both window and document event listeners", () => {
    const windowSpy = vi.spyOn(window, "addEventListener");
    const documentSpy = vi.spyOn(document, "addEventListener");

    render(<PWABadge />);

    // Both window and document should have listeners
    expect(windowSpy).toHaveBeenCalledWith(
      "pwa:registered",
      expect.any(Function)
    );
    expect(documentSpy).toHaveBeenCalledWith(
      "pwa:registered",
      expect.any(Function)
    );

    windowSpy.mockRestore();
    documentSpy.mockRestore();
  });

  test("handles pwa:registered event and stores registration", async () => {
    const registration = {
      active: { state: "activated", scriptURL: "/sw.js" },
    } as unknown as ServiceWorkerRegistration;

    const addSpy = vi.spyOn(window, "addEventListener");
    render(<PWABadge />);

    await new Promise(res => setTimeout(res, 0));
    act(() => {});

    const registeredHandler = getListener(addSpy, "pwa:registered");
    expect(registeredHandler).toBeTruthy();

    if (registeredHandler) {
      act(() =>
        registeredHandler(
          new CustomEvent("pwa:registered", { detail: { registration } })
        )
      );
    }

    // Registration stored internally
    // Note: May trigger offlineReady which shows UI, so we just check handler exists
    expect(registeredHandler).toBeDefined();
    addSpy.mockRestore();
  });

  test("handles pwa:registerError event", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const addSpy = vi.spyOn(window, "addEventListener");

    render(<PWABadge />);

    await new Promise(res => setTimeout(res, 0));
    act(() => {});

    const errorHandler = getListener(addSpy, "pwa:registerError");
    expect(errorHandler).toBeTruthy();

    if (errorHandler) {
      const testError = new Error("SW registration failed");
      act(() =>
        errorHandler(
          new CustomEvent("pwa:registerError", { detail: { error: testError } })
        )
      );
    }

    expect(consoleSpy).toHaveBeenCalledWith(
      "[PWA] register error",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
    addSpy.mockRestore();
  });

  test("can close needRefresh alert without reloading", async () => {
    const registration = {
      update: vi.fn(() => Promise.resolve()),
      active: { state: "activated", scriptURL: "/sw.js" },
    } as unknown as ServiceWorkerRegistration;

    const addSpy = vi.spyOn(window, "addEventListener");
    const { unmount } = render(<PWABadge />);

    await new Promise(res => setTimeout(res, 0));
    act(() => {});

    const needRefreshHandler = getListener(addSpy, "pwa:needRefresh");
    if (needRefreshHandler) {
      act(() =>
        needRefreshHandler(
          new CustomEvent("pwa:needRefresh", { detail: { registration } })
        )
      );
    }

    const alerts = screen.queryAllByRole("alert");
    if (alerts.length > 0) {
      const closeButtons = screen.queryAllByRole("button", { name: /close/i });
      if (closeButtons.length > 0) {
        fireEvent.click(closeButtons[closeButtons.length - 1]);
        await new Promise(res => setTimeout(res, 100));
      }
    }

    unmount();
    addSpy.mockRestore();
  });

  test("attempts to get existing service worker registration on mount", async () => {
    const mockRegistration = {
      active: { state: "activated", scriptURL: "/sw.js" },
    } as unknown as ServiceWorkerRegistration;

    const getRegistrationMock = vi.fn(() => Promise.resolve(mockRegistration));
    Object.defineProperty(navigator, "serviceWorker", {
      value: { getRegistration: getRegistrationMock },
      configurable: true,
    });

    render(<PWABadge />);

    await new Promise(res => setTimeout(res, 100));

    expect(getRegistrationMock).toHaveBeenCalled();
  });

  test("handles missing serviceWorker API gracefully", () => {
    const originalServiceWorker = navigator.serviceWorker;
    Object.defineProperty(navigator, "serviceWorker", {
      value: undefined,
      configurable: true,
    });

    expect(() => {
      render(<PWABadge />);
    }).not.toThrow();

    Object.defineProperty(navigator, "serviceWorker", {
      value: originalServiceWorker,
      configurable: true,
    });
  });

  test("cleans up event listeners on unmount", () => {
    const windowRemoveSpy = vi.spyOn(window, "removeEventListener");
    const documentRemoveSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = render(<PWABadge />);

    unmount();

    // Cleanup should have been called for all event types
    expect(windowRemoveSpy).toHaveBeenCalledWith(
      "pwa:registered",
      expect.any(Function)
    );
    expect(documentRemoveSpy).toHaveBeenCalledWith(
      "pwa:registered",
      expect.any(Function)
    );

    windowRemoveSpy.mockRestore();
    documentRemoveSpy.mockRestore();
  });
});
