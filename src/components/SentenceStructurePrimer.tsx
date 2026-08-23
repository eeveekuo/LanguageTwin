import React, { useState, useMemo, useEffect } from "react";
import { SupportedLanguage } from "../types";
import {
  getSentenceStructureGuide,
  StructureFormula,
  LanguageStructureGuide,
} from "../data/sentenceStructures";
import { AlignedTranslation } from "./AlignedTranslation";
import { playTextAloud } from "../utils/speech";
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Volume2,
  RefreshCw,
  Layers,
  ChevronRight,
  BrainCircuit,
  Lightbulb,
  Check,
  RotateCcw,
  Zap,
} from "lucide-react";

interface SentenceStructurePrimerProps {
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  onNavigateToStudy?: () => void;
  onNavigateToDeck?: () => void;
  isOnline?: boolean;
  pronunciationAid?: string;
  onLogPracticeActivity?: (activity: {
    mechanism: "grammar";
    title: string;
    details: string;
    score?: number;
    targetItem?: string;
  }) => void;
}

// Interactive builder challenge questions
interface BuilderChallenge {
  id: string;
  instruction: string;
  englishMeaning: string;
  correctTiles: string[];
  explanation: string;
}

const BUILDER_CHALLENGES: Record<string, BuilderChallenge[]> = {
  "zh-TW": [
    {
      id: "zh-b1",
      instruction: "Arrange the tiles into correct Chinese word order: Time & Place BEFORE the verb.",
      englishMeaning: "I read books at the library today.",
      correctTiles: ["我", "今天", "在圖書館", "看書"],
      explanation: "In Chinese, Time (今天) and Place (在圖書館) set the stage right before the Action (看書).",
    },
    {
      id: "zh-b2",
      instruction: "Arrange using the modifier connector 的 (de).",
      englishMeaning: "This is a very interesting movie.",
      correctTiles: ["這是", "很有趣的", "電影"],
      explanation: "Modifiers (很有趣的 - very interesting) strictly precede the core noun (電影 - movie).",
    },
  ],
  "es": [
    {
      id: "es-b1",
      instruction: "Arrange the descriptive adjective after the noun.",
      englishMeaning: "She has a white house.",
      correctTiles: ["Ella", "tiene", "una casa", "blanca"],
      explanation: "In Spanish, the descriptive adjective 'blanca' follows the noun 'casa'.",
    },
    {
      id: "es-b2",
      instruction: "Place the object pronoun before the conjugated verb.",
      englishMeaning: "He explained it to me.",
      correctTiles: ["Él", "me", "lo", "explicó"],
      explanation: "Indirect pronoun (me) and direct pronoun (lo) precede the conjugated verb (explicó).",
    },
  ],
  "ja": [
    {
      id: "ja-b1",
      instruction: "Arrange into Japanese SOV order (Verb at the very end).",
      englishMeaning: "I study Japanese every day.",
      correctTiles: ["私は", "毎日", "日本語を", "勉強します"],
      explanation: "The verb (勉強します) must conclude the sentence, with particles marking topic (は) and object (を).",
    },
  ],
  "ko": [
    {
      id: "ko-b1",
      instruction: "Arrange the tiles into Korean SOV word order (Verb at the end with topic and location particles).",
      englishMeaning: "I read books at the library today.",
      correctTiles: ["저는", "오늘", "도서관에서", "책을", "읽어요"],
      explanation: "Topic (저는) -> Time (오늘) -> Action Venue (도서관에서) -> Object (책을) -> Verb (읽어요).",
    },
    {
      id: "ko-b2",
      instruction: "Place the modifier clause directly before the noun.",
      englishMeaning: "This is the book that I bought yesterday.",
      correctTiles: ["이것은", "내가", "어제 산", "책이에요"],
      explanation: "Korean relative clauses like '어제 산' (bought yesterday) stand directly BEFORE the noun '책이에요'.",
    },
    {
      id: "ko-b3",
      instruction: "Arrange sequential actions with the connector suffix -아서/어서.",
      englishMeaning: "I met a friend and watched a movie.",
      correctTiles: ["친구를", "만나서", "영화를", "봤어요"],
      explanation: "Verb stem 만나- attaches -아서 to link chronologically with the past tense verb 봤어요.",
    },
  ],
  "nan": [
    {
      id: "nan-b1",
      instruction: "Arrange into Taiwanese Hokkien word order with progressive aspect 咧 (teh).",
      englishMeaning: "I am reading books at the library.",
      correctTiles: ["我", "佇圖書館", "咧看冊"],
      explanation: "Subject (我) -> Location (佇圖書館) -> Progressive aspect + Verb (咧看冊).",
    },
    {
      id: "nan-b2",
      instruction: "Arrange with the disposal particle 共 (kā).",
      englishMeaning: "Please close this door.",
      correctTiles: ["請你", "共這扇門", "關起來"],
      explanation: "共 (kā) moves the target object 這扇門 before the resultative action verb 關起來.",
    },
  ],
};

export const SentenceStructurePrimer: React.FC<SentenceStructurePrimerProps> = ({
  targetLang,
  knownLang,
  onNavigateToStudy,
  onNavigateToDeck,
  isOnline = true,
  pronunciationAid,
  onLogPracticeActivity,
}) => {
  const guide: LanguageStructureGuide = useMemo(() => {
    return getSentenceStructureGuide(targetLang.code, targetLang.name, targetLang.flag);
  }, [targetLang]);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(
    guide.formulas[0]?.id || ""
  );

  // Interactive Builder State
  const challenges = BUILDER_CHALLENGES[targetLang.code] || [
    {
      id: "gen-1",
      instruction: "Arrange the slots in standard word order.",
      englishMeaning: `A foundational sentence in ${targetLang.name}.`,
      correctTiles: ["Subject", "Verb", "Object"],
      explanation: `Standard Subject-Verb-Object progression in ${targetLang.name}.`,
    },
  ];

  const [challengeIndex, setChallengeIndex] = useState<number>(0);
  const currentChallenge = challenges[challengeIndex] || challenges[0];

  // Scrambled pool
  const [placedTiles, setPlacedTiles] = useState<string[]>([]);
  const [availableTiles, setAvailableTiles] = useState<string[]>(() => {
    return [...currentChallenge.correctTiles].sort(() => Math.random() - 0.5);
  });
  const [isBuilderSubmitted, setIsBuilderSubmitted] = useState<boolean>(false);
  const [isBuilderCorrect, setIsBuilderCorrect] = useState<boolean>(false);

  // AI Ask Grammar Explainer
  const [aiQuery, setAiQuery] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // Synchronize state when target language changes
  useEffect(() => {
    setSelectedFormulaId(guide.formulas[0]?.id || "");
    setActiveCategory("all");
    setChallengeIndex(0);
    const activeChallenges = BUILDER_CHALLENGES[targetLang.code] || [
      {
        id: "gen-1",
        instruction: "Arrange the slots in standard word order.",
        englishMeaning: `A foundational sentence in ${targetLang.name}.`,
        correctTiles: ["Subject", "Verb", "Object"],
        explanation: `Standard Subject-Verb-Object progression in ${targetLang.name}.`,
      },
    ];
    const firstChallenge = activeChallenges[0];
    if (firstChallenge) {
      setPlacedTiles([]);
      setAvailableTiles([...firstChallenge.correctTiles].sort(() => Math.random() - 0.5));
      setIsBuilderSubmitted(false);
      setIsBuilderCorrect(false);
    }
  }, [targetLang.code, guide]);

  // Reset challenge when switching
  const handleSelectChallenge = (index: number) => {
    const ch = challenges[index];
    if (!ch) return;
    setChallengeIndex(index);
    setPlacedTiles([]);
    setAvailableTiles([...ch.correctTiles].sort(() => Math.random() - 0.5));
    setIsBuilderSubmitted(false);
    setIsBuilderCorrect(false);
  };

  const handleTileClick = (tile: string, fromPlaced: boolean) => {
    if (isBuilderSubmitted) return;
    if (fromPlaced) {
      setPlacedTiles((prev) => prev.filter((t, i) => i !== prev.indexOf(tile)));
      setAvailableTiles((prev) => [...prev, tile]);
    } else {
      setAvailableTiles((prev) => prev.filter((t, i) => i !== prev.indexOf(tile)));
      setPlacedTiles((prev) => [...prev, tile]);
    }
  };

  const handleCheckBuilder = () => {
    const isMatch =
      placedTiles.length === currentChallenge.correctTiles.length &&
      placedTiles.every((t, i) => t === currentChallenge.correctTiles[i]);

    setIsBuilderCorrect(isMatch);
    setIsBuilderSubmitted(true);
    if (isMatch) {
      playTextAloud(placedTiles.join(""), targetLang.code);
    }
    onLogPracticeActivity?.({
      mechanism: "grammar",
      title: `Structure Challenge: ${currentChallenge.englishMeaning}`,
      details: isMatch
        ? `Arranged word order correctly: "${placedTiles.join(" ")}"`
        : `Attempted arrangement: "${placedTiles.join(" ")}"`,
      score: isMatch ? 100 : 40,
    });
  };

  const handleResetBuilder = () => {
    setPlacedTiles([]);
    setAvailableTiles([...currentChallenge.correctTiles].sort(() => Math.random() - 0.5));
    setIsBuilderSubmitted(false);
    setIsBuilderCorrect(false);
  };

  // AI Deep Dive Query
  const handleAskAiStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setAiExplanation(null);

    try {
      const res = await fetch("/api/quick-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryType: "check_nuance",
          inputQuery: `Explain this grammar structure pattern in ${targetLang.name}: "${aiQuery}". Explain the word order blueprint, why English speakers get confused, and provide 2 clear example sentences with word-by-word structural breakdown.`,
          targetLanguage: targetLang.name,
          knownLanguage: knownLang.name,
        }),
      });

      if (!res.ok) throw new Error("Failed to consult AI tutor");
      const data = await res.json();
      setAiExplanation(
        data.nuanceTip ||
          data.meaningInKnown ||
          data.targetExpression ||
          "Structure analysis received."
      );
    } catch (err) {
      setAiExplanation(
        `In ${targetLang.name}, sentence structure builds around the core subject and context markers. Review the formula cards above to practice.`
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredFormulas = useMemo(() => {
    if (activeCategory === "all") return guide.formulas;
    return guide.formulas.filter((f) => f.category === activeCategory);
  }, [guide.formulas, activeCategory]);

  const activeFormula =
    guide.formulas.find((f) => f.id === selectedFormulaId) || guide.formulas[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      {/* Intro Course Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold border border-white/15">
            <span>{guide.flag}</span>
            <span>{guide.langName} Sentence Structure Primer</span>
            <span className="bg-indigo-500/40 text-white px-2 py-0.5 rounded-full text-[10px]">
              Foundation Course
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Learn How Thoughts Are Built in {guide.langName}
          </h2>

          <p className="text-indigo-100 text-sm leading-relaxed">
            Before memorizing isolated vocabulary lists, master the core sentence
            architecture. Understand where time, location, verbs, and modifiers sit so you
            can instantly form natural, error-free sentences.
          </p>

          {/* Quick CTA to jump to vocab study once ready */}
          <div className="pt-2 flex items-center gap-3 flex-wrap">
            {onNavigateToStudy && (
              <button
                type="button"
                onClick={onNavigateToStudy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-900 text-xs font-extrabold hover:bg-indigo-50 shadow-md transition cursor-pointer"
              >
                <span>Ready? Start Active Vocab Study</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {onNavigateToDeck && (
              <button
                type="button"
                onClick={onNavigateToDeck}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white text-xs font-bold border border-indigo-500/40 transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Browse Deck Vocabulary</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background watermark */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none text-9xl font-black text-white hidden md:block">
          {guide.wordOrderType.split(" ")[0]}
        </div>
      </div>

      {/* Top Architecture Overview & Key Differences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Archetype Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Word Order Archetype
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                {guide.wordOrderType}
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {guide.overview}
          </p>
        </div>

        {/* Top 4 Differences from English */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Key Structural Differences
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                What to Watch Out For vs. English
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {guide.topDifferencesFromEnglish.map((diff, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700"
              >
                <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span className="leading-snug">{diff}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Structure Formulas & Interactive Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Formulas & Patterns (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Core Sentence Formulas</span>
            </h3>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-[11px] font-bold overflow-x-auto no-scrollbar">
              {[
                { id: "all", label: "All Formulas" },
                { id: "word_order", label: "Word Order" },
                { id: "modifiers", label: "Modifiers" },
                { id: "particles", label: "Particles" },
                { id: "negation_questions", label: "Questions" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-2.5 py-1 rounded-xl transition cursor-pointer whitespace-nowrap ${
                    activeCategory === tab.id
                      ? "bg-white text-indigo-900 shadow-2xs font-extrabold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Formulas List */}
          <div className="space-y-3">
            {filteredFormulas.map((formula) => {
              const isSelected = activeFormula?.id === formula.id;

              return (
                <div
                  key={formula.id}
                  onClick={() => setSelectedFormulaId(formula.id)}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-2 border-indigo-600 shadow-md ring-2 ring-indigo-500/10"
                      : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {formula.category.replace("_", " ")}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900">
                          {formula.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        Formula: {formula.summary}
                      </p>
                    </div>

                    <ChevronRight
                      className={`w-5 h-5 transition-transform ${
                        isSelected ? "rotate-90 text-indigo-600" : "text-slate-300"
                      }`}
                    />
                  </div>

                  {/* Formula Slots Visual Breakdown */}
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    {formula.formulaSlots.map((slot, idx) => (
                      <React.Fragment key={idx}>
                        <div
                          className={`px-3 py-1.5 rounded-xl border text-center ${slot.color} shadow-2xs`}
                        >
                          <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                            {slot.label}
                          </div>
                          <div className="text-xs font-black mt-0.5">
                            {slot.exampleTarget}
                          </div>
                          <div className="text-[9px] opacity-75">{slot.exampleEng}</div>
                        </div>
                        {idx < formula.formulaSlots.length - 1 && (
                          <span className="text-slate-300 font-bold text-xs">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Expanded Detail when Selected */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {formula.explanation}
                      </p>

                      <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs font-semibold flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{formula.keyRule}</span>
                      </div>

                      {/* Token-Aligned Example Sentences */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                          Aligned Example Sentences (Hover any word to highlight matching translation):
                        </span>

                        {formula.examples.map((ex, i) => (
                          <div
                            key={i}
                            className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2"
                          >
                            <AlignedTranslation
                              targetText={ex.target}
                              translationText={ex.translation}
                              targetLangCode={targetLang.code}
                              phonetic={ex.phonetic}
                              pronunciationAid={pronunciationAid}
                              structuralFormula={ex.breakdownNote}
                              idPrefix={`formula-${formula.id}-${i}`}
                              onSpeak={(text) => playTextAloud(text, targetLang.code)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Sentence Builder & AI Explainer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Interactive Word Order Puzzle / Builder */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Sentence Builder Puzzle
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Arrange tiles in correct {guide.langName} order
                  </p>
                </div>
              </div>

              {/* Challenge Selector */}
              {challenges.length > 1 && (
                <div className="flex items-center gap-1">
                  {challenges.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectChallenge(i)}
                      className={`w-6 h-6 rounded-full text-xs font-extrabold transition cursor-pointer ${
                        challengeIndex === i
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Instruction & Goal Translation */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800">
                {currentChallenge.instruction}
              </p>
              <div className="p-2.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-950 text-xs font-bold">
                Target Meaning: &ldquo;{currentChallenge.englishMeaning}&rdquo;
              </div>
            </div>

            {/* Placement Area (Active Assembled Sentence) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 min-h-[56px] flex items-center flex-wrap gap-2">
              {placedTiles.length === 0 ? (
                <span className="text-xs text-slate-400 font-medium italic">
                  Tap tiles below to assemble the sentence...
                </span>
              ) : (
                placedTiles.map((tile, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleTileClick(tile, true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-black text-xs shadow-xs hover:bg-indigo-700 active:scale-95 transition cursor-pointer"
                    title="Tap to remove"
                  >
                    {tile}
                  </button>
                ))
              )}
            </div>

            {/* Available Tiles Pool */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Available Word Tiles:
              </span>
              <div className="flex items-center flex-wrap gap-2">
                {availableTiles.map((tile, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleTileClick(tile, false)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-slate-900 font-extrabold text-xs shadow-2xs hover:bg-indigo-50/50 active:scale-95 transition cursor-pointer"
                  >
                    + {tile}
                  </button>
                ))}
              </div>
            </div>

            {/* Result & Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetBuilder}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleCheckBuilder}
                disabled={placedTiles.length === 0 || isBuilderSubmitted}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Check Order</span>
              </button>
            </div>

            {/* Builder Feedback */}
            {isBuilderSubmitted && (
              <div
                className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                  isBuilderCorrect
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                <div className="flex items-center gap-1.5 font-extrabold">
                  {isBuilderCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Perfect Word Order!</span>
                    </>
                  ) : (
                    <>
                      <span>❌ Incorrect Order</span>
                    </>
                  )}
                </div>
                <p className="leading-relaxed font-medium">
                  {currentChallenge.explanation}
                </p>
              </div>
            )}
          </div>

          {/* AI Pattern Explainer Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Ask AI About Any Sentence Pattern
                </h4>
                <p className="text-[10px] text-slate-400">
                  Instant breakdown for any grammar query in {guide.langName}
                </p>
              </div>
            </div>

            <form onSubmit={handleAskAiStructure} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder={`e.g. How do I ask 'where is' in ${guide.langName}?`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-16 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={isAiLoading || !aiQuery.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold disabled:opacity-50 transition cursor-pointer"
                >
                  {isAiLoading ? "..." : "Explain"}
                </button>
              </div>
            </form>

            {isAiLoading && (
              <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>Analyzing {guide.langName} structural blueprints...</span>
              </div>
            )}

            {aiExplanation && !isAiLoading && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-xs text-slate-800 space-y-1 leading-relaxed">
                <span className="font-extrabold text-indigo-900 block text-[11px]">
                  💡 Grammar Pattern Blueprint:
                </span>
                <p className="font-medium">{aiExplanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
