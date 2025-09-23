import { useEffect, useState } from "react";
import "../../styles/PWABadge.css";

// 🔧 PWA関連の型定義
type PWAModule = {
  useRegisterSW: (options: {
    onRegisteredSW?: (swUrl: string, r?: ServiceWorkerRegistration) => void;
  }) => {
    offlineReady: [boolean, (value: boolean) => void];
    needRefresh: [boolean, (value: boolean) => void];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
};

// 🔧 開発環境でのvirtual moduleエラー対応
// PWAが無効な開発環境では、このコンポーネントは何も表示しない
const isPWAEnabled =
  import.meta.env.PROD || import.meta.env.ENABLE_PWA_DEV === "true";

// 🔧 開発環境でのService Worker完全制御
const isDevelopment = import.meta.env.DEV;

function PWABadge() {
  // 開発環境でService Workerを強制アンレジスター
  useEffect(() => {
    if (isDevelopment && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then(registrations => {
          registrations.forEach(registration => {
            console.log(
              "🔧 [PWA] Development mode: Unregistering Service Worker"
            );
            registration.unregister().catch(console.warn);
          });
        })
        .catch(console.warn);
    }
  }, []);

  // PWAが無効化されている場合は何も表示しない
  if (!isPWAEnabled) {
    return null;
  }

  // PWAが有効な場合のみ実際のPWA機能を読み込み
  return <PWABadgeWithSW />;
}

// PWA機能を持つコンポーネント（PWA有効時のみ読み込まれる）
function PWABadgeWithSW() {
  const [pwaSW, setPwaSW] = useState<PWAModule | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 文字列結合でvirtual moduleを動的構築（静的解析を回避）
    const pwaModuleName = ["virtual:", "pwa-register", "react"].join("/");

    const loadPWAModule = async () => {
      try {
        const pwaModule = (await import(
          /* @vite-ignore */ pwaModuleName
        )) as PWAModule;
        setPwaSW(pwaModule);
      } catch (error) {
        console.warn("PWA module not available:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    void loadPWAModule();
  }, []);

  // モジュールが読み込まれていない場合は何も表示しない
  if (!isLoaded || !pwaSW?.useRegisterSW) {
    return null;
  }

  return <PWABadgeContent useRegisterSW={pwaSW.useRegisterSW} />;
}

function PWABadgeContent({
  useRegisterSW,
}: {
  readonly useRegisterSW: PWAModule["useRegisterSW"];
}) {
  // check for updates every hour
  const period = 60 * 60 * 1000;

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl: string, r: ServiceWorkerRegistration | undefined) {
      if (period <= 0) return;
      if (r?.active?.state === "activated") {
        registerPeriodicSync(period, swUrl, r);
      } else if (r?.installing) {
        r.installing.addEventListener("statechange", (e: Event) => {
          const sw = e.target as ServiceWorker;
          if (sw.state === "activated") {
            registerPeriodicSync(period, swUrl, r);
          }
        });
      }
    },
  });

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
            {needRefresh && (
              <button
                className="PWABadge-toast-button"
                onClick={() => {
                  updateServiceWorker(true).catch(console.error);
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
