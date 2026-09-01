import React, { useState, useEffect } from "react";
import {
  VerbConjugationTable,
  ConjugationFormGroup,
  SupportedLanguage,
  Flashcard,
} from "../types";
import {
  COMMON_VERB_CONJUGATIONS,
  CONJUGATION_FORM_OPTIONS,
  generateLocalConjugation,
  IS_CONJUGATION_LANGUAGE,
} from "../data/conjugations";
import { createInitialSRS } from "../data/defaultDecks";
import { playTextAloud } from "../utils/speech";
import { formatPronunciation } from "../utils/pronunciation";
import { AiEngineBadge } from "./AiEngineBadge";
import {
  Volume2,
  Sparkles,
  Search,
  BookOpen,
  ChevronDown,
  Layers,
  CheckCircle2,
  Plus,
  RefreshCw,
  Info,
  ExternalLink,
  Table,
} from "lucide-react";

interface ConjugationLookupProps {
  initialVerb?: string;
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  isOnline?: boolean;
  onAddGrammarCard?: (card: Partial<Flashcard>) => void;
  onAddConjugationToDeck?: (card: Flashcard) => void;
  compact?: boolean;
  className?: string;
  pronunciationAid?: string;
}

export function ConjugationLookup({
  initialVerb = "",
  targetLang,
  knownLang,
  isOnline = true,
  onAddGrammarCard,
  onAddConjugationToDeck,
  compact = false,
  className = "",
  pronunciationAid = "none",
}: ConjugationLookupProps) {
  const [searchTerm, setSearchTerm] = useState(initialVerb);
  const [loading, setLoading] = useState(false);
  const [conjugationData, setConjugationData] = useState<VerbConjugationTable | null>(null);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [playingAudioKey, setPlayingAudioKey] = useState<string | null>(null);
  const [addedFormIds, setAddedFormIds] = useState<Record<string, boolean>>({});

  const isSupportedLanguage = IS_CONJUGATION_LANGUAGE[targetLang.code] ?? false;

  // Auto load verb if provided
  useEffect(() => {
    if (initialVerb && isSupportedLanguage) {
      setSearchTerm(initialVerb);
      handleLookup(initialVerb);
    }
  }, [initialVerb, targetLang.code]);

  const handleLookup = async (verbToLookup: string) => {
    const query = verbToLookup.trim();
    if (!query) return;

    setErrorMsg(null);
    setLoading(true);

    // 1. Try local instant database / heuristics first
    const localResult = generateLocalConjugation(query, targetLang.code);
    if (localResult) {
      setConjugationData(localResult);
      if (localResult.forms.length > 0) {
        setSelectedFormId(localResult.forms[0].id);
      }
      setLoading(false);
      return;
    }

    // 2. If online and not matched locally, call AI conjugation lookup
    if (isOnline) {
      try {
        const response = await fetch("/api/conjugation-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verb: query,
            targetLanguage: targetLang.name,
            targetLanguageCode: targetLang.code,
            knownLanguage: knownLang.name,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch conjugation paradigm");
        }

        const data: VerbConjugationTable = await response.json();
        setConjugationData(data);
        if (data.forms && data.forms.length > 0) {
          setSelectedFormId(data.forms[0].id);
        }
      } catch (err: any) {
        console.warn("Online conjugation lookup error:", err);
        // Fallback to basic local generator
        const fallback = generateLocalConjugation(query, targetLang.code);
        if (fallback) {
          setConjugationData(fallback);
          if (fallback.forms.length > 0) {
            setSelectedFormId(fallback.forms[0].id);
          }
        } else {
          setErrorMsg("Could not find conjugation paradigm for this term. Please verify spelling.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Offline fallback
      const fallback = generateLocalConjugation(query, targetLang.code);
      if (fallback) {
        setConjugationData(fallback);
        if (fallback.forms.length > 0) {
          setSelectedFormId(fallback.forms[0].id);
        }
      } else {
        setErrorMsg("Offline: Conjugation tables available for core regular & irregular verbs.");
      }
      setLoading(false);
    }
  };

  const handlePlaySound = (text: string, key: string) => {
    setPlayingAudioKey(key);
    playTextAloud(text, targetLang.speechLocale, () => {
      setPlayingAudioKey(null);
    });
  };

  const handleCreateGrammarCard = (formGroup: ConjugationFormGroup) => {
    if ((!onAddGrammarCard && !onAddConjugationToDeck) || !conjugationData) return;

    const sampleExamples = formGroup.entries
      .filter((e) => e.example)
      .slice(0, 3)
      .map((e) => ({
        target: e.example!.target,
        translation: e.example!.translation,
        phonetic: e.phonetic,
      }));

    const cardPayload: Partial<Flashcard> = {
      type: "grammar",
      targetItem: `${conjugationData.verb} — ${formGroup.name}`,
      targetLanguage: targetLang.name,
      knownLanguage: knownLang.name,
      partOfSpeech: "Verb Conjugation Paradigm",
      definition: `${formGroup.description}. Formula: ${formGroup.formula || "Standard inflection"}`,
      usageNotes: `Conjugation forms for "${conjugationData.verb}" (${conjugationData.translation}):\n` +
        formGroup.entries.map((e) => `• ${e.personOrForm}: ${e.conjugated} (${e.english || ""})`).join("\n"),
      examples: sampleExamples.length > 0 ? sampleExamples : [
        {
          target: `${formGroup.entries[0]?.conjugated || conjugationData.verb}`,
          translation: formGroup.entries[0]?.english || conjugationData.translation,
        },
      ],
      tags: ["conjugation", "grammar", formGroup.category || "verb-form"],
    };

    if (onAddGrammarCard) {
      onAddGrammarCard(cardPayload);
    }

    if (onAddConjugationToDeck) {
      const fullCard: Flashcard = {
        id: `conj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        deckId: "active-deck",
        type: "grammar",
        targetItem: `${conjugationData.verb} (${formGroup.name})`,
        targetLanguage: targetLang.name,
        knownLanguage: knownLang.name,
        frequencyRank: 99,
        partOfSpeech: "Verb Conjugation Paradigm",
        definition: `${formGroup.description}. Formula: ${formGroup.formula || "Standard inflection"}`,
        usageNotes: `Conjugation forms for "${conjugationData.verb}" (${conjugationData.translation}):\n` +
          formGroup.entries.map((e) => `• ${e.personOrForm}: ${e.conjugated} (${e.english || ""})`).join("\n"),
        examples: sampleExamples.length > 0 ? sampleExamples : [
          {
            target: `${formGroup.entries[0]?.conjugated || conjugationData.verb}`,
            translation: formGroup.entries[0]?.english || conjugationData.translation,
          },
        ],
        tags: ["conjugation", "grammar", formGroup.category || "verb-form"],
        srs: createInitialSRS(),
      };
      onAddConjugationToDeck(fullCard);
    }

    setAddedFormIds((prev) => ({ ...prev, [formGroup.id]: true }));
  };

  if (!isSupportedLanguage) {
    return (
      <div className={`p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2 ${className}`}>
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          {targetLang.name} is an analytical / non-inflectional language. Tense and aspect are marked by context and temporal particles rather than verb conjugations.
        </span>
      </div>
    );
  }

  const activeForm: ConjugationFormGroup | undefined =
    conjugationData?.forms.find((f) => f.id === selectedFormId) || conjugationData?.forms[0];

  return (
    <div
      id="conjugation-lookup-container"
      className={`bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden transition-all ${className}`}
    >
      {/* Header & Search Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-700 flex items-center justify-center font-bold text-sm">
              <Table className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                Verb Conjugation Lookup
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {targetLang.name}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Select any conjugation form/tense to explore inflection patterns, formulas, and examples.
              </p>
            </div>
          </div>

          {/* Quick verb search input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup(searchTerm);
            }}
            className="flex items-center gap-1.5 w-full sm:w-auto"
          >
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="conjugation-verb-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  targetLang.code === "es"
                    ? "e.g. hablar, ser, tener"
                    : targetLang.code === "ja"
                    ? "e.g. 話す, 食べる, 行く"
                    : "e.g. 하다, 가다, 먹다"
                }
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1 shrink-0"
            >
              {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Lookup"}
            </button>
          </form>
        </div>

        {/* Quick sample chips */}
        {!conjugationData && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-500 font-medium text-[11px]">Popular Verbs:</span>
            {targetLang.code === "es" &&
              ["hablar", "ser", "estar", "tener", "hacer", "ir", "poder", "vivir"].map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setSearchTerm(v);
                    handleLookup(v);
                  }}
                  className="px-2 py-0.5 text-[11px] font-medium bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-md border border-slate-200 transition-colors"
                >
                  {v}
                </button>
              ))}
            {targetLang.code === "ja" &&
              ["話す", "食べる", "行く", "する", "見る", "飲む", "書く"].map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setSearchTerm(v);
                    handleLookup(v);
                  }}
                  className="px-2 py-0.5 text-[11px] font-medium bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-md border border-slate-200 transition-colors"
                >
                  {v}
                </button>
              ))}
            {targetLang.code === "ko" &&
              ["하다", "가다", "오다", "먹다", "보다", "만나다", "배우다"].map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setSearchTerm(v);
                    handleLookup(v);
                  }}
                  className="px-2 py-0.5 text-[11px] font-medium bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-md border border-slate-200 transition-colors"
                >
                  {v}
                </button>
              ))}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-amber-50/70 border-b border-amber-100 text-xs text-amber-800 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Conjugation Body */}
      {conjugationData ? (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Verb Overview Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/40 border border-indigo-100/80 p-3.5 rounded-xl">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {conjugationData.verb}
                  </span>
                  <button
                    onClick={() => handlePlaySound(conjugationData.verb, "root-audio")}
                    className="p-1 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors"
                    title="Listen to pronunciation"
                  >
                    <Volume2 className={`w-4 h-4 ${playingAudioKey === "root-audio" ? "text-indigo-600 animate-pulse" : ""}`} />
                  </button>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    conjugationData.regularity === "regular"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : conjugationData.regularity === "irregular"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {conjugationData.regularity}
                  </span>
                  <AiEngineBadge
                    isFallback={conjugationData.isFallback}
                    engineSource={conjugationData.engineSource}
                    modelUsed={conjugationData.modelUsed}
                    compact
                  />
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  <span className="font-semibold text-slate-800">Meaning:</span> {conjugationData.translation}
                  {conjugationData.stemNotes && (
                    <span className="text-slate-500 ml-2 italic">({conjugationData.stemNotes})</span>
                  )}
                </p>
              </div>
            </div>

            {/* Dropdown Selector for Conjugation Form */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <label htmlFor="conjugation-form-select" className="text-xs font-bold text-slate-600 whitespace-nowrap">
                Select Form:
              </label>
              <div className="relative">
                <select
                  id="conjugation-form-select"
                  value={activeForm?.id || ""}
                  onChange={(e) => setSelectedFormId(e.target.value)}
                  className="appearance-none bg-white text-slate-900 font-semibold text-xs py-2 pl-3 pr-8 rounded-xl border border-slate-300 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer min-w-[200px]"
                >
                  {conjugationData.forms.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active Selected Form Paradigm View */}
          {activeForm && (
            <div className="space-y-4">
              {/* Form Info Box */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {activeForm.name}
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700">
                      {activeForm.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {activeForm.description}
                  </p>
                  {activeForm.formula && (
                    <p className="text-[11px] font-mono text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md inline-block border border-indigo-100/60 mt-1">
                      Formula: {activeForm.formula}
                    </p>
                  )}
                </div>

                {onAddGrammarCard && (
                  <button
                    onClick={() => handleCreateGrammarCard(activeForm)}
                    disabled={addedFormIds[activeForm.id]}
                    className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                      addedFormIds[activeForm.id]
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-300 shadow-2xs"
                    }`}
                  >
                    {addedFormIds[activeForm.id] ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Added to Deck</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Concept to Deck</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Conjugation Entries Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {activeForm.entries.map((entry, idx) => {
                  const entryAudioKey = `entry-${activeForm.id}-${idx}`;
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white hover:bg-slate-50/60 border border-slate-200 rounded-xl transition-all space-y-1.5 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                          {entry.personOrForm}
                        </span>
                        <button
                          onClick={() => handlePlaySound(entry.conjugated, entryAudioKey)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors"
                          title="Listen"
                        >
                          <Volume2
                            className={`w-3.5 h-3.5 ${
                              playingAudioKey === entryAudioKey ? "text-indigo-600 animate-pulse" : ""
                            }`}
                          />
                        </button>
                      </div>

                      <div>
                        <span className="text-base font-bold text-slate-900 font-sans tracking-tight">
                          {entry.conjugated}
                        </span>
                        {entry.phonetic && formatPronunciation(entry.conjugated, entry.phonetic, targetLang.code, pronunciationAid) && (
                          <span className="text-[11px] text-indigo-600 font-mono ml-1.5">
                            [{formatPronunciation(entry.conjugated, entry.phonetic, targetLang.code, pronunciationAid)}]
                          </span>
                        )}
                        {entry.english && (
                          <p className="text-xs text-slate-600 font-medium">
                            {entry.english}
                          </p>
                        )}
                      </div>

                      {entry.example && (
                        <div className="pt-2 mt-1 border-t border-slate-100 text-[11px] space-y-0.5">
                          <p className="font-semibold text-slate-800 flex items-center justify-between">
                            <span>{entry.example.target}</span>
                            <button
                              onClick={() => handlePlaySound(entry.example!.target, `example-${activeForm.id}-${idx}`)}
                              className="text-slate-400 hover:text-indigo-600"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                          </p>
                          <p className="text-slate-500 italic">
                            {entry.example.translation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Form Switcher Pills */}
              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  All Available Conjugation Forms:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {conjugationData.forms.map((form) => (
                    <button
                      key={form.id}
                      onClick={() => setSelectedFormId(form.id)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                        form.id === activeForm.id
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                          : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      {form.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-sm font-bold text-slate-900">
              Interactive Conjugation Explorer
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Search for any verb above or click on one of the popular verbs to view its complete conjugation breakdown across moods and tenses.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
