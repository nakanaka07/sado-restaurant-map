// PWARegister.ts
// Production のみで PWA 仮想モジュールを読み込む安全ラッパー。
// dev (import.meta.env.DEV) では vite-plugin-pwa の仮想モジュールは生成されず
// 直接 import すると "PWA module not available" エラーになる場合があるため遅延判定する。

export async function registerPWA() {
  // 本番または開発で ENABLE_PWA_DEV が有効な場合のみ登録を行う
  const isPWAEnabled =
    import.meta.env.PROD || import.meta.env.ENABLE_PWA_DEV === "true";
  if (!isPWAEnabled) {
    return;
  }
  try {
    const { registerSW } = await import("virtual:pwa-register");
    let currentReg: ServiceWorkerRegistration | undefined;
    registerSW({
      onRegistered(swReg: ServiceWorkerRegistration | undefined) {
        currentReg = swReg;
        if (swReg) {
          console.log("[PWA] Service Worker registered");
        }
        window.dispatchEvent(
          new CustomEvent("pwa:registered", { detail: { registration: swReg } })
        );
        document.dispatchEvent(
          new CustomEvent("pwa:registered", { detail: { registration: swReg } })
        );
      },
      onNeedRefresh() {
        window.dispatchEvent(
          new CustomEvent("pwa:needRefresh", {
            detail: { registration: currentReg },
          })
        );
        document.dispatchEvent(
          new CustomEvent("pwa:needRefresh", {
            detail: { registration: currentReg },
          })
        );
      },
      onOfflineReady() {
        window.dispatchEvent(new CustomEvent("pwa:offlineReady"));
        document.dispatchEvent(new CustomEvent("pwa:offlineReady"));
      },
      onRegisterError(err: unknown) {
        console.warn("[PWA] register error", err);
        window.dispatchEvent(
          new CustomEvent("pwa:registerError", { detail: { error: err } })
        );
        document.dispatchEvent(
          new CustomEvent("pwa:registerError", { detail: { error: err } })
        );
      },
    });
  } catch (e) {
    console.warn("[PWA] module not available (likely build mis-config):", e);
  }
}
