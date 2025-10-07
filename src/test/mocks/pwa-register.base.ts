/**
 * Mock for `virtual:pwa-register` base module
 */
export interface RegisterSWOptions {
  immediate?: boolean;
  onRegistered?(registration: ServiceWorkerRegistration | undefined): void;
  onRegisterError?(error: unknown): void;
  onNeedRefresh?(): void;
  onOfflineReady?(): void;
}

export function registerSW(options?: RegisterSWOptions): void {
  // no-op default; tests can spy on this module and trigger callbacks
  if (options?.onRegistered) {
    options.onRegistered(undefined);
  }
}
