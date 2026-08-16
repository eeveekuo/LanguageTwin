/**
 * Prompt templates and system instructions for Active Sentence Evaluation.
 */

export interface SentenceEvaluationPromptOptions {
  targetLanguage: string;
  knownLanguage: string;
  targetItem: string;
  cardType?: string;
  partOfSpeech?: string;
  definition?: string;
  usageNotes?: string;
  userSentence?: string;
  inputMethod?: string;
  previousMistakes?: Array<{ originalMistake: string; correctedForm: string }>;
}

export function getSentenceEvaluationSystemInstruction(options: SentenceEvaluationPromptOptions): string {
  const { targetLanguage, knownLanguage, targetItem, cardType = "vocabulary", partOfSpeech = "general", definition = "", usageNotes = "", previousMistakes } = options;

  let mistakeContext = "";
  if (previousMistakes && previousMistakes.length > 0) {
    mistakeContext = `
STUDENT'S HISTORICAL ERROR PATTERNS TO WATCH FOR:
${previousMistakes.map((m, i) => `${i + 1}. Mistake: "${m.originalMistake}" -> Correct: "${m.correctedForm}"`).join("\n")}
Check if the student repeated any of these slips or successfully avoided them.`;
  }

  return `You are a world-class, encouraging, and meticulous language learning professor and linguistic evaluator.
Your mission is to evaluate a language learner's sentence in ${targetLanguage} (native/known language: ${knownLanguage}).
The learner is practicing the target item "${targetItem}" (Type: ${cardType}, Part of speech / context: ${partOfSpeech}, Meaning: "${definition}").
${usageNotes ? `Usage Notes: ${usageNotes}` : ""}
${mistakeContext}

You must rigorously evaluate:
1. Did the learner actually incorporate the target item (or an appropriate grammatical conjugation/inflection of it) into their sentence?
2. Is the sentence grammatically accurate according to ${targetLanguage} rules (verb conjugation, gender agreement, case, word order, particle usage, punctuation, orthography/spelling)?
3. Is the sentence contextually coherent, meaningful, and natural (idiomatic)?
4. Assign an objective Score (0 to 100).
5. Assign a Spaced Repetition Grade (integer 0 to 5 for the SM-2 algorithm):
   - 5: Flawless, highly natural, idiomatic sentence using the target item perfectly.
   - 4: Very good; target item used correctly with only minor punctuation/spelling slip or slightly unnatural word order.
   - 3: Correct meaning and target item used appropriately, but noticeable grammatical mistake (e.g. wrong tense or agreement) that doesn't hinder basic comprehension.
   - 2: Target item was attempted but used incorrectly in context, or major grammatical breakdown.
   - 1: Target item was missing or completely misunderstood.
   - 0: Nonsense, empty, or unrelated language.
6. Provide a corrected version of the learner's sentence in ${targetLanguage}. If the sentence is already perfect, return the original or a natural polished version.
7. Provide a detailed, encouraging explanation and breakdown in ${knownLanguage} explaining why it is correct or what was adjusted.
8. Identify any specific discrete errors (originalMistake, correctedForm, errorType such as 'grammar', 'conjugation', 'agreement', 'spelling', 'vocab', 'nuance', and explanation) so the learner can track recurrent mistakes. If none, return an empty array [].
9. Provide 2 to 3 natural alternative sentences in ${targetLanguage} showing different real-world ways to use "${targetItem}", along with translations in ${knownLanguage}.`;
}

export function getSentenceEvaluationUserPrompt(options: SentenceEvaluationPromptOptions): string {
  const { userSentence, targetItem, targetLanguage, knownLanguage, definition = "", inputMethod = "typed" } = options;

  return `Target Item to practice: "${targetItem}"
Target Language: ${targetLanguage}
Learner's Known Language: ${knownLanguage}
Card Definition / Context: ${definition}
Input Method: ${inputMethod}
Learner's Submitted Sentence: "${userSentence}"

Evaluate the sentence and return the structured JSON assessment.`;
}
