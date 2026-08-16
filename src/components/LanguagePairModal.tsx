import React, { useState, useEffect } from "react";
import { SupportedLanguage, Deck } from "../types";
import {
  SUPPORTED_TARGET_LANGUAGES,
  SUPPORTED_KNOWN_LANGUAGES,
  getLanguageByCode,
} from "../data/languages";
import {
  Languages,
  X,
  Check,
  Sparkles,
  BookOpen,
  GraduationCap,
  ArrowRight,
  Plus,
} from "lucide-react";

interface LanguagePairModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  allDecks: Deck[];
  activeDeckId: string;
  onSelectLanguagePair: (targetCode: string, knownCode: string) => void;
  onOpenGenerateModal: () => void;
  onSelectDeck: (deck: Deck) => void;
  onOpenPlacementModal?: () => void;
}

export const LanguagePairModal: React.FC<LanguagePairModalProps> = ({
  isOpen,
  onClose,
  targetLang,
  knownLang,
  allDecks,
  activeDeckId,
  onSelectLanguagePair,
  onOpenGenerateModal,
  onSelectDeck,
  onOpenPlacementModal,
}) => {
  const [selectedTarget, setSelectedTarget] = useState(targetLang.code);
  const [selectedKnown, setSelectedKnown] = useState(knownLang.code);

  // Sync state whenever modal opens or props update
  useEffect(() => {
    if (isOpen) {
      setSelectedTarget(targetLang.code);
      setSelectedKnown(knownLang.code);
    }
  }, [isOpen, targetLang.code, knownLang.code]);

  if (!isOpen) return null;

  const targetLangObj = getLanguageByCode(selectedTarget);
  const knownLangObj = getLanguageByCode(selectedKnown);

  // Find all decks matching this target language (or target+known pair)
  const matchingDecks = allDecks.filter(
    (d) => d.targetLangCode === selectedTarget
  );

  const handleApply = () => {
    // 1-step apply: immediately apply the language pair and pick the best deck
    onSelectLanguagePair(selectedTarget, selectedKnown);
    onClose();
  };

  const handleDeckClick = (deck: Deck) => {
    onSelectDeck(deck);
    onSelectLanguagePair(deck.targetLangCode, deck.knownLangCode);
    onClose();
  };

  return (
    <div
      id="language-pair-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur flex items-center justify-center p-4"
    >
      <div
        id="language-pair-modal-container"
        className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5 relative text-slate-900 max-h-[90vh] flex flex-col"
      >
        {/* Close Button */}
        <button
          id="close-lang-modal-btn"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Language & Deck Switcher
              </h3>
              <p className="text-xs text-slate-500">
                Pick your learning language and activate a curriculum deck in 1 click.
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
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
                const deckCount = allDecks.filter(
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

          {/* 3. Available Decks for Selected Target Language */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-600 font-bold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Available Decks for {targetLangObj.name}</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                Click any deck to activate
              </span>
            </div>

            {matchingDecks.length > 0 ? (
              <div className="space-y-2">
                {matchingDecks.map((d) => {
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
                          ? "bg-indigo-50/80 border-indigo-500 shadow-xs ring-1 ring-indigo-500/20"
                          : "bg-slate-50 hover:bg-indigo-50/40 border-slate-200 hover:border-indigo-300 text-slate-800"
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 truncate">
                            {d.title}
                          </span>
                          {isActive && (
                            <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {d.description}
                        </p>
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
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-center space-y-1">
                <p className="font-bold text-xs">
                  No local decks found for {targetLangObj.name} yet.
                </p>
                <p className="text-[11px] text-amber-700">
                  Click below to generate a frequency deck with AI in 5 seconds!
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions (AI Deck Generator & Diagnostic Placement) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              id="modal-gen-deck-btn"
              type="button"
              onClick={() => {
                onClose();
                onOpenGenerateModal();
              }}
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
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
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
            onClick={handleApply}
            className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition cursor-pointer flex items-center gap-2"
          >
            <span>Switch to {targetLangObj.name}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
