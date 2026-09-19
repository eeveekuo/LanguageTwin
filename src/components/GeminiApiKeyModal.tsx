/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Key,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  ExternalLink,
  Trash2,
  RefreshCw,
  X,
  UserCheck,
} from "lucide-react";
import {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  maskApiKey,
  validateGeminiKeyFormat,
} from "../utils/geminiApiKey";
import { saveUserGeminiApiKey } from "../lib/firebase";

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    uid?: string;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  onApiKeyChanged?: (newKey: string | null) => void;
  promptMessage?: string | null;
}

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onApiKeyChanged,
  promptMessage,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Target account identification
  const effectiveEmail = currentUser?.email || "evelynkuoev@gmail.com";
  const effectiveName = currentUser?.displayName || "Evelyn Kuo";

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredGeminiApiKey(effectiveEmail);
      setActiveKey(stored);
      setApiKeyInput(stored || "");
      setTestResult(null);
      setNotification(null);
    }
  }, [isOpen, effectiveEmail]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    const keyToTest = apiKeyInput.trim();
    if (!keyToTest) {
      setTestResult({
        success: false,
        message: "Please enter an API key to test.",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/test-gemini-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": keyToTest,
        },
        body: JSON.stringify({ geminiApiKey: keyToTest }),
      });

      const data = await response.json();
      if (response.ok && data.ok) {
        setTestResult({
          success: true,
          message: "Connection verified! Key has full Gemini API access.",
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Verification failed. Please check the key.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to reach server to test key.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveKey = async () => {
    const keyToSave = apiKeyInput.trim();
    if (!keyToSave) {
      setNotification({
        type: "error",
        text: "Please enter your Gemini API key. AI requests cannot be made without a key.",
      });
      return;
    }

    if (!validateGeminiKeyFormat(keyToSave)) {
      setNotification({
        type: "error",
        text: "Please enter a valid Google Gemini API key (starts with 'AIzaSy' and is ~39 characters).",
      });
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save to local storage for instant sync and Evelyn Kuo profile
      setStoredGeminiApiKey(keyToSave, {
        email: effectiveEmail,
        displayName: effectiveName,
      });

      // 2. Save to Firestore if user is authenticated
      if (currentUser?.uid) {
        await saveUserGeminiApiKey(currentUser.uid, keyToSave);
      }

      setActiveKey(keyToSave);
      if (onApiKeyChanged) {
        onApiKeyChanged(keyToSave);
      }

      setNotification({
        type: "success",
        text: `Gemini API key saved and activated for ${effectiveEmail}! AI features unlocked.`,
      });

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Failed to save Gemini key:", err);
      setNotification({
        type: "error",
        text: "Could not save to cloud profile. Key is saved locally on this browser.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveKey = async () => {
    setApiKeyInput("");
    setIsSaving(true);
    try {
      setStoredGeminiApiKey(null, {
        email: effectiveEmail,
        displayName: effectiveName,
      });

      if (currentUser?.uid) {
        await saveUserGeminiApiKey(currentUser.uid, null);
      }

      setActiveKey(null);
      if (onApiKeyChanged) {
        onApiKeyChanged(null);
      }

      setNotification({
        type: "error",
        text: "Personal API key removed. AI features are now locked until a key is added.",
      });
      setTestResult(null);
    } catch (err: any) {
      console.error("Failed to remove Gemini key:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="gemini-api-key-modal"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Personal Gemini API Key
              </h2>
              <p className="text-xs text-slate-500">
                Required for all AI generation, tutoring, and evaluations
              </p>
            </div>
          </div>
          <button
            id="close-api-key-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* User-Facing Error Prompt If Triggered By Blocked Feature */}
          {promptMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5 text-xs animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-800">AI Request Blocked</div>
                <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                  {promptMessage}
                </p>
              </div>
            </div>
          )}

          {/* User Account Association Pill */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100/80 flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="min-w-0 text-xs text-indigo-950">
              <div className="font-bold flex items-center gap-2">
                <span>Associated User:</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-semibold text-[11px]">
                  {effectiveName}
                </span>
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5 truncate">
                Account: {effectiveEmail}
              </p>
              <p className="text-indigo-600/90 text-[11px] mt-1">
                Your key is associated with your account profile so all AI tutoring, deck generation, and placement evaluations use your private quota.
              </p>
            </div>
          </div>

          {/* Current Status - No Shared Key Option */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
              activeKey
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-rose-200 bg-rose-50/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeKey ? "bg-emerald-500" : "bg-rose-500 animate-pulse"
                }`}
              />
              <span
                className={`font-bold ${
                  activeKey ? "text-emerald-950" : "text-rose-950"
                }`}
              >
                {activeKey ? "Personal API Key Active" : "No API Key Configured (Required)"}
              </span>
            </div>
            {activeKey ? (
              <span className="font-mono text-[11px] text-emerald-800 bg-white px-2 py-1 rounded-md border border-emerald-200 shadow-2xs">
                {maskApiKey(activeKey)}
              </span>
            ) : (
              <span className="text-rose-700 text-[11px] font-bold">
                AI Requests Disabled
              </span>
            )}
          </div>

          {/* Explicit Key Requirement Notice */}
          {!activeKey && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No Shared Server Key Available</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                To guarantee isolated rate limits and prevent shared quota throttling, <strong>no Gemini requests can be made until your personal key is configured</strong>. Free keys can be created in seconds from Google AI Studio.
              </p>
            </div>
          )}

          {/* Key Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="gemini-api-key-input"
                className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
              >
                <span>Google Gemini API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Get key from Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                id="gemini-api-key-input"
                type={showKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setTestResult(null);
                  setNotification(null);
                }}
                placeholder="AIzaSy..."
                className="w-full pl-3 pr-24 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showKey ? "Hide API key" : "Show API key"}
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTesting || !apiKeyInput.trim()}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-semibold text-[11px] transition cursor-pointer disabled:opacity-40"
                  title="Test connectivity to Gemini"
                >
                  {isTesting ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    "Test"
                  )}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Keys begin with <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">AIzaSy</code>. Keys are sent securely to the server proxy for Gemini requests and never exposed to other learners.
            </p>
          </div>

          {/* Test Result Indicator */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              )}
              <div className="text-[11px]">
                <span className="font-bold">
                  {testResult.success ? "Success: " : "Error: "}
                </span>
                <span>{testResult.message}</span>
              </div>
            </div>
          )}

          {/* Notification Toast */}
          {notification && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                notification.type === "success"
                  ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-indigo-600" />
              <span className="font-medium text-[11px]">
                {notification.text}
              </span>
            </div>
          )}

          {/* Security & Privacy Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>How your key is handled</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-500">
              <li>Stored in your private Firestore user record with strict ownership security rules.</li>
              <li>Sent server-side to execute Gemini AI operations through the secure backend proxy.</li>
              <li>Guarantees dedicated Gemini API rate limits with zero throttling from other users.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <div>
            {activeKey && (
              <button
                id="remove-api-key-btn"
                type="button"
                onClick={handleRemoveKey}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Key</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="cancel-api-key-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              {activeKey ? "Close" : "Cancel (AI Disabled)"}
            </button>
            <button
              id="save-api-key-btn"
              type="button"
              onClick={handleSaveKey}
              disabled={isSaving || !apiKeyInput.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition cursor-pointer disabled:opacity-50"
            >
              {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Save & Apply Key</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
