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

/**
 * Save or publish a generated deck to the central Firestore library
 */
export async function saveDeckToCloud(deck: any, user?: User | null): Promise<void> {
  try {
    const deckDocRef = doc(db, DECKS_COLLECTION, deck.id);
    const cleanDeck = {
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
    };
    await setDoc(deckDocRef, cleanDeck, { merge: true });
  } catch (err) {
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
    userProfile?: {
      displayName?: string | null;
      email?: string | null;
      photoURL?: string | null;
    };
  }
): Promise<void> {
  if (!userId) return;
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(
      userDocRef,
      {
        uid: userId,
        ...progressData.userProfile,
        dailyProgress: progressData.dailyProgress,
        activeDeckId: progressData.activeDeckId,
        targetLangCode: progressData.targetLangCode,
        knownLangCode: progressData.knownLangCode,
        streak: progressData.streak || 1,
        decks: progressData.decks.map((d) => ({
          id: d.id,
          title: d.title,
          description: d.description,
          targetLang: d.targetLang,
          targetLangCode: d.targetLangCode,
          knownLang: d.knownLang,
          knownLangCode: d.knownLangCode,
          level: d.level,
          isCustom: d.isCustom,
          cardsCount: d.cards?.length || 0,
          // Save card SRS states efficiently
          cards: d.cards,
        })),
        errorRemedyDeck: progressData.errorRemedyDeck || null,
        lastSyncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Failed to save user progress to cloud:", err);
  }
}

/**
 * Load user study progress from cloud upon sign in
 */
export async function loadUserProgressFromCloud(userId: string): Promise<any | null> {
  if (!userId) return null;
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (err) {
    console.error("Failed to load user progress from cloud:", err);
    return null;
  }
}
