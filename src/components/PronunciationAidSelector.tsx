/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  getPronunciationOptions,
  PronunciationOption,
} from "../utils/pronunciation";
import { Volume2, ChevronDown, Check, Sparkles, EyeOff, Languages } from "lucide-react";

interface PronunciationAidSelectorProps {
  langCode: string;
  langName: string;
  currentAid: string;
  onChangeAid: (aidId: string) => void;
  variant?: "header" | "inline" | "compact";
  className?: string;
}

export const PronunciationAidSelector: React.FC<PronunciationAidSelectorProps> = ({
  langCode,
  langName,
  currentAid,
  onChangeAid,
  variant = "header",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = getPronunciationOptions(langCode);
  const activeOption =
    options.find((o) => o.id === currentAid) ||
    options[0] || {
      id: "none",
      label: "None",
      shortLabel: "None",
      badge: "Off",
      description: "Hide pronunciation aids",
    };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isNone = activeOption.id === "none";

  if (variant === "compact") {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
            isNone
              ? "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
              : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
          }`}
          title={`Pronunciation Aid: ${activeOption.label}`}
        >
          {isNone ? (
            <EyeOff className="w-3 h-3 text-slate-400" />
          ) : (
            <span className="text-[10px] px-1 py-0.2 bg-indigo-200/70 text-indigo-900 rounded font-black">
              {activeOption.badge}
            </span>
          )}
          <span>{activeOption.shortLabel}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-1 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 space-y-1 text-xs">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {langName} Pronunciation Aid
            </div>
            {options.map((option) => {
              const isSelected = option.id === currentAid;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChangeAid(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-900 font-bold"
                      : "text-slate-700 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                        option.id === "none"
                          ? "bg-slate-100 text-slate-500"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {option.badge}
                    </span>
                    <span>{option.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        id="pronunciation-aid-dropdown-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 rounded-full px-3 py-1.5 border shadow-2xs text-xs transition cursor-pointer ${
          isNone
            ? "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
            : "bg-indigo-50/70 hover:bg-indigo-100/90 text-indigo-900 border-indigo-200/90"
        }`}
        title={`Configure pronunciation and romanization aid for ${langName} (Zhuyin, Pinyin, Furigana, etc.)`}
      >
        <div className="flex items-center gap-1.5">
          {isNone ? (
            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-600 text-white rounded-md font-black tracking-tight leading-none shadow-2xs">
              {activeOption.badge}
            </span>
          )}
          <div className="text-left font-bold flex items-center gap-1">
            <span className="text-[11px] text-slate-400 font-normal hidden lg:inline">Aid:</span>
            <span>{activeOption.shortLabel}</span>
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2.5 z-50 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800 uppercase tracking-wider">
              <Languages className="w-3.5 h-3.5 text-indigo-600" />
              <span>{langName} Pronunciation Aid</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Dropdown</span>
          </div>

          <div className="space-y-1 pt-1">
            {options.map((option) => {
              const isSelected = option.id === currentAid;
              return (
                <button
                  key={option.id}
                  id={`pronunciation-opt-${option.id}`}
                  type="button"
                  onClick={() => {
                    onChangeAid(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 border border-indigo-200 text-indigo-950"
                      : "hover:bg-slate-50 border border-transparent text-slate-800"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-black inline-block ${
                        option.id === "none"
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {option.badge}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${isSelected ? "font-black" : "font-bold"}`}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-1.5" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Info Footer */}
          <div className="pt-2 border-t border-slate-100 px-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>Instant sync across all cards & exercises</span>
          </div>
        </div>
      )}
    </div>
  );
};
