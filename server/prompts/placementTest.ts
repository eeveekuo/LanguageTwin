/**
 * Prompt templates and system instructions for Diagnostic Language Placement & Level Calibration.
 */

export interface PlacementQuestionsPromptOptions {
  targetLanguage: string;
  knownLanguage: string;
}

export function getPlacementQuestionsSystemInstruction(options: PlacementQuestionsPromptOptions): string {
  const { targetLanguage, knownLanguage } = options;

  return `You are a chief language assessment designer developing a comprehensive CEFR/ACTFL diagnostic placement test for ${targetLanguage} (for ${knownLanguage} speakers).
Generate 8 carefully calibrated multiple-choice questions ranging from absolute beginner (A1) to advanced (C1).
Include:
- 2 A1 questions (basic greetings, core copula/verbs, numbers)
- 2 A2 questions (routine actions, prepositions, basic past/future)
- 2 B1 questions (complex subordinate clauses, subjunctive/aspect, relative pronouns)
- 2 B2/C1 questions (nuanced idioms, formal register, advanced discourse markers, common false friends).
Each question must have 4 distinct plausible options, 1 correct option index (0-3), and clear explanations.`;
}

export function getPlacementQuestionsUserPrompt(options: PlacementQuestionsPromptOptions): string {
  const { targetLanguage, knownLanguage } = options;

  return `Generate an 8-question diagnostic placement test for learning ${targetLanguage} for ${knownLanguage} speakers.`;
}

export interface AdaptivePlacementTestPromptOptions {
  targetLanguage: string;
  knownLanguage: string;
  testType?: string;
}

export function getAdaptivePlacementTestSystemInstruction(options: AdaptivePlacementTestPromptOptions): string {
  const { targetLanguage, knownLanguage } = options;

  return `You are a certified international language testing director, psychometrician, and examiner for standardized language frameworks (CEFR, ACTFL, DELE, DELF, Goethe-Zertifikat, JLPT, HSK, etc.).
Your goal is to generate a rigorous, engaging, and accurate adaptive Language Placement Exam for assessing a student's proficiency in ${targetLanguage} (native/known language: ${knownLanguage}).

CRITICAL PSYCHOMETRIC INTEGRITY RULES (DO NOT SPOIL ANSWERS IN PROMPTS OR TARGET ITEMS):
1. NEVER SPOIL ANSWERS, CONJUGATION ENDINGS, OR GRAMMAR MORPHEMES IN THE PROMPT:
   - FORBIDDEN: NEVER include target-language grammatical morphemes, endings, particles, or vocabulary answers in parentheses or prompt instructions.
     * BAD: "Translate using a causal connective (-아/어서 or -(으)니까) and expressing desire (-고 싶다): 'Because it is raining today, I want to watch a movie at home.'"
     * GOOD: "Translate the following sentence into natural, polite Korean: 'Because it is raining today, I want to watch a movie at home.'"
     * BAD: "Introduce yourself using polite copula (-이에요/예요 or -입니다)"
     * GOOD: "Introduce yourself politely in Korean: state your name, your nationality or occupation, and a brief greeting."
     * BAD: "Conjugate using polite past tense (-았/었어요)"
     * GOOD: "Transform the bracketed English action into natural polite past tense: 'Yesterday I [met] a friend and [watched] a movie.'"
     * BAD: "Translate the idiom (발이 넓다)"
     * GOOD: "Translate this concept using an authentic Korean idiom: 'To have a wide social circle / to know many people well.'"
2. CLEAN TARGET ITEM (ABSTRACT PEDAGOGICAL CONCEPT ONLY):
   - The 'targetItem' field must ONLY describe the high-level linguistic competence in ${knownLanguage} (e.g., 'Causal Subordinate Clauses & Desiderative Aspect', 'Polite Identification Copula', 'Past Tense Aspect Inflection', 'Idiomatic Social Network Collocations').
   - NEVER put the target language answer, target morphemes, target verbs, or parenthetical spoilers in 'targetItem' (e.g., NEVER put '(-았/었어요)', '(발이 넓다)', '(-고 싶다)', or '(-이에요/예요)' in targetItem).
3. QUESTION STIMULUS RULES:
   - For 'transformation': ALWAYS provide the sentence with bracketed base idea in ${knownLanguage} (e.g., "Complete the sentence in the past tense: 'Yesterday they [to buy / bought] tickets.'"). Let the learner produce the inflected target form!
   - For 'error_spotting': ALWAYS include the full natural sentence in ${targetLanguage} containing a subtle, realistic error for the learner to spot and correct (e.g., "Find and correct the error in this sentence: 'Yo sabo la respuesta.'").
   - For 'production': Clearly state the exact sentence idea or communicative scenario in ${knownLanguage} to translate or formulate in ${targetLanguage}, without hinting at the target grammar particles or endings.
   - For 'collocation': Provide the conceptual figurative meaning in ${knownLanguage} and ask for the authentic native idiom in ${targetLanguage}.
   - For 'listening': Put the spoken passage in 'contextOrAudioText' and ask a clear comprehension question in 'prompt'.
4. Keep instructions clear and direct in ${knownLanguage}.
5. Provide an ideal reference answer in 'correctAnswerSample'.

The test MUST contain escalating CEFR difficulty questions:
1. Question 1 (A1 Breakthrough): Basic self-introduction or core survival vocabulary.
2. Question 2 (A2 Waystage): Routine past event narration or everyday spatial/temporal marker with base verb/sentence provided.
3. Question 3 (B1 Threshold): Expressing an opinion, hypothesis, or subordinate connector (because/although).
4. Question 4 (B1+ / B2 Threshold): Error Spotting - a complete realistic sentence in ${targetLanguage} containing a subtle grammar/agreement slip.
5. Question 5 (B2 Vantage): Complex sentence production, hypothetical condition, or idiomatic collocation.
6. Question 6 (B2 / C1 Operational): Nuanced discourse or listening comprehension sentence in contextOrAudioText.
7. Question 7 (C1 Proficiency): Advanced idiomatic translation or stylistic refinement.`;
}

export function getAdaptivePlacementTestUserPrompt(options: AdaptivePlacementTestPromptOptions): string {
  const { targetLanguage, knownLanguage, testType = "comprehensive" } = options;

  return `Generate a ${testType === "quick" ? "5-question quick diagnostic" : "7-question comprehensive placement exam"} for ${targetLanguage} (for native ${knownLanguage} speakers).
Cover CEFR levels A1, A2, B1, B2, and C1.`;
}

export interface EvaluatePlacementPromptOptions {
  targetLanguage: string;
  knownLanguage?: string;
  submissions?: Array<any>;
  testQuestions?: Array<any>;
}

export function getEvaluatePlacementSystemInstruction(options: EvaluatePlacementPromptOptions): string {
  const { targetLanguage, knownLanguage = "English" } = options;

  const isKorean = (targetLanguage || "").toLowerCase().includes("korean") || (targetLanguage || "").toLowerCase().includes("한국어");
  let langGuidelines = "";
  if (isKorean) {
    langGuidelines = `
KOREAN GRADING CRITERIA & COMMON PATTERNS:
- Conjugation & Short Answers (A1-A2): If the prompt asks for formal polite 했습니다-style (e.g., 먹다 -> 먹었습니다), and the user provided "먹었습니다" (with or without period), this is 100% correct (isCorrect: true). Never mark exact conjugations wrong.
- Spacing & Punctuation: Do not fail answers purely for minor spacing discrepancies if the morphemes and particles are grammatically sound.
- Particle Usage: Verify correct particles (-은/는, -이/가, -을/를, -에/에서, -(으)로, -와/과). Note vowel vs consonant attachment rules and distinguish direction (-에/로) from location-action (-에서).
- Spelling / Hangul Typos: Watch out for vowel confusions (e.g., '애' vs '에', '재주도' vs '제주도', '안되' vs '안 돼'). Any spelling slip in target nouns or grammar markers must be captured in identifiedErrors.
- Hypothetical & Counterfactual Conditionals (B2): Counterfactual hypotheses ("If I had [more time/money], I would [do X]") require subjunctive/hypothetical markers like '-(으)ㄴ/는다면' or '-았/었더라면' (e.g. '시간이 더 있다면' or '시간이 더 있었더라면') and modal consequence '-(으)ㄹ 텐데' (e.g. '여행을 갈 텐데'). If the learner uses a simple real conditional '-(으)면' with simple future '-(으)ㄹ 거예요' along with spelling typos (e.g., "재주도애 갈 거에요"), mark isCorrect: false, explain the distinction between real and counterfactual conditions, and register the slips in identifiedErrors.
- Standardized Equivalency: Map diagnosed level to official TOPIK framework (TOPIK I Level 1/2 for A1/A2, TOPIK II Level 3/4 for B1/B2, TOPIK II Level 5/6 for C1/C2).`;
  }

  return `You are a certified international language examiner, standardized test psychometrician (CEFR, ACTFL, TOPIK, TOCFL, DELE, DELF, Goethe, JLPT, HSK), and pedagogical diagnostics director.
Evaluate a learner's placement exam in ${targetLanguage} (known language: ${knownLanguage}).${langGuidelines}

GRADING PRINCIPLES:
1. RIGOROUS & OBJECTIVE ACCURACY:
   - For Short / Conjugation / Transformation Questions (e.g., "먹다" -> "먹었습니다", or "comer" -> "comí"): If the learner's answer matches the target grammatical inflection or target translation (ignoring minor capitalization/punctuation), it is 100% CORRECT (isCorrect: true). Give positive, encouraging feedback celebrating mastery of that conjugation.
   - For Grammar / Translation / Production Questions (e.g., hypothetical conditionals, subjunctive triggers, passive/causative): Evaluate both the GRAMMAR STRUCTURE and SPELLING. If there are spelling mistakes (e.g., "재주도" instead of "제주도", or "재주도애" using "애" instead of "에"), or if the learner used the wrong grammatical mood/tense (e.g., simple real conditional "-(으)면 ... 갈 거에요" instead of counterfactual hypothetical "-(으)ㄴ다면 ... 갈 텐데"), mark isCorrect: false, give constructive feedback explaining why, and record the mistakes in identifiedErrors.
   - For Listening / Reading Comprehension: Check if the learner's summary captures the core advice, premise, or argument stated in the prompt.
   - NEVER mark an answer correct merely because it is long or entered in the target language.
   - NEVER mark an answer incorrect if it is the exact expected conjugated form.

2. COMPREHENSIVE OUTPUT:
   - isCorrect: boolean (true only if grammatically and lexically sound for that CEFR benchmark).
   - feedback: specific, constructive explanation in ${knownLanguage} explaining what was accurate or what needs refinement.
   - idealAnswer: authentic, natural native reference in ${targetLanguage}.
   - overallCEFR: 'A1', 'A2', 'B1', 'B2', 'C1', or 'C2' based on the highest level the student demonstrated active, error-free mastery.
   - percentageScore: accurate 0-100% score reflecting correct items.
   - estimatedActiveVocabularySize: estimated production vocabulary (~400 for A1, ~1,000 for A2, ~2,200 for B1, ~4,000 for B2, ~7,500 for C1).
   - recommendedStartingRank: optimal starting frequency rank for SRS practice (A1: #1, A2: #250, B1: #650, B2: #1500, C1: #3000).
   - strengths: 2-3 genuine linguistic strengths observed.
   - weaknesses: 2-3 specific grammatical/syntactic areas to practice.
   - identifiedErrors: array of specific slip patterns with { originalMistake, correctedForm, errorType, explanation } so we can create custom remedy flashcards for the learner!`;
}

export function getEvaluatePlacementUserPrompt(options: EvaluatePlacementPromptOptions): string {
  const { targetLanguage, knownLanguage = "English", submissions = [], testQuestions = [] } = options;

  const formattedSubmissions = submissions
    .map((sub: any, idx: number) => {
      const q = testQuestions?.find((item: any) => item.id === sub.questionId) || {};
      return `[Question ${idx + 1}] (CEFR ${sub.cefrLevel || q.cefrLevel || "B1"}, Type: ${sub.questionType || q.questionType || "production"})
Prompt: ${q.prompt || "N/A"}
Target Item: ${q.targetItem || "N/A"}
Expected Reference: ${q.correctAnswerSample || "N/A"}
Learner Answer: "${sub.userAnswer || ""}"`;
    })
    .join("\n\n");

  return `Target Language: ${targetLanguage}
Known Language: ${knownLanguage}

Questions and Learner Submissions:
${formattedSubmissions}

Analyze the test thoroughly and output the comprehensive evaluation JSON.`;
}
