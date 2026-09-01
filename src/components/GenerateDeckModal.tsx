import React, { useState, useEffect } from "react";
import { Deck, Flashcard, SupportedLanguage } from "../types";
import {
  SUPPORTED_TARGET_LANGUAGES,
  SUPPORTED_KNOWN_LANGUAGES,
  getLanguageByCode,
} from "../data/languages";
import { Sparkles, BrainCircuit, X } from "lucide-react";

interface GenerateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  onDeckGenerated: (newDeck: Deck) => void;
  isOnline?: boolean;
}

export const GenerateDeckModal: React.FC<GenerateDeckModalProps> = ({
  isOpen,
  onClose,
  targetLang: initialTarget,
  knownLang: initialKnown,
  onDeckGenerated,
  isOnline = true,
}) => {
  const [selectedTargetCode, setSelectedTargetCode] = useState(initialTarget.code);
  const [selectedKnownCode, setSelectedKnownCode] = useState(initialKnown.code);
  const [level, setLevel] = useState("A1 - Beginner");
  const [topic, setTopic] = useState("Top 20 Most Frequent Core Vocabulary & Connectors");
  const [customTopic, setCustomTopic] = useState("");
  const [count, setCount] = useState<number>(300);
  const [startRank, setStartRank] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedTargetCode(initialTarget.code);
      setSelectedKnownCode(initialKnown.code);
    }
  }, [isOpen, initialTarget.code, initialKnown.code]);

  if (!isOpen) return null;

  const targetLang = getLanguageByCode(selectedTargetCode);
  const knownLang = getLanguageByCode(selectedKnownCode);

  const presetTopics = [
    "Top 20 Most Frequent Core Vocabulary & Connectors",
    "Essential Daily Life & Action Verbs",
    "High-Frequency Grammar Patterns & Conjunctions",
    "Travel, Directions & Transport Essentials",
    "Food, Dining & Culinary Expressions",
    "Work, Professional & Tech Vocabulary",
    "Emotional Expressions & Conversational Idioms",
    "Custom Topic...",
  ];

  const handleGenerate = async (e: React.FormEvent) => {
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
          targetLanguage: targetLang.name,
          knownLanguage: knownLang.name,
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
        targetLanguage: targetLang.name,
        knownLanguage: knownLang.name,
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
        title: data.deckTitle || `${targetLang.name}: ${activeTopic}`,
        description: data.deckDescription || `Frequency ranked flashcards for learning ${targetLang.name}.`,
        targetLang: targetLang.name,
        targetLangCode: targetLang.code,
        knownLang: knownLang.name,
        knownLangCode: knownLang.code,
        level,
        cards: newCards,
        createdAt: new Date().toISOString(),
        isCustom: true,
      };

      onDeckGenerated(newDeck);
      onClose();
    } catch (err: any) {
      console.error("Deck generation failed:", err);
      setErrorMsg(err.message || "Failed to generate deck. Please retry.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative text-slate-900">
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              AI Frequency Deck Generator
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Synthesize custom frequency-ranked flashcard decks for any language pair using Gemini.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4 text-xs">
          {/* Language Pair Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-500 font-bold block mb-1">
                Target Language (Learning)
              </label>
              <select
                value={selectedTargetCode}
                onChange={(e) => setSelectedTargetCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-400"
              >
                {SUPPORTED_TARGET_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-500 font-bold block mb-1">
                Known Language (Definitions)
              </label>
              <select
                value={selectedKnownCode}
                onChange={(e) => setSelectedKnownCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-400"
              >
                {SUPPORTED_KNOWN_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Proficiency Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-500 font-bold block mb-1">Proficiency Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-400"
              >
                <option value="A1 - Beginner">A1 - Beginner (Top 1-500)</option>
                <option value="A2 - Elementary">A2 - Elementary (Top 500-1500)</option>
                <option value="B1 - Intermediate">B1 - Intermediate (Top 1500-3000)</option>
                <option value="B2 - Upper Intermediate">B2 - Upper Intermediate (Top 3000-5000)</option>
                <option value="C1 - Advanced">C1 - Advanced (Top 5000+)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 font-bold block mb-1">Number of Cards</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-400"
              >
                <option value={300}>300 Flashcards (Complete Track)</option>
                <option value={100}>100 Flashcards</option>
                <option value={50}>50 Flashcards</option>
                <option value={20}>20 Flashcards</option>
                <option value={15}>15 Flashcards</option>
              </select>
            </div>
          </div>

          {/* Topic Selector */}
          <div>
            <label className="text-slate-500 font-bold block mb-1">Theme / Focus</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-400"
            >
              {presetTopics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Topic Input if selected */}
          {topic === "Custom Topic..." && (
            <div>
              <label className="text-slate-500 font-bold block mb-1">Custom Topic Details</label>
              <input
                type="text"
                required
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. Medical consultation phrases, software engineer terms..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-400"
              />
            </div>
          )}

          {/* Start Frequency Rank */}
          <div>
            <label className="text-slate-500 font-bold block mb-1">
              Start Frequency Rank (e.g. #1 for most common)
            </label>
            <input
              type="number"
              min="1"
              value={startRank}
              onChange={(e) => setStartRank(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-400"
            />
          </div>

          {errorMsg && <p className="text-rose-600 text-xs font-semibold">{errorMsg}</p>}

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="submit-generate-deck-btn"
              type="submit"
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <BrainCircuit className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Frequency Deck...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Deck ({count} cards)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
