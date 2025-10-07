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

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/App ready to work offline/i);

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

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/New content available/i);

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
});
