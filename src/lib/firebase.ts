import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Initialize Firestore (with designated custom database if configured)
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Authentication Helpers
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error("Sign Out Error:", error);
    throw error;
  }
}

export { onAuthStateChanged };
export type { User };

// Firestore Collections & Helpers
export const DECKS_COLLECTION = "decks";
export const USERS_COLLECTION = "users";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  const lower = errMessage.toLowerCase();
  if (
    lower.includes("resource-exhausted") ||
    lower.includes("write stream exhausted") ||
    lower.includes("backoff delay") ||
    lower.includes("too many requests")
  ) {
    triggerFirestoreBackoff(12000);
  }

  console.error("Firestore Error:", JSON.stringify(errInfo));
  return errInfo;
}

// ----------------------------------------------------
// Firestore Write Throttling, Mutex & Backoff Controls
// ----------------------------------------------------
let writeBackoffUntil = 0;

export function isFirestoreBackingOff(): boolean {
  return Date.now() < writeBackoffUntil;
}

export function triggerFirestoreBackoff(durationMs = 12000): void {
  writeBackoffUntil = Math.max(writeBackoffUntil, Date.now() + durationMs);
  console.warn(`[Firestore] Write stream backoff triggered for ${Math.round(durationMs / 1000)}s`);
}

// Tracks signatures of saved decks to avoid redundant duplicate writes
const savedDeckSignatures = new Map<string, string>();
const activeDeckSaves = new Set<string>();

function computeDeckSignature(deck: any): string {
  if (!deck) return "";
  const cardCount = deck.cards?.length || 0;
  const firstCardId = deck.cards?.[0]?.id || "";
  const lastCardId = deck.cards?.[cardCount - 1]?.id || "";
  return `${deck.id}_${deck.title || ""}_${deck.level || ""}_${cardCount}_${firstCardId}_${lastCardId}_${deck.updatedAt || ""}`;
}

/**
 * Deep sanitization to ensure Firestore compatibility:
 * Recursively converts any `undefined` values to `null` so setDoc() never throws
 * "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T = any>(obj: T): T {
  if (obj === undefined) {
    return null as any;
  }
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (obj instanceof Date) {
    return obj.toISOString() as any;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    } else {
      clean[key] = null;
    }
  }
  return clean as T;
}

/**
 * Save or publish a generated deck to the central Firestore library.
 * Fully throttled, deduplicated, and guarded against write-stream exhaustion.
 */
export async function saveDeckToCloud(deck: any, user?: User | null): Promise<void> {
  if (!deck || !deck.id) return;
  if (isFirestoreBackingOff()) {
    console.warn(`[Firestore] Skipping saveDeckToCloud for ${deck.id} due to active write stream backoff.`);
    return;
  }

  const sig = computeDeckSignature(deck);
  if (savedDeckSignatures.get(deck.id) === sig) {
    // Already saved to Firestore with identical content
    return;
  }

  if (activeDeckSaves.has(deck.id)) {
    // Already in flight
    return;
  }

  activeDeckSaves.add(deck.id);
  const path = `${DECKS_COLLECTION}/${deck.id}`;
  try {
    const deckDocRef = doc(db, DECKS_COLLECTION, deck.id);
    const cleanDeck = sanitizeForFirestore({
      id: deck.id,
      title: deck.title || "Custom Deck",
      description: deck.description || "",
      targetLang: deck.targetLang || "Language",
      targetLangCode: deck.targetLangCode || "es",
      knownLang: deck.knownLang || "English",
      knownLangCode: deck.knownLangCode || "en",
      level: deck.level || "Beginner",
      cards: deck.cards || [],
      createdAt: deck.createdAt || new Date().toISOString(),
      isCustom: true,
      isCalibrated: deck.isCalibrated ?? (typeof deck.id === "string" && deck.id.includes("calibrated")),
      calibratedCEFR: deck.calibratedCEFR || null,
      calibrationDate: deck.calibrationDate || (deck.isCalibrated ? new Date().toISOString() : null),
      creatorId: user ? user.uid : "anonymous",
      creatorName: user?.displayName || "Community Learner",
      creatorPhoto: user?.photoURL || "",
      updatedAt: new Date().toISOString(),
    });
    await setDoc(deckDocRef, cleanDeck, { merge: true });
    savedDeckSignatures.set(deck.id, sig);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    console.error("Failed to save deck to cloud:", err);
  } finally {
    activeDeckSaves.delete(deck.id);
  }
}

/**
 * Fetch all saved/generated decks from the cloud for a given target language (or all)
 */
export async function fetchCloudDecks(targetLangCode?: string): Promise<any[]> {
  try {
    const decksRef = collection(db, DECKS_COLLECTION);
    let q;
    if (targetLangCode) {
      q = query(decksRef, where("targetLangCode", "==", targetLangCode), limit(50));
    } else {
      q = query(decksRef, limit(100));
    }
    const snapshot = await getDocs(q);
    const decks: any[] = [];
    snapshot.forEach((docSnap) => {
      decks.push(docSnap.data());
    });
    return decks;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, DECKS_COLLECTION);
    console.error("Failed to fetch cloud decks:", err);
    return [];
  }
}

/**
 * Check if a deck is a built-in catalog deck (e.g. bundled 300-word catalog)
 * so we avoid storing its heavy card arrays in the user's private profile document.
 */
export function isBuiltinDeck(deck: any): boolean {
  if (!deck || !deck.id) return false;
  if (deck.isCustom === false) return true;
  if (deck.isCustom === true) return false;
  if (typeof deck.id === "string") {
    if (deck.id.startsWith("deck-") && (deck.id.endsWith("-top") || deck.id.includes("-freq"))) {
      return true;
    }
    const knownIds = [
      "deck-spanish-freq-top",
      "deck-japanese-freq-top",
      "deck-korean-freq-top",
      "deck-traditional-chinese-freq-top",
      "deck-chinese-freq-top",
      "deck-taiwanese-hokkien-freq-top",
      "deck-hokkien-freq-top",
      "deck-french-freq-top",
      "deck-german-freq-top",
      "deck-italian-freq-top",
    ];
    if (knownIds.includes(deck.id)) return true;
  }
  return false;
}

// Single-flight mutex and trailing queue for user profile sync
let isUserProgressSaving = false;
let pendingUserProgressSave: {
  userId: string;
  progressData: any;
} | null = null;
let lastUserProgressSaveTime = 0;

/**
 * Save user study state and progress to their private cloud profile.
 * Heavily optimized with compact cardSRSMap, single-flight queuing,
 * and rate-limiting to prevent write-stream exhaustion.
 */
export async function saveUserProgressToCloud(
  userId: string,
  progressData: {
    dailyProgress: any;
    decks: any[];
    activeDeckId: string;
    targetLangCode: string;
    knownLangCode: string;
    streak?: number;
    errorRemedyDeck?: any;
    journalEntries?: any[];
    userProfile?: {
      displayName?: string | null;
      email?: string | null;
      photoURL?: string | null;
    };
  }
): Promise<void> {
  if (!userId) return;

  if (isFirestoreBackingOff()) {
    console.warn("[Firestore] Skipping saveUserProgressToCloud: write stream backoff active.");
    return;
  }

  // If a save is already executing, store latest progressData to run after current save finishes
  if (isUserProgressSaving) {
    pendingUserProgressSave = { userId, progressData };
    return;
  }

  // Ensure at least 1500ms between writes to the user profile document
  const timeSinceLast = Date.now() - lastUserProgressSaveTime;
  if (timeSinceLast < 1500) {
    pendingUserProgressSave = { userId, progressData };
    setTimeout(() => {
      if (pendingUserProgressSave) {
        const next = pendingUserProgressSave;
        pendingUserProgressSave = null;
        saveUserProgressToCloud(next.userId, next.progressData);
      }
    }, 1500 - timeSinceLast);
    return;
  }

  isUserProgressSaving = true;
  lastUserProgressSaveTime = Date.now();

  const path = `${USERS_COLLECTION}/${userId}`;
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);

    // 1. Extract ultra-compact SRS progress for reviewed cards only
    const cardSRSMap: Record<string, any> = {};
    (progressData.decks || []).forEach((deck: any) => {
      (deck.cards || []).forEach((card: any) => {
        if (card && card.id && card.srs) {
          const s = card.srs;
          const rep = s.repetition ?? s.repetitions ?? 0;
          const lapses = Number(s.lapses) || 0;
          const status = s.status || s.state || "new";
          const interval = s.interval ?? 0;
          const score = Number(s.masteryScore) || 0;

          // Store only if the card has non-default progress or was reviewed
          if (
            rep > 0 ||
            lapses > 0 ||
            status !== "new" ||
            interval > 0 ||
            score > 0 ||
            s.lastReviewed
          ) {
            cardSRSMap[card.id] = {
              i: interval,
              r: rep,
              e: Number(s.easeFactor) || 2.5,
              d: s.dueDate || null,
              s: status,
              l: lapses,
              t: s.lastReviewed ?? null,
              m: score,
              c: Number(s.consecutiveSuccesses) || 0,
            };
          }
        }
      });
    });

    // 2. Separate user-created custom decks from built-in 300-word catalog decks
    // NOTE: Custom decks are saved to /decks upon generation, calibration, or import,
    // avoiding redundant write bursts on every progress review tick.
    const customDecks: any[] = [];
    const defaultDeckSummaries: any[] = [];

    (progressData.decks || []).forEach((d: any) => {
      const builtin = isBuiltinDeck(d);
      if (!builtin) {
        // Keep only lightweight metadata inside user document (no card blobs)
        customDecks.push({
          id: d.id,
          title: d.title || "Custom Deck",
          description: d.description || "",
          targetLang: d.targetLang || "Language",
          targetLangCode: d.targetLangCode || "es",
          knownLang: d.knownLang || "English",
          knownLangCode: d.knownLangCode || "en",
          level: d.level || "Beginner",
          isCustom: true,
          isCalibrated: Boolean(d.isCalibrated),
          calibrationDate: d.calibrationDate || null,
          cardsCount: d.cards?.length || 0,
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
        });
      } else {
        defaultDeckSummaries.push({
          id: d.id,
          title: d.title,
          targetLangCode: d.targetLangCode,
          level: d.level,
          cardsCount: d.cards?.length || 300,
        });
      }
    });

    // 3. Sanitize journal entries (strip massive audio base64 blobs, retain last 50)
    const sanitizedJournal = (progressData.journalEntries || []).slice(0, 50).map((entry: any) => ({
      id: entry.id,
      title: entry.title || "Untitled Entry",
      content: entry.content || "",
      date: entry.date || new Date().toISOString().split("T")[0],
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: entry.updatedAt || new Date().toISOString(),
      targetLangCode: entry.targetLangCode || "es",
      targetLangName: entry.targetLangName || "Spanish",
      knownLangCode: entry.knownLangCode || "en",
      knownLangName: entry.knownLangName || "English",
      tags: Array.isArray(entry.tags) ? entry.tags.slice(0, 8) : [],
      wordCount: Number(entry.wordCount) || 0,
      characterCount: Number(entry.characterCount) || 0,
      promptTopic: entry.promptTopic ?? null,
      mood: entry.mood ?? null,
      emoji: entry.emoji ?? null,
      voiceNoteDuration: entry.voiceNoteDuration ?? null,
      isFavorite: Boolean(entry.isFavorite),
      isExample: Boolean(entry.isExample),
      correctionResult: entry.correctionResult ? {
        overallScore: Number(entry.correctionResult.overallScore) || 0,
        estimatedCEFR: entry.correctionResult.estimatedCEFR || "A2",
        fluencyRating: entry.correctionResult.fluencyRating || "intermediate",
        summaryFeedback: entry.correctionResult.summaryFeedback || "",
        correctedText: entry.correctionResult.correctedText || "",
        translatedText: entry.correctionResult.translatedText || "",
        grammarScore: Number(entry.correctionResult.grammarScore) || 0,
        vocabularyScore: Number(entry.correctionResult.vocabularyScore) || 0,
        naturalnessScore: Number(entry.correctionResult.naturalnessScore) || 0,
        errors: Array.isArray(entry.correctionResult.errors) ? entry.correctionResult.errors.slice(0, 8) : [],
        positiveHighlights: Array.isArray(entry.correctionResult.positiveHighlights) ? entry.correctionResult.positiveHighlights.slice(0, 4) : [],
        naturalPhrasings: Array.isArray(entry.correctionResult.naturalPhrasings) ? entry.correctionResult.naturalPhrasings.slice(0, 4) : [],
        extractedVocabulary: Array.isArray(entry.correctionResult.extractedVocabulary) ? entry.correctionResult.extractedVocabulary.slice(0, 8) : [],
        suggestedTags: Array.isArray(entry.correctionResult.suggestedTags) ? entry.correctionResult.suggestedTags.slice(0, 8) : [],
        suggestedEmoji: entry.correctionResult.suggestedEmoji ?? null,
        suggestedMood: entry.correctionResult.suggestedMood ?? null,
        checkedAt: entry.correctionResult.checkedAt || new Date().toISOString(),
      } : null,
    }));

    // 4. Construct compact user payload
    const rawPayload = {
      uid: userId,
      displayName: progressData.userProfile?.displayName ?? null,
      email: progressData.userProfile?.email ?? null,
      photoURL: progressData.userProfile?.photoURL ?? null,
      dailyProgress: {
        target: Number(progressData.dailyProgress?.target) || 10,
        reviewedToday: Number(progressData.dailyProgress?.reviewedToday) || 0,
        date: progressData.dailyProgress?.date || new Date().toISOString().split("T")[0],
        streak: Number(progressData.dailyProgress?.streak ?? progressData.streak) || 1,
        lastCompletedDate: progressData.dailyProgress?.lastCompletedDate ?? null,
      },
      activeDeckId: progressData.activeDeckId ?? null,
      targetLangCode: progressData.targetLangCode || "es",
      knownLangCode: progressData.knownLangCode || "en",
      streak: Number(progressData.streak ?? progressData.dailyProgress?.streak) || 1,
      cardSRSMap,
      customDecks,
      defaultDeckSummaries,
      journalEntries: sanitizedJournal,
      errorRemedyDeck: progressData.errorRemedyDeck ? {
        id: progressData.errorRemedyDeck.id || "error-remedy-deck",
        title: progressData.errorRemedyDeck.title || "Targeted Error Remedies",
        cards: (progressData.errorRemedyDeck.cards || []).slice(0, 20).map((c: any) => ({
          id: c.id,
          targetItem: c.targetItem,
          targetLanguage: c.targetLanguage,
          knownLanguage: c.knownLanguage,
          definition: c.definition,
          partOfSpeech: c.partOfSpeech ?? null,
          phonetic: c.phonetic ?? null,
          exampleSentence: c.exampleSentence ?? null,
          exampleTranslation: c.exampleTranslation ?? null,
          grammarTip: c.grammarTip ?? null,
          mnemonic: c.mnemonic ?? null,
          lastReviewed: c.lastReviewed ?? null,
          nextReviewDate: c.nextReviewDate ?? null,
          srs: c.srs || null,
        })),
      } : null,
      lastSyncedAt: new Date().toISOString(),
    };

    let sanitized = sanitizeForFirestore(rawPayload);

    // Size safeguard: Ensure total payload is well below 1MB (1,048,576 bytes)
    const payloadStr = JSON.stringify(sanitized);
    if (payloadStr.length > 700000) {
      console.warn("User progress payload exceeds 700KB, compressing historical entries...");
      sanitized.journalEntries = sanitized.journalEntries.slice(0, 15);
      if (sanitized.errorRemedyDeck?.cards) {
        sanitized.errorRemedyDeck.cards = sanitized.errorRemedyDeck.cards.slice(0, 10);
      }
    }

    await setDoc(userDocRef, sanitized, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    console.error("Failed to save user progress to cloud:", err);
  } finally {
    isUserProgressSaving = false;
    lastUserProgressSaveTime = Date.now();

    // If a subsequent update arrived while this write was executing, run trailing save after delay
    if (pendingUserProgressSave) {
      const next = pendingUserProgressSave;
      pendingUserProgressSave = null;
      setTimeout(() => {
        saveUserProgressToCloud(next.userId, next.progressData);
      }, 2000);
    }
  }
}

/**
 * Load user study progress from cloud upon sign in
 */
export async function loadUserProgressFromCloud(userId: string): Promise<any | null> {
  if (!userId) return null;
  const path = `${USERS_COLLECTION}/${userId}`;
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();

      // Retrieve full custom decks created by this user from the decks collection
      try {
        const decksQuery = query(
          collection(db, DECKS_COLLECTION),
          where("creatorId", "==", userId),
          limit(50)
        );
        const decksSnap = await getDocs(decksQuery);
        const cloudCustomDecks: any[] = [];
        decksSnap.forEach((dSnap) => {
          cloudCustomDecks.push(dSnap.data());
        });

        // Also fetch any custom deck IDs listed in user's profile metadata that weren't caught
        const customDeckMetas = Array.isArray(data.customDecks) ? data.customDecks : [];
        const loadedIds = new Set(cloudCustomDecks.map((d: any) => d.id));

        for (const meta of customDeckMetas) {
          if (meta.id && !loadedIds.has(meta.id)) {
            try {
              const singleDeckSnap = await getDoc(doc(db, DECKS_COLLECTION, meta.id));
              if (singleDeckSnap.exists()) {
                cloudCustomDecks.push(singleDeckSnap.data());
                loadedIds.add(meta.id);
              }
            } catch (singleErr) {
              console.warn(`Could not load individual custom deck ${meta.id}:`, singleErr);
            }
          }
        }

        data.customDecks = cloudCustomDecks;
      } catch (deckFetchErr) {
        console.warn("Could not query individual user custom decks from collection:", deckFetchErr);
      }

      return data;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    console.error("Failed to load user progress from cloud:", err);
    return null;
  }
}
