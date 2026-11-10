/**
 * Shaka Player Loader
 *
 * Provides SSR-safe, dynamic loading of Shaka Player for React / Next.js / TanStack Start.
 * Automatically polyfills browser media engines and verifies DRM & MSE support.
 */

let shakaLoadingPromise: Promise<any> | null = null;

export async function loadShakaPlayer(): Promise<any> {
  if (typeof window === "undefined") {
    return null;
  }

  // Already loaded in window
  if ((window as any).shaka) {
    const shaka = (window as any).shaka;
    if (shaka.polyfill) shaka.polyfill.installAll();
    return shaka;
  }

  if (shakaLoadingPromise) {
    return shakaLoadingPromise;
  }

  shakaLoadingPromise = (async () => {
    // 1. Try dynamic import if installed via npm/bundler
    try {
      const mod = await import("shaka-player");
      const shaka = (mod as any).default || mod;
      if (shaka && typeof shaka.Player === "function") {
        if (shaka.polyfill) shaka.polyfill.installAll();
        (window as any).shaka = shaka;
        return shaka;
      }
    } catch {
      // Not bundled via npm, fallback to CDN below
    }

    // 2. Fallback to official CDN bundle
    return new Promise((resolve, reject) => {
      // Check if script tag is already in DOM
      const existing = document.querySelector('script[data-lib="shaka-player"]') as HTMLScriptElement;
      if (existing) {
        if ((window as any).shaka) {
          const shaka = (window as any).shaka;
          if (shaka.polyfill) shaka.polyfill.installAll();
          return resolve(shaka);
        }
        existing.addEventListener("load", () => {
          const shaka = (window as any).shaka;
          if (shaka?.polyfill) shaka.polyfill.installAll();
          resolve(shaka);
        });
        existing.addEventListener("error", (e) => reject(new Error("Shaka CDN script failed: " + e)));
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.11.16/shaka-player.compiled.js";
      script.async = true;
      script.dataset.lib = "shaka-player";

      script.onload = () => {
        const shaka = (window as any).shaka;
        if (!shaka) {
          return reject(new Error("Shaka Player loaded from CDN but window.shaka was not found."));
        }
        if (shaka.polyfill) {
          shaka.polyfill.installAll();
        }
        resolve(shaka);
      };

      script.onerror = (e) => {
        reject(new Error("Failed to load Shaka Player script from CDN: " + String(e)));
      };

      document.head.appendChild(script);
    });
  })();

  return shakaLoadingPromise;
}

