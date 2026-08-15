import { PlacementTestResult } from "../types";

export interface StoredDiagnosticRecord extends PlacementTestResult {
  id: string;
  targetLangName: string;
  targetLangCode: string;
  knownLangName: string;
}

export type DiagnosticTestRecord = StoredDiagnosticRecord;

const STORAGE_KEY = "linguist_pro_diagnostic_history_v1";

/**
 * Saves a completed placement diagnostic result to local history
 */
export function saveDiagnosticToHistory(
  result: PlacementTestResult,
  targetLangName: string,
  targetLangCode: string,
  knownLangName: string = "English"
): StoredDiagnosticRecord {
  const record: StoredDiagnosticRecord = {
    ...result,
    id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    targetLangName,
    targetLangCode,
    knownLangName,
    completedAt: result.completedAt || new Date().toISOString(),
  };

  try {
    const existing = loadDiagnosticHistory();
    const updated = [record, ...existing.filter((r) => r.id !== record.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 50))); // Keep last 50
  } catch (err) {
    console.warn("[DiagnosticHistory] Failed to save test to localStorage:", err);
  }

  return record;
}

/**
 * Loads all saved diagnostic test history records
 */
export function loadDiagnosticHistory(targetLangCode?: string): StoredDiagnosticRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    if (targetLangCode) {
      return parsed.filter(
        (r) =>
          r.targetLangCode?.toLowerCase() === targetLangCode.toLowerCase() ||
          r.targetLangName?.toLowerCase().includes(targetLangCode.toLowerCase())
      );
    }
    return parsed;
  } catch (err) {
    console.warn("[DiagnosticHistory] Failed to load history:", err);
    return [];
  }
}

/**
 * Delete a single diagnostic record
 */
export function deleteDiagnosticRecord(id: string): void {
  try {
    const existing = loadDiagnosticHistory();
    const filtered = existing.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn("[DiagnosticHistory] Failed to delete test record:", err);
  }
}
