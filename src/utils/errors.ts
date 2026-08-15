import { Flashcard, EvaluationResult, LearnerError, Deck } from "../types";

const STORAGE_KEY_ERRORS = "frequency_srs_learner_errors_v1";

export function loadLearnerErrors(): LearnerError[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ERRORS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to load learner errors:", e);
    return [];
  }
}

export function saveLearnerErrors(errors: LearnerError[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ERRORS, JSON.stringify(errors));
  } catch (e) {
    console.warn("Failed to save learner errors:", e);
  }
}

/**
 * Creates a user-tailored flashcard for a specific common error
 */
export function createCardFromLearnerError(
  err: LearnerError,
  deckId: string,
  targetLang: string,
  knownLang: string
): Flashcard {
  return {
    id: `error-card-${err.id}`,
    deckId: deckId,
    type: "common_error",
    category: "common_error",
    isCommonError: true,
    originalMistake: err.originalMistake,
    correctedForm: err.correctedForm,
    errorId: err.id,
    targetItem: err.correctedForm || err.targetItem,
    targetLanguage: targetLang,
    knownLanguage: knownLang,
    frequencyRank: 0,
    partOfSpeech: `Common Slip Remedy (${err.errorType})`,
    definition: `Correct form for "${err.targetItem}": Avoid "${err.originalMistake}" → Use "${err.correctedForm}"`,
    usageNotes: err.explanation || `Avoid mistake: "${err.originalMistake}". Construct sentence using: "${err.correctedForm}".`,
    examples: [
      {
        target: err.correctedForm,
        translation: `Correct pattern (avoiding "${err.originalMistake}")`,
      },
    ],
    tags: ["common-error", err.errorType, "tailored"],
    srs: {
      repetition: err.consecutiveCorrect || 0,
      interval: err.isResolved ? 7 : 1,
      easeFactor: 2.3,
      dueDate: new Date().toISOString(),
      history: [],
      masteryScore: err.isResolved ? 90 : 35,
      status: err.isResolved ? "mastered" : "learning",
      consecutiveSuccesses: err.consecutiveCorrect || 0,
    },
  };
}

/**
 * Synchronizes user-tailored common error cards into the deck's cards array
 */
export function syncCommonErrorCardsIntoDeck(
  deckCards: Flashcard[],
  errors: LearnerError[],
  deckId: string,
  targetLang: string,
  knownLang: string
): Flashcard[] {
  // Keep all non-common-error cards, plus any existing common error cards that still exist
  const baseCards = deckCards.filter((c) => !c.isCommonError && c.category !== "common_error");
  
  // Create or update tailored cards for all active/recorded errors
  const errorCards: Flashcard[] = errors.map((err) => {
    const existing = deckCards.find((c) => c.errorId === err.id || c.id === `error-card-${err.id}`);
    if (existing) {
      return {
        ...existing,
        originalMistake: err.originalMistake,
        correctedForm: err.correctedForm,
        usageNotes: err.explanation || existing.usageNotes,
        srs: {
          ...existing.srs,
          status: err.isResolved ? "mastered" : (existing.srs.status === "new" ? "learning" : existing.srs.status),
          masteryScore: err.isResolved ? Math.max(85, existing.srs.masteryScore) : existing.srs.masteryScore,
        },
      };
    }
    return createCardFromLearnerError(err, deckId, targetLang, knownLang);
  });

  return [...baseCards, ...errorCards];
}

/**
 * Updates the error tracking ledger when a sentence is evaluated:
 * 1. If errors are identified, record or increment their recurrence and reset their resolution counter.
 * 2. If the user produces a high-scoring sentence (>= 85) on a card where previous errors existed,
 *    increment the consecutiveCorrect counter. Once the user succeeds 2+ times, the error is marked as resolved (phased out).
 */
export function recordEvaluationErrors(
  card: Flashcard,
  evaluation: EvaluationResult,
  userSentence: string,
  currentErrors: LearnerError[]
): { updatedErrors: LearnerError[]; newErrorsCount: number; newlyPhasedOutCount: number } {
  let updated = [...currentErrors];
  let newErrorsCount = 0;
  let newlyPhasedOutCount = 0;
  const now = new Date().toISOString();

  // If high score with no grammar/vocab issues, celebrate overcoming past errors on this item
  if (evaluation.score >= 85 && evaluation.isGrammaticallyCorrect) {
    updated = updated.map((err) => {
      if (
        err.targetItem.toLowerCase() === card.targetItem.toLowerCase() ||
        err.cardId === card.id ||
        (card.errorId && card.errorId === err.id)
      ) {
        const nextConsecutive = (err.consecutiveCorrect || 0) + 1;
        const willResolve = nextConsecutive >= 2;
        if (!err.isResolved && willResolve) {
          newlyPhasedOutCount++;
        }
        return {
          ...err,
          consecutiveCorrect: nextConsecutive,
          isResolved: willResolve ? true : err.isResolved,
        };
      }
      return err;
    });
  }

  // Check identified errors from evaluation
  const identified = evaluation.identifiedErrors || [];

  if (identified.length > 0) {
    identified.forEach((errItem) => {
      const existingIdx = updated.findIndex(
        (e) =>
          (e.targetItem.toLowerCase() === card.targetItem.toLowerCase() || e.cardId === card.id || e.id === card.errorId) &&
          (e.originalMistake.toLowerCase() === errItem.originalMistake.toLowerCase() ||
            e.errorType.toLowerCase() === errItem.errorType.toLowerCase())
      );

      if (existingIdx >= 0) {
        // Recurrent error: reset consecutive successes and un-resolve
        const existing = updated[existingIdx];
        updated[existingIdx] = {
          ...existing,
          originalMistake: errItem.originalMistake || existing.originalMistake,
          correctedForm: errItem.correctedForm || existing.correctedForm,
          errorType: errItem.errorType || existing.errorType,
          explanation: errItem.explanation || existing.explanation,
          timestamp: now,
          occurrences: existing.occurrences + 1,
          consecutiveCorrect: 0,
          isResolved: false, // Reactivated because user repeated it
        };
      } else {
        // Brand new error
        newErrorsCount++;
        const newError: LearnerError = {
          id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          cardId: card.id,
          targetItem: card.targetItem,
          originalMistake: errItem.originalMistake || userSentence,
          correctedForm: errItem.correctedForm || evaluation.correctedSentence,
          errorType: (errItem.errorType as any) || "grammar",
          explanation: errItem.explanation || evaluation.feedbackSummary,
          timestamp: now,
          occurrences: 1,
          consecutiveCorrect: 0,
          isResolved: false,
        };
        updated.unshift(newError);
      }
    });
  } else if (evaluation.score < 80 && !evaluation.isGrammaticallyCorrect) {
    // Fallback: If score is low but identifiedErrors wasn't populated, create one from feedback
    const breakdownMistakes = evaluation.breakdown.filter((b) => b.type !== "positive");
    const explanationText =
      breakdownMistakes.map((b) => b.message).join(" • ") || evaluation.feedbackSummary;

    const existingIdx = updated.findIndex(
      (e) => e.targetItem.toLowerCase() === card.targetItem.toLowerCase() || e.cardId === card.id || e.id === card.errorId
    );

    if (existingIdx >= 0) {
      const existing = updated[existingIdx];
      updated[existingIdx] = {
        ...existing,
        originalMistake: userSentence,
        correctedForm: evaluation.correctedSentence,
        explanation: explanationText,
        timestamp: now,
        occurrences: existing.occurrences + 1,
        consecutiveCorrect: 0,
        isResolved: false,
      };
    } else {
      newErrorsCount++;
      const newError: LearnerError = {
        id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        cardId: card.id,
        targetItem: card.targetItem,
        originalMistake: userSentence,
        correctedForm: evaluation.correctedSentence,
        errorType: (breakdownMistakes[0]?.type as any) || "grammar",
        explanation: explanationText,
        timestamp: now,
        occurrences: 1,
        consecutiveCorrect: 0,
        isResolved: false,
      };
      updated.unshift(newError);
    }
  }

  saveLearnerErrors(updated);
  return { updatedErrors: updated, newErrorsCount, newlyPhasedOutCount };
}

export function toggleErrorResolution(errorId: string, currentErrors: LearnerError[]): LearnerError[] {
  const updated = currentErrors.map((err) => {
    if (err.id === errorId) {
      return {
        ...err,
        isResolved: !err.isResolved,
        consecutiveCorrect: !err.isResolved ? 2 : 0,
      };
    }
    return err;
  });
  saveLearnerErrors(updated);
  return updated;
}

export function removeLearnerError(errorId: string, currentErrors: LearnerError[]): LearnerError[] {
  const updated = currentErrors.filter((err) => err.id !== errorId);
  saveLearnerErrors(updated);
  return updated;
}

