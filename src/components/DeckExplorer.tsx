import React, { useState } from "react";
import { Deck, Flashcard, SupportedLanguage, CardType } from "../types";
import { playTextAloud } from "../utils/speech";
import { getFrequencyBrackets, getActiveFrequencyBracket } from "../utils/frequencyProgression";
import { ConjugationLookup } from "./ConjugationLookup";
import { IS_CONJUGATION_LANGUAGE } from "../data/conjugations";
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
  ArrowRight,
} from "lucide-react";

interface DeckExplorerProps {
  deck: Deck;
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  onAddCard: (card: Flashcard) => void;
  onOpenGenerateModal: () => void;
  onStudyCard: (cardId: string) => void;
  onStudyBracket?: (startRank: number, endRank: number) => void;
  onGenerateNextBatch?: (startRank: number, endRank: number) => void;
  isGeneratingBatch?: boolean;
  isOnline?: boolean;
}

export const DeckExplorer: React.FC<DeckExplorerProps> = ({
  deck,
  targetLang,
  knownLang,
  onAddCard,
  onOpenGenerateModal,
  onStudyCard,
  onStudyBracket,
  onGenerateNextBatch,
  isGeneratingBatch = false,
  isOnline = true,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<number | "all">("all");
  const [deckViewMode, setDeckViewMode] = useState<"catalog" | "tiers">("catalog");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [showAddCardModal, setShowAddCardModal] = useState<boolean>(false);
  const [showConjugationExplorer, setShowConjugationExplorer] = useState<boolean>(false);
  const [activeLookupVerb, setActiveLookupVerb] = useState<string>("");

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

  const isConjugationLang = IS_CONJUGATION_LANGUAGE[targetLang.code] ?? false;

  const brackets = getFrequencyBrackets(deck.cards, 10);
  const { currentBracket, nextBracketStart, nextBracketEnd, isCurrentTierMastered, needsNextBatchGeneration } =
    getActiveFrequencyBracket(deck.cards, 10);

  const filteredCards = deck.cards
    .filter((card) => {
      // Tier filter
      if (tierFilter !== "all") {
        const startRank = (tierFilter - 1) * 10 + 1;
        const endRank = tierFilter * 10;
        if (card.frequencyRank < startRank || card.frequencyRank > endRank) {
          return false;
        }
      }

      // Search filter
      const matchesSearch =
        card.targetItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.partOfSpeech.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      if (statusFilter === "all") return matchesSearch;
      if (statusFilter === "common_error") {
        return matchesSearch && (card.isCommonError || card.type === "common_error");
      }
      if (statusFilter === "due") {
        const isDue =
          card.srs.history.length > 0 && new Date(card.srs.dueDate) <= new Date();
        return matchesSearch && isDue;
      }
      return matchesSearch && card.srs.status === statusFilter;
    })
    .sort((a, b) => {
      // Show common errors appropriately or sort by frequency rank
      if (a.isCommonError && !b.isCommonError) return -1;
      if (!a.isCommonError && b.isCommonError) return 1;
      return a.frequencyRank - b.frequencyRank;
    });

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
      {/* Header Bento Tile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{targetLang.flag}</span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {deck.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{deck.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 mt-3 text-xs text-slate-500 font-semibold flex-wrap">
            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100">
              {deck.cards.length} Frequency Items
            </span>
            <span>•</span>
            <span>Target: {targetLang.name}</span>
            <span>•</span>
            <span>Known: {knownLang.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {needsNextBatchGeneration && (
            <button
              onClick={() => {
                if (isOnline) {
                  onGenerateNextBatch?.(nextBracketStart, nextBracketEnd);
                }
              }}
              disabled={!isOnline || isGeneratingBatch}
              title={
                !isOnline
                  ? "Requires online connection to generate cards with AI"
                  : "Generate next frequency batch"
              }
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
                isOnline
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 cursor-pointer"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
              }`}
            >
              {isGeneratingBatch ? (
                <>
                  <BrainCircuit className="w-4 h-4 animate-spin" />
                  <span>Generating #{nextBracketStart}–#{nextBracketEnd}...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>
                    Unlock Next Batch (#{nextBracketStart}–#{nextBracketEnd})
                    {!isOnline && " (Online Only)"}
                  </span>
                </>
              )}
            </button>
          )}

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

          <button
            id="deck-explorer-generate-btn"
            onClick={() => {
              if (isOnline) {
                onOpenGenerateModal();
              }
            }}
            disabled={!isOnline}
            title={
              !isOnline
                ? "Requires online connection to generate AI decks"
                : "Create or calibrate a new deck"
            }
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold border transition ${
              isOnline
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 cursor-pointer"
                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>New Deck {!isOnline && "(Online)"}</span>
          </button>
        </div>
      </div>

      {/* Deck Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs sm:text-sm font-bold">
        <button
          id="deck-view-catalog-btn"
          onClick={() => setDeckViewMode("catalog")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition cursor-pointer ${
            deckViewMode === "catalog"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>Cards Catalog ({deck.cards.length})</span>
        </button>

        <button
          id="deck-view-tiers-btn"
          onClick={() => setDeckViewMode("tiers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition cursor-pointer ${
            deckViewMode === "tiers"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Flame className="w-4 h-4 shrink-0 text-orange-500 fill-orange-500" />
          <span>Frequency Tiers Breakdown ({brackets.length} Tiers)</span>
        </button>
      </div>

      {/* VIEW MODE: FREQUENCY TIERS BREAKDOWN */}
      {deckViewMode === "tiers" && (
        <div className="space-y-4">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                  <span>Frequency-Ordered Progression Hierarchy</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ordered by natural occurrence in {targetLang.name}. Mastering each 10-word tier builds rapid fluency.
                </p>
              </div>

              {needsNextBatchGeneration && (
                <button
                  onClick={() => {
                    if (isOnline) {
                      onGenerateNextBatch?.(nextBracketStart, nextBracketEnd);
                    }
                  }}
                  disabled={!isOnline || isGeneratingBatch}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Unlock Next Batch (#{nextBracketStart}–#{nextBracketEnd})</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {brackets.map((bracket, idx) => {
                const masteryPercent =
                  bracket.totalCards > 0
                    ? Math.round((bracket.masteredCards / bracket.totalCards) * 100)
                    : 0;

                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-3xl border transition shadow-xs space-y-3 ${
                      bracket.isMastered
                        ? "bg-emerald-50/30 border-emerald-200"
                        : bracket.cards.length > 0
                        ? "bg-white border-slate-200"
                        : "bg-slate-50/60 border-dashed border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center">
                          T{idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            Tier {idx + 1}: Ranks #{bracket.startRank} – #{bracket.endRank}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {bracket.totalCards} cards • {bracket.masteredCards} mastered
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            bracket.isMastered
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : bracket.totalCards > 0
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {bracket.isMastered
                            ? "Tier Mastered 🎉"
                            : bracket.totalCards > 0
                            ? `${masteryPercent}% Complete`
                            : "Not Generated Yet"}
                        </span>

                        {bracket.totalCards > 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setTierFilter(idx + 1);
                                setDeckViewMode("catalog");
                              }}
                              className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                            >
                              Filter in Catalog
                            </button>
                            <button
                              onClick={() => onStudyBracket?.(bracket.startRank, bracket.endRank)}
                              className="flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-bold transition cursor-pointer"
                            >
                              <span>Study Tier</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {bracket.totalCards > 0 && (
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            bracket.isMastered ? "bg-emerald-500" : "bg-indigo-600"
                          }`}
                          style={{ width: `${masteryPercent}%` }}
                        />
                      </div>
                    )}

                    {/* Words Chips */}
                    {bracket.cards.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {bracket.cards.map((c) => (
                          <span
                            key={c.id}
                            onClick={() => handlePlayAudio(c.targetItem)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition hover:scale-105 active:scale-95 ${
                              c.srs.status === "mastered"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                            title="Click to pronounce"
                          >
                            <span className="text-[10px] text-slate-400 font-mono">#{c.frequencyRank}</span>
                            <span>{c.targetItem}</span>
                            <Volume2 className="w-3 h-3 opacity-50 ml-0.5" />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE: CARDS CATALOG */}
      {deckViewMode === "catalog" && (
        <div className="space-y-6">
          {/* Frequency Tiers Quick Strip */}
          {brackets.length > 0 && (
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Frequency Progression Tiers</span>
                </span>
                <button
                  onClick={() => setDeckViewMode("tiers")}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Tiers Hierarchy</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setTierFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    tierFilter === "all"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Tiers ({deck.cards.length})
                </button>

                {brackets.map((b, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTierFilter(idx + 1)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      tierFilter === idx + 1
                        ? "bg-indigo-600 text-white"
                        : b.isMastered
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>Tier {idx + 1} (#{b.startRank}–#{b.endRank})</span>
                    {b.isMastered ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <span className="text-[10px] opacity-75">
                        {b.masteredCards}/{b.totalCards}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

      {/* Conjugation Tables Explorer (Dropdown & Verb Forms) */}
      {isConjugationLang && showConjugationExplorer && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <ConjugationLookup
            targetLang={targetLang}
            knownLang={knownLang}
            initialVerb={activeLookupVerb || ""}
            isOnline={isOnline}
            onAddConjugationToDeck={(newCard) => onAddCard(newCard)}
          />
        </div>
      )}

      {/* Filter & Search Bar Bento Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="deck-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search word, concept, definition..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-bold no-scrollbar">
          {[
            { id: "all", label: "All Items" },
            { id: "common_error", label: "⚠️ Error Remedies" },
            { id: "due", label: "Due for Review" },
            { id: "mastered", label: "Mastered" },
            { id: "learning", label: "Learning" },
            { id: "new", label: "New" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
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

      {/* FREQUENCY-ORDERED CARD LIST */}
      <div className="space-y-3">
        {filteredCards.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm">
            No cards found matching your filter criteria.
          </div>
        ) : (
          filteredCards.map((card) => {
            const isExpanded = expandedCardId === card.id;
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
                          {card.isCommonError ? "Tailored Error Remedy" : card.type}
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

                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        {card.phonetic && <span className="font-serif text-slate-400 mr-2">{card.phonetic}</span>}
                        {card.definition}
                      </p>
                    </div>
                  </div>

                  {/* Right: SRS Status & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        card.srs.status === "mastered"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : card.srs.status === "review"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : card.srs.status === "learning"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {card.srs.status === "mastered" ? "Mastered" : card.srs.status}
                    </span>

                    {/* Conjugation Form Lookup Button for Verbs */}
                    {isConjugationLang && (
                      <button
                        onClick={() => {
                          const rootCandidate = card.targetItem.split(/[\s(—\/:;,]/)[0].trim();
                          setActiveLookupVerb(rootCandidate);
                          setShowConjugationExplorer(true);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 text-xs font-bold transition cursor-pointer"
                        title="View Conjugation Forms & Paradigm"
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Conjugations</span>
                      </button>
                    )}

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
                        />
                      </div>
                    )}

                    {card.examples && card.examples.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                          Example Sentences:
                        </span>
                        <div className="space-y-1.5">
                          {card.examples.map((ex, idx) => (
                            <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{ex.target}</span>
                                <button
                                  onClick={() => handlePlayAudio(ex.target)}
                                  className="p-1 text-slate-400 hover:text-indigo-600"
                                >
                                  <Volume2 className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-slate-500 italic text-[11px]">{ex.translation}</p>
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
            <h3 className="text-lg font-bold text-slate-900">Add Custom Frequency Card</h3>
            <form onSubmit={handleCreateCard} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Word / Concept</label>
                <input
                  type="text"
                  required
                  value={newTargetItem}
                  onChange={(e) => setNewTargetItem(e.target.value)}
                  placeholder="e.g. haber, por vs para"
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
                  placeholder="e.g. Irregular Verb, Preposition"
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition"
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
