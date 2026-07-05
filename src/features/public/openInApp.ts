// Deep-link helpers for the public share landing pages. These pages are what a
// recipient sees when a shared https://riden74.com/listing/:id link is opened
// somewhere Android App Links do NOT fire — in-app browsers (WhatsApp/Telegram),
// on a device without the app, on iOS, or on desktop.

export const APP_PACKAGE = 'com.riden74.app';
export const APP_SCHEME = 'realestatemobile';
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${APP_PACKAGE}`;

export function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
}

// Android `intent://` URL: opens the app if installed, otherwise Android routes
// to `browser_fallback_url` (the Play Store) — the app-or-store behaviour in a
// single navigation, no timers needed. `path` is e.g. `listing/abc`.
function intentUrl(path: string): string {
  const fallback = encodeURIComponent(PLAY_STORE_URL);
  return (
    `intent://${path}#Intent;scheme=${APP_SCHEME};package=${APP_PACKAGE};` +
    `S.browser_fallback_url=${fallback};end`
  );
}

/**
 * Send the user to the app at `path`; if it isn't installed, to the Play Store.
 * Android uses the atomic `intent://` scheme. Elsewhere (no published iOS app)
 * we try the custom scheme and fall back to the store after a short delay.
 */
export function openInApp(path: string): void {
  if (isAndroid()) {
    window.location.href = intentUrl(path);
    return;
  }
  const start = Date.now();
  const fallback = window.setTimeout(() => {
    if (Date.now() - start < 2500 && !document.hidden) {
      window.location.href = PLAY_STORE_URL;
    }
  }, 1400);
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) window.clearTimeout(fallback);
    },
    { once: true }
  );
  window.location.href = `${APP_SCHEME}://${path}`;
}
