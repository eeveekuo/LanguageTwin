import React from "react";
import { SupportedLanguage, Deck, DailyProgress } from "../types";
import { LanguageTwinLogo } from "./LanguageTwinLogo";
import {
  GraduationCap,
  Layers,
  Bot,
  BarChart3,
  Sparkles,
  Languages,
  Plus,
  Volume2,
  Flame,
  Target,
  AlertTriangle,
  Wifi,
  WifiOff,
  Headphones,
  BookOpen,
} from "lucide-react";

interface HeaderProps {
  activeTab: "study" | "deck" | "reading" | "tutor" | "stats";
  setActiveTab: (tab: "study" | "deck" | "reading" | "tutor" | "stats") => void;
  activeDeck: Deck;
  allDecks: Deck[];
  onSelectDeck: (deck: Deck) => void;
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  onOpenLanguageModal: () => void;
  onOpenGenerateModal: () => void;
  onOpenPlacementModal?: () => void;
  dueCount: number;
  dailyProgress: DailyProgress;
  activeErrorsCount?: number;
  isOnline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeDeck,
  allDecks,
  onSelectDeck,
  targetLang,
  knownLang,
  onOpenLanguageModal,
  onOpenGenerateModal,
  onOpenPlacementModal,
  dueCount,
  dailyProgress,
  activeErrorsCount = 0,
  isOnline = true,
}) => {
  const dailyPercent = Math.min(100, Math.round((dailyProgress.reviewedToday / dailyProgress.target) * 100));

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <LanguageTwinLogo className="w-10 h-10" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  Language<span className="text-indigo-600">Twin</span>
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  SRS Twin
                </span>
                
                {/* Connectivity Badge */}
                {isOnline ? (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                    title="Online: AI Sentence Evaluation, Tutor & Deck Synthesis active"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Online</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200"
                    title="Offline Mode: Previously studied decks & self-reported recall cached locally"
                  >
                    <WifiOff className="w-3 h-3 text-amber-600" />
                    <span>Offline Mode</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Active Sentence Production & Frequency Progression
              </p>
            </div>
          </div>

          {/* Language Pair Selector & Deck Switcher */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center bg-slate-50 rounded-full px-4 py-1.5 border border-slate-200 shadow-xs gap-2 text-xs font-medium">
              <span className="text-slate-400">Learning</span>
              <span className="text-slate-900 font-bold uppercase flex items-center gap-1">
                <span>{targetLang.flag}</span>
                <span>{targetLang.name}</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-400">From</span>
              <span className="text-slate-900 font-bold uppercase flex items-center gap-1">
                <span>{knownLang.flag}</span>
                <span>{knownLang.name}</span>
              </span>
              <button
                onClick={onOpenLanguageModal}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition ml-0.5 cursor-pointer"
                title="Change language pair"
              >
                <Languages className="w-3.5 h-3.5 text-indigo-600" />
              </button>
            </div>

            {/* Deck selector dropdown */}
            <div className="flex items-center bg-white rounded-full px-3 py-1.5 border border-slate-200 shadow-xs text-xs font-medium text-slate-700">
              <select
                id="deck-selector"
                value={activeDeck.id}
                onChange={(e) => {
                  const found = allDecks.find((d) => d.id === e.target.value);
                  if (found) onSelectDeck(found);
                }}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer max-w-[180px] truncate"
              >
                {allDecks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.cards.length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Daily Goal & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Daily Goal Pill */}
            <div
              onClick={() => setActiveTab("stats")}
              className="hidden sm:flex items-center bg-indigo-50/80 hover:bg-indigo-100 text-indigo-800 rounded-full px-3.5 py-1.5 border border-indigo-100 shadow-xs gap-2 text-xs font-bold transition cursor-pointer"
              title="Daily Target Progress - Click to view analytics"
            >
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {dailyProgress.reviewedToday}/{dailyProgress.target} Goal
              </span>
              <div className="w-8 bg-indigo-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${dailyPercent}%` }}
                />
              </div>
            </div>

            {/* Due items counter (Streak removed per request) */}
            {dueCount > 0 && (
              <div className="flex items-center bg-orange-50 text-orange-700 rounded-full px-3 py-1.5 border border-orange-200 shadow-xs gap-1.5 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span>{dueCount} Due</span>
              </div>
            )}

            {/* Language Level Test Button */}
            {onOpenPlacementModal && (
              <button
                id="header-level-test-btn"
                onClick={() => {
                  if (isOnline) {
                    onOpenPlacementModal();
                  }
                }}
                disabled={!isOnline}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition ${
                  isOnline
                    ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 active:scale-95 cursor-pointer"
                    : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                }`}
                title={
                  isOnline
                    ? "Evaluate Language Level & Calibrate Decks"
                    : "Requires online connection to work (AI placement testing requires network)"
                }
              >
                <GraduationCap className={`w-3.5 h-3.5 ${isOnline ? "text-indigo-600" : "text-slate-400"}`} />
                <span>Level Test</span>
              </button>
            )}

            <button
              id="header-generate-deck-btn"
              onClick={() => {
                if (isOnline) {
                  onOpenGenerateModal();
                }
              }}
              disabled={!isOnline}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition shadow-xs ${
                isOnline
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 active:scale-95 cursor-pointer"
                  : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60"
              }`}
              title={
                isOnline
                  ? "AI Deck Generator"
                  : "Requires online connection to work (AI deck synthesis requires network)"
              }
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Deck Generator</span>
              <span className="sm:hidden">New Deck</span>
            </button>

            {/* Mobile Lang Button */}
            <button
              onClick={onOpenLanguageModal}
              className="lg:hidden p-2 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer"
              title="Language Settings"
            >
              <Languages className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 py-2.5 border-t border-slate-100 overflow-x-auto no-scrollbar text-xs sm:text-sm font-semibold">
          <button
            id="tab-study"
            onClick={() => setActiveTab("study")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition whitespace-nowrap cursor-pointer ${
              activeTab === "study"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Active Study</span>
            {dueCount > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === "study"
                    ? "bg-white text-indigo-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {dueCount}
              </span>
            )}
          </button>

          <button
            id="tab-reading"
            onClick={() => setActiveTab("reading")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition whitespace-nowrap cursor-pointer ${
              activeTab === "reading"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Reading & Listening</span>
          </button>

          <button
            id="tab-deck"
            onClick={() => setActiveTab("deck")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition whitespace-nowrap cursor-pointer ${
              activeTab === "deck"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Deck ({activeDeck.cards.length})</span>
          </button>

          <button
            id="tab-tutor"
            onClick={() => {
              if (isOnline) {
                setActiveTab("tutor");
              }
            }}
            disabled={!isOnline}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition whitespace-nowrap ${
              !isOnline
                ? "text-slate-400 bg-slate-100/70 border border-slate-200 cursor-not-allowed opacity-60"
                : activeTab === "tutor"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 cursor-pointer"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            }`}
            title={
              isOnline
                ? "Conversation - Natural conversational practice & grammar evaluation"
                : "Requires online connection to work (AI conversation requires network)"
            }
          >
            <Bot className="w-4 h-4" />
            <span>Conversation</span>
            {!isOnline && (
              <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-slate-200 text-slate-500">
                Online Only
              </span>
            )}
          </button>

          <button
            id="tab-stats"
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition whitespace-nowrap cursor-pointer ${
              activeTab === "stats"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Mastery & Level</span>
          </button>
        </div>
      </div>
    </header>
  );
};

