import { useEffect, useState } from "react";
import "../../styles/PWABadge.css";

/**
 * WHY: vite-plugin-pwa の仮想モジュールは ビルド時に static analysis される前提。
 * 過去実装では `['virtual', 'pwa-register', 'react'].join(':')` のような
 * 動的文字列結合により `virtual:/pwa-register/react` (コロン後にスラッシュ挿入) という
 * 存在しないパスをブラウザがフェッチ → 404 → コンソールにノイズ、という問題が発生した。
 * さらに hook 版 (virtual:pwa-register/react) を使う必要性は薄く、
 * 基本的な registerSW API で十分だったため、hook 依存を排除し以下の方針に統一:
 *   1. runtime では `import("virtual:pwa-register")` をそのまま静的リテラルで記述 (Vite が置換)。
 *   2. DEV 環境では service worker 未登録でも問題ないよう try/catch で吸収。
 *   3. UI state (offlineReady / needRefresh) はフック経由ではなくローカルで保持。
 * このコメントは将来誰かが再び動的パス生成へ戻さないためのガード目的。
 */

// 🔧 PWA関連の型定義
// Hook 版モジュールを使うと dynamic import で解決されない環境があったため
// ベースの registerSW API に切り替え、状態管理はローカル実装する。
type RegisterSWFn = (options?: {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegistered?: (reg?: ServiceWorkerRegistration) => void;
  onRegisterError?: (error: unknown) => void;
}) => void;

// 有効時のみ SW 状態を監視するバッジコンポーネント
function PWABadge() {
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<
    ServiceWorkerRegistration | undefined
  >(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { registerSW } = (await import("virtual:pwa-register")) as {
          registerSW: RegisterSWFn;
        };
        registerSW({
          onOfflineReady: () => setOfflineReady(true),
          onNeedRefresh: () => setNeedRefresh(true),
          onRegistered: r => setRegistration(r),
          onRegisterError: err => console.warn("[PWA] register error", err),
        });
      } catch (e) {
        console.warn("[PWA] base module not available:", e);
      } finally {
        setLoaded(true);
      }
    };
    void init();
  }, []);

  if (!loaded) return null;

  // check for updates every hour
  const period = 60 * 60 * 1000;
  if (registration) {
    // 登録済み SW の状態に応じて周期更新をセット
    if (registration.active?.state === "activated") {
      registerPeriodicSync(period, registration.active.scriptURL, registration);
    }
  }

  function close() {
    setOfflineReady(false);
    setNeedRefresh(false);
  }

  return (
    <div className="PWABadge" role="alert" aria-labelledby="toast-message">
      {(offlineReady || needRefresh) && (
        <div className="PWABadge-toast">
          <div className="PWABadge-message">
            {offlineReady ? (
              <span id="toast-message">App ready to work offline</span>
            ) : (
              <span id="toast-message">
                New content available, click on reload button to update.
              </span>
            )}
          </div>
          <div className="PWABadge-buttons">
            {needRefresh && registration && (
              <button
                className="PWABadge-toast-button"
                onClick={() => {
                  registration
                    .update()
                    .then(() => location.reload())
                    .catch(console.error);
                }}
              >
                Reload
              </button>
            )}
            <button className="PWABadge-toast-button" onClick={() => close()}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PWABadge;

/**
 * This function will register a periodic sync check every hour, you can modify the interval as needed.
 */
function registerPeriodicSync(
  period: number,
  swUrl: string,
  r: ServiceWorkerRegistration
) {
  if (period <= 0) return;

  setInterval(() => {
    void (async () => {
      if ("onLine" in navigator && !navigator.onLine) return;

      const resp = await fetch(swUrl, {
        cache: "no-store",
        headers: {
          cache: "no-store",
          "cache-control": "no-cache",
        },
      });

      if (resp?.status === 200) await r.update();
    })();
  }, period);
}
