import { Deck, DailyProgress, LearnerError } from "../types";

const DB_NAME = "linguist_pro_srs_db";
const DB_VERSION = 1;

const STORE_DECKS = "decks";
const STORE_DAILY_PROGRESS = "daily_progress";
const STORE_LEARNER_ERRORS = "learner_errors";
const STORE_META = "meta";

/**
 * Opens and initializes the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_DECKS)) {
        db.createObjectStore(STORE_DECKS, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORE_DAILY_PROGRESS)) {
        db.createObjectStore(STORE_DAILY_PROGRESS, { keyPath: "date" });
      }

      if (!db.objectStoreNames.contains(STORE_LEARNER_ERRORS)) {
        db.createObjectStore(STORE_LEARNER_ERRORS, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Save all decks into IndexedDB
 */
export async function saveDecksToIndexedDB(decks: Deck[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DECKS, "readwrite");
    const store = tx.objectStore(STORE_DECKS);

    // Clear existing decks and re-insert to keep order and removals in sync
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    for (const deck of decks) {
      store.put(deck);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[IndexedDB] Failed to save decks:", err);
  }
}

/**
 * Load all decks from IndexedDB
 */
export async function loadDecksFromIndexedDB(): Promise<Deck[] | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DECKS, "readonly");
    const store = tx.objectStore(STORE_DECKS);

    const decks = await new Promise<Deck[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    if (Array.isArray(decks) && decks.length > 0) {
      return decks;
    }
    return null;
  } catch (err) {
    console.warn("[IndexedDB] Failed to load decks:", err);
    return null;
  }
}

/**
 * Save Daily Progress into IndexedDB
 */
export async function saveDailyProgressToIndexedDB(progress: DailyProgress): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DAILY_PROGRESS, "readwrite");
    const store = tx.objectStore(STORE_DAILY_PROGRESS);

    store.put(progress);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[IndexedDB] Failed to save daily progress:", err);
  }
}

/**
 * Load the latest Daily Progress from IndexedDB
 */
export async function loadDailyProgressFromIndexedDB(): Promise<DailyProgress | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DAILY_PROGRESS, "readonly");
    const store = tx.objectStore(STORE_DAILY_PROGRESS);

    const allRecords = await new Promise<DailyProgress[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    if (allRecords.length > 0) {
      // Sort by date descending
      allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return allRecords[0];
    }
    return null;
  } catch (err) {
    console.warn("[IndexedDB] Failed to load daily progress:", err);
    return null;
  }
}

/**
 * Save Learner Errors into IndexedDB
 */
export async function saveLearnerErrorsToIndexedDB(errors: LearnerError[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_LEARNER_ERRORS, "readwrite");
    const store = tx.objectStore(STORE_LEARNER_ERRORS);

    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    for (const err of errors) {
      store.put(err);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[IndexedDB] Failed to save learner errors:", err);
  }
}

/**
 * Load Learner Errors from IndexedDB
 */
export async function loadLearnerErrorsFromIndexedDB(): Promise<LearnerError[] | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_LEARNER_ERRORS, "readonly");
    const store = tx.objectStore(STORE_LEARNER_ERRORS);

    const errors = await new Promise<LearnerError[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    if (Array.isArray(errors) && errors.length > 0) {
      return errors;
    }
    return null;
  } catch (err) {
    console.warn("[IndexedDB] Failed to load learner errors:", err);
    return null;
  }
}

/**
 * Save a meta key/value pair (e.g. active deck ID)
 */
export async function saveMetaToIndexedDB(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_META, "readwrite");
    const store = tx.objectStore(STORE_META);

    store.put({ key, value });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Failed to save meta for ${key}:`, err);
  }
}

/**
 * Load a meta value by key
 */
export async function loadMetaFromIndexedDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_META, "readonly");
    const store = tx.objectStore(STORE_META);

    const result = await new Promise<{ key: string; value: T } | undefined>((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return result ? result.value : null;
  } catch (err) {
    console.warn(`[IndexedDB] Failed to load meta for ${key}:`, err);
    return null;
  }
}

// Convenient aliases for App.tsx
export const loadDecksFromDB = loadDecksFromIndexedDB;
export const saveDecksToDB = saveDecksToIndexedDB;
export const saveActiveDeckIdToDB = (id: string) => saveMetaToIndexedDB("active_deck_id", id);
export const loadActiveDeckIdFromDB = () => loadMetaFromIndexedDB<string>("active_deck_id");

