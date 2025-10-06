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
    registerSW({
      onRegistered(swReg: ServiceWorkerRegistration | undefined) {
        if (swReg) console.log("[PWA] Service Worker registered");
      },
      onRegisterError(err: unknown) {
        console.warn("[PWA] register error", err);
      },
    });
  } catch (e) {
    console.warn("[PWA] module not available (likely build mis-config):", e);
  }
}
