/**
 * Prompt templates for Language Journal AI Grammar & Prose Proofreading
 */

export function getJournalCheckSystemInstruction(
  targetLanguage: string,
  knownLanguage: string
): string {
  return `You are an expert native-speaking linguistic proofreader and pedagogical language tutor specializing in ${targetLanguage} for learners whose reference language is ${knownLanguage}.
Your task is to analyze freeform prose and journal entries written by language learners.

Analyze the text comprehensively for:
1. Grammatical accuracy (verb conjugations, tense/aspect consistency, subject-verb agreement, gender/number concord, prepositions, particles, word order).
2. Orthography & Spelling (accent marks, diacritics, punctuation conventions like ¿ ¡ in Spanish or 。、in CJK, capitalization).
3. Lexical precision & Vocabulary nuance (collocations, false cognates, natural phrasing vs. literal word-for-word translation).
4. Naturalness & Register (distinguishing formal vs. casual vs. intimate tone).

Output your evaluation as pure valid JSON conforming strictly to the requested schema.
Be encouraging, pedagogical, and precise. Provide clear explanations in ${knownLanguage}.
Never return markdown wrappers like \`\`\`json. Output raw valid JSON only.`;
}

export function getJournalCheckUserPrompt(
  entryTitle: string,
  entryContent: string,
  targetLanguage: string,
  knownLanguage: string,
  estimatedLevel?: string
): string {
  return `Please analyze and error-check this journal entry written in ${targetLanguage}. The learner's reference language is ${knownLanguage}.
${estimatedLevel ? `Learner's current target level: ${estimatedLevel}` : ""}

---
TITLE: "${entryTitle || "Untitled Entry"}"
CONTENT:
"""
${entryContent}
"""
---

Analyze the writing and return a JSON object with this exact structure:
{
  "overallScore": 88, // integer 0-100 reflecting grammar, vocabulary, and naturalness
  "estimatedCEFR": "B1", // "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
  "fluencyRating": "intermediate", // "beginner" | "developing" | "intermediate" | "fluent" | "native_like"
  "summaryFeedback": "Concise 2-3 sentence overview celebrating what they did well and highlighting key areas for improvement.",
  "correctedText": "The complete, fully corrected, natural version of the learner's prose in ${targetLanguage} maintaining their original voice and meaning.",
  "translatedText": "Accurate, natural translation of the corrected prose into ${knownLanguage}.",
  "grammarScore": 85, // integer 0-100
  "vocabularyScore": 90, // integer 0-100
  "naturalnessScore": 85, // integer 0-100
  "errors": [
    {
      "originalText": "the exact snippet or word with the error",
      "correctedText": "the corrected snippet or word",
      "errorType": "grammar", // "grammar" | "conjugation" | "agreement" | "spelling" | "vocabulary" | "punctuation" | "nuance"
      "explanation": "Clear, friendly explanation in ${knownLanguage} explaining WHY this correction is needed and the underlying rule."
    }
  ],
  "positiveHighlights": [
    "Specific phrase or grammatical structure the user used correctly and effectively."
  ],
  "naturalPhrasings": [
    {
      "originalExcerpt": "phrase from the text",
      "suggestedAlternative": "more idiomatic native expression in ${targetLanguage}",
      "explanation": "Why this alternative sounds more natural in daily speech or writing."
    }
  ],
  "extractedVocabulary": [
    {
      "word": "key vocabulary word or phrase from the journal in ${targetLanguage}",
      "translation": "translation in ${knownLanguage}",
      "partOfSpeech": "noun/verb/adjective/expression",
      "phonetic": "pronunciation or romanization",
      "exampleSentence": "example sentence using this word in ${targetLanguage}"
    }
  ],
  "suggestedTags": ["daily-life", "weekend", "coffee"], // 3-5 smart, contextual topic tags in lowercase
  "suggestedEmoji": "☕", // single best fitting emoji based on entry content and mood
  "suggestedMood": "relaxed" // "happy" | "reflective" | "motivated" | "curious" | "relaxed" | "proud" | "melancholy" | "adventurous"
}`;
}
