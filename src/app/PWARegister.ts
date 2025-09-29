// PWARegister.ts
// Production のみで PWA 仮想モジュールを読み込む安全ラッパー。
// dev (import.meta.env.DEV) では vite-plugin-pwa の仮想モジュールは生成されず
// 直接 import すると "PWA module not available" エラーになる場合があるため遅延判定する。

export async function registerPWA() {
  if (!import.meta.env.PROD) {
    // 開発では SW 未登録 (要求があれば ENABLE_PWA_DEV フラグで制御)。
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
