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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  console.error("Firestore Error:", JSON.stringify(errInfo));
  return errInfo;
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
 * Save or publish a generated deck to the central Firestore library
 */
export async function saveDeckToCloud(deck: any, user?: User | null): Promise<void> {
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
      creatorId: user ? user.uid : "anonymous",
      creatorName: user?.displayName || "Community Learner",
      creatorPhoto: user?.photoURL || "",
      updatedAt: new Date().toISOString(),
    });
    await setDoc(deckDocRef, cleanDeck, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    console.error("Failed to save deck to cloud:", err);
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
 * Save user study state and progress to their private cloud profile
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
  const path = `${USERS_COLLECTION}/${userId}`;
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
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
      decks: (progressData.decks || []).map((d) => ({
        id: d.id,
        title: d.title || "Custom Deck",
        description: d.description || "",
        targetLang: d.targetLang || "Language",
        targetLangCode: d.targetLangCode || "es",
        knownLang: d.knownLang || "English",
        knownLangCode: d.knownLangCode || "en",
        level: d.level || "Beginner",
        isCustom: Boolean(d.isCustom),
        cardsCount: d.cards?.length || 0,
        cards: (d.cards || []).map((c: any) => ({
          ...c,
          phonetic: c.phonetic ?? null,
          partOfSpeech: c.partOfSpeech ?? null,
          exampleSentence: c.exampleSentence ?? null,
          exampleTranslation: c.exampleTranslation ?? null,
          grammarTip: c.grammarTip ?? null,
          mnemonic: c.mnemonic ?? null,
          lastReviewed: c.lastReviewed ?? null,
          nextReviewDate: c.nextReviewDate ?? null,
        })),
      })),
      journalEntries: (progressData.journalEntries || []).map((entry: any) => ({
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
        tags: entry.tags || [],
        wordCount: Number(entry.wordCount) || 0,
        characterCount: Number(entry.characterCount) || 0,
        promptTopic: entry.promptTopic ?? null,
        mood: entry.mood ?? null,
        emoji: entry.emoji ?? null,
        voiceNoteAudioBase64: entry.voiceNoteAudioBase64 ?? null,
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
          errors: entry.correctionResult.errors || [],
          positiveHighlights: entry.correctionResult.positiveHighlights || [],
          naturalPhrasings: entry.correctionResult.naturalPhrasings || [],
          extractedVocabulary: entry.correctionResult.extractedVocabulary || [],
          suggestedTags: entry.correctionResult.suggestedTags || [],
          suggestedEmoji: entry.correctionResult.suggestedEmoji ?? null,
          suggestedMood: entry.correctionResult.suggestedMood ?? null,
          checkedAt: entry.correctionResult.checkedAt || new Date().toISOString(),
        } : null,
      })),
      errorRemedyDeck: progressData.errorRemedyDeck ? {
        ...progressData.errorRemedyDeck,
        cards: (progressData.errorRemedyDeck.cards || []).map((c: any) => ({
          ...c,
          phonetic: c.phonetic ?? null,
          partOfSpeech: c.partOfSpeech ?? null,
          exampleSentence: c.exampleSentence ?? null,
          exampleTranslation: c.exampleTranslation ?? null,
          grammarTip: c.grammarTip ?? null,
          mnemonic: c.mnemonic ?? null,
          lastReviewed: c.lastReviewed ?? null,
          nextReviewDate: c.nextReviewDate ?? null,
        })),
      } : null,
      lastSyncedAt: new Date().toISOString(),
    };

    const sanitized = sanitizeForFirestore(rawPayload);
    await setDoc(userDocRef, sanitized, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    console.error("Failed to save user progress to cloud:", err);
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
      return docSnap.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    console.error("Failed to load user progress from cloud:", err);
    return null;
  }
}
