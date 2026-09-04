import React, { useState, useMemo, useEffect, useRef } from "react";
import { Deck, Flashcard, SupportedLanguage, CardType } from "../types";
import { playTextAloud } from "../utils/speech";
import { ConjugationLookup } from "./ConjugationLookup";
import { IS_CONJUGATION_LANGUAGE } from "../data/conjugations";
import { LinguisticCopilot, CopilotTriggerButton } from "./LinguisticCopilot";
import { formatPronunciation } from "../utils/pronunciation";
import { fetchCloudDecks, User } from "../lib/firebase";
import { AlignedTranslation } from "./AlignedTranslation";
import {
  Search,
  Plus,
  Flame,
  Volume2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  GraduationCap,
  Award,
  Zap,
  CheckCircle2,
  Layers,
  BrainCircuit,
  Table,
  ArrowUpDown,
  Filter,
  ListFilter,
  Check,
  Languages,
  Cloud,
  Globe2,
  FolderOpen,
} from "lucide-react";

interface DeckExplorerProps {
  deck: Deck;
  allDecks?: Deck[];
  onSelectDeck?: (deck: Deck) => void;
  onDeckGenerated?: (newDeck: Deck) => void;
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  onAddCard: (card: Flashcard) => void;
  onOpenGenerateModal: () => void;
  onStudyCard: (cardId: string) => void;
  onStudyBracket?: (startRank: number, endRank: number) => void;
  onGenerateNextBatch?: (startRank: number, endRank: number) => void;
  isGeneratingBatch?: boolean;
  isOnline?: boolean;
  currentUser?: User | null;
  pronunciationAid?: string;
}

export const DeckExplorer: React.FC<DeckExplorerProps> = ({
  deck,
  allDecks = [],
  onSelectDeck,
  onDeckGenerated,
  targetLang,
  knownLang,
  onAddCard,
  onOpenGenerateModal,
  onStudyCard,
  onStudyBracket,
  onGenerateNextBatch,
  isGeneratingBatch = false,
  isOnline = true,
  currentUser,
  pronunciationAid = "none",
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [freqRangeFilter, setFreqRangeFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"rank-asc" | "rank-desc" | "alpha-asc" | "mastery-desc" | "mastery-asc">("rank-asc");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [showAddCardModal, setShowAddCardModal] = useState<boolean>(false);
  const [showConjugationExplorer, setShowConjugationExplorer] = useState<boolean>(false);
  const [activeLookupVerb, setActiveLookupVerb] = useState<string>("");

  // In-tab Deck Switcher state
  const [showDeckPicker, setShowDeckPicker] = useState<boolean>(false);
  const [deckPickerSearch, setDeckPickerSearch] = useState<string>("");
  const [deckPickerTab, setDeckPickerTab] = useState<"my" | "community">("my");
  const [cloudDecks, setCloudDecks] = useState<Deck[]>([]);
  const [isLoadingCloudDecks, setIsLoadingCloudDecks] = useState<boolean>(false);
  const deckPickerRef = useRef<HTMLDivElement>(null);

  // Close deck picker on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        deckPickerRef.current &&
        !deckPickerRef.current.contains(event.target as Node)
      ) {
        setShowDeckPicker(false);
      }
    }
    if (showDeckPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDeckPicker]);

  // Load cloud community decks for the current target language
  useEffect(() => {
    let isMounted = true;
    if (isOnline && showDeckPicker && deckPickerTab === "community") {
      setIsLoadingCloudDecks(true);
      fetchCloudDecks(targetLang.code)
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
  }, [isOnline, showDeckPicker, deckPickerTab, targetLang.code]);

  // Decks for current language
  const currentLangDecks = useMemo(() => {
    const combined = allDecks.length > 0 ? allDecks : [deck];
    return combined.filter((d) => d.targetLangCode === targetLang.code);
  }, [allDecks, deck, targetLang.code]);

  // Filtered decks for the picker
  const filteredLocalDecks = useMemo(() => {
    return currentLangDecks.filter((d) => {
      if (!deckPickerSearch.trim()) return true;
      const q = deckPickerSearch.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        (d.level && d.level.toLowerCase().includes(q))
      );
    });
  }, [currentLangDecks, deckPickerSearch]);

  const filteredCloudDecks = useMemo(() => {
    const localIds = new Set(currentLangDecks.map((d) => d.id));
    return cloudDecks
      .filter((d) => !localIds.has(d.id))
      .filter((d) => {
        if (!deckPickerSearch.trim()) return true;
        const q = deckPickerSearch.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          (d.level && d.level.toLowerCase().includes(q))
        );
      });
  }, [cloudDecks, currentLangDecks, deckPickerSearch]);

  // New Card Form State
  const [newTargetItem, setNewTargetItem] = useState("");
  const [newType, setNewType] = useState<CardType>("vocabulary");
  const [newPartOfSpeech, setNewPartOfSpeech] = useState("Verb");
  const [newDefinition, setNewDefinition] = useState("");
  const [newPhonetic, setNewPhonetic] = useState("");
  const [newUsageNotes, setNewUsageNotes] = useState("");
  const [newFreqRank, setNewFreqRank] = useState<number>(deck.cards.length + 1);
  const [newExampleTarget, setNewExampleTarget] = useState("");
  const [newExampleTranslation, setNewExampleTranslation] = useState("");
  const [isModalCopilotOpen, setIsModalCopilotOpen] = useState(false);

  const isConjugationLang = IS_CONJUGATION_LANGUAGE[targetLang.code] ?? false;

  // Deck Stats Calculation
  const totalCards = deck.cards.length;
  const masteredCardsCount = deck.cards.filter(
    (c) => c.srs.status === "mastered" || c.srs.masteryScore >= 85
  ).length;
  const activeReviewCardsCount = deck.cards.filter(
    (c) =>
      c.srs.status === "learning" ||
      c.srs.status === "review" ||
      (c.srs.masteryScore >= 40 && c.srs.masteryScore < 85)
  ).length;
  const newCardsCount = deck.cards.filter(
    (c) => c.srs.status === "new" && (c.srs.masteryScore || 0) < 40
  ).length;
  const dueCardsCount = deck.cards.filter(
    (c) => c.srs.history && c.srs.history.length > 0 && new Date(c.srs.dueDate) <= new Date()
  ).length;

  // Filtered & Sorted Cards
  const filteredCards = useMemo(() => {
    return deck.cards
      .filter((card) => {
        // 1. Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            card.targetItem.toLowerCase().includes(q) ||
            card.definition.toLowerCase().includes(q) ||
            card.partOfSpeech.toLowerCase().includes(q) ||
            (card.usageNotes && card.usageNotes.toLowerCase().includes(q)) ||
            (card.correctedForm && card.correctedForm.toLowerCase().includes(q));
          if (!matches) return false;
        }

        // 2. Mastery status filter
        if (statusFilter !== "all") {
          if (statusFilter === "mastered") {
            if (card.srs.status !== "mastered" && card.srs.masteryScore < 85) return false;
          } else if (statusFilter === "active_review") {
            if (
              card.srs.status !== "learning" &&
              card.srs.status !== "review" &&
              (card.srs.masteryScore < 40 || card.srs.masteryScore >= 85)
            ) {
              return false;
            }
          } else if (statusFilter === "new") {
            if (card.srs.status !== "new" && (card.srs.history?.length || 0) > 0) return false;
          } else if (statusFilter === "due") {
            const isDue =
              card.srs.history &&
              card.srs.history.length > 0 &&
              new Date(card.srs.dueDate) <= new Date();
            if (!isDue) return false;
          } else if (statusFilter === "common_error") {
            if (!card.isCommonError && card.type !== "common_error") return false;
          }
        }

        // 3. Item type filter
        if (typeFilter !== "all") {
          const pos = (card.partOfSpeech || "").toLowerCase();
          const cardType = (card.type || "").toLowerCase();

          if (typeFilter === "vocab") {
            // Standard words, nouns, verbs, adjs
            const isParticleOrGrammar =
              pos.includes("particle") ||
              pos.includes("connector") ||
              pos.includes("grammar") ||
              pos.includes("formula") ||
              cardType === "grammar_concept" ||
              cardType === "connector";
            if (isParticleOrGrammar && cardType !== "vocabulary") return false;
          } else if (typeFilter === "particle") {
            // Particles and connectors
            const isParticle =
              pos.includes("particle") ||
              pos.includes("connector") ||
              pos.includes("preposition") ||
              pos.includes("postposition") ||
              pos.includes("conjunction") ||
              cardType === "connector";
            if (!isParticle) return false;
          } else if (typeFilter === "grammar") {
            // Grammar concepts and formula structures
            const isGrammar =
              pos.includes("grammar") ||
              pos.includes("formula") ||
              pos.includes("pattern") ||
              pos.includes("rule") ||
              pos.includes("conjugation") ||
              cardType === "grammar_concept";
            if (!isGrammar) return false;
          } else if (typeFilter === "phrase") {
            const isPhrase =
              pos.includes("phrase") ||
              pos.includes("idiom") ||
              pos.includes("expression") ||
              cardType === "phrase";
            if (!isPhrase) return false;
          }
        }

        // 4. Frequency range filter
        if (freqRangeFilter !== "all") {
          const rank = card.frequencyRank || 9999;
          if (freqRangeFilter === "1-50" && (rank < 1 || rank > 50)) return false;
          if (freqRangeFilter === "51-100" && (rank < 51 || rank > 100)) return false;
          if (freqRangeFilter === "101-200" && (rank < 101 || rank > 200)) return false;
          if (freqRangeFilter === "201-300" && (rank < 201 || rank > 300)) return false;
          if (freqRangeFilter === "301+" && rank < 301) return false;
          // Legacy support
          if (freqRangeFilter === "1-10" && (rank < 1 || rank > 10)) return false;
          if (freqRangeFilter === "11-20" && (rank < 11 || rank > 20)) return false;
          if (freqRangeFilter === "21-30" && (rank < 21 || rank > 30)) return false;
          if (freqRangeFilter === "31-50" && (rank < 31 || rank > 50)) return false;
          if (freqRangeFilter === "101+" && rank < 101) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "rank-asc") {
          return (a.frequencyRank || 9999) - (b.frequencyRank || 9999);
        } else if (sortOrder === "rank-desc") {
          return (b.frequencyRank || 0) - (a.frequencyRank || 0);
        } else if (sortOrder === "alpha-asc") {
          return a.targetItem.localeCompare(b.targetItem);
        } else if (sortOrder === "mastery-desc") {
          return (b.srs.masteryScore || 0) - (a.srs.masteryScore || 0);
        } else if (sortOrder === "mastery-asc") {
          return (a.srs.masteryScore || 0) - (b.srs.masteryScore || 0);
        }
        return 0;
      });
  }, [deck.cards, searchQuery, statusFilter, typeFilter, freqRangeFilter, sortOrder]);

  const handlePlayAudio = (text: string) => {
    playTextAloud(text, targetLang.code);
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetItem.trim() || !newDefinition.trim()) return;

    const newCard: Flashcard = {
      id: `custom-${Date.now()}`,
      deckId: deck.id,
      type: newType,
      targetItem: newTargetItem.trim(),
      targetLanguage: targetLang.name,
      knownLanguage: knownLang.name,
      frequencyRank: Number(newFreqRank) || deck.cards.length + 1,
      partOfSpeech: newPartOfSpeech,
      definition: newDefinition.trim(),
      phonetic: newPhonetic.trim() || undefined,
      usageNotes: newUsageNotes.trim() || "Use accurately in a sentence.",
      examples:
        newExampleTarget.trim() && newExampleTranslation.trim()
          ? [{ target: newExampleTarget.trim(), translation: newExampleTranslation.trim() }]
          : [],
      tags: ["custom"],
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
    };

    onAddCard(newCard);
    setShowAddCardModal(false);
    // Reset form
    setNewTargetItem("");
    setNewDefinition("");
    setNewPhonetic("");
    setNewUsageNotes("");
    setNewExampleTarget("");
    setNewExampleTranslation("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      {/* Quick Decks Switcher Pills (when more than 1 deck is available) */}
      {currentLangDecks.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Decks:</span>
          </span>
          {currentLangDecks.map((d) => {
            const isActive = d.id === deck.id;
            return (
              <button
                key={d.id}
                id={`quick-deck-btn-${d.id}`}
                onClick={() => {
                  if (onSelectDeck) onSelectDeck(d);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition whitespace-nowrap cursor-pointer shrink-0 border ${
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs shadow-indigo-200"
                    : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                {isActive && <Check className="w-3 h-3 text-white stroke-[3]" />}
                <span className="truncate max-w-[180px]">{d.title}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {d.cards.length}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => {
              if (isOnline) onOpenGenerateModal();
            }}
            disabled={!isOnline}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition whitespace-nowrap cursor-pointer shrink-0"
            title="Generate new deck with AI"
          >
            <Sparkles className="w-3 h-3" />
            <span>+ New Deck</span>
          </button>
        </div>
      )}

      {/* Header Bento Tile */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            {/* Language and Deck Context Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">{targetLang.flag}</span>
              <span className="text-xs font-bold text-slate-800">
                {targetLang.name}
              </span>
              <span className="text-slate-300 text-xs">·</span>
              <span className="text-xs font-semibold text-slate-500">
                from {knownLang.name} {knownLang.flag}
              </span>
              {deck.level && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {deck.level}
                </span>
              )}
              {deck.isCustom && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Custom
                </span>
              )}
            </div>

            {/* Deck Title & Switcher Dropdown Anchor */}
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {deck.title}
              </h2>

              {/* In-tab Deck Switcher Dropdown Button */}
              <div className="relative inline-block" ref={deckPickerRef}>
                <button
                  id="deck-switcher-btn"
                  type="button"
                  onClick={() => setShowDeckPicker(!showDeckPicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 text-xs font-bold transition cursor-pointer"
                  title="Switch to a different deck"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Switch Deck ({currentLangDecks.length})</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-indigo-500 transition-transform duration-200 ${
                      showDeckPicker ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Deck Switcher Popover Menu */}
                {showDeckPicker && (
                  <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-3xl bg-white border border-slate-200 shadow-2xl p-4 z-40 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <span>Select Deck for {targetLang.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {currentLangDecks.length} local
                      </span>
                    </div>

                    {/* Search inside deck picker */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={deckPickerSearch}
                        onChange={(e) => setDeckPickerSearch(e.target.value)}
                        placeholder="Search decks..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
                      />
                    </div>

                    {/* Tabs: My Decks / Community Cloud Decks */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 text-xs font-bold">
                      <button
                        onClick={() => setDeckPickerTab("my")}
                        className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer ${
                          deckPickerTab === "my"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        My Decks ({currentLangDecks.length})
                      </button>
                      <button
                        onClick={() => setDeckPickerTab("community")}
                        className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                          deckPickerTab === "community"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Cloud className="w-3 h-3 text-indigo-500" />
                        <span>Community</span>
                      </button>
                    </div>

                    {/* Decks List */}
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar text-xs">
                      {deckPickerTab === "my" ? (
                        filteredLocalDecks.length === 0 ? (
                          <div className="p-4 text-center text-slate-400 text-xs">
                            No local decks match your search.
                          </div>
                        ) : (
                          filteredLocalDecks.map((d) => {
                            const isCurrent = d.id === deck.id;
                            const dMastered = d.cards.filter(
                              (c) => c.srs.status === "mastered" || c.srs.masteryScore >= 85
                            ).length;
                            return (
                              <div
                                key={d.id}
                                onClick={() => {
                                  if (onSelectDeck) onSelectDeck(d);
                                  setShowDeckPicker(false);
                                }}
                                className={`p-3 rounded-2xl border transition cursor-pointer space-y-1 text-left ${
                                  isCurrent
                                    ? "bg-indigo-50/70 border-indigo-300 shadow-2xs"
                                    : "bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/80"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900 truncate">
                                    {d.title}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white shrink-0">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-1">
                                  {d.description || "Active Vocabulary and Grammar Formulas"}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold pt-0.5">
                                  <span>{d.cards.length} items</span>
                                  <span>·</span>
                                  <span className="text-emerald-600">
                                    {dMastered} mastered
                                  </span>
                                  {d.level && (
                                    <>
                                      <span>·</span>
                                      <span className="text-indigo-600 font-bold">
                                        {d.level}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )
                      ) : (
                        /* Community Cloud Decks */
                        isLoadingCloudDecks ? (
                          <div className="p-6 text-center text-slate-400 space-y-1">
                            <Cloud className="w-5 h-5 animate-pulse text-indigo-500 mx-auto" />
                            <p className="text-xs">Loading community decks...</p>
                          </div>
                        ) : filteredCloudDecks.length === 0 ? (
                          <div className="p-4 text-center text-slate-400 text-xs">
                            No community decks found for {targetLang.name}.
                          </div>
                        ) : (
                          filteredCloudDecks.map((cd) => (
                            <div
                              key={cd.id}
                              onClick={() => {
                                if (onSelectDeck) onSelectDeck(cd);
                                setShowDeckPicker(false);
                              }}
                              className="p-3 rounded-2xl bg-slate-50/60 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 transition cursor-pointer space-y-1 text-left"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 truncate">
                                  {cd.title}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 shrink-0 flex items-center gap-1">
                                  <Cloud className="w-2.5 h-2.5" />
                                  <span>Import</span>
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                {cd.description || "Shared by the community"}
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                                <span>{cd.cards.length} items</span>
                                <span>by {cd.creatorName || "Learner"}</span>
                              </div>
                            </div>
                          ))
                        )
                      )}
                    </div>

                    {/* Footer Actions inside Deck Switcher */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setShowDeckPicker(false);
                          if (isOnline) onOpenGenerateModal();
                        }}
                        disabled={!isOnline}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>+ Generate New Deck</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-500">
              {deck.description || "Active Vocabulary and Grammar Formulas"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              id="deck-generate-more-btn"
              onClick={() => {
                if (isOnline) {
                  onOpenGenerateModal();
                }
              }}
              disabled={!isOnline || isGeneratingBatch}
              title={
                !isOnline
                  ? "Requires online connection to generate cards with AI"
                  : "Generate more frequency cards and grammar concepts"
              }
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-xs ${
                isOnline
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 active:scale-95 cursor-pointer"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate More Items</span>
            </button>

            <button
              id="open-add-card-modal-btn"
              onClick={() => setShowAddCardModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Card</span>
            </button>

            {isConjugationLang && (
              <button
                id="deck-conjugation-explorer-btn"
                onClick={() => {
                  setShowConjugationExplorer(!showConjugationExplorer);
                  setActiveLookupVerb("");
                }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold border transition cursor-pointer ${
                  showConjugationExplorer
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 border-slate-200"
                }`}
              >
                <Table className="w-4 h-4" />
                <span>Conjugation Tables</span>
              </button>
            )}
          </div>
        </div>

        {/* Current Deck Stats Chips */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs font-bold flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-3 py-1 rounded-full border border-slate-200">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>{totalCards} Total Items</span>
          </span>

          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{masteredCardsCount} Mastered</span>
          </span>

          <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-800 px-3 py-1 rounded-full border border-indigo-200">
            <Flame className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
            <span>{activeReviewCardsCount} Active Review</span>
          </span>

          {newCardsCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{newCardsCount} New</span>
            </span>
          )}

          {dueCardsCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-800 px-3 py-1 rounded-full border border-orange-200">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>{dueCardsCount} Due</span>
            </span>
          )}
        </div>
      </div>

      {/* Conjugation Tables Explorer (Dropdown & Verb Forms) */}
      {isConjugationLang && showConjugationExplorer && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <ConjugationLookup
            targetLang={targetLang}
            knownLang={knownLang}
            initialVerb={activeLookupVerb || ""}
            isOnline={isOnline}
            onAddConjugationToDeck={(newCard) => onAddCard(newCard)}
            pronunciationAid={pronunciationAid}
          />
        </div>
      )}

      {/* Filters and Search Controls Strip */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        {/* Top Row: Search and Sort */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="deck-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search word, grammar concept, definition..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </span>
            <select
              id="deck-sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="rank-asc">Frequency: Lowest Rank (#1 First)</option>
              <option value="rank-desc">Frequency: Highest Rank</option>
              <option value="alpha-asc">Alphabetical (A → Z)</option>
              <option value="mastery-desc">Mastery: High to Low</option>
              <option value="mastery-asc">Mastery: Low to High</option>
            </select>
          </div>
        </div>

        {/* Second Row: Mastery Filter, Item Type Filter, and Frequency Range Filter */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs">
          {/* Mastery Status Filter Pills */}
          <div className="space-y-1.5 w-full lg:w-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Filter by Mastery:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "all", label: `All (${totalCards})` },
                { id: "mastered", label: `Mastered (${masteredCardsCount})` },
                { id: "active_review", label: `Active Review (${activeReviewCardsCount})` },
                { id: "new", label: `New (${newCardsCount})` },
                { id: "due", label: `Due (${dueCardsCount})` },
                { id: "common_error", label: "⚠️ Error Remedies" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                    statusFilter === f.id
                      ? f.id === "common_error"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Type and Frequency Range Selectors */}
          <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto pt-1 lg:pt-0">
            {/* Item Type Filter */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Item Type:
              </span>
              <select
                id="deck-type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="all">All Item Types</option>
                <option value="vocab">Vocabulary / Core Words</option>
                <option value="particle">Particles & Connectors</option>
                <option value="grammar">Grammar Concepts & Formulas</option>
                <option value="phrase">Phrases & Expressions</option>
              </select>
            </div>

            {/* Frequency Range Filter */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Frequency Range:
              </span>
              <select
                id="deck-frequency-range-filter"
                value={freqRangeFilter}
                onChange={(e) => setFreqRangeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="all">All Frequency Ranks</option>
                <option value="1-50">Top 50 (Ranks #1 – #50)</option>
                <option value="51-100">Ranks #51 – #100</option>
                <option value="101-200">Ranks #101 – #200</option>
                <option value="201-300">Ranks #201 – #300</option>
                <option value="301+">Ranks #301+</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Catalog List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <span>Showing {filteredCards.length} of {totalCards} items</span>
          {(statusFilter !== "all" || typeFilter !== "all" || freqRangeFilter !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setTypeFilter("all");
                setFreqRangeFilter("all");
                setSearchQuery("");
              }}
              className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>

        {filteredCards.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm space-y-2">
            <p className="font-semibold text-slate-600">No cards found matching your current filter criteria.</p>
            <p className="text-xs text-slate-400">Try adjusting your filters, search term, or click "Generate More Items" to expand the deck.</p>
          </div>
        ) : (
          filteredCards.map((card) => {
            const isExpanded = expandedCardId === card.id;
            const formattedAid = formatPronunciation(
              card.targetItem,
              card.phonetic,
              targetLang.code,
              pronunciationAid
            );

            return (
              <div
                key={card.id}
                id={`card-item-${card.id}`}
                className={`border rounded-3xl p-5 transition shadow-xs space-y-3 ${
                  card.isCommonError
                    ? "bg-gradient-to-r from-amber-50/40 via-white to-white border-amber-200"
                    : "bg-white hover:border-slate-300 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Frequency rank & Word */}
                  <div className="flex items-start gap-3.5">
                    {/* Rank Badge */}
                    <div
                      className={`shrink-0 w-10 h-10 rounded-2xl flex flex-col items-center justify-center text-[10px] font-bold border ${
                        card.isCommonError
                          ? "bg-amber-100 border-amber-200 text-amber-900"
                          : "bg-indigo-50 border-indigo-100 text-indigo-700"
                      }`}
                    >
                      {card.isCommonError ? (
                        <Zap className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
                      ) : (
                        <Flame className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
                      )}
                      <span>{card.isCommonError ? "Slip" : `#${card.frequencyRank}`}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-extrabold text-slate-900">{card.targetItem}</h3>
                        <button
                          onClick={() => handlePlayAudio(card.correctedForm || card.targetItem)}
                          className="p-1 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-500 transition cursor-pointer"
                          title="Listen"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            card.isCommonError
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {card.isCommonError ? "Error Remedy" : card.type}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                          {card.partOfSpeech}
                        </span>
                      </div>

                      {card.isCommonError && card.originalMistake && (
                        <div className="flex items-center gap-2 text-xs font-mono mt-1">
                          <span className="text-rose-700 font-bold line-through">
                            Avoid: "{card.originalMistake}"
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="text-emerald-800 font-bold">
                            Use: "{card.correctedForm || card.targetItem}"
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-slate-600 mt-1 font-medium flex items-center gap-2 flex-wrap">
                        {formattedAid && (
                          <span className="font-serif text-indigo-600 font-semibold bg-indigo-50/70 px-2 py-0.5 rounded-md border border-indigo-100">
                            {formattedAid}
                          </span>
                        )}
                        <span>{card.definition}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: SRS Status & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        card.srs.status === "mastered" || card.srs.masteryScore >= 85
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : card.srs.status === "review"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : card.srs.status === "learning" || card.srs.masteryScore >= 40
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {card.srs.status === "mastered" || card.srs.masteryScore >= 85
                        ? "Mastered"
                        : card.srs.status === "new"
                        ? "New"
                        : "Active Review"}
                    </span>

                    <button
                      onClick={() => onStudyCard(card.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-bold transition cursor-pointer"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Study</span>
                    </button>

                    <button
                      onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 text-xs space-y-4 bg-slate-50/50 p-4 rounded-2xl">
                    <div>
                      <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                        Usage & Grammar:
                      </span>
                      <p className="text-slate-700">{card.usageNotes}</p>
                    </div>

                    {/* Inline Conjugation Lookup in Verb Definition */}
                    {isConjugationLang && (
                      <div className="pt-2 border-t border-slate-200/80">
                        <ConjugationLookup
                          targetLang={targetLang}
                          knownLang={knownLang}
                          initialVerb={card.targetItem.split(/[\s(—\/:;,]/)[0].trim()}
                          isOnline={isOnline}
                          onAddConjugationToDeck={(newCard) => onAddCard(newCard)}
                          pronunciationAid={pronunciationAid}
                        />
                      </div>
                    )}

                    {card.examples && card.examples.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                          Example Sentences (Hover to highlight matching translation):
                        </span>
                        <div className="space-y-2">
                          {card.examples.map((ex, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                              <AlignedTranslation
                                targetText={ex.target}
                                translationText={ex.translation}
                                targetLangCode={targetLang.code}
                                phonetic={ex.phonetic}
                                pronunciationAid={pronunciationAid}
                                tokenBreakdown={ex.tokenBreakdown}
                                idPrefix={`deck-card-${card.id}-ex-${idx}`}
                                onSpeak={(text) => handlePlayAudio(text)}
                                size="sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add Custom Frequency Card</h3>
              <CopilotTriggerButton
                id="modal-copilot-trigger-btn"
                isOpen={isModalCopilotOpen}
                onClick={() => setIsModalCopilotOpen(!isModalCopilotOpen)}
                label="AI Co-Pilot"
                size="xs"
              />
            </div>

            {/* Modal Linguistic Copilot Panel */}
            {isModalCopilotOpen && (
              <div className="animate-fade-in">
                <LinguisticCopilot
                  targetLang={targetLang}
                  knownLang={knownLang}
                  pronunciationAid="romanized"
                  onInsertText={(text) => {
                    if (!newTargetItem) {
                      setNewTargetItem(text);
                    } else if (!newUsageNotes) {
                      setNewUsageNotes(text);
                    } else {
                      setNewTargetItem((prev) => `${prev} ${text}`);
                    }
                  }}
                  isOpen={isModalCopilotOpen}
                  onClose={() => setIsModalCopilotOpen(false)}
                  variant="inline"
                  idPrefix="modal-deck-copilot"
                  title="Linguistic Assistant"
                  subtitle={`Query vocabulary, definitions, phrases, or conjugations in ${targetLang.name}`}
                />
              </div>
            )}

            <form onSubmit={handleCreateCard} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Word / Concept</label>
                <input
                  type="text"
                  required
                  value={newTargetItem}
                  onChange={(e) => setNewTargetItem(e.target.value)}
                  placeholder="e.g. haber, por vs para, 食べる..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Card Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as CardType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="vocabulary">Vocabulary</option>
                    <option value="grammar">Grammar Formula</option>
                    <option value="connector">Particle / Connector</option>
                    <option value="phrase">Phrase / Idiom</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Frequency Rank</label>
                  <input
                    type="number"
                    value={newFreqRank}
                    onChange={(e) => setNewFreqRank(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Part of Speech / Category</label>
                <input
                  type="text"
                  value={newPartOfSpeech}
                  onChange={(e) => setNewPartOfSpeech(e.target.value)}
                  placeholder="e.g. Irregular Verb, Particle, Preposition"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Definition / Meaning</label>
                <input
                  type="text"
                  required
                  value={newDefinition}
                  onChange={(e) => setNewDefinition(e.target.value)}
                  placeholder="Meaning in known language"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Usage Notes & Patterns (Optional)</label>
                <textarea
                  value={newUsageNotes}
                  onChange={(e) => setNewUsageNotes(e.target.value)}
                  placeholder="How to use this word in a sentence..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition cursor-pointer"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
