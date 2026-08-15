import React, { useState } from "react";
import { SupportedLanguage, Deck } from "../types";
import {
  SUPPORTED_TARGET_LANGUAGES,
  SUPPORTED_KNOWN_LANGUAGES,
  getLanguageByCode,
} from "../data/languages";
import { Languages, X, Check, Sparkles, BookOpen } from "lucide-react";

interface LanguagePairModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  allDecks: Deck[];
  onSelectLanguagePair: (targetCode: string, knownCode: string) => void;
  onOpenGenerateModal: () => void;
  onSelectDeck: (deck: Deck) => void;
}

export const LanguagePairModal: React.FC<LanguagePairModalProps> = ({
  isOpen,
  onClose,
  targetLang,
  knownLang,
  allDecks,
  onSelectLanguagePair,
  onOpenGenerateModal,
  onSelectDeck,
}) => {
  const [selectedTarget, setSelectedTarget] = useState(targetLang.code);
  const [selectedKnown, setSelectedKnown] = useState(knownLang.code);

  if (!isOpen) return null;

  const handleApply = () => {
    onSelectLanguagePair(selectedTarget, selectedKnown);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative text-slate-900">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Languages className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Language Pair Settings
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Configure your target learning language and known reference language for definitions and sentence evaluation.
          </p>
        </div>

        {/* Pair Config */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-500 font-bold block mb-1.5">
              1. Target Language (The language you are learning)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUPPORTED_TARGET_LANGUAGES.map((l) => {
                const isSelected = selectedTarget === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setSelectedTarget(l.code)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-600 text-indigo-900 font-bold shadow-xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{l.flag}</span>
                      <span>{l.name}</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-slate-500 font-bold block mb-1.5">
              2. Known / Native Language (Definitions & Feedback)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_KNOWN_LANGUAGES.map((l) => {
                const isSelected = selectedKnown === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setSelectedKnown(l.code)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-600 text-indigo-900 font-bold shadow-xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{l.flag}</span>
                      <span>{l.name} ({l.nativeName})</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Deck Switcher for Matching Target Language */}
          <div className="pt-1">
            <label className="text-slate-500 font-bold block mb-1.5">
              Available Decks for {getLanguageByCode(selectedTarget).name}
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {allDecks
                .filter((d) => d.targetLangCode === selectedTarget)
                .map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      onSelectDeck(d);
                      onSelectLanguagePair(d.targetLangCode, d.knownLangCode);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 text-left flex items-center justify-between text-xs text-slate-800 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span>{d.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-bold">{d.cards.length} cards</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Generate Custom Deck Link */}
          <div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenGenerateModal();
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-2 border border-indigo-100 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate AI Frequency Deck for this pair</span>
            </button>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="apply-lang-pair-btn"
              type="button"
              onClick={handleApply}
              className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100 transition cursor-pointer"
            >
              Apply Language Pair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
