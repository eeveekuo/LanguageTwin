/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Deck,
  Flashcard,
  SupportedLanguage,
  LearnerError,
  DailyProgress,
  EvaluationResult,
  PracticeMechanismType,
} from "./types";
import { DEFAULT_DECKS } from "./data/defaultDecks";
import { SUPPORTED_LANGUAGES, getLanguageByCode } from "./data/languages";
import { getStudyQueue } from "./utils/srs";
import {
  loadDailyProgress,
  saveDailyProgress,
  recordCardReview,
  updateDailyTarget,
  logPracticeActivity,
} from "./utils/dailyGoals";
import {
  loadLearnerErrors,
  saveLearnerErrors,
  recordEvaluationErrors,
  toggleErrorResolution,
  isIgnoredNonErrorInput,
} from "./utils/errors";
import {
  getFrequencyFocusedQueue,
  getActiveFrequencyBracket,
} from "./utils/frequencyProgression";
import {
  loadSavedPronunciationAid,
  savePronunciationAid,
  getDefaultPronunciationOption,
} from "./utils/pronunciation";
import {
  loadJournalEntriesFromLocal,
  saveJournalEntriesToLocal,
} from "./utils/journalStorage";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import {
  loadDecksFromDB,
  saveDecksToDB,
  loadActiveDeckIdFromDB,
  saveActiveDeckIdToDB,
} from "./utils/indexedDBStorage";
import {
  auth,
  signInWithGoogle,
  logOut,
  onAuthStateChanged,
  saveUserProgressToCloud,
  loadUserProgressFromCloud,
  saveDeckToCloud,
  User,
} from "./lib/firebase";
import { Header } from "./components/Header";
import { StudySession } from "./components/StudySession";
import { DeckExplorer } from "./components/DeckExplorer";
import { ReadingListeningPractice } from "./components/ReadingListeningPractice";
import { LanguageJournal } from "./components/LanguageJournal";
import { AITutorChat } from "./components/AITutorChat";
import { AnalyticsView } from "./components/AnalyticsView";
import { LanguagePairModal } from "./components/LanguagePairModal";
import { LanguagePlacementModal } from "./components/LanguagePlacementModal";
import { SentenceStructurePrimer } from "./components/SentenceStructurePrimer";
import { TranslateAndExplain } from "./components/TranslateAndExplain";
import { AiBenchmarkModal } from "./components/AiBenchmarkModal";
import { GeminiApiKeyModal } from "./components/GeminiApiKeyModal";
import {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  GEMINI_KEY_REQUIRED_EVENT,
} from "./utils/geminiApiKey";

const STORAGE_KEY_DECKS = "frequency_srs_decks_v1";
const STORAGE_KEY_ACTIVE_DECK = "frequency_srs_active_deck_id_v1";

function sanitizeDeckCards(decksList: Deck[]): Deck[] {
  // 1. Deduplicate decks list (especially legacy timestamped calibrated decks)
  const seenKeys = new Set<string>();
  const deduplicatedDecks: Deck[] = [];

  for (const deck of decksList) {
    const isCalibrated =
      deck.isCalibrated ||
      deck.id.includes("calibrated") ||
      deck.title.toLowerCase().includes("calibrated");

    // Standardize title and calibration flag if calibrated
    const normalizedDeck: Deck = isCalibrated
      ? {
          ...deck,
          isCalibrated: true,
          isCustom: true,
          title: deck.title.includes("Placement Calibrated")
            ? deck.title
            : `${deck.targetLang}: CEFR ${deck.level.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "Calibrated"} (Placement Calibrated)`,
        }
      : deck;

    // Deduplication key: for calibrated decks, allow only one per language + level
    // for other decks, deduplicate by ID
    const dedupKey = isCalibrated
      ? `calibrated-${normalizedDeck.targetLangCode}-${(normalizedDeck.level || "B1").slice(0, 10).toLowerCase()}`
      : `id-${normalizedDeck.id}`;

    if (!seenKeys.has(dedupKey)) {
      seenKeys.add(dedupKey);
      deduplicatedDecks.push(normalizedDeck);
    }
  }

  // 2. Sanitize cards for each deck
  return deduplicatedDecks.map((deck) => {
    let cards = (deck.cards || []).map((card) => {
      let cleanedTargetItem = card.targetItem || "";
      // Strip parenthetical readings like "是 (shì)" -> "是", "友達 (ともだち)" -> "友達"
      cleanedTargetItem = cleanedTargetItem
        .replace(/\s*\([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüê̄ếê̌ềêńňǹ\u3040-\u309F\u30A0-\u30FF\u3100-\u312F\s\-~—–./]+\)/g, "")
        .trim();

      return {
        ...card,
        targetItem: cleanedTargetItem || card.targetItem,
      };
    });

    // If deck has fewer than 300 cards, backfill from DEFAULT_DECKS catalog
    if (cards.length < 300) {
      const match = DEFAULT_DECKS.find(
        (d) => d.targetLangCode === deck.targetLangCode || d.targetLang === deck.targetLang
      );
      if (match && match.cards && match.cards.length > cards.length) {
        const existingItems = new Set(cards.map((c) => (c.targetItem || "").trim().toLowerCase()));
        for (const catCard of match.cards) {
          if (cards.length >= 300) break;
          const key = (catCard.targetItem || "").trim().toLowerCase();
          if (!existingItems.has(key)) {
            existingItems.add(key);
            cards.push({
              ...catCard,
              id: `${deck.id}-card-${cards.length + 1}`,
              deckId: deck.id,
              frequencyRank: cards.length + 1,
            });
          }
        }
      }
    }

    return {
      ...deck,
      title: deck.title.replace("Top 20", "Top 300").replace("Top 15", "Top 300"),
      description: deck.description.replace("Top 20", "Top 300").replace("Top 15", "Top 300"),
      cards,
    };
  });
}

export default function App() {
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<
    "study" | "grammar" | "deck" | "reading" | "journal" | "tutor" | "translate" | "stats"
  >("study");

  // User & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);

  // Decks state with IndexedDB & localStorage persistence
  const [decks, setDecks] = useState<Deck[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_DECKS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return sanitizeDeckCards(parsed);
          }
        }
      } catch (e) {
        console.warn("Failed to load decks from local storage:", e);
      }
    }
    return sanitizeDeckCards(DEFAULT_DECKS);
  });

  const [activeDeckId, setActiveDeckId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_DECK);
      if (savedId) return savedId;
    }
    return DEFAULT_DECKS[0]?.id || "deck-spanish-freq-top";
  });

  // Daily target and streak state
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(() =>
    loadDailyProgress()
  );

  // Learner errors ledger state
  const [learnerErrors, setLearnerErrors] = useState<LearnerError[]>(() =>
    loadLearnerErrors()
  );

  // Study focus mode & bracket filters
  const [studyFilter, setStudyFilter] = useState<{
    mode: "auto" | "tier" | "all" | "card";
    targetCardId?: string;
    tierStart?: number;
    tierEnd?: number;
  }>({ mode: "auto" });

  // Generating next frequency batch loading state
  const [isGeneratingBatch, setIsGeneratingBatch] = useState<boolean>(false);
  const [batchNotice, setBatchNotice] = useState<string | null>(null);

  // Pronunciation aid settings state per language (e.g. { "zh-TW": "zhuyin", "ja": "furigana" })
  const [pronunciationSettings, setPronunciationSettings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (typeof window !== "undefined") {
      ["zh-TW", "zh", "ja", "ko", "es", "nan", "en"].forEach((code) => {
        initial[code] = loadSavedPronunciationAid(code);
      });
    }
    return initial;
  });

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [languageModalInitialMode, setLanguageModalInitialMode] = useState<
    "browse" | "generate"
  >("browse");
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);
  const [hasCustomGeminiApiKey, setHasCustomGeminiApiKey] = useState<boolean>(() =>
    Boolean(getStoredGeminiApiKey())
  );
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [apiKeyModalPrompt, setApiKeyModalPrompt] = useState<string | null>(null);

  // Listen for global AI key required events (e.g. from blocked API calls or missing keys)
  useEffect(() => {
    const handleKeyRequired = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      const msg =
        customEvent.detail?.message ||
        "A personal Google Gemini API key is required to make AI requests. There is no shared server key.";
      setApiKeyModalPrompt(msg);
      setIsApiKeyModalOpen(true);
    };

    window.addEventListener(GEMINI_KEY_REQUIRED_EVENT, handleKeyRequired);
    return () => {
      window.removeEventListener(GEMINI_KEY_REQUIRED_EVENT, handleKeyRequired);
    };
  }, []);

  const activeDeck =
    decks.find((d) => d.id === activeDeckId) || decks[0] || DEFAULT_DECKS[0];

  const targetLang: SupportedLanguage = getLanguageByCode(
    activeDeck.targetLangCode || "es"
  );
  const knownLang: SupportedLanguage = getLanguageByCode(
    activeDeck.knownLangCode || "en"
  );

  // ----------------------------------------------------
  // 1. Initial Local Storage & IndexedDB Hydration
  // ----------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    async function hydrateStorage() {
      try {
        const dbDecks = await loadDecksFromDB();
        if (isMounted && dbDecks && dbDecks.length > 0) {
          setDecks(dbDecks);
        }
        const dbActiveId = await loadActiveDeckIdFromDB();
        if (isMounted && dbActiveId) {
          setActiveDeckId(dbActiveId);
        }
      } catch (err) {
        console.warn("IndexedDB initial load error:", err);
      }
    }
    hydrateStorage();
    return () => {
      isMounted = false;
    };
  }, []);

  // ----------------------------------------------------
  // 2. Firebase Google Authentication & Cloud Sync
  // ----------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthInitialized(true);

      if (user) {
        setIsSyncing(true);
        try {
          const cloudData = await loadUserProgressFromCloud(user.uid);
          if (cloudData) {
            // Merge cloud daily progress
            if (cloudData.dailyProgress) {
              setDailyProgress(cloudData.dailyProgress);
              saveDailyProgress(cloudData.dailyProgress);
            }

            // Restore / merge user decks and card SRS progression
            const cardSRSMap = cloudData.cardSRSMap || {};
            const cloudDecks = Array.isArray(cloudData.customDecks) && cloudData.customDecks.length > 0
              ? cloudData.customDecks
              : Array.isArray(cloudData.decks)
              ? cloudData.decks
              : [];

            setDecks((prevDecks) => {
              let merged = [...prevDecks];
              if (cloudDecks.length > 0) {
                const sanitizedCloudDecks = sanitizeDeckCards(cloudDecks);
                sanitizedCloudDecks.forEach((cd: Deck) => {
                  const existingIdx = merged.findIndex((d) => d.id === cd.id);
                  if (existingIdx >= 0) {
                    merged[existingIdx] = cd;
                  } else {
                    merged.push(cd);
                  }
                });
              }

              // Apply card SRS progression map (supporting compact keys and legacy formats)
              if (Object.keys(cardSRSMap).length > 0) {
                merged = merged.map((d) => ({
                  ...d,
                  cards: (d.cards || []).map((card) => {
                    const srs = cardSRSMap[card.id];
                    if (srs) {
                      const interval = srs.i !== undefined ? srs.i : (srs.interval ?? card.srs?.interval ?? 0);
                      const repetition = srs.r !== undefined ? srs.r : (srs.repetition ?? srs.repetitions ?? card.srs?.repetition ?? 0);
                      const easeFactor = srs.e !== undefined ? srs.e : (srs.easeFactor ?? card.srs?.easeFactor ?? 2.5);
                      const dueDate = srs.d !== undefined ? (srs.d || card.srs?.dueDate) : (srs.dueDate || card.srs?.dueDate || new Date().toISOString());
                      const status = srs.s !== undefined ? srs.s : (srs.status || srs.state || card.srs?.status || "new");
                      const masteryScore = srs.m !== undefined ? srs.m : (srs.masteryScore ?? card.srs?.masteryScore ?? 0);
                      const consecutiveSuccesses = srs.c !== undefined ? srs.c : (srs.consecutiveSuccesses ?? card.srs?.consecutiveSuccesses ?? 0);
                      const lastReviewed = srs.t !== undefined ? (srs.t || undefined) : (srs.lastReviewed || card.srs?.lastReviewed);

                      return {
                        ...card,
                        srs: {
                          ...card.srs,
                          interval,
                          repetition,
                          easeFactor,
                          dueDate: dueDate || new Date().toISOString(),
                          status,
                          masteryScore,
                          consecutiveSuccesses,
                          lastReviewed,
                        },
                      };
                    }
                    return card;
                  }),
                }));
              }

              return sanitizeDeckCards(merged);
            });

            if (cloudData.activeDeckId) {
              setActiveDeckId(cloudData.activeDeckId);
            }

            // Restore / merge journal entries from cloud
            if (
              Array.isArray(cloudData.journalEntries) &&
              cloudData.journalEntries.length > 0
            ) {
              saveJournalEntriesToLocal(cloudData.journalEntries);
            }

            // Restore user's Gemini API key if present in their cloud profile
            if (cloudData.geminiApiKey) {
              setStoredGeminiApiKey(cloudData.geminiApiKey, {
                email: user.email,
                displayName: user.displayName,
              });
              setHasCustomGeminiApiKey(true);
            }

            setBatchNotice(
              `☁️ Welcome back, ${
                user.displayName || "Learner"
              }! Your progress, decks, and journal entries are synced from Google Cloud.`
            );
          } else {
            // First time user login: back up their current state to cloud
            await saveUserProgressToCloud(user.uid, {
              dailyProgress,
              decks,
              activeDeckId,
              targetLangCode: targetLang.code,
              knownLangCode: knownLang.code,
              streak: dailyProgress.streak || 1,
              journalEntries: loadJournalEntriesFromLocal(targetLang, knownLang),
              geminiApiKey: getStoredGeminiApiKey(user.email),
              userProfile: {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
              },
            });
            setBatchNotice(
              `✨ Connected to Google Account! Your progress and journal are now safely backed up to the cloud.`
            );
          }
        } catch (err) {
          console.error("Cloud hydration error:", err);
        } finally {
          setIsSyncing(false);
          setTimeout(() => setBatchNotice(null), 6000);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsSyncing(true);
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Sign in failed:", err);
      setBatchNotice(
        err.message || "Sign in cancelled or failed. Please try again."
      );
      setTimeout(() => setBatchNotice(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setCurrentUser(null);
      setBatchNotice("Signed out of Google account. Working in local mode.");
      setTimeout(() => setBatchNotice(null), 4000);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // ----------------------------------------------------
  // 3. Auto-save to Cloud when state updates (Debounced)
  // ----------------------------------------------------
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // 1. Local persistence
    try {
      localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(decks));
    } catch (e) {
      console.warn("Failed to persist decks to localStorage:", e);
    }
    saveDecksToDB(decks).catch((e) =>
      console.warn("Failed to persist decks to IndexedDB:", e)
    );

    // 2. Cloud persistence if authenticated (Debounced by 3000ms)
    if (currentUser) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(async () => {
        setIsSyncing(true);
        await saveUserProgressToCloud(currentUser.uid, {
          dailyProgress,
          decks,
          activeDeckId,
          targetLangCode: targetLang.code,
          knownLangCode: knownLang.code,
          streak: dailyProgress.streak || 1,
          journalEntries: loadJournalEntriesFromLocal(targetLang, knownLang),
          geminiApiKey: getStoredGeminiApiKey(currentUser.email),
          userProfile: {
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
          },
        });
        setIsSyncing(false);
      }, 3000);
    }
  }, [decks, dailyProgress, activeDeckId, currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_DECK, activeDeckId);
    } catch (e) {
      console.warn("Failed to persist active deck id to localStorage:", e);
    }
    saveActiveDeckIdToDB(activeDeckId).catch((e) =>
      console.warn("Failed to persist active deck id to IndexedDB:", e)
    );
  }, [activeDeckId]);

  // Active pronunciation aid for current target language
  const currentPronunciationAid =
    pronunciationSettings[targetLang.code] ||
    loadSavedPronunciationAid(targetLang.code);

  const handlePronunciationAidChange = (aidId: string, langCode?: string) => {
    const code = langCode || targetLang.code;
    savePronunciationAid(code, aidId);
    setPronunciationSettings((prev) => ({
      ...prev,
      [code]: aidId,
    }));
  };

  // Determine study queue based on study filter
  let activeStudyQueue: Flashcard[] = [];
  if (studyFilter.mode === "card" && studyFilter.targetCardId) {
    const singleCard = activeDeck.cards.find(
      (c) => c.id === studyFilter.targetCardId
    );
    const otherCards = activeDeck.cards.filter(
      (c) => c.id !== studyFilter.targetCardId
    );
    activeStudyQueue = singleCard
      ? [singleCard, ...otherCards]
      : activeDeck.cards;
  } else if (
    studyFilter.mode === "tier" &&
    studyFilter.tierStart &&
    studyFilter.tierEnd
  ) {
    activeStudyQueue = getFrequencyFocusedQueue(
      activeDeck.cards,
      "tier",
      studyFilter.tierStart,
      studyFilter.tierEnd
    );
  } else {
    // Auto progression mode: active bracket first, then others
    activeStudyQueue = getFrequencyFocusedQueue(activeDeck.cards, "auto");
  }

  const { dueCards } = getStudyQueue(activeDeck.cards);
  const activeErrorsCount = learnerErrors.filter(
    (e) => !e.isResolved && !isIgnoredNonErrorInput(e.originalMistake)
  ).length;

  // Update a flashcard after review or edits
  const handleCardUpdated = (updatedCard: Flashcard) => {
    setDecks((prevDecks) =>
      prevDecks.map((d) => {
        if (d.id !== activeDeck.id) return d;
        return {
          ...d,
          cards: d.cards.map((c) =>
            c.id === updatedCard.id ? updatedCard : c
          ),
        };
      })
    );
  };

  // Called whenever user produces an evaluated sentence
  const handleSentenceEvaluated = (
    card: Flashcard,
    evaluation: EvaluationResult,
    userSentence: string
  ) => {
    // 1. Record error ledger updates (recurrence, newly phased out, new errors)
    const { updatedErrors } = recordEvaluationErrors(
      card,
      evaluation,
      userSentence,
      learnerErrors
    );
    setLearnerErrors(updatedErrors);

    // 2. Increment daily cards reviewed
    const { updated } = recordCardReview(dailyProgress);
    setDailyProgress(updated);
  };

  // Update daily target
  const handleUpdateDailyTarget = (newTarget: number) => {
    const updated = updateDailyTarget(dailyProgress, newTarget);
    setDailyProgress(updated);
  };

  // Toggle error resolved status
  const handleToggleErrorResolved = (errorId: string) => {
    const updated = toggleErrorResolution(errorId, learnerErrors);
    setLearnerErrors(updated);
  };

  // Add new card to active deck
  const handleAddCard = (newCard: Flashcard) => {
    setDecks((prevDecks) =>
      prevDecks.map((d) => {
        if (d.id !== activeDeck.id) return d;
        return {
          ...d,
          cards: [...d.cards, newCard],
        };
      })
    );
  };

  // Called when AI Tutor evaluates deck items during chat conversation
  const handleTutorItemsEvaluated = (
    evaluatedItems: any[],
    userMessage: string
  ) => {
    if (!evaluatedItems || evaluatedItems.length === 0) return;

    setDecks((prevDecks) =>
      prevDecks.map((d) => {
        if (d.id !== activeDeck.id) return d;

        const updatedCards = d.cards.map((c) => {
          const evalItem = evaluatedItems.find(
            (ev) =>
              ev.cardId === c.id ||
              ev.targetItem?.toLowerCase() === c.targetItem?.toLowerCase() ||
              (c.errorId &&
                ev.targetItem?.toLowerCase() ===
                  c.correctedForm?.toLowerCase())
          );

          if (!evalItem) return c;

          const score =
            typeof evalItem.score === "number" ? evalItem.score : 80;
          const grade =
            typeof evalItem.grade === "number"
              ? evalItem.grade
              : score >= 80
              ? 4
              : 2;
          const isSuccess = score >= 75;

          const currentRep = c.srs.repetition || 0;
          const nextRep = isSuccess ? currentRep + 1 : 0;
          const nextInterval = isSuccess
            ? c.srs.interval === 0
              ? 1
              : Math.round(c.srs.interval * (c.srs.easeFactor || 2.5))
            : 1;
          const nextConsecutive = isSuccess
            ? (c.srs.consecutiveSuccesses || 0) + 1
            : 0;
          const newMastery = Math.min(
            100,
            Math.max(
              0,
              Math.round(c.srs.masteryScore * 0.4 + score * 0.6)
            )
          );

          return {
            ...c,
            srs: {
              ...c.srs,
              repetition: nextRep,
              interval: nextInterval,
              masteryScore: newMastery,
              status: (newMastery >= 85 ? "mastered" : "learning") as any,
              consecutiveSuccesses: nextConsecutive,
              history: [
                ...(c.srs.history || []),
                {
                  date: new Date().toISOString(),
                  grade,
                  score,
                  sentenceUsed: userMessage,
                  feedback:
                    evalItem.feedback ||
                    "Evaluated in AI Tutor conversation",
                },
              ],
            },
          };
        });

        return {
          ...d,
          cards: updatedCards,
        };
      })
    );

    // Increment daily target progress
    const { updated } = recordCardReview(dailyProgress);
    const updatedWithLog = logPracticeActivity(updated, {
      mechanism: "tutor",
      title: `Conversation with AI Tutor (${evaluatedItems.length} items)`,
      details: userMessage.slice(0, 80),
      score: evaluatedItems[0]?.score || 85,
      targetItem: evaluatedItems[0]?.targetItem,
    });
    setDailyProgress(updatedWithLog);
  };

  const handleLogPracticeActivity = (activity: {
    mechanism: PracticeMechanismType;
    title: string;
    details: string;
    score?: number;
    targetItem?: string;
  }) => {
    const updated = logPracticeActivity(dailyProgress, activity);
    setDailyProgress(updated);
  };

  // Stable debounced cloud sync handler for journal entries
  const handleJournalSyncWithCloud = useCallback((entries: any[]) => {
    if (currentUser) {
      saveUserProgressToCloud(currentUser.uid, {
        dailyProgress,
        decks,
        activeDeckId,
        targetLangCode: targetLang.code,
        knownLangCode: knownLang.code,
        streak: dailyProgress.streak || 1,
        journalEntries: entries,
        userProfile: {
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
        },
      }).catch((err) =>
        console.warn("Journal cloud sync warning:", err)
      );
    }
  }, [currentUser?.uid, dailyProgress, decks, activeDeckId, targetLang.code, knownLang.code]);

  // Add newly generated deck and save to cloud
  const handleDeckGenerated = async (newDeck: Deck) => {
    setDecks((prev) => [newDeck, ...prev]);
    setActiveDeckId(newDeck.id);
    setStudyFilter({ mode: "auto" });
    setActiveTab("study");

    // Automatically persist newly generated deck to global Firestore collection
    await saveDeckToCloud(newDeck, currentUser);
  };

  // Add newly calibrated placement deck & register error remedy cards into ledger
  const handleDeckCalibrated = async (calibratedDeck: Deck) => {
    // 1. Standardize calibrated flags, clean ID, & labels
    const cleanLevel = (calibratedDeck.level || "B1")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase();
    const standardizedId = `calibrated-${calibratedDeck.targetLangCode}-${cleanLevel.toLowerCase()}`;

    const markedDeck: Deck = {
      ...calibratedDeck,
      id: standardizedId,
      isCalibrated: true,
      isCustom: true,
      calibrationDate: new Date().toISOString(),
      title: `${calibratedDeck.targetLang}: CEFR ${cleanLevel} (Placement Calibrated)`,
      description: `Targeted CEFR ${cleanLevel} vocabulary and active grammar calibrated via diagnostic placement test.`,
    };

    // 2. Replace any previous calibrated deck for this target language
    setDecks((prev) => {
      const filtered = prev.filter((d) => {
        if (d.id === markedDeck.id) return false;
        const isSameLangCalibrated =
          d.targetLangCode === markedDeck.targetLangCode &&
          (d.isCalibrated ||
            d.id.includes("calibrated") ||
            d.title.toLowerCase().includes("calibrated"));
        return !isSameLangCalibrated;
      });
      return [markedDeck, ...filtered];
    });

    setActiveDeckId(markedDeck.id);
    setStudyFilter({ mode: "auto" });
    setActiveTab("study");

    // Automatically persist calibrated deck to cloud Firestore
    await saveDeckToCloud(markedDeck, currentUser);

    // 3. Register any common error cards from the diagnostic into the learnerErrors ledger
    const errorCards = markedDeck.cards.filter(
      (c) => c.isCommonError || c.type === "common_error"
    );
    if (errorCards.length > 0) {
      setLearnerErrors((prevErrors) => {
        const newLedgerEntries: LearnerError[] = errorCards.map((ec) => ({
          id: `diag-err-${Date.now()}-${ec.id}`,
          cardId: ec.id,
          targetItem: ec.targetItem,
          originalMistake: ec.originalMistake || "Test slip",
          correctedForm: ec.correctedForm || ec.targetItem,
          errorType: "Diagnostic Placement Slip",
          explanation:
            ec.usageNotes ||
            "Identified during language level placement test.",
          occurrences: 1,
          consecutiveCorrect: 0,
          isResolved: false,
          timestamp: new Date().toISOString(),
        }));
        return [...newLedgerEntries, ...prevErrors];
      });
    }

    setBatchNotice(
      `🎯 Deck calibrated to ${
        markedDeck.level || "Diagnosed Level"
      }! Starting practice queue ready.`
    );
  };

  // Generate Next Frequency Batch (e.g., 1-10 mastered -> synthesize 11-20)
  const handleGenerateNextBatch = async (
    startRank: number,
    endRank: number
  ) => {
    setIsGeneratingBatch(true);
    setBatchNotice(`Generating Frequency Batch #${startRank}–#${endRank}...`);

    try {
      const response = await fetch("/api/generate-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLanguage: targetLang.name,
          knownLanguage: knownLang.name,
          startFrequencyRank: startRank,
          count: endRank - startRank + 1,
          level: activeDeck.level || "Beginner to Intermediate",
          customTopic: `Frequency Tier #${startRank}–#${endRank} Core Words & Formulas`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate batch: ${response.statusText}`);
      }

      const data = await response.json();
      const newCards: Flashcard[] = (data.cards || []).map(
        (card: any, idx: number) => ({
          ...card,
          id: `batch-${startRank}-${idx + 1}-${Date.now()}`,
          deckId: activeDeck.id,
          frequencyRank: startRank + idx,
          srs: {
            repetition: 0,
            interval: 0,
            easeFactor: 2.5,
            dueDate: new Date().toISOString(),
            history: [],
            masteryScore: 0,
            status: "new",
            consecutiveSuccesses: 0,
          },
        })
      );

      // Append new cards to current deck
      setDecks((prevDecks) =>
        prevDecks.map((d) => {
          if (d.id !== activeDeck.id) return d;
          return {
            ...d,
            cards: [...d.cards, ...newCards].sort(
              (a, b) => a.frequencyRank - b.frequencyRank
            ),
          };
        })
      );

      setBatchNotice(
        `🎉 Unlocked Tier #${startRank}–#${endRank}! Now added to your study queue.`
      );
      setStudyFilter({ mode: "tier", tierStart: startRank, tierEnd: endRank });
      setActiveTab("study");
    } catch (err) {
      console.error("Batch generation failed:", err);
      setBatchNotice("Failed to generate batch. Please retry in a moment.");
    } finally {
      setIsGeneratingBatch(false);
      setTimeout(() => setBatchNotice(null), 5000);
    }
  };

  // Switch study queue to a specific card
  const handleStudyCard = (cardId: string) => {
    setStudyFilter({ mode: "card", targetCardId: cardId });
    setActiveTab("study");
  };

  // Switch study queue to a specific frequency bracket
  const handleStudyBracket = (startRank: number, endRank: number) => {
    setStudyFilter({ mode: "tier", tierStart: startRank, tierEnd: endRank });
    setActiveTab("study");
  };

  // Handle switching language pairs
  const handleSelectLanguagePair = (
    targetCode: string,
    knownCode: string
  ) => {
    // 1. Look for exact matching deck in active decks
    const matchingDeck = decks.find(
      (d) => d.targetLangCode === targetCode && d.knownLangCode === knownCode
    );

    if (matchingDeck) {
      setActiveDeckId(matchingDeck.id);
      setStudyFilter({ mode: "auto" });
      return;
    }

    // 2. Look for any deck in active decks with matching target language
    const targetMatch = decks.find((d) => d.targetLangCode === targetCode);
    if (targetMatch) {
      setActiveDeckId(targetMatch.id);
      setStudyFilter({ mode: "auto" });
      return;
    }

    // 3. Look in DEFAULT_DECKS catalog for pre-built starter decks
    const defaultMatch = DEFAULT_DECKS.find(
      (d) => d.targetLangCode === targetCode
    );
    if (defaultMatch) {
      const clonedDefault: Deck = {
        ...defaultMatch,
        knownLangCode: knownCode,
        knownLang: getLanguageByCode(knownCode).name,
      };
      setDecks((prev) => [
        clonedDefault,
        ...prev.filter((d) => d.id !== clonedDefault.id),
      ]);
      setActiveDeckId(clonedDefault.id);
      setStudyFilter({ mode: "auto" });
      return;
    }

    // 4. Create a clean starter deck for this language pair if none exists
    const targetObj = getLanguageByCode(targetCode);
    const knownObj = getLanguageByCode(knownCode);
    const newStarterDeck: Deck = {
      id: `deck-${targetCode}-${knownCode}-starter-${Date.now()}`,
      title: `${targetObj.name}: Essential Core Vocabulary & Connectors`,
      description: `Starter high-frequency curriculum for learning ${targetObj.name} from ${knownObj.name}.`,
      targetLang: targetObj.name,
      targetLangCode: targetCode,
      knownLang: knownObj.name,
      knownLangCode: knownCode,
      level: "A1 - Beginner",
      cards: [],
      createdAt: new Date().toISOString(),
    };
    setDecks((prev) => [newStarterDeck, ...prev]);
    setActiveDeckId(newStarterDeck.id);
    setStudyFilter({ mode: "auto" });
  };

  // Handle selecting a deck from Deck tab or elsewhere
  const handleSelectDeck = (selectedDeck: Deck) => {
    setDecks((prev) => {
      if (prev.some((d) => d.id === selectedDeck.id)) {
        return prev;
      }
      return [selectedDeck, ...prev];
    });
    setActiveDeckId(selectedDeck.id);
    setStudyFilter({ mode: "auto" });
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header with Google Account Login & Sync */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeDeck={activeDeck}
        targetLang={targetLang}
        knownLang={knownLang}
        onOpenLanguageModal={() => {
          setLanguageModalInitialMode("browse");
          setIsLanguageModalOpen(true);
        }}
        onOpenGenerateModal={() => {
          setLanguageModalInitialMode("generate");
          setIsLanguageModalOpen(true);
        }}
        onOpenPlacementModal={() => setIsPlacementModalOpen(true)}
        onOpenBenchmarkModal={() => setIsBenchmarkModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasCustomApiKey={hasCustomGeminiApiKey}
        dueCount={dueCards.length}
        dailyProgress={dailyProgress}
        activeErrorsCount={activeErrorsCount}
        isOnline={isOnline}
        currentUser={currentUser}
        onSignInWithGoogle={handleGoogleSignIn}
        onSignOut={handleSignOut}
        isSyncing={isSyncing}
        pronunciationAid={currentPronunciationAid}
        onChangePronunciationAid={handlePronunciationAidChange}
      />

      {/* Missing Personal Gemini API Key Alert Banner */}
      {!hasCustomGeminiApiKey && (
        <div
          id="missing-gemini-key-banner"
          className="bg-rose-50 border-b border-rose-200/80 px-4 py-2 text-xs text-rose-900 shadow-2xs"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span>
                <strong>Gemini API Key Required:</strong> No shared server key is provided. All AI requests (tutoring, evaluations, deck generation) are locked until your personal key is set.
              </span>
            </div>
            <button
              id="banner-configure-key-btn"
              type="button"
              onClick={() => {
                setApiKeyModalPrompt(
                  "A personal Google Gemini API key is required to make AI requests. Please configure your key to proceed."
                );
                setIsApiKeyModalOpen(true);
              }}
              className="font-bold text-rose-700 hover:text-rose-900 underline self-start sm:self-auto cursor-pointer shrink-0"
            >
              Configure API Key →
            </button>
          </div>
        </div>
      )}

      {/* Batch Notification / Cloud Sync Toast */}
      {batchNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold flex items-center justify-between shadow-md shadow-indigo-200">
            <span>{batchNotice}</span>
            <button
              onClick={() => setBatchNotice(null)}
              className="text-white/80 hover:text-white font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Content */}
      <main className="flex-1 pb-12 pt-2">
        {activeTab === "study" && (
          <StudySession
            key={`${activeDeck.id}-${studyFilter.mode}-${
              studyFilter.targetCardId || ""
            }-${studyFilter.tierStart || ""}`}
            cards={activeStudyQueue}
            allDeckCards={activeDeck.cards}
            targetLang={targetLang}
            knownLang={knownLang}
            deckTitle={activeDeck.title}
            dailyProgress={dailyProgress}
            learnerErrors={learnerErrors}
            onCardUpdated={handleCardUpdated}
            onSentenceEvaluated={handleSentenceEvaluated}
            onFinishSession={() => setActiveTab("stats")}
            onUnlockNextBatch={handleGenerateNextBatch}
            isGeneratingBatch={isGeneratingBatch}
            isOnline={isOnline}
            pronunciationAid={currentPronunciationAid}
          />
        )}

        {activeTab === "grammar" && (
          <SentenceStructurePrimer
            key={`primer-${targetLang.code}`}
            targetLang={targetLang}
            knownLang={knownLang}
            isOnline={isOnline}
            pronunciationAid={currentPronunciationAid}
            onNavigateToStudy={() => setActiveTab("study")}
            onNavigateToDeck={() => setActiveTab("deck")}
            onLogPracticeActivity={handleLogPracticeActivity}
          />
        )}

        {activeTab === "reading" && (
          <ReadingListeningPractice
            key={activeDeck.id}
            deck={activeDeck}
            targetLang={targetLang}
            knownLang={knownLang}
            isOnline={isOnline}
            onAddCardToDeck={handleAddCard}
            learnerErrors={learnerErrors}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            pronunciationAid={currentPronunciationAid}
            onLogPracticeActivity={handleLogPracticeActivity}
          />
        )}

        {activeTab === "deck" && (
          <DeckExplorer
            key={activeDeck.id}
            deck={activeDeck}
            allDecks={decks}
            onSelectDeck={handleSelectDeck}
            onDeckGenerated={handleDeckGenerated}
            targetLang={targetLang}
            knownLang={knownLang}
            onAddCard={handleAddCard}
            onOpenGenerateModal={() => {
              setLanguageModalInitialMode("generate");
              setIsLanguageModalOpen(true);
            }}
            onStudyCard={handleStudyCard}
            onStudyBracket={handleStudyBracket}
            onGenerateNextBatch={handleGenerateNextBatch}
            isGeneratingBatch={isGeneratingBatch}
            isOnline={isOnline}
            currentUser={currentUser}
            pronunciationAid={currentPronunciationAid}
          />
        )}

        {activeTab === "translate" && (
          <TranslateAndExplain
            key={`${targetLang.code}-${knownLang.code}`}
            targetLang={targetLang}
            knownLang={knownLang}
            isOnline={isOnline}
            pronunciationAid={currentPronunciationAid}
            onAddCardToDeck={handleAddCard}
            onLogPracticeActivity={handleLogPracticeActivity}
          />
        )}

        {activeTab === "journal" && (
          <LanguageJournal
            key={`${activeDeck.id}-${targetLang.code}`}
            targetLang={targetLang}
            knownLang={knownLang}
            activeDeck={activeDeck}
            onAddCardToDeck={handleAddCard}
            isOnline={isOnline}
            currentUser={currentUser}
            isSyncing={isSyncing}
            onLogPracticeActivity={handleLogPracticeActivity}
            onSyncWithCloud={handleJournalSyncWithCloud}
          />
        )}

        {activeTab === "tutor" && (
          <AITutorChat
            key={activeDeck.id}
            deck={activeDeck}
            targetLang={targetLang}
            knownLang={knownLang}
            learnerErrors={learnerErrors}
            onTutorItemsEvaluated={handleTutorItemsEvaluated}
            pronunciationAid={currentPronunciationAid}
          />
        )}

        {activeTab === "stats" && (
          <AnalyticsView
            key={activeDeck.id}
            deck={activeDeck}
            targetLang={targetLang}
            knownLang={knownLang}
            learnerErrors={learnerErrors}
            onToggleErrorResolved={handleToggleErrorResolved}
            dailyProgress={dailyProgress}
            onUpdateDailyTarget={handleUpdateDailyTarget}
            onStudyCard={handleStudyCard}
            onStudyBracket={handleStudyBracket}
            onGenerateNextBatch={handleGenerateNextBatch}
            isGeneratingBatch={isGeneratingBatch}
            onOpenPlacementTest={() => setIsPlacementModalOpen(true)}
            onAddCardToDeck={handleAddCard}
          />
        )}
      </main>

      {/* Unified Language & Deck Hub + Community Cloud Repository Modal */}
      <LanguagePairModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        targetLang={targetLang}
        knownLang={knownLang}
        allDecks={decks}
        activeDeckId={activeDeck.id}
        onSelectLanguagePair={handleSelectLanguagePair}
        onSelectDeck={handleSelectDeck}
        onDeckGenerated={handleDeckGenerated}
        onOpenPlacementModal={(targetCode, knownCode) => {
          if (targetCode && knownCode) {
            handleSelectLanguagePair(targetCode, knownCode);
          }
          setIsPlacementModalOpen(true);
        }}
        initialMode={languageModalInitialMode}
        isOnline={isOnline}
        currentUser={currentUser}
        pronunciationSettings={pronunciationSettings}
        onChangePronunciationAid={handlePronunciationAidChange}
      />

      <LanguagePlacementModal
        isOpen={isPlacementModalOpen}
        onClose={() => setIsPlacementModalOpen(false)}
        targetLang={targetLang}
        knownLang={knownLang}
        onDeckCalibrated={handleDeckCalibrated}
        isOnline={isOnline}
      />

      <AiBenchmarkModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
        targetLang={targetLang}
        knownLang={knownLang}
      />

      <GeminiApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => {
          setIsApiKeyModalOpen(false);
          setApiKeyModalPrompt(null);
        }}
        currentUser={currentUser}
        onApiKeyChanged={(newKey) => setHasCustomGeminiApiKey(Boolean(newKey))}
        promptMessage={apiKeyModalPrompt}
      />
    </div>
  );
}
