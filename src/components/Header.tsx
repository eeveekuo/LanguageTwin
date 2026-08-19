import React, { useState, useRef, useEffect } from "react";
import { SupportedLanguage, Deck, DailyProgress } from "../types";
import { LanguageTwinLogo } from "./LanguageTwinLogo";
import { PronunciationAidSelector } from "./PronunciationAidSelector";
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
  ChevronDown,
  Cloud,
  LogOut,
  User as UserIcon,
  RefreshCw,
  PenTool,
  Compass,
} from "lucide-react";

interface HeaderProps {
  activeTab: "study" | "grammar" | "deck" | "reading" | "journal" | "tutor" | "translate" | "stats";
  setActiveTab: (tab: "study" | "grammar" | "deck" | "reading" | "journal" | "tutor" | "translate" | "stats") => void;
  activeDeck: Deck;
  allDecks?: Deck[];
  onSelectDeck?: (deck: Deck) => void;
  targetLang: SupportedLanguage;
  knownLang: SupportedLanguage;
  onOpenLanguageModal: () => void;
  onOpenGenerateModal: () => void;
  onOpenPlacementModal?: () => void;
  dueCount: number;
  dailyProgress: DailyProgress;
  activeErrorsCount?: number;
  isOnline?: boolean;
  currentUser?: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  onSignInWithGoogle?: () => void;
  onSignOut?: () => void;
  isSyncing?: boolean;
  pronunciationAid: string;
  onChangePronunciationAid: (aidId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeDeck,
  allDecks = [],
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
  currentUser,
  onSignInWithGoogle,
  onSignOut,
  isSyncing = false,
  pronunciationAid,
  onChangePronunciationAid,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const dailyPercent = Math.min(
    100,
    Math.round((dailyProgress.reviewedToday / dailyProgress.target) * 100)
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

                {/* Connectivity Badge */}
                {isOnline ? (
                  <span
                    className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                    title="Online: AI Evaluation, Cloud Sync & Shared Decks active"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Online</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200"
                    title="Offline Mode: Previously studied decks cached locally"
                  >
                    <WifiOff className="w-3 h-3 text-amber-600" />
                    <span>Offline</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Language Pair Selector (Deck is selected via the Deck tab) */}
          <div className="hidden md:flex items-center gap-2">
            <button
              id="header-lang-btn"
              type="button"
              onClick={onOpenLanguageModal}
              className="group flex items-center bg-slate-50 hover:bg-slate-100/90 text-slate-800 rounded-full px-3.5 py-1.5 border border-slate-200 shadow-xs gap-2 text-xs transition cursor-pointer"
              title="Click to adjust learning or source language"
            >
              <Languages className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              {/* Language Pair */}
              <div className="flex items-center gap-1.5 font-semibold">
                <span className="text-slate-400 text-[11px] font-medium">
                  Learning
                </span>
                <span className="text-slate-900 font-bold flex items-center gap-1">
                  <span>{targetLang.flag}</span>
                  <span>{targetLang.name}</span>
                </span>
                <span className="text-slate-300 font-normal">·</span>
                <span className="text-slate-400 text-[11px] font-medium">
                  From
                </span>
                <span className="text-slate-900 font-bold flex items-center gap-1">
                  <span>{knownLang.flag}</span>
                  <span>{knownLang.name}</span>
                </span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition shrink-0" />
            </button>

            {/* Pronunciation Aid Dropdown */}
            <PronunciationAidSelector
              langCode={targetLang.code}
              langName={targetLang.name}
              currentAid={pronunciationAid}
              onChangeAid={onChangePronunciationAid}
            />
          </div>

          {/* Right Actions: Daily Goal, Due Badge & Google Auth */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Mobile Pronunciation Aid */}
            <div className="md:hidden">
              <PronunciationAidSelector
                langCode={targetLang.code}
                langName={targetLang.name}
                currentAid={pronunciationAid}
                onChangeAid={onChangePronunciationAid}
                variant="compact"
              />
            </div>

            {/* Top-Level Mastery & Progress Button */}
            <button
              id="top-mastery-btn"
              type="button"
              onClick={() => setActiveTab("stats")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shadow-2xs border ${
                activeTab === "stats"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-100"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
              title="View Standardized Mastery, CEFR Level, SRS Brackets & Daily Practice Activity Logs"
            >
              <BarChart3 className={`w-3.5 h-3.5 ${activeTab === "stats" ? "text-white" : "text-indigo-600"}`} />
              <span>Mastery</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === "stats" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
              }`}>
                {dailyProgress.streak}🔥
              </span>
            </button>

            {/* Daily Goal Pill */}
            <div
              onClick={() => setActiveTab("stats")}
              className="hidden lg:flex items-center bg-indigo-50/80 hover:bg-indigo-100 text-indigo-800 rounded-full px-3.5 py-1.5 border border-indigo-100 shadow-xs gap-2 text-xs font-bold transition cursor-pointer"
              title="Daily Target Progress - Click to view detailed activity breakdown"
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

            {/* Due items counter */}
            {dueCount > 0 && (
              <div className="flex items-center bg-orange-50 text-orange-700 rounded-full px-2.5 sm:px-3 py-1.5 border border-orange-200 shadow-xs gap-1.5 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span>{dueCount} Due</span>
              </div>
            )}

            {/* Mobile Lang Button */}
            <button
              onClick={onOpenLanguageModal}
              className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-bold cursor-pointer"
              title="Language & Deck Hub"
            >
              <span>{targetLang.flag}</span>
              <span className="truncate max-w-[70px]">{targetLang.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Google Account Authentication & Sync Pill */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  id="user-profile-menu-btn"
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 sm:pr-3 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-xs transition cursor-pointer shadow-2xs"
                  title={`Signed in as ${currentUser.displayName || currentUser.email}`}
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || "User"}
                      className="w-7 h-7 rounded-full object-cover border border-slate-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                      {currentUser.displayName
                        ? currentUser.displayName.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                  )}

                  <div className="hidden sm:block text-left">
                    <div className="font-bold text-slate-900 text-xs truncate max-w-[100px]">
                      {currentUser.displayName || "Learner"}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                      {isSyncing ? (
                        <>
                          <RefreshCw className="w-2.5 h-2.5 animate-spin text-indigo-600" />
                          <span className="text-indigo-600">Syncing...</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="w-2.5 h-2.5 text-emerald-500" />
                          <span>Cloud Synced</span>
                        </>
                      )}
                    </div>
                  </div>

                  <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 space-y-2 text-xs">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt="Avatar"
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                          {currentUser.displayName?.charAt(0) || "U"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {currentUser.displayName || "Google User"}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {currentUser.email}
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1 text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Sync status:</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <Cloud className="w-3 h-3" />
                          <span>Active (Firestore)</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Your spaced repetition queue, daily progress, and custom decks are backed up to the cloud.
                      </p>
                    </div>

                    <button
                      id="google-sign-out-btn"
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        if (onSignOut) onSignOut();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="google-login-btn"
                type="button"
                onClick={onSignInWithGoogle}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-bold shadow-2xs transition cursor-pointer hover:border-slate-300"
                title="Sign in with Google to sync your study progress and save decks"
              >
                {/* Official Google G icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">Sign in with Google</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Practice Mechanisms) */}
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
            id="tab-grammar"
            onClick={() => setActiveTab("grammar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition whitespace-nowrap cursor-pointer ${
              activeTab === "grammar"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Sentence Structure</span>
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
            id="tab-translate"
            onClick={() => setActiveTab("translate")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition whitespace-nowrap cursor-pointer ${
              activeTab === "translate"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>Translate & Explain</span>
          </button>

          <button
            id="tab-journal"
            onClick={() => setActiveTab("journal")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition whitespace-nowrap cursor-pointer ${
              activeTab === "journal"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Language Journal</span>
          </button>
        </div>
      </div>
    </header>
  );
};
