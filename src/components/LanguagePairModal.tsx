import React, { useState, useEffect } from "react";
import { SupportedLanguage, Deck, Flashcard } from "../types";
import {
  SUPPORTED_TARGET_LANGUAGES,
  SUPPORTED_KNOWN_LANGUAGES,
  getLanguageByCode,
} from "../data/languages";
import {
  saveDeckToCloud,
  fetchCloudDecks,
  User,
} from "../lib/firebase";
import {
  loadSavedPronunciationAid,
  savePronunciationAid,
} from "../utils/pronunciation";
import { PronunciationAidSelector } from "./PronunciationAidSelector";
import {
  Languages,
  X,
  Check,
  Sparkles,
  BookOpen,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sliders,
  Layers,
  Wand2,
  AlertCircle,
  Cloud,
  Globe2,
  Users,
  Calendar,
  Search,
  Volume2,
} from "lucide-react";

interface LanguagePairModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  allDecks: Deck[];
  activeDeckId: string;
  onSelectLanguagePair: (targetCode: string, knownCode: string) => void;
  onSelectDeck: (deck: Deck) => void;
  onDeckGenerated?: (newDeck: Deck) => void;
  onOpenPlacementModal?: () => void;
  initialMode?: "browse" | "generate";
  isOnline?: boolean;
  currentUser?: User | null;
  pronunciationSettings?: Record<string, string>;
  onChangePronunciationAid?: (aidId: string, langCode?: string) => void;
}

export const LanguagePairModal: React.FC<LanguagePairModalProps> = ({
  isOpen,
  onClose,
  targetLang,
  knownLang,
  allDecks,
  activeDeckId,
  onSelectLanguagePair,
  onSelectDeck,
  onDeckGenerated,
  onOpenPlacementModal,
  initialMode = "browse",
  isOnline = true,
  currentUser,
  pronunciationSettings = {},
  onChangePronunciationAid,
}) => {
  const [mode, setMode] = useState<"browse" | "generate">(initialMode);
  const [selectedTarget, setSelectedTarget] = useState(targetLang.code);
  const [selectedKnown, setSelectedKnown] = useState(knownLang.code);
  const [selectedAid, setSelectedAid] = useState<string>(() =>
    pronunciationSettings[targetLang.code] || loadSavedPronunciationAid(targetLang.code)
  );

  // Cloud decks state
  const [cloudDecks, setCloudDecks] = useState<Deck[]>([]);
  const [isLoadingCloudDecks, setIsLoadingCloudDecks] = useState<boolean>(false);
  const [deckTab, setDeckTab] = useState<"all" | "curated" | "community">("all");
  const [deckSearch, setDeckSearch] = useState("");

  // Generator form state (pre-filled and bound to current selection)
  const [level, setLevel] = useState("A1 - Beginner");
  const [topic, setTopic] = useState("Top 20 Most Frequent Core Vocabulary & Connectors");
  const [customTopic, setCustomTopic] = useState("");
  const [count, setCount] = useState<number>(15);
  const [startRank, setStartRank] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load cloud decks and update aid whenever modal is opened or target language changes
  useEffect(() => {
    if (isOpen) {
      setSelectedTarget(targetLang.code);
      setSelectedKnown(knownLang.code);
      setSelectedAid(
        pronunciationSettings[targetLang.code] || loadSavedPronunciationAid(targetLang.code)
      );
      setMode(initialMode);
      setErrorMsg(null);
      setIsGenerating(false);
    }
  }, [isOpen, targetLang.code, knownLang.code, initialMode, pronunciationSettings]);

  // When target language selection changes within modal, load saved/configured aid for that language
  useEffect(() => {
    setSelectedAid(
      pronunciationSettings[selectedTarget] || loadSavedPronunciationAid(selectedTarget)
    );
  }, [selectedTarget, pronunciationSettings]);

  const handleAidChange = (aidId: string) => {
    setSelectedAid(aidId);
    savePronunciationAid(selectedTarget, aidId);
    if (onChangePronunciationAid) {
      onChangePronunciationAid(aidId, selectedTarget);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (isOpen && isOnline) {
      setIsLoadingCloudDecks(true);
      fetchCloudDecks(selectedTarget)
        .then((fetched) => {
          if (isMounted) {
            const formatted: Deck[] = fetched.map((d: any) => ({
              id: d.id,
              title: d.title || "Custom Deck",
              description: d.description || "",
              targetLang: d.targetLang,
              targetLangCode: d.targetLangCode,
              knownLang: d.knownLang,
              knownLangCode: d.knownLangCode,
              level: d.level || "Beginner",
              cards: d.cards || [],
              createdAt: d.createdAt || new Date().toISOString(),
              isCustom: true,
              creatorName: d.creatorName,
              creatorPhoto: d.creatorPhoto,
            }));
            setCloudDecks(formatted);
            setIsLoadingCloudDecks(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoadingCloudDecks(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedTarget, isOnline]);

  if (!isOpen) return null;

  const targetLangObj = getLanguageByCode(selectedTarget);
  const knownLangObj = getLanguageByCode(selectedKnown);

  // Combine local decks with cloud decks (prevent duplicates by ID)
  const localMatchingDecks = allDecks.filter(
    (d) => d.targetLangCode === selectedTarget
  );

  const localDeckIds = new Set(localMatchingDecks.map((d) => d.id));
  const uniqueCloudDecks = cloudDecks.filter((d) => !localDeckIds.has(d.id));

  const allAvailableDecks = [...localMatchingDecks, ...uniqueCloudDecks];

  const filteredDecks = allAvailableDecks.filter((d) => {
    const matchesSearch =
      !deckSearch.trim() ||
      d.title.toLowerCase().includes(deckSearch.toLowerCase()) ||
      (d.description || "").toLowerCase().includes(deckSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (deckTab === "curated") {
      return !d.isCustom;
    }
    if (deckTab === "community") {
      return d.isCustom === true;
    }
    return true;
  });

  const presetTopics = [
    "Top 20 Most Frequent Core Vocabulary & Connectors",
    "Essential Daily Life & Action Verbs",
    "High-Frequency Grammar Patterns & Conjunctions",
    "Food, Dining & Culinary Expressions",
    "Travel, Directions & Transport Essentials",
    "Work, Professional & Tech Vocabulary",
    "Emotional Expressions & Conversational Idioms",
    "Custom Topic...",
  ];

  const handleApplySwitch = () => {
    savePronunciationAid(selectedTarget, selectedAid);
    if (onChangePronunciationAid) {
      onChangePronunciationAid(selectedAid, selectedTarget);
    }
    onSelectLanguagePair(selectedTarget, selectedKnown);
    onClose();
  };

  const handleDeckClick = (deck: Deck) => {
    const aidToSave = deck.targetLangCode === selectedTarget ? selectedAid : loadSavedPronunciationAid(deck.targetLangCode);
    savePronunciationAid(deck.targetLangCode, aidToSave);
    if (onChangePronunciationAid) {
      onChangePronunciationAid(aidToSave, deck.targetLangCode);
    }
    onSelectDeck(deck);
    onSelectLanguagePair(deck.targetLangCode, deck.knownLangCode);
    onClose();
  };

  const handleGenerateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setErrorMsg("Generating decks with AI requires an active internet connection.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    const activeTopic = topic === "Custom Topic..." ? customTopic : topic;

    try {
      const response = await fetch("/api/generate-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLanguage: targetLangObj.name,
          knownLanguage: knownLangObj.name,
          topic: activeTopic || "Core Frequency",
          level,
          count,
          startFrequencyRank: startRank,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      const newDeckId = `deck-custom-${Date.now()}`;
      const newCards: Flashcard[] = (data.cards || []).map((card: any, idx: number) => ({
        id: `card-${newDeckId}-${idx}`,
        deckId: newDeckId,
        type: card.type || "vocabulary",
        targetItem: card.targetItem,
        targetLanguage: targetLangObj.name,
        knownLanguage: knownLangObj.name,
        frequencyRank: card.frequencyRank || startRank + idx,
        partOfSpeech: card.partOfSpeech || "Vocabulary",
        definition: card.definition,
        phonetic: card.phonetic,
        usageNotes: card.usageNotes || "Use in a natural sentence.",
        examples: card.examples || [],
        tags: card.tags || ["ai-generated"],
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
      }));

      const newDeck: Deck = {
        id: newDeckId,
        title: data.deckTitle || `${targetLangObj.name}: ${activeTopic}`,
        description:
          data.deckDescription ||
          `Frequency ranked flashcards for learning ${targetLangObj.name} from ${knownLangObj.name}.`,
        targetLang: targetLangObj.name,
        targetLangCode: targetLangObj.code,
        knownLang: knownLangObj.name,
        knownLangCode: knownLangObj.code,
        level,
        cards: newCards,
        createdAt: new Date().toISOString(),
        isCustom: true,
        creatorName: currentUser?.displayName || "Community Learner",
        creatorPhoto: currentUser?.photoURL || undefined,
      };

      // Save to centralized cloud database (Firestore) so all users can reuse it
      await saveDeckToCloud(newDeck, currentUser);

      savePronunciationAid(targetLangObj.code, selectedAid);
      if (onChangePronunciationAid) {
        onChangePronunciationAid(selectedAid, targetLangObj.code);
      }

      if (onDeckGenerated) {
        onDeckGenerated(newDeck);
      } else {
        onSelectDeck(newDeck);
      }
      onSelectLanguagePair(targetLangObj.code, knownLangObj.code);
      onClose();
    } catch (err: any) {
      console.error("Deck generation failed:", err);
      setErrorMsg(err.message || "Failed to generate deck. Please retry.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      id="language-pair-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur flex items-center justify-center p-3 sm:p-4"
    >
      <div
        id="language-pair-modal-container"
        className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl space-y-4 relative text-slate-900 max-h-[92vh] flex flex-col transition-all duration-200"
      >
        {/* Close Button */}
        <button
          id="close-lang-modal-btn"
          onClick={onClose}
          disabled={isGenerating}
          className="absolute right-4 top-4 sm:right-5 sm:top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Mode Switcher */}
        <div className="shrink-0 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
              {mode === "browse" ? (
                <Languages className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {mode === "browse"
                  ? "Language & Deck Hub"
                  : "AI Frequency Deck Generator"}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === "browse"
                  ? "Choose your language pair and select from curated or community-generated decks."
                  : `Generating high-frequency deck for ${targetLangObj.name} ${targetLangObj.flag}`}
              </p>
            </div>
          </div>

          {/* Unified Mode Toggle Bar */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode("browse");
                setErrorMsg(null);
              }}
              disabled={isGenerating}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
                mode === "browse"
                  ? "bg-white text-indigo-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Browse Decks ({allAvailableDecks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("generate");
                setErrorMsg(null);
              }}
              disabled={isGenerating}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
                mode === "generate"
                  ? "bg-white text-indigo-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>✨ Generate AI Deck</span>
            </button>
          </div>
        </div>

        {/* ----------------- VIEW 1: BROWSE & SWITCH DECKS ----------------- */}
        {mode === "browse" && (
          <>
            <div className="overflow-y-auto pr-1 space-y-4 text-xs flex-1">
              {/* 1. Target Language */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-600 font-bold">
                    1. I want to learn (Target Language):
                  </label>
                  <span className="text-[11px] font-bold text-indigo-600">
                    {targetLangObj.name} {targetLangObj.flag}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SUPPORTED_TARGET_LANGUAGES.map((l) => {
                    const isSelected = selectedTarget === l.code;
                    const deckCount = allAvailableDecks.filter(
                      (d) => d.targetLangCode === l.code
                    ).length;
                    return (
                      <button
                        key={l.code}
                        id={`target-lang-${l.code}`}
                        type="button"
                        onClick={() => setSelectedTarget(l.code)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50/90 border-indigo-600 text-indigo-900 font-bold shadow-xs ring-1 ring-indigo-500/20"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base shrink-0">{l.flag}</span>
                          <span className="truncate">{l.name}</span>
                        </div>
                        {isSelected ? (
                          <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : deckCount > 0 ? (
                          <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                            {deckCount}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Known / Reference Language */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-600 font-bold">
                    2. Explain in (My Native / Known Language):
                  </label>
                  <span className="text-[11px] font-bold text-slate-500">
                    {knownLangObj.name} {knownLangObj.flag}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SUPPORTED_KNOWN_LANGUAGES.map((l) => {
                    const isSelected = selectedKnown === l.code;
                    return (
                      <button
                        key={l.code}
                        id={`known-lang-${l.code}`}
                        type="button"
                        onClick={() => setSelectedKnown(l.code)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50/90 border-indigo-600 text-indigo-900 font-bold shadow-xs ring-1 ring-indigo-500/20"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="text-base shrink-0">{l.flag}</span>
                          <span className="truncate">
                            {l.name} ({l.nativeName})
                          </span>
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Pronunciation & Script Aid Preference for Selected Target Language */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <label className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>3. Pronunciation Aid for {targetLangObj.name}:</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Select phonetic script, romanization, or none
                  </p>
                </div>
                <PronunciationAidSelector
                  langCode={targetLangObj.code}
                  langName={targetLangObj.name}
                  currentAid={selectedAid}
                  onChangeAid={handleAidChange}
                />
              </div>

              {/* 4. Available Decks for Selected Target Language (Curated + Community Cloud) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-700 font-bold flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>4. Decks for {targetLangObj.name}</span>
                  </label>
                  
                  {/* Category Filter */}
                  <div className="flex items-center gap-1 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setDeckTab("all")}
                      className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                        deckTab === "all"
                          ? "bg-indigo-100 text-indigo-800 font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      All ({allAvailableDecks.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeckTab("curated")}
                      className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                        deckTab === "curated"
                          ? "bg-indigo-100 text-indigo-800 font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Curated
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeckTab("community")}
                      className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        deckTab === "community"
                          ? "bg-indigo-100 text-indigo-800 font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Cloud className="w-2.5 h-2.5" />
                      <span>Generated ({allAvailableDecks.filter((d) => d.isCustom).length})</span>
                    </button>
                  </div>
                </div>

                {isLoadingCloudDecks && (
                  <div className="py-2 text-center text-xs text-indigo-600 font-medium flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing saved cloud decks...</span>
                  </div>
                )}

                {filteredDecks.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                    {filteredDecks.map((d) => {
                      const isActive = d.id === activeDeckId;
                      const masteredCount = d.cards.filter(
                        (c) => (c.srs?.masteryScore || 0) >= 70
                      ).length;

                      return (
                        <button
                          key={d.id}
                          id={`deck-item-${d.id}`}
                          type="button"
                          onClick={() => handleDeckClick(d)}
                          className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer group ${
                            isActive
                              ? "bg-indigo-50/90 border-indigo-500 shadow-xs ring-1 ring-indigo-500/20"
                              : "bg-slate-50 hover:bg-indigo-50/40 border-slate-200 hover:border-indigo-300 text-slate-800"
                          }`}
                        >
                          <div className="space-y-1 min-w-0 pr-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 truncate">
                                {d.title}
                              </span>

                              {isActive && (
                                <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full shrink-0">
                                  Active
                                </span>
                              )}

                              {d.isCustom && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                                  <Cloud className="w-2.5 h-2.5" />
                                  <span>AI / Cloud</span>
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500 truncate">
                              {d.description}
                            </p>

                            {d.creatorName && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span>Created by {d.creatorName}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0 text-right">
                            <div>
                              <div className="font-bold text-xs text-slate-800">
                                {d.cards.length} cards
                              </div>
                              <div className="text-[10px] text-emerald-600 font-medium">
                                {masteredCount} mastered
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-center space-y-2">
                    <p className="font-bold text-xs">
                      No matching decks found for {targetLangObj.name}.
                    </p>
                    <p className="text-[11px] text-amber-700">
                      Generate a custom frequency deck with Gemini AI in seconds!
                    </p>
                    <button
                      type="button"
                      onClick={() => setMode("generate")}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate {targetLangObj.name} Deck</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Actions (AI Deck Generator & Diagnostic Placement) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  id="modal-gen-deck-btn"
                  type="button"
                  onClick={() => setMode("generate")}
                  className="py-2.5 px-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold flex items-center justify-center gap-2 border border-indigo-200 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Generate AI Frequency Deck</span>
                </button>

                {onOpenPlacementModal && (
                  <button
                    id="modal-placement-btn"
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPlacementModal();
                    }}
                    className="py-2.5 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 border border-emerald-200 transition cursor-pointer"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>CEFR Diagnostic Placement</span>
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                id="apply-lang-pair-btn"
                type="button"
                onClick={handleApplySwitch}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition cursor-pointer flex items-center gap-2"
              >
                <span>Switch to {targetLangObj.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ----------------- VIEW 2: INLINE AI DECK GENERATOR ----------------- */}
        {mode === "generate" && (
          <form onSubmit={handleGenerateDeck} className="flex flex-col flex-1 overflow-hidden space-y-4">
            <div className="overflow-y-auto pr-1 space-y-4 text-xs flex-1">
              {/* Selected Language Pair Context Badge */}
              <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-500 font-medium">
                    Language Pair Selected:
                  </div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <span className="text-base">{targetLangObj.flag}</span>
                      <span className="text-indigo-700 font-extrabold">{targetLangObj.name} (Target)</span>
                    </span>
                    <span className="text-slate-400">←</span>
                    <span className="flex items-center gap-1 text-slate-700">
                      <span className="text-base">{knownLangObj.flag}</span>
                      <span>{knownLangObj.name} (Explanation)</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMode("browse")}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-xl border border-indigo-200 transition cursor-pointer"
                >
                  Change Pair
                </button>
              </div>

              {/* Topic Preset Chips */}
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">
                  Curriculum Topic / Focus Area:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {presetTopics.map((t) => {
                    const isSelected = topic === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTopic(t)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer text-[11px] truncate ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-600 text-indigo-900 font-bold shadow-2xs"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>

                {topic === "Custom Topic..." && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="e.g. Airport Navigation, Office Meetings, Coffee Shop Slang"
                      className="w-full p-2.5 rounded-xl border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-indigo-50/20 text-slate-900"
                      required
                    />
                  </div>
                )}
              </div>

              {/* CEFR Level Selector */}
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">
                  Target CEFR Level:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: "A1 - Beginner", label: "A1 (Beginner)" },
                    { id: "A2 - Elementary", label: "A2 (Elementary)" },
                    { id: "B1 - Intermediate", label: "B1 (Intermediate)" },
                    { id: "B2 - Upper Intermediate", label: "B2 (Upper)" },
                    { id: "C1 - Advanced", label: "C1 (Advanced)" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLevel(l.id)}
                      className={`p-2 rounded-xl border text-center text-[11px] font-bold transition cursor-pointer ${
                        level === l.id
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Count & Frequency Start Rank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1.5">
                    Number of Cards:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[10, 15, 20, 25].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCount(num)}
                        className={`p-2 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                          count === num
                            ? "bg-indigo-50 border-indigo-600 text-indigo-900 font-extrabold"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1.5">
                    Starting Frequency Rank:
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="grid grid-cols-3 gap-1 flex-1">
                      {[1, 21, 51].map((rk) => (
                        <button
                          key={rk}
                          type="button"
                          onClick={() => setStartRank(rk)}
                          className={`p-2 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                            startRank === rk
                              ? "bg-indigo-50 border-indigo-600 text-indigo-900 font-extrabold"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          #{rk}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={5000}
                      value={startRank}
                      onChange={(e) => setStartRank(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 p-2 rounded-xl border border-slate-200 text-center text-xs font-bold bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      title="Custom starting frequency rank index"
                    />
                  </div>
                </div>
              </div>

              {/* Cloud Save Notice */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>
                  This deck will be permanently saved to your library and shared in the community hub so you can re-use it anytime!
                </span>
              </div>

              {/* Error Notice */}
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Generator Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setMode("browse")}
                disabled={isGenerating}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Decks</span>
              </button>

              <button
                id="generate-deck-submit-btn"
                type="submit"
                disabled={isGenerating}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Synthesizing {count} Cards with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate & Save Deck</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
