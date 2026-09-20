/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const STORAGE_KEY_GEMINI = "languagetwin_user_gemini_api_key";
const STORAGE_KEY_OWNER = "languagetwin_gemini_key_owner";
const STORAGE_KEY_EVELYN = "languagetwin_gemini_api_key_evelynkuoev@gmail.com";

/**
 * Retrieve the active user-configured Gemini API Key from localStorage
 */
export function getStoredGeminiApiKey(userEmail?: string | null): string | null {
  try {
    // If specific to Evelyn Kuo user
    if (userEmail && userEmail.toLowerCase().includes("evelynkuoev")) {
      const evelynKey = localStorage.getItem(STORAGE_KEY_EVELYN);
      if (evelynKey && evelynKey.trim()) return evelynKey.trim();
    }

    const standardKey = localStorage.getItem(STORAGE_KEY_GEMINI);
    if (standardKey && standardKey.trim()) return standardKey.trim();

    // Fallback check for Evelyn key if previously set
    const fallbackEvelyn = localStorage.getItem(STORAGE_KEY_EVELYN);
    if (fallbackEvelyn && fallbackEvelyn.trim()) return fallbackEvelyn.trim();

    return null;
  } catch (e) {
    console.warn("Could not read Gemini API key from storage:", e);
    return null;
  }
}

/**
 * Save user Gemini API key to localStorage and sync across user identifiers
 */
export function setStoredGeminiApiKey(
  apiKey: string | null,
  ownerInfo?: { email?: string | null; displayName?: string | null }
): void {
  try {
    if (apiKey && apiKey.trim()) {
      const trimmed = apiKey.trim();
      localStorage.setItem(STORAGE_KEY_GEMINI, trimmed);

      const ownerEmail = ownerInfo?.email?.toLowerCase() || "";
      const ownerName = ownerInfo?.displayName || "";

      if (ownerEmail.includes("evelynkuoev") || ownerName.toLowerCase().includes("evelyn")) {
        localStorage.setItem(STORAGE_KEY_EVELYN, trimmed);
      }

      localStorage.setItem(
        STORAGE_KEY_OWNER,
        JSON.stringify({
          email: ownerInfo?.email || "evelynkuoev@gmail.com",
          displayName: ownerInfo?.displayName || "Evelyn Kuo",
          updatedAt: new Date().toISOString(),
        })
      );
    } else {
      localStorage.removeItem(STORAGE_KEY_GEMINI);
      if (ownerInfo?.email?.toLowerCase().includes("evelynkuoev")) {
        localStorage.removeItem(STORAGE_KEY_EVELYN);
      }
      localStorage.removeItem(STORAGE_KEY_OWNER);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("languagetwin:gemini-key-changed"));
    }
  } catch (e) {
    console.warn("Could not write Gemini API key to storage:", e);
  }
}

/**
 * Mask an API key for safe visual representation in UI (e.g. AIzaSy...9xL4)
 */
export function maskApiKey(key: string): string {
  if (!key) return "";
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "••••••••";
  const start = trimmed.slice(0, 6);
  const end = trimmed.slice(-4);
  return `${start}••••••••${end}`;
}

/**
 * Check if a string matches a valid Google Gemini API key format.
 * Supports standard AIzaSy keys, Google Cloud AQ. keys, and AI Studio tokens.
 */
export function validateGeminiKeyFormat(key: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.length >= 20 && !trimmed.includes(" ");
}

let serverDefaultKeyAvailable: boolean = true;

export function setServerDefaultKeyAvailable(available: boolean): void {
  serverDefaultKeyAvailable = available;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("languagetwin:gemini-key-changed"));
  }
}

/**
 * Determines whether an active Gemini key is available.
 * Returns true if a user-supplied key exists, if the default environment key is active,
 * or if running under the Evelyn Kuo profile.
 */
export function isGeminiKeyActive(userEmail?: string | null): boolean {
  const stored = getStoredGeminiApiKey(userEmail);
  if (stored && stored.trim().length >= 10) return true;

  // Active by default via server environment key and for Evelyn Kuo's account
  if (serverDefaultKeyAvailable) return true;
  if (userEmail && userEmail.toLowerCase().includes("evelyn")) return true;

  return false;
}

export const GEMINI_KEY_REQUIRED_EVENT = "languagetwin:gemini-key-required";

/**
 * Dispatches an event to open the API Key setup modal with a user-facing notice.
 */
export function notifyGeminiKeyRequired(reason?: string): void {
  if (typeof window === "undefined") return;
  const message =
    reason ||
    "A Google Gemini API key is required to make AI requests. Please configure your key in settings.";
  window.dispatchEvent(
    new CustomEvent(GEMINI_KEY_REQUIRED_EVENT, {
      detail: { message },
    })
  );
}

/**
 * Checks if a valid Gemini API key is currently available (custom or environment default).
 * If not, triggers the key required notification and returns false.
 */
export function checkHasGeminiApiKey(featureName?: string, userEmail?: string | null): boolean {
  if (isGeminiKeyActive(userEmail)) {
    return true;
  }
  notifyGeminiKeyRequired(
    featureName
      ? `A Google Gemini API key is required to use ${featureName}. Please add your key to proceed.`
      : undefined
  );
  return false;
}

/**
 * Safe fetch wrapper that automatically injects the user's custom Gemini API key
 * header (`x-gemini-api-key`) into outgoing /api/* requests if configured.
 * When no custom key is provided, requests proceed so the backend can use the
 * default environment key.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : (input as Request)?.url || "";

  const isAiRoute =
    url &&
    (url.startsWith("/api/") || url.includes("/api/")) &&
    !url.includes("/api/health") &&
    !url.includes("/api/test-gemini-key") &&
    !url.includes("/api/gemini-key-status");

  const userKey = getStoredGeminiApiKey();

  if (userKey) {
    const headers = new Headers(
      init?.headers || (input instanceof Request ? input.headers : {})
    );
    if (!headers.has("x-gemini-api-key")) {
      headers.set("x-gemini-api-key", userKey);
    }
    init = {
      ...init,
      headers,
    };
  }

  const response = await fetch(input, init);

  if (response.status === 401 && isAiRoute) {
    try {
      const clone = response.clone();
      clone.json().then((data) => {
        if (data?.requiresApiKey) {
          notifyGeminiKeyRequired(data.error);
        }
      }).catch(() => {});
    } catch {
      // Ignore
    }
  }

  return response;
}

let interceptorInstalled = false;

/**
 * Safely attaches the user's personal Gemini API key header
 * (`x-gemini-api-key`) to outgoing `/api/*` fetch requests if configured.
 */
export function setupGeminiKeyInterceptor(): void {
  if (typeof window === "undefined" || interceptorInstalled) return;
  interceptorInstalled = true;

  try {
    const originalFetch = window.fetch ? window.fetch.bind(window) : fetch.bind(globalThis);
    const customFetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.toString()
          : (input as Request)?.url || "";

      const isAiRoute =
        url &&
        (url.startsWith("/api/") || url.includes("/api/")) &&
        !url.includes("/api/health") &&
        !url.includes("/api/test-gemini-key") &&
        !url.includes("/api/gemini-key-status");

      const userKey = getStoredGeminiApiKey();

      try {
        if (isAiRoute && userKey) {
          const headers = new Headers(
            init?.headers || (input instanceof Request ? input.headers : {})
          );
          if (!headers.has("x-gemini-api-key")) {
            headers.set("x-gemini-api-key", userKey);
          }
          init = {
            ...init,
            headers,
          };
        }
      } catch {
        // Continue with original headers if header formation fails
      }

      const res = await originalFetch(input, init);

      if (res.status === 401 && isAiRoute) {
        try {
          const clone = res.clone();
          clone.json().then((data) => {
            if (data?.requiresApiKey) {
              notifyGeminiKeyRequired(data.error);
            }
          }).catch(() => {});
        } catch {
          // Ignore
        }
      }

      return res;
    };

    // Attempt patching safely without throwing
    let patched = false;
    try {
      Object.defineProperty(window, "fetch", {
        value: customFetch,
        writable: true,
        configurable: true,
      });
      patched = true;
    } catch {
      // Ignored
    }

    if (!patched) {
      try {
        (window as any).fetch = customFetch;
        patched = true;
      } catch {
        // Ignored
      }
    }
  } catch (err) {
    console.warn("Global fetch interceptor not supported in this runtime, using explicit apiFetch fallback:", err);
  }
}
