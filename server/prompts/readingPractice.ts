/**
 * Prompt templates and system instructions for Graded Reading & Listening Comprehension.
 */

export interface ReadingArticlePromptOptions {
  targetLanguage: string;
  knownLanguage: string;
  targetLanguageCode?: string;
  knownLanguageCode?: string;
  cefrLevel?: string;
  level?: string;
  topic?: string;
  targetWords?: string[];
  activeDeckCards?: Array<{ targetItem: string; definition?: string }>;
}

export function getReadingArticleSystemInstruction(options: ReadingArticlePromptOptions): string {
  const { targetLanguage, knownLanguage, cefrLevel = "A2", level = cefrLevel, targetWords = [] } = options;

  const isKorean = (targetLanguage || "").toLowerCase().includes("korean") || (targetLanguage || "").toLowerCase().includes("한국어");
  let langGuidance = "";
  if (isKorean) {
    langGuidance = `
KOREAN LANGUAGE & SCRIPT REQUIREMENTS:
- Write strictly in standard Hangul (한글) following SOV word order and authentic particles (은/는, 이/가, 을/를, 에/에서).
- Use natural polite endings (해요체: -아요/어요 or written narrative style -(으)ㄴ/는다 or 하십시오체) appropriate for CEFR ${level}.
- Do NOT mix Chinese characters (漢字) or Chinese grammar constructions into Korean text.`;
  }

  return `You are a master foreign language pedagogue and author.
Your task is to write an engaging, natural, level-appropriate (CEFR ${level}) short story or informative article in ${targetLanguage}.
The learner's native/known language is ${knownLanguage}.${langGuidance}

CRITICAL REQUIREMENTS:
1. Seamlessly incorporate the following target words/grammar patterns that the user is studying today: ${targetWords.join(", ")}.
2. The writing must be natural and idiomatic in ${targetLanguage}, NOT awkward or machine-translated.
3. Organize the article into 3 to 5 logical paragraphs.
4. For each paragraph, provide the paragraph in ${targetLanguage} AND an accurate translation in ${knownLanguage}.
5. Give the article a catchy title in ${targetLanguage} and title translation in ${knownLanguage}.
6. Provide a concise summary (1-2 sentences in ${knownLanguage}) and list the target words/patterns used in the story.`;
}

export function getReadingArticleUserPrompt(options: ReadingArticlePromptOptions): string {
  const { targetLanguage, cefrLevel = "A2", level = cefrLevel, topic = "Daily life, culture, or an interesting everyday adventure", targetWords = [] } = options;

  return `Write a reading and listening practice article in ${targetLanguage} at CEFR Level ${level}.
Topic / Context: ${topic}
Target vocabulary & grammar items to weave into the story:
${targetWords.length > 0 ? targetWords.map((w: string, i: number) => `${i + 1}. ${w}`).join("\n") : "High-frequency core words and daily conversational structures"}

Return the structured JSON output.`;
}

export interface ExplainReadingTextPromptOptions {
  targetLanguage: string;
  knownLanguage?: string;
  selectedText: string;
  fullContext?: string;
  fullContextSentence?: string;
  level?: string;
}

export function getExplainReadingTextSystemInstruction(options: ExplainReadingTextPromptOptions): string {
  const { targetLanguage, knownLanguage = "English", selectedText, fullContext = "" } = options;

  return `You are a linguistic expert and language tutor.
The user highlighted the text: "${selectedText}" within the reading context: "${fullContext || selectedText}".
Target language: ${targetLanguage}. Known/native language: ${knownLanguage}.

Provide a clear pedagogical breakdown:
1. Accurate translation of the highlighted phrase/sentence in ${knownLanguage}.
2. Grammatical explanation / syntax notes (why words are in this order, verb conjugations, particles, idioms).
3. Break down the key concept(s) and vocabulary word(s) inside this highlighted text into flashcard-ready concepts.
For each concept:
- targetItem (the root word or dictionary form or grammatical formula)
- type ('vocabulary' or 'grammar')
- partOfSpeech (e.g., 'Transitive Verb', 'Conjunction', 'Particle')
- definition (concise meaning in ${knownLanguage})
- phonetic (phonetic pronunciation, IPA, pinyin, romaji, or hangul phonetic)
- usageNotes (how to use it)
- exampleSentence ({ target: string, translation: string, phonetic?: string })`;
}

export function getExplainReadingTextUserPrompt(options: ExplainReadingTextPromptOptions): string {
  const { selectedText, fullContext = "", fullContextSentence = fullContext, targetLanguage, knownLanguage = "English" } = options;

  return `Analyze and explain this highlighted excerpt from reading practice:
Highlighted Text: "${selectedText}"
Context: "${fullContextSentence}"
Target Language: ${targetLanguage}
Learner Known Language: ${knownLanguage}

Return the structured JSON explanation with extractable flashcard concepts.`;
}

export interface GradeReadingResponsePromptOptions {
  targetLanguage: string;
  knownLanguage?: string;
  targetLanguageCode?: string;
  questionText?: string;
  questionTranslation?: string;
  userResponse?: string;
  studentAnswer?: string;
  articleContext?: string;
  articleTitle?: string;
  articleSummary?: string;
  prompt?: string;
  level?: string;
}

export function getGradeReadingResponseSystemInstruction(options: GradeReadingResponsePromptOptions): string {
  const { targetLanguage, knownLanguage = "English", questionText = "", questionTranslation = "", articleContext = "" } = options;

  return `You are a master foreign language instructor and pedagogical evaluator in ${targetLanguage}.
Evaluate a learner's written or dictated response to a reading comprehension follow-up question.
Learner's native/known language: ${knownLanguage}.

Article Story Context:
"""
${articleContext || "Context provided in question."}
"""

Question Asked: "${questionText}" (${questionTranslation})

You MUST evaluate two independent dimensions:
1. SEMANTIC ACCURACY & COMPREHENSION: Did the learner correctly answer the question based on the facts/nuance of the story? (semanticScore 0-100, isSemanticallyAccurate: boolean, semanticFeedback in ${knownLanguage}).
2. GRAMMATICAL & MORPHOLOGICAL CORRECTNESS: Is the sentence grammatically well-formed in ${targetLanguage}? (grammarScore 0-100, isGrammaticallyCorrect: boolean, grammarFeedback in ${knownLanguage}).
3. CORRECTED / NATIVE POLISH: Provide the most natural, idiomatic version in ${targetLanguage} with its ${knownLanguage} translation.
4. IDENTIFIED ERRORS & REMEDY FLASHCARDS: If the student made any vocabulary, grammar, conjugation, or particle errors, extract them into:
   - identifiedErrors: [{ originalMistake, correctedForm, errorType, explanation }]
   - suggestedRemedyCards: Array of flashcard objects that the learner can add to their Spaced Repetition deck to prevent this mistake from recurring!`;
}

export function getGradeReadingResponseUserPrompt(options: GradeReadingResponsePromptOptions): string {
  const { questionText = "", userResponse = "", studentAnswer = userResponse, targetLanguage } = options;

  return `Evaluate the learner's response:
Target Language: ${targetLanguage}
Question: "${questionText}"
User Answer: "${studentAnswer}"

Output structured JSON evaluation.`;
}
