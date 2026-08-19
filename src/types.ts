export type CardType = "vocabulary" | "grammar" | "common_error";

export type MasteryLevel = "mastered" | "good" | "developing" | "incorrect";

export type SRSStatus = "new" | "learning" | "review" | "mastered";

export interface ExampleSentence {
  target: string;
  translation: string;
  phonetic?: string;
}

export interface SRSRecord {
  date: string;
  userSentence: string;
  score: number;
  grade: number; // 0-5 SM-2 grade
  masteryLevel: MasteryLevel;
  feedback: string;
  correctedSentence: string;
  inputMethod: "typed" | "spoken";
}

export interface SRSData {
  repetition: number;
  interval: number; // in days
  easeFactor: number; // SM-2 default 2.5
  dueDate: string; // ISO date string
  lastReviewed?: string;
  history: SRSRecord[];
  masteryScore: number; // 0-100%
  status: SRSStatus;
  consecutiveSuccesses: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  type: CardType;
  category?: "frequency" | "common_error";
  isCommonError?: boolean;
  originalMistake?: string;
  correctedForm?: string;
  errorId?: string;
  targetItem: string;
  targetLanguage: string;
  knownLanguage: string;
  frequencyRank: number; // #1, #2, #3 etc. or 0 for common errors
  partOfSpeech: string;
  definition: string;
  phonetic?: string;
  usageNotes: string;
  examples: ExampleSentence[];
  tags: string[];
  srs: SRSData;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  targetLang: string; // e.g. "Spanish"
  targetLangCode: string; // e.g. "es"
  knownLang: string; // e.g. "English"
  knownLangCode: string; // e.g. "en"
  level: string;
  cards: Flashcard[];
  createdAt: string;
  isCustom?: boolean;
  creatorId?: string;
  creatorName?: string;
  creatorPhoto?: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  speechLocale: string;
  specialChars: string[];
  defaultVoices?: string[];
}

export interface IdentifiedError {
  originalMistake: string;
  correctedForm: string;
  errorType: string;
  explanation: string;
}

export interface LearnerError {
  id: string;
  cardId?: string;
  targetItem: string;
  originalMistake: string;
  correctedForm: string;
  errorType: "grammar" | "conjugation" | "agreement" | "spelling" | "vocab" | "nuance" | string;
  explanation: string;
  timestamp: string;
  occurrences: number;
  consecutiveCorrect: number;
  isResolved: boolean; // Phased out when user masters/avoids it
}

export interface EvaluatedItemInChat {
  targetItem: string;
  cardId?: string;
  score: number;
  grade: number;
  masteryLevel: MasteryLevel;
  isGrammaticallyCorrect: boolean;
  feedback: string;
  userExcerpt?: string;
  identifiedErrors?: IdentifiedError[];
}

export type PracticeMechanismType =
  | "study"
  | "deck"
  | "grammar"
  | "reading"
  | "tutor"
  | "translate"
  | "journal";

export interface PracticeActivityRecord {
  id: string;
  timestamp: number;
  date: string; // YYYY-MM-DD
  mechanism: PracticeMechanismType;
  title: string;
  details: string;
  score?: number;
  targetItem?: string;
}

export interface PracticeBreakdownCounts {
  study: number;
  deck: number;
  grammar: number;
  reading: number;
  tutor: number;
  translate: number;
  journal: number;
}

export interface DailyProgress {
  target: number; // e.g. 10
  reviewedToday: number;
  date: string; // YYYY-MM-DD
  streak: number;
  lastCompletedDate?: string | null;
  breakdown?: PracticeBreakdownCounts;
  activityLog?: PracticeActivityRecord[];
}

export interface FrequencyBracket {
  startRank: number;
  endRank: number;
  totalCards: number;
  masteredCards: number;
  isUnlocked: boolean;
  isMastered: boolean;
  cards: Flashcard[];
}

export interface EvaluationResult {
  score: number;
  grade: number;
  masteryLevel: MasteryLevel;
  isTargetUsed: boolean;
  isGrammaticallyCorrect: boolean;
  feedbackSummary: string;
  correctedSentence: string;
  correctedSentenceTranslation: string;
  detailedExplanation: string;
  identifiedErrors?: IdentifiedError[];
  breakdown: Array<{
    type: "positive" | "grammar" | "vocab" | "spelling" | "nuance";
    message: string;
  }>;
  naturalAlternatives: Array<{
    sentence: string;
    translation: string;
    explanation: string;
  }>;
}

export interface CardExplanation {
  targetItem: string;
  definition: string;
  phonetic: string;
  usageFormat: string;
  ruleExplanation: string;
  examples: ExampleSentence[];
  collocations: string[];
  mnemonicTip: string;
  commonMistakes: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  targetWordHighlights?: string[];
  evaluatedItems?: EvaluatedItemInChat[];
}

export interface StudySessionStats {
  cardsReviewed: number;
  masteredCount: number;
  goodCount: number;
  developingCount: number;
  incorrectCount: number;
  avgScore: number;
  startTime: number;
  endTime?: number;
}

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface ReadingArticleConcept {
  id: string;
  targetItem: string;
  type: CardType;
  partOfSpeech: string;
  definition: string;
  phonetic?: string;
  usageNotes?: string;
  exampleSentence?: ExampleSentence;
}

export interface TextSelectionExplanation {
  selectedText: string;
  translation: string;
  grammaticalContext: string;
  concepts: ReadingArticleConcept[];
}

export interface ReadingArticleParagraph {
  targetText: string;
  translation: string;
}

export interface ConjugationEntry {
  personOrForm: string; // e.g. "yo (I)", "tú (you)", "él/ella (he/she)", "nosotros (we)", "vosotros (you all)", "ellos (they)" OR "Affirmative", "Negative", "Formal", etc.
  conjugated: string; // e.g. "hablo", "hablas", "話します", "먹어요"
  phonetic?: string; // e.g. "ah-blo", "ha-na-shi-ma-su"
  english?: string; // e.g. "I speak", "you speak"
  example?: {
    target: string;
    translation: string;
  };
}

export interface ConjugationFormGroup {
  id: string; // e.g. "present_indicative", "preterite", "imperfect", "future", "conditional", "present_subjunctive", "imperative", "gerund_participle", "te_form", "polite_masu", "potential", "past_ta", "negative_nai", "volitional", "passive", "causative", "present_polite", "past_polite", "future_intent", "connective_go"
  name: string; // e.g. "Present Indicative (Presente)", "Te-form (て形)", "Present Informal Polite (해요체)"
  category: "indicative" | "subjunctive" | "imperative" | "participle" | "polite" | "plain" | "connective" | "modal" | "honorific" | string;
  description: string; // e.g. "Habitual actions, current states, and general truths"
  formula?: string; // e.g. "Stem + -o, -as, -a, -amos, -áis, -an"
  cefrLevel?: string; // e.g. "A1", "A2", "B1"
  entries: ConjugationEntry[];
}

export interface VerbConjugationTable {
  verb: string; // e.g. "hablar", "comer", "vivir", "話す", "食べる", "する", "하다", "가다"
  infinitiveOrRoot: string;
  translation: string;
  targetLanguage: string;
  targetLangCode: string;
  regularity: "regular" | "irregular" | "stem-changing" | string;
  stemNotes?: string;
  forms: ConjugationFormGroup[];
}

export interface ReadingFollowUpQuestion {
  id: string;
  questionText: string;
  questionTranslation: string;
  focusGrammarOrConcept?: string;
  suggestedAnswerHint?: string;
}

export interface ReadingQuestionEvaluation {
  questionId: string;
  semanticScore: number;
  isSemanticallyAccurate: boolean;
  semanticFeedback: string;
  grammarScore: number;
  isGrammaticallyCorrect: boolean;
  grammarFeedback: string;
  correctedResponse: string;
  correctedTranslation: string;
  identifiedErrors: IdentifiedError[];
  suggestedRemedyCards: Partial<Flashcard>[];
}

export interface ReadingArticle {
  id: string;
  title: string;
  titleTranslation: string;
  topic: string;
  cefrLevel: string;
  targetLanguage: string;
  knownLanguage: string;
  targetLanguageCode: string;
  knownLanguageCode: string;
  content: string;
  paragraphs: ReadingArticleParagraph[];
  targetWordsUsed: string[];
  summary: string;
  followUpQuestions?: ReadingFollowUpQuestion[];
  createdAt: string;
}

export interface PlacementQuestion {
  id: string;
  cefrLevel: CEFRLevel;
  questionType: "production" | "transformation" | "error_spotting" | "collocation" | "listening";
  prompt: string; // The instruction or sentence prompt
  targetItem?: string; // Focus concept
  contextOrAudioText?: string; // Audio script or context
  options?: string[]; // Multiple choice options if applicable
  correctAnswerSample?: string;
  explanation: string;
}

export interface PlacementTestSubmission {
  questionId: string;
  userAnswer: string;
  cefrLevel: CEFRLevel;
  questionType: string;
}

export interface StandardizedEquivalency {
  frameworkName: string; // e.g. "DELE / SIELE", "JLPT", "DELF", "Goethe-Zertifikat", "HSK", "ACTFL"
  estimatedScoreOrGrade: string; // e.g. "DELE B1 (Estimated 74/100)", "JLPT N3", "HSK Level 4"
  actflEquivalent: string; // e.g. "Intermediate Mid", "Advanced Low"
  readinessPercentage: number; // 0-100% readiness for next formal exam
  description: string;
}

export interface PlacementTestResult {
  overallCEFR: CEFRLevel;
  cefrDescription: string;
  percentageScore: number;
  estimatedActiveVocabularySize: number;
  recommendedStartingRank: number;
  strengths: string[];
  weaknesses: string[];
  identifiedErrors: IdentifiedError[];
  standardizedEquivalency: StandardizedEquivalency;
  detailedFeedback: string;
  perQuestionReview: Array<{
    questionId: string;
    cefrLevel: CEFRLevel;
    prompt: string;
    userAnswer: string;
    isCorrect: boolean;
    feedback: string;
    idealAnswer: string;
  }>;
  completedAt: string;
}

export interface JournalErrorDetail {
  originalText: string;
  correctedText: string;
  errorType: "grammar" | "spelling" | "conjugation" | "vocabulary" | "punctuation" | "agreement" | "nuance" | string;
  explanation: string;
}

export interface JournalVocabularyHighlight {
  word: string;
  translation: string;
  partOfSpeech: string;
  phonetic?: string;
  exampleSentence?: string;
}

export interface JournalCorrectionResult {
  overallScore: number;
  estimatedCEFR: CEFRLevel;
  fluencyRating: "beginner" | "developing" | "intermediate" | "fluent" | "native_like";
  summaryFeedback: string;
  correctedText: string;
  translatedText: string;
  grammarScore: number;
  vocabularyScore: number;
  naturalnessScore: number;
  errors: JournalErrorDetail[];
  positiveHighlights: string[];
  naturalPhrasings: Array<{
    originalExcerpt: string;
    suggestedAlternative: string;
    explanation: string;
  }>;
  extractedVocabulary: JournalVocabularyHighlight[];
  suggestedTags?: string[];
  suggestedEmoji?: string;
  suggestedMood?: string;
  checkedAt?: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD (auto-recorded)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  targetLangCode: string;
  targetLangName: string;
  knownLangCode: string;
  knownLangName: string;
  tags: string[];
  wordCount: number;
  characterCount: number;
  promptTopic?: string;
  mood?: string;
  emoji?: string;
  voiceNoteAudioBase64?: string | null;
  voiceNoteDuration?: number | null;
  isFavorite?: boolean;
  isExample?: boolean;
  correctionResult?: JournalCorrectionResult | null;
}

export interface SavedArticleItem {
  id: string;
  article: ReadingArticle;
  savedAt: string; // ISO date string
  targetLangCode: string;
  notes?: string;
  isFavorite?: boolean;
  lastReadAt?: string;
}

export interface ScenarioData {
  title: string;
  category: string;
  scenarioPrompt: string;
  targetWordsToUse: string[];
  openingGreeting: string;
  openingGreetingTranslation: string;
}

export interface SavedConversation {
  id: string;
  title: string;
  targetLangCode: string;
  targetLangName: string;
  knownLangCode?: string;
  knownLangName?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  messages: ChatMessage[];
  scenario?: ScenarioData | null;
  summary?: string;
  messageCount: number;
  evaluatedItemsCount: number;
}

export type QuickAssistQueryType = "how_to_say" | "lookup_word" | "check_nuance" | "conjugate" | "deconjugate" | "general";

export interface ConjugationAnalysis {
  infinitive?: string;
  form?: string;
  tense?: string;
  personOrRegister?: string;
  ruleExplanation?: string;
  relatedForms?: Array<{
    form: string;
    conjugated: string;
  }>;
}

export interface QuickAssistResult {
  targetExpression: string;
  phonetic?: string;
  meaningInKnown: string;
  formalityVariants?: Array<{
    register: string;
    phrase: string;
    note: string;
  }>;
  wordBreakdown?: Array<{
    word: string;
    meaning: string;
    partOfSpeech?: string;
  }>;
  exampleSentence?: {
    target: string;
    meaning?: string;
    translation?: string;
    phonetic?: string;
  };
  conjugationAnalysis?: ConjugationAnalysis;
  grammarNote?: string;
  nuanceTip?: string;
}

