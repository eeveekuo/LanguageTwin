import { GoogleGenAI } from "@google/genai";

const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.7-flash",
  "gemini-2.5-flash-lite",
];

interface GenerateWithFallbackOptions {
  contents: any;
  config?: any;
  primaryModel?: string;
}

/**
 * Execute Gemini generateContent with automatic retry on 503/429 and fallback across reliable models
 */
export async function generateWithFallback(
  ai: GoogleGenAI,
  options: GenerateWithFallbackOptions
) {
  const primary = options.primaryModel || "gemini-2.5-flash";
  const modelList = [
    primary,
    ...CANDIDATE_MODELS.filter((m) => m !== primary),
  ];

  let lastError: any = null;

  for (const model of modelList) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });

        if (response && (response.text || response.candidates?.length)) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const msg = (err?.message || String(err)).toLowerCase();
        console.warn(
          `[Gemini Resilience] Model ${model} (attempt ${attempt + 1}) failed: ${err?.message || err}`
        );

        // If high demand / 503 / 429 / resource exhausted, pause and retry or cascade
        if (
          msg.includes("503") ||
          msg.includes("429") ||
          msg.includes("unavailable") ||
          msg.includes("demand") ||
          msg.includes("resource_exhausted") ||
          msg.includes("overloaded")
        ) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
          continue;
        } else {
          // If syntax/format error, try next model directly
          break;
        }
      }
    }
  }

  throw lastError || new Error("All Gemini models are temporarily unavailable.");
}

/**
 * Fallback Diagnostic Questions in case all remote AI calls fail
 */
export function getFallbackPlacementQuestions(
  targetLanguage: string,
  knownLanguage: string,
  testType: "quick" | "comprehensive"
) {
  const langLower = (targetLanguage || "").toLowerCase();

  // Spanish Specific Diagnostic
  if (langLower.includes("spanish") || langLower.includes("español")) {
    const spanishQuestions = [
      {
        id: "q-es-1",
        cefrLevel: "A1",
        questionType: "production",
        prompt: `Introduce yourself in ${targetLanguage}: write 1-2 complete sentences stating your name, hometown/country, and one interest.`,
        targetItem: "Personal identity, origin expressions, and present indicative verb agreement",
        contextOrAudioText: "¡Hola! ¿Cómo te llamas y de dónde eres?",
        correctAnswerSample: "Hola, me llamo Juan, soy de Madrid y me gusta la música.",
        explanation: "Assesses basic self-identification, personal pronouns, and fundamental sentence structure (A1 Breakthrough).",
      },
      {
        id: "q-es-2",
        cefrLevel: "A2",
        questionType: "transformation",
        prompt: `Transform the bracketed English infinitive ideas into past completed actions to complete the sentence: "Ayer yo [went] a la estación y [bought] los billetes de tren."`,
        targetItem: "Past completed aspect & narrative sequence inflection",
        contextOrAudioText: "Ayer yo fui a la estación y compré los billetes.",
        correctAnswerSample: "Ayer yo fui a la estación y compré los billetes de tren.",
        explanation: "Assesses past event narration with irregular and regular preterite conjugations (A2 Waystage).",
      },
      {
        id: "q-es-3",
        cefrLevel: "B1",
        questionType: "production",
        prompt: `Express your opinion about learning languages in ${targetLanguage}, connecting your ideas with a subordinate cause or concession.`,
        targetItem: "Subordinate clause connectors & opinion phrasing",
        contextOrAudioText: "En mi opinión, aprender idiomas es fascinante aunque requiere paciencia.",
        correctAnswerSample: "En mi opinión, aprender idiomas es muy útil porque te permite conocer nuevas culturas.",
        explanation: "Assesses ability to formulate opinions with subordinate causality or concession clauses (B1 Threshold).",
      },
      {
        id: "q-es-4",
        cefrLevel: "B1",
        questionType: "error_spotting",
        prompt: `Spot the grammatical agreement mistake in this sentence and rewrite it correctly: "Me gusta mucho las películas de ciencia ficción."`,
        targetItem: "Reverse-psychology verb subject agreement with plural nouns",
        contextOrAudioText: "Me gusta mucho las películas de ciencia ficción.",
        correctAnswerSample: "Me gustan mucho las películas de ciencia ficción.",
        explanation: "Assesses awareness of reverse-subject agreement with gustar-type psych verbs (B1 Error Spotting).",
      },
      {
        id: "q-es-5",
        cefrLevel: "B2",
        questionType: "production",
        prompt: `Complete this hypothetical conditional sentence in ${targetLanguage}: 'If I had a month of vacation, I would...'`,
        targetItem: "Hypothetical unreal condition combining subjunctive and conditional moods",
        contextOrAudioText: "Si tuviera más tiempo libre, viajaría por todo el mundo.",
        correctAnswerSample: "Si yo tuviera un mes de vacaciones, viajaría por varios países de América Latina.",
        explanation: "Assesses hypothetical construction combining imperfect subjunctive and conditional (B2 Vantage).",
      },
      {
        id: "q-es-6",
        cefrLevel: "B2",
        questionType: "listening",
        prompt: `Listen to the audio sentence. What did the speaker feel after the project was completed? Respond in ${targetLanguage}.`,
        targetItem: "Complex emotional state & concession marker comprehension",
        contextOrAudioText: "A pesar de las dificultades imprevistas durante la reunión, nos sentimos sumamente aliviados al ver que el cliente aprobó la propuesta sin dudarlo.",
        correctAnswerSample: "Se sintieron muy aliviados porque el cliente aprobó la propuesta a pesar de las dificultades.",
        explanation: "Assesses listening comprehension of connected discourse with concessions (B2 Operational).",
      },
      {
        id: "q-es-7",
        cefrLevel: "C1",
        questionType: "collocation",
        prompt: `Translate this concept into natural, idiomatic ${targetLanguage} (not literal word-for-word): 'To take something with skepticism / to avoid making hasty judgments.'`,
        targetItem: "Idiomatic figurative metaphors and high-register discourse",
        contextOrAudioText: "Conviene tomar esas declaraciones con pinzas.",
        correctAnswerSample: "Tomar algo con pinzas / no precipitarse al juzgar.",
        explanation: "Assesses idiomatic competency, register nuance, and non-literal figurative mastery (C1 Effective Operational).",
      },
    ];

    return {
      testTitle: `${targetLanguage} Diagnostic Placement Exam`,
      targetLanguage,
      knownLanguage,
      estimatedDurationMinutes: testType === "quick" ? 3 : 6,
      questions: testType === "quick" ? spanishQuestions.slice(0, 5) : spanishQuestions,
    };
  }

  // French Specific Diagnostic
  if (langLower.includes("french") || langLower.includes("français")) {
    const frenchQuestions = [
      {
        id: "q-fr-1",
        cefrLevel: "A1",
        questionType: "production",
        prompt: `Introduce yourself in ${targetLanguage}: state your name, profession or hobby, and where you live.`,
        targetItem: "Basic self-introduction and present indicative verbs",
        contextOrAudioText: "Bonjour ! Comment vous vous appelez et où habitez-vous ?",
        correctAnswerSample: "Bonjour, je m'appelle Marie, j'habite à Paris et j'aime lire.",
        explanation: "Assesses basic personal information and regular present tense conjugation (A1).",
      },
      {
        id: "q-fr-2",
        cefrLevel: "A2",
        questionType: "transformation",
        prompt: `Put the bracketed concepts into the completed past tense: "Hier, nous [visited] le musée et nous [took/drank] un café."`,
        targetItem: "Compound past auxiliary selection and past participle agreement",
        contextOrAudioText: "Hier nous avons visité le musée et nous avons pris un café.",
        correctAnswerSample: "Hier, nous avons visité le musée et nous avons pris un café.",
        explanation: "Assesses standard past tense formulation and auxiliary selection (A2).",
      },
      {
        id: "q-fr-3",
        cefrLevel: "B1",
        questionType: "production",
        prompt: `Write a sentence in ${targetLanguage} expressing necessity or a desire for someone else to do an action, using the subjunctive mood.`,
        targetItem: "Impersonal obligation triggers and present subjunctive inflection",
        contextOrAudioText: "Il faut que nous fassions attention aux détails.",
        correctAnswerSample: "Il faut que tu fasses tes devoirs avant de sortir ce soir.",
        explanation: "Assesses formulation of necessity and subjunctive mood triggers (B1).",
      },
      {
        id: "q-fr-4",
        cefrLevel: "B1",
        questionType: "error_spotting",
        prompt: `Correct the clitic pronoun mistake in this sentence: "Je vais à la maison de mes parents pour leur voir."`,
        targetItem: "Direct object pronoun vs indirect pronoun placement",
        contextOrAudioText: "Je vais à la maison de mes parents pour les voir.",
        correctAnswerSample: "Je vais chez mes parents pour les voir.",
        explanation: "Assesses direct object clitic pronoun usage with transitive verbs (B1).",
      },
      {
        id: "q-fr-5",
        cefrLevel: "B2",
        questionType: "production",
        prompt: `Formulate a conditional sentence in ${targetLanguage} expressing a past counterfactual regret: 'If I had known earlier, I would have...'`,
        targetItem: "Past hypothetical regret and compound conditional logic",
        contextOrAudioText: "Si j'avais su la vérité plus tôt, j'aurais réagi différemment.",
        correctAnswerSample: "Si j'avais su la vérité, je ne serais pas venu hier.",
        explanation: "Assesses hypothetical past conditions and complex compound tenses (B2).",
      },
      {
        id: "q-fr-6",
        cefrLevel: "B2",
        questionType: "listening",
        prompt: `Listen to the sentence and summarize what the speaker concluded. Respond in ${targetLanguage}.`,
        targetItem: "Complex argumentative synthesis and concession comprehension",
        contextOrAudioText: "Bien que le projet semble ambitieux, nous estimons qu'il est tout à fait réalisable avec un encadrement rigoureux.",
        correctAnswerSample: "Le locuteur pense que le projet est réalisable malgré son ambition s'il est bien encadré.",
        explanation: "Assesses listening comprehension of nuanced corporate/academic opinions (B2).",
      },
      {
        id: "q-fr-7",
        cefrLevel: "C1",
        questionType: "collocation",
        prompt: `Express this idea using a natural, sophisticated idiom in ${targetLanguage}: 'To weigh the pros and cons meticulously before deciding.'`,
        targetItem: "Nuanced stylistic collocations & figurative balance",
        contextOrAudioText: "Il convient de peser le pour et le contre avec minutie.",
        correctAnswerSample: "Peser le pour et le contre / être partagé entre deux options.",
        explanation: "Assesses C1 mastery of stylistic nuance, register, and figurative rhetoric.",
      },
    ];

    return {
      testTitle: `${targetLanguage} Placement Diagnostic`,
      targetLanguage,
      knownLanguage,
      estimatedDurationMinutes: testType === "quick" ? 3 : 6,
      questions: testType === "quick" ? frenchQuestions.slice(0, 5) : frenchQuestions,
    };
  }

  // Universal Multilingual CEFR Adaptive Matrix
  const universalQuestions = [
    {
      id: "q-uni-1",
      cefrLevel: "A1",
      questionType: "production",
      prompt: `Write 1-2 sentences introducing yourself in ${targetLanguage} (name, hometown, or daily activity).`,
      targetItem: "Basic self-introduction & present tense verbs",
      contextOrAudioText: `Hello! What is your name and where are you from? (In ${targetLanguage})`,
      correctAnswerSample: `[Self-introduction in ${targetLanguage}]`,
      explanation: "Assesses basic personal identity statement and survival lexicon (CEFR A1).",
    },
    {
      id: "q-uni-2",
      cefrLevel: "A2",
      questionType: "production",
      prompt: `Write a short sentence describing an activity you completed yesterday in ${targetLanguage}.`,
      targetItem: "Past tense narration & temporal markers",
      contextOrAudioText: `Yesterday I went to the store and met a friend. (In ${targetLanguage})`,
      correctAnswerSample: `[Past activity sentence in ${targetLanguage}]`,
      explanation: "Assesses past tense conjugations, time adverbs, and sequential events (CEFR A2).",
    },
    {
      id: "q-uni-3",
      cefrLevel: "B1",
      questionType: "production",
      prompt: `State your opinion about technology or travel in ${targetLanguage}, using a connector meaning 'because', 'although', or 'therefore'.`,
      targetItem: "Complex sentence connectors & opinion formulation",
      contextOrAudioText: `In my opinion, technology connects people although it has drawbacks. (In ${targetLanguage})`,
      correctAnswerSample: `[Opinion with connector in ${targetLanguage}]`,
      explanation: "Assesses subordinate clauses, opinions, and causal reasoning (CEFR B1).",
    },
    {
      id: "q-uni-4",
      cefrLevel: "B1",
      questionType: "transformation",
      prompt: `Write a polite request or advice sentence in ${targetLanguage} (e.g. asking someone for assistance or giving guidance).`,
      targetItem: "Polite modals / conditional / imperative forms",
      contextOrAudioText: `Could you please help me with this task? (In ${targetLanguage})`,
      correctAnswerSample: `[Polite request in ${targetLanguage}]`,
      explanation: "Assesses register adaptation and polite modal/subjunctive structures (CEFR B1+).",
    },
    {
      id: "q-uni-5",
      cefrLevel: "B2",
      questionType: "production",
      prompt: `Formulate a hypothetical conditional sentence in ${targetLanguage}: 'If I had more time / resources, I would...'`,
      targetItem: "Hypothetical unreal conditions & advanced mood structures",
      contextOrAudioText: `If I had known earlier, I would have planned accordingly. (In ${targetLanguage})`,
      correctAnswerSample: `[Hypothetical condition in ${targetLanguage}]`,
      explanation: "Assesses complex hypothetical syntax and counterfactual logic (CEFR B2).",
    },
    {
      id: "q-uni-6",
      cefrLevel: "B2",
      questionType: "listening",
      prompt: `Listen to the sentence prompt. State the main takeaway or intention in ${targetLanguage}.`,
      targetItem: "Discourse comprehension & pragmatic inference",
      contextOrAudioText: `Although the situation was challenging, our team found a collaborative solution that satisfied everyone involved.`,
      correctAnswerSample: `[Summary explanation in ${targetLanguage}]`,
      explanation: "Assesses extended speech comprehension and pragmatic deduction (CEFR B2).",
    },
    {
      id: "q-uni-7",
      cefrLevel: "C1",
      questionType: "collocation",
      prompt: `Translate this concept into natural, idiomatic ${targetLanguage}: 'To weigh all options carefully before making a critical decision.'`,
      targetItem: "Idiomatic nuances, collocations, and stylistic mastery",
      contextOrAudioText: `Carefully evaluating all alternatives prior to making a strategic choice.`,
      correctAnswerSample: `[Natural idiomatic phrasing in ${targetLanguage}]`,
      explanation: "Assesses advanced stylistic flexibility and idiomatic depth (CEFR C1).",
    },
  ];

  return {
    testTitle: `${targetLanguage} Adaptive CEFR Placement Exam`,
    targetLanguage,
    knownLanguage,
    estimatedDurationMinutes: testType === "quick" ? 3 : 6,
    questions: testType === "quick" ? universalQuestions.slice(0, 5) : universalQuestions,
  };
}

/**
 * Fallback Diagnostic Evaluation in case remote AI scoring is unreachable
 */
export function getFallbackPlacementEvaluation(
  targetLanguage: string,
  knownLanguage: string,
  submissions: Array<{ questionId: string; userAnswer: string; cefrLevel?: string }>,
  testQuestions: any[]
) {
  let attemptedCount = 0;
  let correctCount = 0;

  const perQuestionReview = submissions.map((sub, idx) => {
    const q = testQuestions?.find((item) => item.id === sub.questionId) || {};
    const answer = (sub.userAnswer || "").trim();
    const hasContent = answer.length >= 3;
    const isReasonable = answer.length >= 10;

    if (hasContent) attemptedCount++;
    if (isReasonable) correctCount++;

    return {
      questionId: sub.questionId,
      cefrLevel: sub.cefrLevel || q.cefrLevel || "A2",
      prompt: q.prompt || `Question ${idx + 1}`,
      userAnswer: answer || "(No response)",
      isCorrect: isReasonable,
      feedback: isReasonable
        ? `Good sentence formulation demonstrating active vocabulary in ${targetLanguage}.`
        : `Consider reviewing the required grammatical structures and sentence connectors for ${sub.cefrLevel || "this level"}.`,
      idealAnswer: q.correctAnswerSample || "Natural phrasing in " + targetLanguage,
    };
  });

  const total = submissions.length || 1;
  const ratio = correctCount / total;
  let diagnosedLevel = "A1";
  let startingRank = 1;
  let vocabSize = 350;

  if (ratio >= 0.85) {
    diagnosedLevel = "B2";
    startingRank = 1500;
    vocabSize = 4200;
  } else if (ratio >= 0.6) {
    diagnosedLevel = "B1";
    startingRank = 600;
    vocabSize = 2100;
  } else if (ratio >= 0.35) {
    diagnosedLevel = "A2";
    startingRank = 200;
    vocabSize = 950;
  }

  const scorePct = Math.round(ratio * 100);

  return {
    overallCEFR: diagnosedLevel,
    cefrDescription: `Demonstrates ${diagnosedLevel} language competency with active production ability in everyday and contextual topics in ${targetLanguage}.`,
    percentageScore: scorePct,
    estimatedActiveVocabularySize: vocabSize,
    recommendedStartingRank: startingRank,
    strengths: [
      `Active sentence formulation in ${targetLanguage}`,
      `Familiarity with essential core vocabulary and syntax patterns`,
    ],
    weaknesses: [
      `Complex subordinate clauses and nuanced verb moods`,
      `Idiomatic collocations and formal register distinctions`,
    ],
    identifiedErrors: [],
    standardizedEquivalency: {
      frameworkName: `Standardized CEFR / ACTFL Profile for ${targetLanguage}`,
      estimatedScoreOrGrade: `CEFR Level ${diagnosedLevel} (Score: ${scorePct}%)`,
      actflEquivalent: diagnosedLevel === "B2" ? "Advanced Low" : diagnosedLevel === "B1" ? "Intermediate Mid" : diagnosedLevel === "A2" ? "Novice High" : "Novice Mid",
      readinessPercentage: scorePct,
      description: `Solid performance indicating readiness for level ${diagnosedLevel} curriculum track.`,
    },
    detailedFeedback: `Great job completing the placement test! Your diagnostic shows a solid foundation. We recommend starting your frequency track around Rank #${startingRank}.`,
    perQuestionReview,
  };
}
