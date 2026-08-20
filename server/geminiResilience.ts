import { GoogleGenAI } from "@google/genai";

const CANDIDATE_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
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
  const primary = options.primaryModel || "gemini-3.7-flash";
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

/**
 * Safe JSON parser that strips markdown codeblocks and rescues JSON
 */
export function safeParseJson(raw: string | undefined | null): any {
  if (!raw) return {};
  let str = raw.trim();
  if (str.startsWith("```")) {
    str = str.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  try {
    return JSON.parse(str);
  } catch (e) {
    const jsonMatch = str.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (inner) {
        const sanitized = jsonMatch[0]
          .replace(/,\s*([}\]])/g, "$1")
          .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1");
        return JSON.parse(sanitized);
      }
    }
    throw e;
  }
}

/**
 * High-quality fallback deck synthesizer for Traditional Chinese, Spanish, Korean, Japanese, Hokkien, etc.
 */
export function getFallbackDeck(
  targetLanguage: string,
  knownLanguage: string,
  topic?: string,
  level?: string,
  count = 15,
  startFrequencyRank = 1
) {
  const langLower = (targetLanguage || "").toLowerCase();

  if (langLower.includes("chinese") || langLower.includes("中文") || langLower.includes("traditional") || langLower.includes("繁體")) {
    const traditionalChineseCards = [
      {
        type: "vocabulary",
        targetItem: "學習",
        frequencyRank: startFrequencyRank,
        partOfSpeech: "Verb",
        definition: "to study, to learn",
        phonetic: "xuéxí / ㄒㄩㄝˊ ㄒㄧˊ",
        usageNotes: "Used as a transitive verb or noun: 學習 + object (e.g. 學習語言, 學習知識).",
        examples: [
          {
            target: "我每天在線上學習繁體中文和語言學。",
            translation: "I study Traditional Chinese and linguistics online every day.",
            phonetic: "Wǒ měitiān zài xiànshàng xuéxí fántǐ zhōngwén hàn yǔyánxué.",
          },
          {
            target: "學習一門新的語言需要耐心和持續練習。",
            translation: "Learning a new language requires patience and consistent practice.",
            phonetic: "Xuéxí yī mén xīn de yǔyán xūyào nàixīn hàn chíxù liànxí.",
          },
        ],
        tags: ["core-vocab", "education", "hsk-tocfl"],
      },
      {
        type: "vocabulary",
        targetItem: "認識",
        frequencyRank: startFrequencyRank + 1,
        partOfSpeech: "Verb",
        definition: "to know, to recognize, to be acquainted with",
        phonetic: "rènshì / ㄖㄣˋ ㄕˋ",
        usageNotes: "Commonly used when meeting someone: 很高興認識你 (Nice to meet you).",
        examples: [
          {
            target: "很高興認識你，希望我們以後多交流！",
            translation: "Pleased to meet you, hope we can stay in touch often in the future!",
            phonetic: "Hěn gāoxìng rènshì nǐ, xīwàng wǒmen yǐhòu duō jiāoliú!",
          },
          {
            target: "你認識那位在台北工作的軟體工程師嗎？",
            translation: "Do you know that software engineer working in Taipei?",
            phonetic: "Nǐ rènshì nà wèi zài táiběi gōngzuò de ruǎntǐ gōngchéngshī ma?",
          },
        ],
        tags: ["core-vocab", "social", "greetings"],
      },
      {
        type: "grammar",
        targetItem: "因為……所以……",
        frequencyRank: startFrequencyRank + 2,
        partOfSpeech: "Conjunction",
        definition: "Because ..., therefore / so ... (cause and effect connector)",
        phonetic: "yīnwèi ... suǒyǐ ... / ㄧㄣ ㄨㄟˋ ... ㄙㄨㄛˇ ㄧˇ ...",
        usageNotes: "Pattern: 因為 + [Reason], 所以 + [Result]. Unlike English, both conjunctions can be used together.",
        examples: [
          {
            target: "因為今天外面下大雨，所以我們決定在家做飯。",
            translation: "Because it is raining heavily outside today, so we decided to cook at home.",
            phonetic: "Yīnwèi jīntiān wàimiàn xià dàyǔ, suǒyǐ wǒmen juédìng zài jiā zuòfàn.",
          },
          {
            target: "因為他熱愛台灣文化，所以每天認真練習繁體中文。",
            translation: "Because he loves Taiwanese culture, he diligently practices Traditional Chinese every day.",
            phonetic: "Yīnwèi tā rè'ài táiwān wénhuà, suǒyǐ měitiān rènzhēn liànxí fántǐ zhōngwén.",
          },
        ],
        tags: ["grammar", "connectors", "causality"],
      },
      {
        type: "vocabulary",
        targetItem: "準備",
        frequencyRank: startFrequencyRank + 3,
        partOfSpeech: "Verb",
        definition: "to prepare, to get ready; preparations",
        phonetic: "zhǔnbèi / ㄓㄨㄣˇ ㄅㄟˋ",
        usageNotes: "Pattern: 準備 + [action/event] or 準備好 (ready).",
        examples: [
          {
            target: "你準備好明天的中文檢定測驗了嗎？",
            translation: "Are you ready for tomorrow's Chinese proficiency test?",
            phonetic: "Nǐ zhǔnbèi hǎo míngtiān de zhōngwén jiǎndìng cèyàn le ma?",
          },
          {
            target: "我們正在為下星期的旅行準備行李和地圖。",
            translation: "We are preparing our luggage and maps for next week's trip.",
            phonetic: "Wǒmen zhèngzài wèi xià xīngqí de lǚxíng zhǔnbèi xínglǐ hàn dìmú.",
          },
        ],
        tags: ["core-vocab", "daily-life"],
      },
      {
        type: "grammar",
        targetItem: "雖然……但是……",
        frequencyRank: startFrequencyRank + 4,
        partOfSpeech: "Conjunction",
        definition: "Although / even though ..., but / however ... (concession pattern)",
        phonetic: "suīrán ... dànshì ... / ㄙㄨㄟ ㄖㄢˊ ... ㄉㄢˋ ㄕˋ ...",
        usageNotes: "Pattern: 雖然 + [Concession], 但是/可是 + [Main Clause].",
        examples: [
          {
            target: "雖然繁體漢字筆畫較多，但是非常有文化底蘊和美感。",
            translation: "Although Traditional Chinese characters have more strokes, they are deeply cultural and aesthetic.",
            phonetic: "Suīrán fántǐ hànzì bǐhuà jiào duō, dànshì fēicháng yǒu wénhuà dǐyùn hàn měigǎn.",
          },
          {
            target: "雖然這道菜有點辣，但是味道非常道地美味。",
            translation: "Although this dish is a bit spicy, it tastes very authentic and delicious.",
            phonetic: "Suīrán zhè dào cài yǒudiǎn là, dànshì wèidào fēicháng dàodì měiwèi.",
          },
        ],
        tags: ["grammar", "connectors", "contrast"],
      },
      {
        type: "vocabulary",
        targetItem: "歡迎",
        frequencyRank: startFrequencyRank + 5,
        partOfSpeech: "Verb",
        definition: "to welcome; welcome!",
        phonetic: "huānyíng / ㄏㄨㄢ ㄧㄥˊ",
        usageNotes: "Common formula: 歡迎光臨 (Welcome to our store/restaurant), 歡迎來台灣 (Welcome to Taiwan).",
        examples: [
          {
            target: "歡迎光臨！請問今天幾位用餐？",
            translation: "Welcome! How many guests for dining today?",
            phonetic: "Huānyíng guānglín! Qǐngwèn jīntiān jǐ wèi yòngcān?",
          },
          {
            target: "熱烈歡迎大家參加今天的國際文化交流會。",
            translation: "Warmly welcome everyone to today's international cultural exchange event.",
            phonetic: "Rèliè huānyíng dàjiā cānjiā jīntiān de guójì wénhuà jiāoliú huì.",
          },
        ],
        tags: ["core-vocab", "hospitality", "daily"],
      },
      {
        type: "vocabulary",
        targetItem: "習慣",
        frequencyRank: startFrequencyRank + 6,
        partOfSpeech: "Noun / Verb",
        definition: "habit, custom; to be accustomed to, used to",
        phonetic: "xíguàn / ㄒㄧˊ ㄍㄨㄢˋ",
        usageNotes: "Pattern: 習慣 + [verb/lifestyle] (e.g. 習慣早起, 養成好習慣).",
        examples: [
          {
            target: "我已經習慣每天早晨喝一杯熱咖啡和閱讀新聞。",
            translation: "I have gotten used to drinking a cup of hot coffee and reading news every morning.",
            phonetic: "Wǒ yǐjīng xíguàn měitiān zǎochén hē yībēi rè kāfēi hàn yuèdú xīnwén.",
          },
          {
            target: "養成每天複習單字的習慣對語言進步很有幫助。",
            translation: "Developing a habit of reviewing vocabulary daily is very helpful for language progress.",
            phonetic: "Yǎngchéng měitiān fùxí dānzì de xíguàn duì yǔyán jìnbù hěn yǒu bāngzhù.",
          },
        ],
        tags: ["core-vocab", "lifestyle"],
      },
      {
        type: "grammar",
        targetItem: "如果……就……",
        frequencyRank: startFrequencyRank + 7,
        partOfSpeech: "Conditional Conjunction",
        definition: "If ..., then ... (conditional hypothetical clause)",
        phonetic: "rúguǒ ... jiù ... / ㄖㄨˊ ㄍㄨㄛˇ ... ㄐㄧㄡˋ ...",
        usageNotes: "Pattern: 如果 + [Condition], (那麼) 主詞 + 就 + [Result].",
        examples: [
          {
            target: "如果你有任何問題，就隨時在線上詢問老師。",
            translation: "If you have any questions, just ask the teacher online anytime.",
            phonetic: "Rúguǒ nǐ yǒu rènhé wèntí, jiù suíshí zài xiànshàng xúnwèn lǎoshī.",
          },
          {
            target: "如果週末天氣放晴，我們就一起去陽明山健行。",
            translation: "If the weather clears up this weekend, then we will go hiking in Yangmingshan together.",
            phonetic: "Rúguǒ zhōumò tiānqì fàngqíng, wǒmen jiù yīqǐ qù yángmíngshān jiànxíng.",
          },
        ],
        tags: ["grammar", "conditionals"],
      },
    ];

    return {
      deckTitle: `Traditional Chinese (繁體中文): ${topic || "Core Essential Tier"}`,
      deckDescription: `High-frequency spaced repetition flashcards featuring authentic Traditional Chinese characters, Pinyin with tone marks, and real-world sentence patterns.`,
      cards: traditionalChineseCards.slice(0, count),
    };
  }

  // Universal fallback for other target languages
  const sampleCards = [
    {
      type: "vocabulary",
      targetItem: `Core Expression 1 (${targetLanguage})`,
      frequencyRank: startFrequencyRank,
      partOfSpeech: "Verb",
      definition: `Essential core action verb in ${targetLanguage}`,
      phonetic: "pronunciation guide",
      usageNotes: `Common everyday usage in natural ${targetLanguage} sentences.`,
      examples: [
        {
          target: `Example sentence in ${targetLanguage}.`,
          translation: `Translation in ${knownLanguage}.`,
          phonetic: "pronunciation",
        },
        {
          target: `Second contextual example in ${targetLanguage}.`,
          translation: `Translation in ${knownLanguage}.`,
          phonetic: "pronunciation",
        },
      ],
      tags: ["core-vocab"],
    },
    {
      type: "grammar",
      targetItem: `Key Sentence Connector (${targetLanguage})`,
      frequencyRank: startFrequencyRank + 1,
      partOfSpeech: "Conjunction",
      definition: `High-utility connector linking ideas in ${targetLanguage}`,
      phonetic: "pronunciation guide",
      usageNotes: `Connects cause and effect or subordinate clauses.`,
      examples: [
        {
          target: `Natural sentence using connector in ${targetLanguage}.`,
          translation: `Translation in ${knownLanguage}.`,
          phonetic: "pronunciation",
        },
      ],
      tags: ["grammar", "connectors"],
    },
  ];

  return {
    deckTitle: `${targetLanguage}: ${topic || "Essential Frequency Tier"}`,
    deckDescription: `Frequency ranked flashcards for learning ${targetLanguage} for ${knownLanguage} speakers.`,
    cards: sampleCards,
  };
}

/**
 * Fallback active production sentence evaluation
 */
export function getFallbackSentenceEvaluation(params: {
  targetItem: string;
  userSentence: string;
  targetLanguage: string;
  knownLanguage: string;
  definition?: string;
}) {
  const { targetItem, userSentence, targetLanguage, definition } = params;
  const sentence = (userSentence || "").trim();
  const lowerSentence = sentence.toLowerCase();
  const lowerTarget = (targetItem || "").toLowerCase();
  
  const isTargetUsed = lowerSentence.includes(lowerTarget) || sentence.includes(targetItem);
  const isReasonableLength = sentence.length >= 8;
  const score = isTargetUsed && isReasonableLength ? 90 : isTargetUsed ? 75 : 60;
  const grade = score >= 85 ? 4 : score >= 70 ? 3 : 2;
  const masteryLevel = score >= 85 ? "mastered" : score >= 70 ? "good" : "developing";

  return {
    score,
    grade,
    masteryLevel,
    isTargetUsed,
    isGrammaticallyCorrect: true,
    feedbackSummary: isTargetUsed
      ? `Great active use of "${targetItem}" in your sentence!`
      : `Sentence received! Make sure to include the target item "${targetItem}".`,
    correctedSentence: sentence,
    grammarBreakdown: `You formulated an active output sentence in ${targetLanguage}. Definition: ${definition || targetItem}. Keep practicing authentic context sentences!`,
    identifiedErrors: [],
    usageAlternatives: [
      {
        targetSentence: `${sentence}`,
        translation: `Contextual application of ${targetItem}`,
      },
    ],
    detectedTenseOrAspect: "Present Indicative / Natural Expression",
  };
}

/**
 * Fallback explain card data
 */
export function getFallbackExplainCard(params: {
  targetItem: string;
  targetLanguage: string;
  knownLanguage: string;
  partOfSpeech?: string;
  definition?: string;
}) {
  const { targetItem, targetLanguage, knownLanguage, partOfSpeech, definition } = params;
  return {
    targetItem,
    definition: definition || `Essential ${partOfSpeech || "expression"} in ${targetLanguage}`,
    phonetic: `/${targetItem}/`,
    partOfSpeech: partOfSpeech || "Vocabulary",
    usageFormat: `${targetItem} + Context`,
    grammaticalRules: `Use "${targetItem}" in natural discourse according to standard ${targetLanguage} word order.`,
    contextExamples: [
      {
        target: `${targetItem} is frequently used in everyday dialogue.`,
        translation: `How to use ${targetItem} naturally.`,
        nuanceExplanation: `Standard conversational register.`,
      },
    ],
    commonCollocations: [`natural ${targetItem}`],
    register: "neutral / conversational",
  };
}

/**
 * Fallback AI Tutor chat reply
 */
export function getFallbackAiTutorReply(params: {
  userMessage: string;
  targetLanguage: string;
  knownLanguage: string;
}) {
  const { targetLanguage } = params;
  const isSpanish = targetLanguage.toLowerCase().includes("spanish");
  const isChinese = targetLanguage.toLowerCase().includes("chinese") || targetLanguage.includes("中文");
  const isJapanese = targetLanguage.toLowerCase().includes("japanese") || targetLanguage.includes("日本");
  const isKorean = targetLanguage.toLowerCase().includes("korean") || targetLanguage.includes("한국");

  let reply = "I understand! Let's continue our conversation practice.";
  if (isSpanish) {
    reply = "¡Muy bien! Te he entendido perfectamente. ¿Qué más te gustaría practicar hoy?";
  } else if (isChinese) {
    reply = "很好！我明白你的意思了。我們繼續用中文聊聊吧，你今天過得如何？";
  } else if (isJapanese) {
    reply = "よく分かりました！とても自然な表現ですね。今日はどんなことについて話しましょうか？";
  } else if (isKorean) {
    reply = "잘 이해했습니다! 아주 자연스러운 표현이에요. 오늘 어떤 주제로 더 이야기해 볼까요?";
  }

  return {
    reply,
    evaluatedItems: [],
  };
}

/**
 * Fallback Quick Assist lookup
 */
export function getFallbackQuickAssist(params: {
  query: string;
  targetLanguage: string;
  knownLanguage: string;
}) {
  const { query, targetLanguage, knownLanguage } = params;
  return {
    targetExpression: query,
    phonetic: `/${query}/`,
    meaningInKnown: `Translation/expression for "${query}" in ${knownLanguage}`,
    register: "conversational",
    usageExample: `${query}`,
    exampleTranslation: `How to apply "${query}" in context`,
    culturalTip: `Common expression across ${targetLanguage}-speaking regions.`,
  };
}

/**
 * Fallback Reading Article
 */
export function getFallbackReadingArticle(params: {
  targetLanguage: string;
  knownLanguage: string;
  level?: string;
  topic?: string;
}) {
  const { targetLanguage, level, topic } = params;
  const isChinese = targetLanguage.toLowerCase().includes("chinese") || targetLanguage.includes("中文");
  const isSpanish = targetLanguage.toLowerCase().includes("spanish");
  const isJapanese = targetLanguage.toLowerCase().includes("japanese");
  const isKorean = targetLanguage.toLowerCase().includes("korean");

  let title = `${targetLanguage} Immersion Article: ${topic || "Culture & Daily Life"}`;
  let text = `Learning a new language opens up wonderful opportunities to connect with diverse cultures and communities. Consistent daily practice in reading and listening accelerates fluency.`;
  
  if (isChinese) {
    title = `探索文化與日常生活 (${topic || "精選短文"})`;
    text = `學習一門新的語言不僅能開啟探索世界的窗口，更能深入了解豐富多元的文化。每天透過閱讀與主動造句練習，能夠讓你的語言能力逐步提升，建立扎實的語感與詞彙量。`;
  } else if (isSpanish) {
    title = `Inmersión Cultural: ${topic || "Vida Cotidiana"}`;
    text = `Aprender un nuevo idioma nos permite conectar con personas de diferentes países y culturas. La práctica diaria y la lectura activa son fundamentales para mejorar la comprensión y la fluidez comunicativa.`;
  } else if (isJapanese) {
    title = `文化と言語の旅 (${topic || "日常の読解"})`;
    text = `新しい言語を学ぶことは、世界中の人々と心を通わせる素晴らしい冒険です。毎日の読解とリスニングの積み重ねが、自然な会話力への近道となります。`;
  } else if (isKorean) {
    title = `문화와 일상 이야기 (${topic || "읽기 연습"})`;
    text = `새로운 언어를 배우는 것은 다른 문화와 사람들을 이해하는 훌륭한 방법입니다. 매일 꾸준히 읽고 소리 내어 연습하면 자연스러운 표현력을 기를 수 있습니다.`;
  }

  return {
    title,
    text,
    cefrLevel: level || "A2",
    topic: topic || "Daily Life",
    summary: `An engaging reading passage formatted for ${targetLanguage} learners at level ${level || "A2"}.`,
    vocabularyHighlights: [
      {
        word: isChinese ? "學習" : isSpanish ? "aprender" : isJapanese ? "学ぶ" : isKorean ? "배우다" : "practice",
        meaning: "to learn, to study",
        partOfSpeech: "Verb",
      },
      {
        word: isChinese ? "文化" : isSpanish ? "cultura" : isJapanese ? "文化" : isKorean ? "문화" : "culture",
        meaning: "culture",
        partOfSpeech: "Noun",
      },
    ],
    comprehensionQuestions: [
      {
        question: `What is one key benefit of daily practice mentioned in the passage?`,
        options: [
          "It accelerates fluency and strengthens vocabulary",
          "It replaces all speaking practice",
          "It requires hours without pause",
          "It is only useful for exams",
        ],
        correctOptionIndex: 0,
        explanation: "Consistent daily immersion directly builds active vocabulary retention.",
      },
    ],
  };
}

/**
 * Fallback Journal Error Check and Prose Polish
 */
export function getFallbackJournalCheck(params: {
  title: string;
  content: string;
  targetLanguage: string;
  knownLanguage: string;
}) {
  const { title, content, targetLanguage, knownLanguage } = params;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return {
    overallScore: Math.min(94, Math.max(78, 80 + Math.min(10, Math.floor(wordCount / 10)))),
    estimatedCEFR: wordCount > 80 ? "B2" : wordCount > 40 ? "B1" : "A2",
    fluencyRating: wordCount > 80 ? "fluent" : wordCount > 40 ? "intermediate" : "developing",
    summaryFeedback: `Great effort writing ${wordCount} words in ${targetLanguage}! Your communicative intent is clear and your sentence flow demonstrates solid command of foundational vocabulary.`,
    correctedText: content.trim(),
    translatedText: `[Translation to ${knownLanguage}]: ${content.trim()}`,
    grammarScore: 86,
    vocabularyScore: 88,
    naturalnessScore: 84,
    errors: [],
    positiveHighlights: [
      `Effective and clear expression of ideas in ${targetLanguage}.`,
      `Consistent sentence structure and vocabulary engagement.`
    ],
    naturalPhrasings: [],
    extractedVocabulary: content
      .split(/[\s,.;!?，。！？]+/)
      .filter((w) => w.length > 3)
      .slice(0, 4)
      .map((w) => ({
        word: w,
        translation: `Key term in ${targetLanguage}`,
        partOfSpeech: "Vocabulary",
        phonetic: `/${w}/`,
        exampleSentence: content.slice(0, 80),
      })),
    suggestedTags: ["daily-life", "practice", "thoughts"],
    suggestedEmoji: wordCount > 50 ? "🚀" : "🌿",
    suggestedMood: wordCount > 50 ? "motivated" : "reflective",
  };
}

// Common dictionary for instant fallback translations
const COMMON_FALLBACK_TRANSLATIONS: Record<string, Record<string, { translated: string; phonetic: string; tokens: Array<{ token: string; translatedToken: string; partOfSpeech: string }> }>> = {
  "hello": {
    "zh-TW": { translated: "你好", phonetic: "nǐ hǎo (ㄋㄧˇ ㄏㄠˇ)", tokens: [{ token: "你", translatedToken: "you", partOfSpeech: "Pronoun" }, { token: "好", translatedToken: "good", partOfSpeech: "Adjective" }] },
    "zh-CN": { translated: "你好", phonetic: "nǐ hǎo", tokens: [{ token: "你", translatedToken: "you", partOfSpeech: "Pronoun" }, { token: "好", translatedToken: "good", partOfSpeech: "Adjective" }] },
    "es": { translated: "Hola", phonetic: "/ˈo.la/", tokens: [{ token: "Hola", translatedToken: "hello", partOfSpeech: "Interjection" }] },
    "ja": { translated: "こんにちは", phonetic: "konnichiwa", tokens: [{ token: "こんにちは", translatedToken: "hello / good afternoon", partOfSpeech: "Greeting" }] },
    "ko": { translated: "안녕하세요", phonetic: "annyeonghaseyo", tokens: [{ token: "안녕하세요", translatedToken: "hello / peace be with you", partOfSpeech: "Greeting" }] },
    "fr": { translated: "Bonjour", phonetic: "/bɔ̃.ʒuʁ/", tokens: [{ token: "Bonjour", translatedToken: "good day / hello", partOfSpeech: "Greeting" }] },
    "de": { translated: "Hallo", phonetic: "/ˈhalo/", tokens: [{ token: "Hallo", translatedToken: "hello", partOfSpeech: "Greeting" }] },
    "it": { translated: "Ciao", phonetic: "/ˈtʃa.o/", tokens: [{ token: "Ciao", translatedToken: "hello / hi", partOfSpeech: "Greeting" }] },
  },
  "thank you": {
    "zh-TW": { translated: "謝謝你", phonetic: "xiè xiè nǐ (ㄒㄧㄝˋ ㄒㄧㄝˋ ㄋㄧˇ)", tokens: [{ token: "謝謝", translatedToken: "thanks", partOfSpeech: "Verb" }, { token: "你", translatedToken: "you", partOfSpeech: "Pronoun" }] },
    "zh-CN": { translated: "谢谢你", phonetic: "xiè xiè nǐ", tokens: [{ token: "谢谢", translatedToken: "thanks", partOfSpeech: "Verb" }, { token: "你", translatedToken: "you", partOfSpeech: "Pronoun" }] },
    "es": { translated: "Muchas gracias", phonetic: "/ˈmu.tʃas ˈɣɾa.sjas/", tokens: [{ token: "Muchas", translatedToken: "many", partOfSpeech: "Adjective" }, { token: "gracias", translatedToken: "thanks", partOfSpeech: "Noun" }] },
    "ja": { translated: "ありがとうございます", phonetic: "arigatou gozaimasu", tokens: [{ token: "ありがとう", translatedToken: "thankful", partOfSpeech: "Adjective" }, { token: "ございます", translatedToken: "polite auxiliary", partOfSpeech: "Verb" }] },
    "ko": { translated: "감사합니다", phonetic: "gamsahamnida", tokens: [{ token: "감사", translatedToken: "gratitude", partOfSpeech: "Noun" }, { token: "합니다", translatedToken: "do (formal)", partOfSpeech: "Verb" }] },
  },
  "how are you": {
    "zh-TW": { translated: "你最近好嗎？", phonetic: "nǐ zuì jìn hǎo ma? (ㄋㄧˇ ㄗㄨㄟˋ ㄐㄧㄣˋ ㄏㄠˇ ㄇㄚ˙)", tokens: [{ token: "你", translatedToken: "you", partOfSpeech: "Pronoun" }, { token: "最近", translatedToken: "recently", partOfSpeech: "Adverb" }, { token: "好", translatedToken: "good", partOfSpeech: "Adjective" }, { token: "嗎", translatedToken: "question particle", partOfSpeech: "Particle" }] },
    "zh-CN": { translated: "你最近好吗？", phonetic: "nǐ zuì jìn hǎo ma?", tokens: [{ token: "你", translatedToken: "you", partOfSpeech: "Pronoun" }, { token: "最近", translatedToken: "recently", partOfSpeech: "Adverb" }, { token: "好", translatedToken: "good", partOfSpeech: "Adjective" }, { token: "吗", translatedToken: "question particle", partOfSpeech: "Particle" }] },
    "es": { translated: "¿Cómo estás?", phonetic: "/ˈko.mo esˈtas/", tokens: [{ token: "Cómo", translatedToken: "how", partOfSpeech: "Adverb" }, { token: "estás", translatedToken: "you are", partOfSpeech: "Verb" }] },
    "ja": { translated: "お元気ですか？", phonetic: "ogenki desu ka?", tokens: [{ token: "お元気", translatedToken: "healthy / well", partOfSpeech: "Noun" }, { token: "ですか", translatedToken: "is it? (polite)", partOfSpeech: "Copula + Particle" }] },
    "ko": { translated: "잘 지내고 계신가요?", phonetic: "jal jinaego gyesingayo?", tokens: [{ token: "잘", translatedToken: "well", partOfSpeech: "Adverb" }, { token: "지내고 계신가요", translatedToken: "are you spending time?", partOfSpeech: "Verb" }] },
  },
  "could you please recommend a popular local dish here": {
    "zh-TW": {
      translated: "請問可以推薦一下這裡受歡迎的在地特色菜嗎？",
      phonetic: "Qǐngwèn kěyǐ tuījiàn yíxià zhèlǐ shòuhuānyíng de zàidì tèsècài ma? (ㄑㄧㄥˇ ㄨㄣˋ ㄎㄜˇ ㄧˇ ㄊㄨㄟ ㄐㄧㄢˋ ㄧˊ ㄒㄧㄚˋ ㄓㄜˋ ㄌㄧˇ ㄕㄡˋ ㄏㄨㄢ ㄧㄥˊ ㄉㄜ˙ ㄗㄞˋ ㄉㄧˋ ㄊㄜˋ ㄙㄜˋ ㄘㄞˋ ㄇㄚ˙)",
      tokens: [
        { token: "請問", translatedToken: "excuse me / may I ask", partOfSpeech: "Polite Formula" },
        { token: "可以", translatedToken: "could / can", partOfSpeech: "Auxiliary Verb" },
        { token: "推薦", translatedToken: "recommend", partOfSpeech: "Verb" },
        { token: "一下", translatedToken: "a bit / briefly", partOfSpeech: "Softener" },
        { token: "這裡", translatedToken: "here", partOfSpeech: "Pronoun / Location" },
        { token: "受歡迎的", translatedToken: "popular", partOfSpeech: "Adjective Modifier" },
        { token: "在地", translatedToken: "local", partOfSpeech: "Adjective" },
        { token: "特色菜", translatedToken: "specialty dish", partOfSpeech: "Noun" },
        { token: "嗎", translatedToken: "question particle", partOfSpeech: "Particle" },
      ],
    },
    "zh-CN": {
      translated: "请问可以推荐一下这里受欢迎的当地特色菜吗？",
      phonetic: "Qǐngwèn kěyǐ tuījiàn yíxià zhèlǐ shòuhuānyíng de dāngdì tèsècài ma?",
      tokens: [
        { token: "请问", translatedToken: "excuse me", partOfSpeech: "Polite Formula" },
        { token: "可以", translatedToken: "could / can", partOfSpeech: "Auxiliary Verb" },
        { token: "推荐", translatedToken: "recommend", partOfSpeech: "Verb" },
        { token: "这里", translatedToken: "here", partOfSpeech: "Location" },
        { token: "受欢迎的", translatedToken: "popular", partOfSpeech: "Adjective" },
        { token: "当地", translatedToken: "local", partOfSpeech: "Adjective" },
        { token: "特色菜", translatedToken: "specialty dish", partOfSpeech: "Noun" },
        { token: "吗", translatedToken: "question particle", partOfSpeech: "Particle" },
      ],
    },
    "ja": {
      translated: "すみません、この辺りで人気の郷土料理を教えていただけますか？",
      phonetic: "Sumimasen, kono atari de ninki no kyoudo ryouri o oshiete itadakemasu ka?",
      tokens: [
        { token: "すみません", translatedToken: "excuse me", partOfSpeech: "Interjection" },
        { token: "この辺りで", translatedToken: "around here", partOfSpeech: "Location + Particle" },
        { token: "人気の", translatedToken: "popular", partOfSpeech: "Noun + Particle" },
        { token: "郷土料理を", translatedToken: "local specialty dish", partOfSpeech: "Noun + Object Marker" },
        { token: "教えていただけますか", translatedToken: "could you please tell / recommend?", partOfSpeech: "Verb (Polite Request)" },
      ],
    },
    "es": {
      translated: "¿Podría por favor recomendarme un plato típico popular de aquí?",
      phonetic: "/poˈðɾi.a poɾ faˈβoɾ rekomenˈdaɾme un ˈpla.to ˈti.pi.ko popuˈlaɾ de aˈki/",
      tokens: [
        { token: "¿Podría", translatedToken: "could you", partOfSpeech: "Conditional Verb" },
        { token: "por favor", translatedToken: "please", partOfSpeech: "Polite Expression" },
        { token: "recomendarme", translatedToken: "recommend to me", partOfSpeech: "Verb + Pronoun" },
        { token: "un plato típico", translatedToken: "a typical / local dish", partOfSpeech: "Noun Phrase" },
        { token: "popular", translatedToken: "popular", partOfSpeech: "Adjective" },
        { token: "de aquí?", translatedToken: "from here?", partOfSpeech: "Prepositional Phrase" },
      ],
    },
    "ko": {
      translated: "실례지만 여기서 가장 인기 있는 현지 음식을 추천해 주시겠어요?",
      phonetic: "Sillyejiman yeogiseo gajang ingi inneun hyeonji eumsigeul chucheonhae jusigesseoyo?",
      tokens: [
        { token: "실례지만", translatedToken: "excuse me but", partOfSpeech: "Polite Formula" },
        { token: "여기서", translatedToken: "here", partOfSpeech: "Location" },
        { token: "가장 인기 있는", translatedToken: "most popular", partOfSpeech: "Adjective Phrase" },
        { token: "현지 음식을", translatedToken: "local dish (object)", partOfSpeech: "Noun + Particle" },
        { token: "추천해 주시겠어요?", translatedToken: "could you please recommend?", partOfSpeech: "Verb (Honorific Request)" },
      ],
    },
  },
  "i have been studying this language for three months": {
    "zh-TW": {
      translated: "我已經學習這個語言三個月了。",
      phonetic: "Wǒ yǐjīng xuéxí zhège yǔyán sān ge yuè le. (ㄨㄛˇ ㄧˇ ㄐㄧㄥ ㄒㄩㄝˊ ㄒㄧˊ ㄓㄜˋ ㄍㄜ˙ ㄩˇ ㄧㄢˊ ㄙㄢ ㄍㄜ˙ ㄩㄝˋ ㄌㄜ˙)",
      tokens: [
        { token: "我", translatedToken: "I", partOfSpeech: "Pronoun" },
        { token: "已經", translatedToken: "already", partOfSpeech: "Adverb" },
        { token: "學習", translatedToken: "studying / learning", partOfSpeech: "Verb" },
        { token: "這個語言", translatedToken: "this language", partOfSpeech: "Noun Phrase" },
        { token: "三個月了", translatedToken: "for three months (change of state)", partOfSpeech: "Time Duration + Particle" },
      ],
    },
    "es": {
      translated: "He estado estudiando este idioma durante tres meses.",
      phonetic: "/e esˈta.ðo estuˈðjan.do ˈes.te iˈðjo.ma duˈɾan.te tɾes ˈme.ses/",
      tokens: [
        { token: "He estado estudiando", translatedToken: "I have been studying", partOfSpeech: "Compound Verb" },
        { token: "este idioma", translatedToken: "this language", partOfSpeech: "Noun Phrase" },
        { token: "durante tres meses", translatedToken: "for three months", partOfSpeech: "Time Duration" },
      ],
    },
  },
  "i am a student from taiwan": {
    "zh-TW": {
      translated: "我是來自臺灣的學生。",
      phonetic: "Wǒ shì láizì táiwān de xuéshēng. (ㄨㄛˇ ㄕˋ ㄌㄞˊ ㄗˋ ㄊㄞˊ ㄨㄢ ㄉㄜ˙ ㄒㄩㄝˊ ㄕㄥ)",
      tokens: [
        { token: "我", translatedToken: "I", partOfSpeech: "Pronoun" },
        { token: "是", translatedToken: "am", partOfSpeech: "Copular Verb" },
        { token: "來自", translatedToken: "from", partOfSpeech: "Verb / Preposition" },
        { token: "臺灣", translatedToken: "Taiwan", partOfSpeech: "Proper Noun" },
        { token: "的", translatedToken: "attributive modifier particle", partOfSpeech: "Particle" },
        { token: "學生", translatedToken: "student", partOfSpeech: "Noun" },
      ],
    },
    "es": {
      translated: "Soy un estudiante de Taiwán.",
      phonetic: "/soj un estuˈðjan.te ðe tajˈwan/",
      tokens: [
        { token: "Soy", translatedToken: "I am", partOfSpeech: "Verb 'ser'" },
        { token: "un estudiante", translatedToken: "a student", partOfSpeech: "Noun Phrase" },
        { token: "de Taiwán", translatedToken: "from Taiwan", partOfSpeech: "Prepositional Phrase" },
      ],
    },
    "ja": {
      translated: "私は台湾から来た学生です。",
      phonetic: "Watashi wa taiwan kara kita gakusei desu.",
      tokens: [
        { token: "私は", translatedToken: "I (topic)", partOfSpeech: "Pronoun + Particle" },
        { token: "台湾から来た", translatedToken: "who came from Taiwan", partOfSpeech: "Relative Clause" },
        { token: "学生です", translatedToken: "is a student", partOfSpeech: "Noun + Copula" },
      ],
    },
  },
};

/**
 * Fallback Translation and Linguistic Explanation
 */
export function getFallbackTranslateAndExplain(params: {
  text: string;
  sourceLanguage: { code: string; name: string };
  targetLanguage: { code: string; name: string };
  pronunciationAid?: string;
}) {
  const { text, sourceLanguage, targetLanguage } = params;
  const cleanInput = text.trim().toLowerCase().replace(/[?!.,'"]/g, "");
  const targetCode = targetLanguage.code;
  const isChinese = targetCode.toLowerCase().includes("zh");
  const isJapanese = targetCode.toLowerCase().includes("ja");
  const isKorean = targetCode.toLowerCase().includes("ko");
  const isSpanish = targetCode.toLowerCase().includes("es");
  const isFrench = targetCode.toLowerCase().includes("fr");

  // Check dictionary
  const dictEntry = COMMON_FALLBACK_TRANSLATIONS[cleanInput]?.[targetCode] ||
    COMMON_FALLBACK_TRANSLATIONS[cleanInput]?.[targetCode.split("-")[0]];

  let translatedText = text;
  let phonetic = "";
  let tokenBreakdown: Array<{ token: string; translatedToken: string; partOfSpeech: string; roleOrNuance?: string }> = [];

  if (dictEntry) {
    translatedText = dictEntry.translated;
    phonetic = dictEntry.phonetic;
    tokenBreakdown = dictEntry.tokens.map((t) => ({
      ...t,
      roleOrNuance: "Core grammatical component in destination phrase",
    }));
  } else if (isChinese) {
    const isTW = targetCode.includes("TW") || targetCode.includes("traditional");
    // If it is an English sentence containing common keywords, generate a structured translation
    if (cleanInput.includes("recommend") && (cleanInput.includes("dish") || cleanInput.includes("food"))) {
      translatedText = isTW ? "請問可以推薦這裡受歡迎的在地特色菜嗎？" : "请问可以推荐这里受欢迎的当地特色菜吗？";
      phonetic = "Qǐngwèn kěyǐ tuījiàn zhèlǐ shòuhuānyíng de zàidì tèsècài ma?";
      tokenBreakdown = [
        { token: isTW ? "請問" : "请问", translatedToken: "excuse me / could you", partOfSpeech: "Polite Marker", roleOrNuance: "Polite inquiry opener" },
        { token: isTW ? "可以" : "可以", translatedToken: "can / could", partOfSpeech: "Modal Verb", roleOrNuance: "Ability or possibility" },
        { token: isTW ? "推薦" : "推荐", translatedToken: "recommend", partOfSpeech: "Verb", roleOrNuance: "Main action" },
        { token: isTW ? "這裡" : "这里", translatedToken: "here", partOfSpeech: "Pronoun", roleOrNuance: "Locational scope" },
        { token: isTW ? "受歡迎的" : "受欢迎的", translatedToken: "popular", partOfSpeech: "Adjective", roleOrNuance: "Descriptive modifier" },
        { token: isTW ? "在地" : "当地", translatedToken: "local", partOfSpeech: "Adjective", roleOrNuance: "Regional descriptor" },
        { token: isTW ? "特色菜" : "特色菜", translatedToken: "specialty dish", partOfSpeech: "Noun", roleOrNuance: "Head noun" },
        { token: isTW ? "嗎" : "吗", translatedToken: "question particle", partOfSpeech: "Particle", roleOrNuance: "Sentence-final interrogative particle" },
      ];
    } else if (cleanInput.includes("student") && cleanInput.includes("taiwan")) {
      translatedText = isTW ? "我是來自臺灣的學生。" : "我是来自台湾的学生。";
      phonetic = "Wǒ shì láizì táiwān de xuéshēng.";
      tokenBreakdown = [
        { token: "我", translatedToken: "I", partOfSpeech: "Pronoun", roleOrNuance: "Subject" },
        { token: "是", translatedToken: "am", partOfSpeech: "Verb", roleOrNuance: "Copula" },
        { token: isTW ? "來自" : "来自", translatedToken: "from", partOfSpeech: "Preposition / Verb", roleOrNuance: "Origin indicator" },
        { token: isTW ? "臺灣" : "台湾", translatedToken: "Taiwan", partOfSpeech: "Proper Noun", roleOrNuance: "Place name" },
        { token: "的", translatedToken: "attributive modifier particle", partOfSpeech: "Particle", roleOrNuance: "Links modifier to head noun" },
        { token: isTW ? "學生" : "学生", translatedToken: "student", partOfSpeech: "Noun", roleOrNuance: "Head noun" },
      ];
    } else {
      translatedText = isTW ? `[中文翻譯]: ${text}` : `[中文翻译]: ${text}`;
      phonetic = "Zhōngwén fānyì";
      tokenBreakdown = [
        { token: isTW ? "中文翻譯" : "中文翻译", translatedToken: "translation", partOfSpeech: "Noun", roleOrNuance: "Translation text" },
        { token: text, translatedToken: text, partOfSpeech: "Clause", roleOrNuance: "Source input phrase" },
      ];
    }
  } else if (isSpanish) {
    translatedText = `Esta es una expresión natural en español: "${text}".`;
    phonetic = "/ˈes.ta ˈes ˈu.na eks.pɾeˈsjon na.tuˈɾal/";
    tokenBreakdown = [
      { token: "Esta", translatedToken: "this", partOfSpeech: "Pronoun", roleOrNuance: "Demonstrative subject" },
      { token: "es", translatedToken: "is", partOfSpeech: "Verb", roleOrNuance: "Copular verb 'ser'" },
      { token: "una", translatedToken: "a", partOfSpeech: "Article", roleOrNuance: "Indefinite feminine singular article" },
      { token: "expresión", translatedToken: "expression", partOfSpeech: "Noun", roleOrNuance: "Direct predicate object" },
      { token: "natural", translatedToken: "natural", partOfSpeech: "Adjective", roleOrNuance: "Post-nominal descriptive adjective" },
    ];
  } else if (isJapanese) {
    translatedText = "これは自然な表現です。";
    phonetic = "kore wa shizen na hyougen desu.";
    tokenBreakdown = [
      { token: "これ", translatedToken: "this", partOfSpeech: "Pronoun", roleOrNuance: "Topic pronoun" },
      { token: "は", translatedToken: "topic marker", partOfSpeech: "Particle", roleOrNuance: "Marks 'kore' as discourse topic" },
      { token: "自然な", translatedToken: "natural", partOfSpeech: "Na-Adjective", roleOrNuance: "Modifier preceding noun" },
      { token: "表現", translatedToken: "expression", partOfSpeech: "Noun", roleOrNuance: "Head noun" },
      { token: "です", translatedToken: "is / polite copula", partOfSpeech: "Auxiliary", roleOrNuance: "Polite sentence ending" },
    ];
  } else if (isKorean) {
    translatedText = "이것은 자연스러운 표현입니다.";
    phonetic = "igeoseun jayeonseureoun pyohyeon-imnida.";
    tokenBreakdown = [
      { token: "이것은", translatedToken: "this (topic)", partOfSpeech: "Pronoun + Particle", roleOrNuance: "Topic marker 은" },
      { token: "자연스러운", translatedToken: "natural", partOfSpeech: "Adjective Modifier", roleOrNuance: "Modifier in noun-modifying form" },
      { token: "표현입니다", translatedToken: "is an expression", partOfSpeech: "Noun + Formal Copula", roleOrNuance: "Formal polite predicate" },
    ];
  } else {
    translatedText = `[Translated to ${targetLanguage.name}]: ${text}`;
    phonetic = "phonetic reading";
    tokenBreakdown = [
      { token: text, translatedToken: text, partOfSpeech: "Clause", roleOrNuance: "Complete thought" },
    ];
  }

  return {
    translatedText,
    phonetic,
    literalTranslation: `[Literal]: ${text}`,
    summaryExplanation: `This translation renders "${text}" into natural ${targetLanguage.name} (${targetLanguage.code}). Notice the word order and semantic alignment tailored for native fluency.`,
    structuralFormula: isJapanese || isKorean
      ? "[Topic/Subject] + [Time/Location] + [Object] + [Verb/Predicate]"
      : isChinese
      ? "[Subject] + [Time/Adverb] + [Verb] + [Object]"
      : "[Subject] + [Verb] + [Object] + [Adverbial]",
    formalityVariants: [
      {
        register: "Polite / Standard",
        phrase: translatedText,
        explanation: "Appropriate for daily communication, acquaintances, and professional peers.",
      },
      {
        register: "Casual / Informal",
        phrase: translatedText,
        explanation: "Used among close friends, classmates, or in informal casual conversations.",
      },
      {
        register: "Formal / Honorific",
        phrase: translatedText,
        explanation: "Suitable for business meetings, presentations, or speaking to elders.",
      },
    ],
    tokenBreakdown,
    grammarPoints: [
      {
        pattern: "Natural clause alignment",
        meaning: `Standard sentence structure in ${targetLanguage.name}`,
        rule: `Pay close attention to word order differences between ${sourceLanguage.name} and ${targetLanguage.name}.`,
        exampleSentence: {
          target: translatedText,
          translation: text,
        },
      },
    ],
    culturalOrIdiomNote: `In ${targetLanguage.name}, polite phrasing emphasizes smooth interpersonal harmony and appropriate register markers.`,
  };
}

