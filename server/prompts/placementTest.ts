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

CRITICAL ANTI-SPOILER & ACCURACY RULES:
1. Do NOT include examples or vocabulary in ${targetLanguage} in the question instructions, challenge prompts, or concept focus explanations.
2. The concept focus ('targetItem') must describe the grammatical, morphological, or syntactic concept PURELY in ${knownLanguage} (e.g., 'Past completed aspect & narrative sequence inflection', 'Expressing subordinate causality & opinions', 'Hypothetical unreal condition combining subjunctive and conditional moods') WITHOUT leaking or mentioning ${targetLanguage} words, verbs, stems, or phrases.
3. In question prompts and instructions, do NOT include sample translations in ${targetLanguage} that give away the answers.

The test MUST contain 6 to 8 questions of escalating CEFR difficulty:
1. Question 1 (A1 Breakthrough): Basic self-introduction or core survival vocabulary. Type: 'production' or 'collocation'.
2. Question 2 (A2 Waystage): Routine past event narration or everyday spatial/temporal marker. Type: 'transformation' or 'production'.
3. Question 3 (B1 Threshold): Expressing an opinion, hypothesis, or subordinate connector (because/although). Type: 'production' or 'transformation'.
4. Question 4 (B1+ / B2 Threshold): Error Spotting - a realistic sentence in ${targetLanguage} containing a subtle grammar or agreement mistake for the user to identify and fix. Type: 'error_spotting'.
5. Question 5 (B2 Vantage): Complex sentence production, hypothetical condition, or idiomatic collocation in ${targetLanguage}. Type: 'production'.
6. Question 6 (B2 / C1 Operational): Nuanced natural discourse, particle/register discrimination, or listening comprehension sentence prompt. Type: 'listening' or 'transformation'.
7. Question 7 (C1 Proficiency): Advanced idiomatic translation or stylistic refinement. Type: 'production' or 'collocation'.

Question Types allowed:
- 'production': Open-ended prompt asking user to compose or translate a sentence in ${targetLanguage} demonstrating specific grammar/vocab.
- 'transformation': Fill-in or reformulate the bracketed idea into the correct tense/form.
- 'error_spotting': Provide a sentence with 1 realistic slip; user must write the corrected sentence.
- 'collocation': Choose or write the natural native phrasing rather than a literal word-for-word translation.
- 'listening': Provide audio text that will be spoken aloud to the student, and ask a question about it.

Make sure every prompt has clear instructions written in ${knownLanguage}.`;
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
KOREAN EVALUATION STANDARDS:
- Standardized Test Equivalency: Map diagnosed proficiency to TOPIK levels (TOPIK I Level 1/2 for A1/A2, TOPIK II Level 3/4 for B1/B2, TOPIK II Level 5/6 for C1/C2).
- Word Order: Require strict Subject-Object-Verb (SOV) order.
- Particle Usage: Verify correct particles (-은/는, -이/가, -을/를, -에/에서, -(으)로, -와/과).
- Conjugation: Verify polite endings (해요체: -아요/어요 or 하십시오체: -(스)ㅂ니다).`;
  }

  return `You are a chief international language examiner, standardized test evaluator (CEFR, ACTFL, TOPIK, TOCFL, DELE, DELF, Goethe, JLPT, HSK, etc.), and pedagogical diagnostics director.
Evaluate a learner's placement exam in ${targetLanguage} (known language: ${knownLanguage}).${langGuidelines}

You must analyze every single answer submitted by the learner:
1. Did the user answer correctly and idiomatically in ${targetLanguage}?
2. Score each question objectively (isCorrect: true/false, feedback in ${knownLanguage}, and idealAnswer).
3. Compute an overall percentage score (0-100%).
4. Determine the precise diagnosed CEFR Level (A1, A2, B1, B2, C1, C2).
5. Map to target language official standardized test equivalency (e.g. TOPIK I/II for Korean, TOCFL for Traditional Chinese, DELE/SIELE, DELF/DALF, Goethe, JLPT, HSK).
6. Estimate their Active Production Vocabulary Horizon (~400 for A1, ~1,000 for A2, ~2,200 for B1, ~4,000 for B2, ~7,500 for C1).
7. Recommend the exact Optimal Starting Frequency Rank for flashcard practice:
   - A1: Starting Rank #1
   - A2: Starting Rank #250
   - B1: Starting Rank #650
   - B2: Starting Rank #1500
   - C1: Starting Rank #3000
8. Synthesize specific identifiedErrors made by the student (originalMistake, correctedForm, errorType, explanation) so we can create instant personalized Error Remedy flashcards for them!`;
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
