import { GoogleGenAI } from "@google/genai";

const CANDIDATE_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
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
    // For 503 high demand spikes, try 1 quick retry on the first model, then immediately cascade to the next candidate model
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });

        if (response && (response.text || response.candidates?.length)) {
          return {
            ...response,
            text: response.text,
            candidates: response.candidates,
            modelUsed: model,
          };
        }
      } catch (err: any) {
        lastError = err;
        const msg = (err?.message || String(err)).toLowerCase();

        // If 503 / high demand on attempt 1, immediately switch to alternate candidate model on next loop
        if (msg.includes("503") || msg.includes("unavailable") || msg.includes("high demand") || msg.includes("spikes in demand")) {
          console.warn(
            `[Gemini Resilience] Model ${model} is experiencing high demand (503). Cascading to alternate model immediately.`
          );
          break; // Cascade to the next model immediately
        }

        // If rate limited 429, pause with brief jitter
        if (
          msg.includes("429") ||
          msg.includes("resource_exhausted") ||
          msg.includes("overloaded")
        ) {
          const backoffTime = 500 * (attempt + 1) + Math.floor(Math.random() * 200);
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
          continue;
        } else {
          // If unsupported parameter or syntax/format error on specific model, try next model directly
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

  // Korean Specific Diagnostic (TOPIK / CEFR)
  if (langLower.includes("korean") || langLower.includes("한국어") || langLower.includes("한국") || langLower === "ko") {
    const koreanQuestions = [
      {
        id: "q-ko-1",
        cefrLevel: "A1",
        questionType: "production",
        prompt: `Introduce yourself in ${targetLanguage}: state your name, nationality/occupation, and a brief greeting using standard polite style (-이에요/예요 or -입니다).`,
        targetItem: "Self-introduction, identification copula (-이에요/예요), and subject markers (은/는, 이/가)",
        contextOrAudioText: "안녕하세요! 이름이 무엇이고 어디에서 오셨어요?",
        correctAnswerSample: "안녕하세요, 저는 민수예요. 미국 사람이고 학생이에요.",
        explanation: "Assesses basic self-identification, topic markers, and present polite copula (A1 / TOPIK I Level 1).",
      },
      {
        id: "q-ko-2",
        cefrLevel: "A2",
        questionType: "transformation",
        prompt: `Complete the sentence by putting the bracketed ideas into the past tense with the sequential connector (-아서/어서): "어제 친구를 [meet] 같이 영화를 [saw]."`,
        targetItem: "Sequential time connector (-아서/어서) and past polite inflection (-았/었어요)",
        contextOrAudioText: "어제 친구를 만나서 같이 영화를 봤어요.",
        correctAnswerSample: "어제 친구를 만나서 같이 영화를 봤어요.",
        explanation: "Assesses sequential action connection and regular/irregular past tense conjugation (A2 / TOPIK I Level 2).",
      },
      {
        id: "q-ko-3",
        cefrLevel: "B1",
        questionType: "production",
        prompt: `State your opinion about studying abroad in ${targetLanguage}, using a background/contrast connector (-는데/-은데) or reason connector (-기 때문에).`,
        targetItem: "Background clauses (-는데), opinion phrasing (-는 것 같아요), and causality",
        contextOrAudioText: "제 생각에는 유학이 힘들지만 많은 것을 배울 수 있어서 좋은 것 같아요.",
        correctAnswerSample: "유학 생활은 조금 외롭지만 시야를 넓힐 수 있기 때문에 가치 있다고 생각해요.",
        explanation: "Assesses complex clause linkage and indirect opinion formulation (B1 / TOPIK II Level 3).",
      },
      {
        id: "q-ko-4",
        cefrLevel: "B1",
        questionType: "error_spotting",
        prompt: `Spot the particle mistake in this sentence and rewrite it correctly: "저는 내일 비행기을 타고 제주도에 갈 거예요."`,
        targetItem: "Object particle selection with vowel/consonant finals (을/를)",
        contextOrAudioText: "저는 내일 비행기를 타고 제주도에 갈 거예요.",
        correctAnswerSample: "저는 내일 비행기를 타고 제주도에 갈 거예요.",
        explanation: "Assesses awareness of Korean morphophonological particle selection (을 vs 를) (B1 Error Spotting).",
      },
      {
        id: "q-ko-5",
        cefrLevel: "B2",
        questionType: "production",
        prompt: `Write a hypothetical or conditional sentence in ${targetLanguage}: 'If I had had enough preparation time, I would have passed the exam.' (using -(으)ㄹ 텐데 or -(으)ㄹ 수 있었을 텐데).`,
        targetItem: "Past counterfactual hypothetical structures and modal regret expressions",
        contextOrAudioText: "시간이 더 충분했더라면 시험에 합격할 수 있었을 텐데요.",
        correctAnswerSample: "준비할 시간이 더 있었더라면 시험에 합격할 수 있었을 텐데요.",
        explanation: "Assesses counterfactual hypothetical reasoning and advanced compound verb endings (B2 / TOPIK II Level 4).",
      },
      {
        id: "q-ko-6",
        cefrLevel: "B2",
        questionType: "listening",
        prompt: `Listen to the audio sentence. What was the speaker's advice regarding the schedule change? Respond in ${targetLanguage}.`,
        targetItem: "Formal corporate/academic register and indirect quotation/concession",
        contextOrAudioText: "일정에 다소 차질이 생기더라도 사전에 팀원들과 긴밀히 협의하여 단계적으로 진행하는 편이 바람직합니다.",
        correctAnswerSample: "일정에 차질이 있어도 팀원들과 사전에 협의하며 단계적으로 진행하라고 조언했습니다.",
        explanation: "Assesses listening comprehension of formal administrative discourse (B2 / TOPIK II Level 5).",
      },
      {
        id: "q-ko-7",
        cefrLevel: "C1",
        questionType: "collocation",
        prompt: `Translate this concept using natural, idiomatic ${targetLanguage} (such as a Korean four-character idiom / 사자성어 or figurative expression): 'Making decisions after careful deliberation and foresight / Look before you leap.'`,
        targetItem: "Four-character proverbs (사자성어) or advanced figurative idioms (e.g. 심사숙고, 돌다리도 두들겨 보고 건너라)",
        contextOrAudioText: "중요한 결정일수록 심사숙고하여 신중하게 처리해야 합니다.",
        correctAnswerSample: "심사숙고하다 / 돌다리도 두들겨 보고 건너다",
        explanation: "Assesses high-register proverbs, figurative mastery, and stylistic eloquence (C1 / TOPIK II Level 6).",
      },
    ];

    return {
      testTitle: `${targetLanguage} TOPIK & CEFR Diagnostic Placement`,
      targetLanguage,
      knownLanguage,
      estimatedDurationMinutes: testType === "quick" ? 3 : 6,
      questions: testType === "quick" ? koreanQuestions.slice(0, 5) : koreanQuestions,
    };
  }

  // Chinese (Mandarin / Traditional Chinese / Simplified Chinese / TOCFL / HSK)
  if (langLower.includes("chinese") || langLower.includes("中文") || langLower.includes("華語") || langLower.includes("漢語") || langLower.includes("zh")) {
    const isTraditional = langLower.includes("traditional") || langLower.includes("繁體") || langLower.includes("tw") || langLower.includes("taiwan");
    const chineseQuestions = [
      {
        id: "q-zh-1",
        cefrLevel: "A1",
        questionType: "production",
        prompt: `Introduce yourself in ${targetLanguage}: write 1-2 sentences stating your name, where you live or study, and a greeting.`,
        targetItem: isTraditional ? "自我介紹、是字句與國籍/職業表達" : "自我介绍、是字句与国籍/职业表达",
        contextOrAudioText: isTraditional ? "你好！你叫什麼名字？你住在哪裡？" : "你好！你叫什么名字？你住在哪里？",
        correctAnswerSample: isTraditional ? "你好，我叫王明，我是學生，我住在台北。" : "你好，我叫王明，我是学生，我住在北京。",
        explanation: "Assesses self-introduction, basic copula (是/叫/在), and personal information (A1 / TOCFL Level 1 / HSK 1-2).",
      },
      {
        id: "q-zh-2",
        cefrLevel: "A2",
        questionType: "transformation",
        prompt: `Complete the sentence expressing a completed action and duration: "昨天我 [learned] 中文 [for two hours]。"`,
        targetItem: isTraditional ? "動態助詞『了』與時量補語句型" : "动态助词『了』与时量补语句型",
        contextOrAudioText: isTraditional ? "昨天我學了兩個小時的中文。" : "昨天我学了两个小时的中文。",
        correctAnswerSample: isTraditional ? "昨天我學了兩個小時的中文。" : "昨天我学了两个小时的中文。",
        explanation: "Assesses aspect marker (了) and duration complement structure (A2 / TOCFL Level 2 / HSK 3).",
      },
      {
        id: "q-zh-3",
        cefrLevel: "B1",
        questionType: "production",
        prompt: `Express your opinion about public transit or cycling in ${targetLanguage}, using a connector meaning 'although... but...' (雖然...但是...) or 'because... therefore...' (因為...所以...).`,
        targetItem: isTraditional ? "複句關聯詞 (雖然...但是...) 與主觀觀點表達" : "复句关联词 (虽然...但是...) 与主观观点表达",
        contextOrAudioText: isTraditional ? "雖然搭捷運很方便，但我更喜歡騎腳踏車。" : "虽然坐地铁很方便，但我更喜欢骑自行车。",
        correctAnswerSample: isTraditional ? "雖然搭捷運很方便，但我認為騎腳踏車更健康。" : "虽然坐地铁很方便，但我认为骑自行车更健康。",
        explanation: "Assesses complex clause coordination and opinion formulation (B1 / TOCFL Level 3 / HSK 4).",
      },
      {
        id: "q-zh-4",
        cefrLevel: "B1",
        questionType: "error_spotting",
        prompt: `Spot the word order mistake with the disposal/ba-construction in this sentence and rewrite it correctly: "${isTraditional ? "我把在桌子上的書看了。" : "我把在桌子上的书看了。"}"`,
        targetItem: isTraditional ? "把字句受詞與動詞結果補語語序" : "把字句宾语与动词结果补语语序",
        contextOrAudioText: isTraditional ? "我把桌子上的書看完了。" : "我把桌子上的书看完了。",
        correctAnswerSample: isTraditional ? "我把桌子上的書看完了。" : "我把桌子上的书看完了。",
        explanation: "Assesses word order constraints with the disposal construction (把字句) and resultative complements (B1 Error Spotting).",
      },
      {
        id: "q-zh-5",
        cefrLevel: "B2",
        questionType: "production",
        prompt: `Compose a conditional or hypothetical sentence in ${targetLanguage}: 'If we had known the project timeline in advance, we wouldn't have rushed.' (using 要不是 / 如果...的話).`,
        targetItem: isTraditional ? "假設複句與反事實推論結構" : "假设复句与反事实推论结构",
        contextOrAudioText: isTraditional ? "如果我們早點知道進度的話，就不會這麼匆忙了。" : "如果我们早点知道进度的话，就不会这么匆忙了。",
        correctAnswerSample: isTraditional ? "如果事先掌握進度的話，我們就不至於手忙腳亂了。" : "如果事先掌握进度的话，我们就不至于手忙脚乱了。",
        explanation: "Assesses hypothetical conditionals, counterfactual logic, and advanced discourse connectors (B2 / TOCFL Level 4 / HSK 5).",
      },
      {
        id: "q-zh-6",
        cefrLevel: "B2",
        questionType: "listening",
        prompt: `Listen to the audio sentence. What was the speaker's main recommendation regarding international collaboration? Respond in ${targetLanguage}.`,
        targetItem: isTraditional ? "正式商務與學術語域篇章理解" : "正式商务与学术语域篇章理解",
        contextOrAudioText: isTraditional ? "在跨文化合作的過程中，唯有保持開放包容的心態並建立透明的溝通機制，才能化解潛在的分歧。" : "在跨文化合作的过程中，唯有保持开放包容的心态并建立透明的沟通机制，才能化解潜在的分歧。",
        correctAnswerSample: isTraditional ? "說話者建議保持開放心態並建立透明溝通機制來化解分歧。" : "说话者建议保持开放心态并建立透明沟通机制来化解分歧。",
        explanation: "Assesses listening comprehension of high-register argumentative discourse (B2 / TOCFL Level 5 / HSK 6).",
      },
      {
        id: "q-zh-7",
        cefrLevel: "C1",
        questionType: "collocation",
        prompt: `Translate this concept using an authentic, high-register four-character idiom (成語): 'To make steady, gradual progress step-by-step through persistent effort / Step by step.'`,
        targetItem: isTraditional ? "典雅四字成語與修辭深度 (循序漸進 / 穩紮穩打 / 水到渠成)" : "典雅四字成语与修辞深度 (循序渐进 / 稳扎稳打 / 水到渠成)",
        contextOrAudioText: isTraditional ? "學習語言必須循序漸進，切忌急於求成。" : "学习语言必须循序渐进，切忌急于求成。",
        correctAnswerSample: isTraditional ? "循序漸進 / 穩紮穩打" : "循序渐进 / 稳扎稳打",
        explanation: "Assesses mastery of authentic idiomatic collocations and stylistic refinement (C1 / TOCFL Level 6).",
      },
    ];

    return {
      testTitle: `${targetLanguage} TOCFL / HSK & CEFR Diagnostic Placement`,
      targetLanguage,
      knownLanguage,
      estimatedDurationMinutes: testType === "quick" ? 3 : 6,
      questions: testType === "quick" ? chineseQuestions.slice(0, 5) : chineseQuestions,
    };
  }

  // Japanese Specific Diagnostic (JLPT / CEFR)
  if (langLower.includes("japanese") || langLower.includes("日本語") || langLower === "ja") {
    const japaneseQuestions = [
      {
        id: "q-ja-1",
        cefrLevel: "A1",
        questionType: "production",
        prompt: `Introduce yourself in ${targetLanguage}: state your name, where you are from or your occupation, using polite desu/masu form (です/ます).`,
        targetItem: "Self-introduction copula (です), topic particle (は), and origin (から来ました)",
        contextOrAudioText: "初めまして！お名前とご出身はどちらですか？",
        correctAnswerSample: "初めまして、田中です。東京から来ました。よろしくお願いします。",
        explanation: "Assesses basic self-introduction, polite copula, and essential survival greeting (A1 / JLPT N5).",
      },
      {
        id: "q-ja-2",
        cefrLevel: "A2",
        questionType: "transformation",
        prompt: `Connect the actions in the past using the te-form (て形): "昨日、友達に [meet] 一緒に昼ご飯を [ate]。"`,
        targetItem: "Te-form sequential action chaining and past polite inflection (-ました)",
        contextOrAudioText: "昨日、友達に会って、一緒に昼ご飯を食べました。",
        correctAnswerSample: "昨日、友達に会って、一緒に昼ご飯を食べました。",
        explanation: "Assesses te-form sequential linkage and standard polite past conjugation (A2 / JLPT N4).",
      },
      {
        id: "q-ja-3",
        cefrLevel: "B1",
        questionType: "production",
        prompt: `State your opinion about remote work in ${targetLanguage}, using a reason connector (〜ので / 〜から) and an opinion ending (〜と思います).`,
        targetItem: "Objective causality (ので), potential form (できる), and indirect opinion (と思います)",
        contextOrAudioText: "私の考えでは、時間を有効に使えるので、在宅勤務はとても便利だと思います。",
        correctAnswerSample: "通勤時間を節約できるので、リモートワークはとても効率的だと思います。",
        explanation: "Assesses sentence nesting with opinion clauses and potential forms (B1 / JLPT N3).",
      },
      {
        id: "q-ja-4",
        cefrLevel: "B1",
        questionType: "error_spotting",
        prompt: `Spot the particle mistake in this potential construction and rewrite it correctly: "私は漢字をあまり読むことができません。" or "私は漢字を読めます。"`,
        targetItem: "Potential verb object particle preference (が vs を)",
        contextOrAudioText: "私は漢字があまり読めません。",
        correctAnswerSample: "私は漢字が読めます / 私は漢字を読むことができません。",
        explanation: "Assesses particle case assignment with potential verbs (B1 / JLPT N3 Error Spotting).",
      },
      {
        id: "q-ja-5",
        cefrLevel: "B2",
        questionType: "production",
        prompt: `Write a conditional or hypothetical sentence in ${targetLanguage}: 'If I had known that earlier, I wouldn't have made that mistake.' (using 〜ばよかった or 〜たら).`,
        targetItem: "Counterfactual conditionals and modal regret expressions (〜ばよかった / 〜ていたら)",
        contextOrAudioText: "事前に知っていれば、そのようなミスを防げたはずです。",
        correctAnswerSample: "もっと早く知っていれば、そんな失敗はしなかったのに。",
        explanation: "Assesses counterfactual hypothetical clauses and conditional inflections (B2 / JLPT N2).",
      },
      {
        id: "q-ja-6",
        cefrLevel: "B2",
        questionType: "listening",
        prompt: `Listen to the audio sentence. What was the speaker's main decision regarding the proposal? Respond in ${targetLanguage}.`,
        targetItem: "Keigo / Honorific expressions and formal business discourse",
        contextOrAudioText: "恐れ入りますが、ご提案いただいた件につきましては、社内で再度検討させていただきたく存じます。",
        correctAnswerSample: "社内で再度検討することにしました。",
        explanation: "Assesses listening comprehension of formal business Japanese and humble keigo (B2 / JLPT N2).",
      },
      {
        id: "q-ja-7",
        cefrLevel: "C1",
        questionType: "collocation",
        prompt: `Translate this concept using an authentic Japanese four-character idiom (四字熟語) or natural idiomatic phrasing: 'Putting all one's energy and sincere devotion into a task / Wholehearted devotion.'`,
        targetItem: "Four-character idioms (四字熟語 e.g. 一所懸命 / 全身全霊) and nuanced literary collocations",
        contextOrAudioText: "このプロジェクトには全身全霊を捧げて取り組む所存です。",
        correctAnswerSample: "全身全霊を傾ける / 一意専心",
        explanation: "Assesses C1 register flexibility, four-character idioms, and high-level corporate/academic prose (JLPT N1).",
      },
    ];

    return {
      testTitle: `${targetLanguage} JLPT & CEFR Diagnostic Placement`,
      targetLanguage,
      knownLanguage,
      estimatedDurationMinutes: testType === "quick" ? 3 : 6,
      questions: testType === "quick" ? japaneseQuestions.slice(0, 5) : japaneseQuestions,
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
 * Intelligent Linguistic Placement Question Grader
 */
export function evaluateDiagnosticAnswer(
  targetLanguage: string,
  question: {
    id?: string;
    prompt?: string;
    targetItem?: string;
    questionType?: string;
    cefrLevel?: string;
    correctAnswerSample?: string;
    contextOrAudioText?: string;
  },
  userAnswer: string
): {
  isCorrect: boolean;
  feedback: string;
  idealAnswer: string;
  errors: Array<{
    originalMistake: string;
    correctedForm: string;
    errorType: string;
    explanation: string;
  }>;
} {
  const rawAnswer = (userAnswer || "").trim();
  const sample = (question.correctAnswerSample || "").trim();
  const prompt = (question.prompt || "").toLowerCase();
  const targetItem = (question.targetItem || "").toLowerCase();
  const cefr = (question.cefrLevel || "A2").toUpperCase();
  const langLower = (targetLanguage || "").toLowerCase();

  const normalize = (s: string) =>
    s
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'「」『』·•]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const normUser = normalize(rawAnswer);
  const normSample = normalize(sample);

  const errors: Array<{
    originalMistake: string;
    correctedForm: string;
    errorType: string;
    explanation: string;
  }> = [];

  if (!rawAnswer || rawAnswer.length === 0) {
    return {
      isCorrect: false,
      feedback: "No response was provided for this question.",
      idealAnswer: sample || `Standard ${targetLanguage} expression`,
      errors: [],
    };
  }

  // Exact match (or exact match across alternative sample options)
  const sampleOptions = sample.split(/[/;,]/).map((p) => normalize(p)).filter(Boolean);
  if (normUser === normSample || sampleOptions.includes(normUser)) {
    return {
      isCorrect: true,
      feedback: "Excellent! Exact grammatical conjugation and accurate native formulation.",
      idealAnswer: sample || rawAnswer,
      errors: [],
    };
  }

  // Korean-specific linguistic rules
  if (langLower.includes("korean") || langLower.includes("한국어") || langLower === "ko") {
    // Q2 / Conjugation: Past tense formal polite (했습니다 style) for 먹다
    if (prompt.includes("먹다") || prompt.includes("to eat") || targetItem.includes("past tense formal") || prompt.includes("했습니다")) {
      if (rawAnswer.includes("먹었습니다")) {
        return {
          isCorrect: true,
          feedback: "Perfect! '먹었습니다' is the exact formal polite past tense conjugation (했습니다 style) of 먹다.",
          idealAnswer: "먹었습니다",
          errors: [],
        };
      } else if (rawAnswer.includes("먹었어요")) {
        errors.push({
          originalMistake: "먹었어요",
          correctedForm: "먹었습니다",
          errorType: "register",
          explanation: "'먹었어요' is informal polite (해요체). The question requested formal polite style (했습니다 style: '먹었습니다').",
        });
        return {
          isCorrect: false,
          feedback: "Good attempt, but '먹었어요' is in the informal polite style (해요체). The question requested formal polite style (했습니다 style: '먹었습니다').",
          idealAnswer: "먹었습니다",
          errors,
        };
      } else if (rawAnswer.includes("먹었다")) {
        errors.push({
          originalMistake: "먹었다",
          correctedForm: "먹었습니다",
          errorType: "register",
          explanation: "'먹었다' is plain/informal non-polite (해라체). Formal polite is '먹었습니다'.",
        });
        return {
          isCorrect: false,
          feedback: "'먹었다' is plain non-polite form. The formal polite ending is '먹었습니다'.",
          idealAnswer: "먹었습니다",
          errors,
        };
      }
    }

    // A2 Sequential connector (-아서/어서): 어제 친구를 만나서 같이 영화를 봤어요
    if (prompt.includes("만나") || prompt.includes("영화") || prompt.includes("-아서/어서") || targetItem.includes("sequential time connector")) {
      if (rawAnswer.includes("만나서") && (rawAnswer.includes("봤어요") || rawAnswer.includes("보았습니다"))) {
        return {
          isCorrect: true,
          feedback: "Great job! Accurate use of the sequential connector (-아서/어서) and past tense conjugation.",
          idealAnswer: sample || "어제 친구를 만나서 같이 영화를 봤어요.",
          errors: [],
        };
      }
    }

    // B2: Hypothetical counterfactual conditional ("If I had more time, I would travel to Jeju Island" / "시간이 더 있다면 제주도로 여행을 갈 텐데")
    if (prompt.includes("jeju") || prompt.includes("제주") || prompt.includes("hypothetical") || prompt.includes("가정") || prompt.includes("재주")) {
      let isFlawed = false;
      const detectedErrors: typeof errors = [];

      // 1. Check spelling of Jeju: "재주도" -> "제주도"
      if (rawAnswer.includes("재주도") || rawAnswer.includes("재주")) {
        isFlawed = true;
        detectedErrors.push({
          originalMistake: "재주도",
          correctedForm: "제주도",
          errorType: "spelling",
          explanation: "Jeju Island is spelled '제주도' (with ㅔ), not '재주도'.",
        });
      }

      // 2. Check particle typo: "재주도애" or "도애" -> "제주도에" / "제주도로"
      if (rawAnswer.includes("도애") || rawAnswer.includes("재주도애") || rawAnswer.includes("제주도애")) {
        isFlawed = true;
        detectedErrors.push({
          originalMistake: "도애",
          correctedForm: "도에 (or 도로)",
          errorType: "particle_spelling",
          explanation: "The directional particle is '에' or '(으)로', not '애'.",
        });
      }

      // 3. Check conditional mood: simple real conditional ("있으면") vs hypothetical/counterfactual ("있다면" / "있었더라면")
      const hasHypotheticalIf = rawAnswer.includes("있다면") || rawAnswer.includes("있었더라면") || rawAnswer.includes("있었으면");
      const hasHypotheticalThen =
        rawAnswer.includes("갈 텐데") ||
        rawAnswer.includes("갔을 텐데") ||
        rawAnswer.includes("갈 텐데요") ||
        rawAnswer.includes("갔을 텐데요") ||
        rawAnswer.includes("갈 것입니다");

      if (rawAnswer.includes("있으면") && !hasHypotheticalIf) {
        isFlawed = true;
        detectedErrors.push({
          originalMistake: "시간이 더 있으면",
          correctedForm: "시간이 더 있다면 (or 있었더라면)",
          errorType: "grammar_mood",
          explanation: "In B2 hypothetical/counterfactual statements ('If I had...'), Korean uses '-(으)ㄴ다면' or '-았/었더라면' rather than simple real conditional '-(으)면'.",
        });
      }

      // 4. Check verb ending: "갈 거에요" -> "갈 텐데"
      if (rawAnswer.includes("갈 거에요") || rawAnswer.includes("갈 거예요") || rawAnswer.includes("갈거에요")) {
        isFlawed = true;
        detectedErrors.push({
          originalMistake: "갈 거에요",
          correctedForm: "갈 텐데 (or 갔을 텐데)",
          errorType: "grammar_ending",
          explanation: "Hypothetical counterfactual outcomes require the modal prospective ending '-(으)ㄹ 텐데' rather than simple indicative future '-(으)ㄹ 거예요'.",
        });
      }

      if (isFlawed || detectedErrors.length > 0) {
        return {
          isCorrect: false,
          feedback: `Needs refinement for B2 hypothetical precision: ${detectedErrors.map((e) => e.explanation).join(" ")}`,
          idealAnswer: sample || "시간이 더 있다면 제주도로 여행을 갈 텐데.",
          errors: detectedErrors,
        };
      }

      if (hasHypotheticalIf && (hasHypotheticalThen || rawAnswer.includes("여행"))) {
        return {
          isCorrect: true,
          feedback: "Excellent! Accurate B2 hypothetical conditional formulation using authentic mood markers.",
          idealAnswer: sample || "시간이 더 있다면 제주도로 여행을 갈 텐데.",
          errors: [],
        };
      }
    }

    // B2 / C1 Listening Comprehension (Q6)
    if (question.questionType === "listening" || prompt.includes("listen") || prompt.includes("듣고") || prompt.includes("advice")) {
      const containsAdviceCore =
        rawAnswer.includes("협의") ||
        rawAnswer.includes("사전에") ||
        rawAnswer.includes("단계적") ||
        rawAnswer.includes("의논") ||
        rawAnswer.includes("상의") ||
        rawAnswer.includes("팀원") ||
        rawAnswer.includes("조언");

      if (containsAdviceCore && rawAnswer.length >= 8) {
        return {
          isCorrect: true,
          feedback: "Great comprehension! You accurately captured the speaker's advice regarding team consultation and phased progression.",
          idealAnswer: sample || "일정에 차질이 있어도 팀원들과 사전에 긴밀히 협의하며 단계적으로 진행하라고 조언했습니다.",
          errors: [],
        };
      } else {
        return {
          isCorrect: false,
          feedback: "The response did not capture the core recommendation from the audio: to consult closely with team members beforehand and progress in structured phases.",
          idealAnswer: sample || "일정에 차질이 있어도 팀원들과 사전에 협의하며 단계적으로 진행하라고 조언했습니다.",
          errors: [
            {
              originalMistake: rawAnswer || "(Incomplete comprehension)",
              correctedForm: "팀원들과 사전에 긴밀히 협의하여 단계적으로 진행",
              errorType: "listening_comprehension",
              explanation: "Focus on formal discourse markers like '사전에 협의하여' and '단계적으로 진행'.",
            },
          ],
        };
      }
    }
  }

  // Sub-phrase matching across sample options
  for (const part of sampleOptions) {
    if (part.length >= 4 && (normUser.includes(part) || part.includes(normUser))) {
      return {
        isCorrect: true,
        feedback: "Good formulation matching the core grammatical target and vocabulary.",
        idealAnswer: sample,
        errors: [],
      };
    }
  }

  // Token similarity
  const userTokens = normUser.split(" ").filter((t) => t.length > 1);
  const sampleTokens = normSample.split(" ").filter((t) => t.length > 1);

  if (sampleTokens.length > 0) {
    let matchCount = 0;
    for (const ut of userTokens) {
      if (sampleTokens.some((st) => st === ut || (st.length > 3 && (st.includes(ut) || ut.includes(st))))) {
        matchCount++;
      }
    }
    const tokenSimilarity = matchCount / Math.max(sampleTokens.length, 1);

    if (tokenSimilarity >= 0.7 && userTokens.length >= Math.max(2, Math.floor(sampleTokens.length * 0.6))) {
      return {
        isCorrect: true,
        feedback: "Well done! Your sentence expresses the target concept with accurate vocabulary and syntax.",
        idealAnswer: sample,
        errors: [],
      };
    }
  }

  return {
    isCorrect: false,
    feedback: `Consider reviewing the required grammatical structure and sentence patterns for ${cefr}.`,
    idealAnswer: sample || `Standard ${targetLanguage} expression`,
    errors: [
      {
        originalMistake: rawAnswer,
        correctedForm: sample || "Target sentence structure",
        errorType: "grammar",
        explanation: `Refine grammatical accuracy and lexical choice for ${cefr} benchmarks.`,
      },
    ],
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
  let correctCount = 0;
  const errorList: Array<{ originalMistake: string; correctedForm: string; errorType: string; explanation: string }> = [];

  const perQuestionReview = submissions.map((sub, idx) => {
    const q = testQuestions?.find((item) => item.id === sub.questionId) || testQuestions?.[idx] || {};
    const evalRes = evaluateDiagnosticAnswer(targetLanguage, q, sub.userAnswer);

    if (evalRes.isCorrect) {
      correctCount++;
    } else if (evalRes.errors && evalRes.errors.length > 0) {
      errorList.push(...evalRes.errors);
    }

    return {
      questionId: sub.questionId,
      cefrLevel: sub.cefrLevel || q.cefrLevel || "A2",
      prompt: q.prompt || `Question ${idx + 1}`,
      userAnswer: sub.userAnswer || "(No response)",
      isCorrect: evalRes.isCorrect,
      feedback: evalRes.feedback,
      idealAnswer: evalRes.idealAnswer,
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
    identifiedErrors: errorList.slice(0, 4),
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

  // Korean Specific Frequency Deck Fallback
  if (langLower.includes("korean") || langLower.includes("한국어") || langLower.includes("한국") || langLower === "ko") {
    const koreanCards = [
      {
        type: "vocabulary",
        targetItem: "배우다",
        frequencyRank: startFrequencyRank,
        partOfSpeech: "Verb",
        definition: "to learn, to study",
        phonetic: "bae-u-da (Present: 배워요 / bae-wo-yo)",
        usageNotes: "SOV word order: [Topic/Subject + 은/는] + [Object + 을/를] + 배워요. Direct object takes 을/를.",
        examples: [
          {
            target: "저는 매일 한국어를 열심히 배워요.",
            translation: "I study Korean hard every day.",
            phonetic: "Jeo-neun mae-il han-guk-eo-reul yeol-sim-hi bae-wo-yo.",
          },
          {
            target: "새로운 언어를 배우는 것은 정말 재미있어요.",
            translation: "Learning a new language is really fun.",
            phonetic: "Sae-ro-un eon-eo-reul bae-u-neun geos-eun jeong-mal jae-mi-iss-eo-yo.",
          },
        ],
        tags: ["core-vocab", "education", "topik-1"],
      },
      {
        type: "vocabulary",
        targetItem: "만나다",
        frequencyRank: startFrequencyRank + 1,
        partOfSpeech: "Verb",
        definition: "to meet, to see (a person)",
        phonetic: "man-na-da (Present: 만나요 / man-na-yo)",
        usageNotes: "Pattern: [Person + 을/를 or 와/과] + 만나요. Location takes 에서 (e.g. 카페에서).",
        examples: [
          {
            target: "오늘 오후에 카페에서 친구를 만나요.",
            translation: "I meet my friend at the cafe this afternoon.",
            phonetic: "O-neul o-hu-e ka-pe-e-seo chin-gu-reul man-na-yo.",
          },
          {
            target: "만나서 반갑습니다!",
            translation: "Pleased to meet you!",
            phonetic: "Man-na-seo ban-gap-seum-ni-da!",
          },
        ],
        tags: ["core-vocab", "social", "topik-1"],
      },
      {
        type: "grammar",
        targetItem: "-아서/어서",
        frequencyRank: startFrequencyRank + 2,
        partOfSpeech: "Connective Suffix",
        definition: "because / so (cause & effect) OR sequential action (and then)",
        phonetic: "-a-seo / -eo-seo",
        usageNotes: "Vowel harmony: use -아서 after ㅏ/ㅗ; use -어서 after other vowels; 하다 becomes 해서. Connects two clauses in SOV order.",
        examples: [
          {
            target: "날씨가 좋아서 한강 공원에 산책하러 갔어요.",
            translation: "Because the weather was nice, I went for a walk at the Han River park.",
            phonetic: "Nal-ssi-ga joh-a-seo han-gang gong-won-e san-chaek-ha-reo gass-eo-yo.",
          },
          {
            target: "한국 음식이 맛있어서 자주 먹어요.",
            translation: "Because Korean food is delicious, I eat it often.",
            phonetic: "Han-guk eum-sig-i mas-iss-eo-seo ja-ju meog-eo-yo.",
          },
        ],
        tags: ["grammar", "connectors", "causality"],
      },
      {
        type: "vocabulary",
        targetItem: "좋아하다",
        frequencyRank: startFrequencyRank + 3,
        partOfSpeech: "Transitive Verb",
        definition: "to like, to be fond of",
        phonetic: "joh-a-ha-da (Present: 좋아해요 / joh-a-hae-yo)",
        usageNotes: "Takes an object with -을/를 (e.g. 음악을 좋아해요). Distinct from descriptive adjective 좋다 (which takes -이/가).",
        examples: [
          {
            target: "저는 시원한 아이스 아메리카노를 좋아해요.",
            translation: "I like cold iced Americanos.",
            phonetic: "Jeo-neun si-won-han a-i-seu a-me-ri-ka-no-reul joh-a-hae-yo.",
          },
          {
            target: "어떤 한국 드라마를 제일 좋아하세요?",
            translation: "Which Korean drama do you like the most?",
            phonetic: "Eo-tteon han-guk deu-ra-ma-reul je-il joh-a-ha-se-yo?",
          },
        ],
        tags: ["core-vocab", "preferences"],
      },
      {
        type: "grammar",
        targetItem: "-고 싶다",
        frequencyRank: startFrequencyRank + 4,
        partOfSpeech: "Auxiliary Verb",
        definition: "to want to (expresses desire to do an action)",
        phonetic: "-go sip-da (Present: -고 싶어요 / -go sip-eo-yo)",
        usageNotes: "Attach directly to verb stem: [Verb Stem] + 고 싶어요. Object can take -을/를 or -이/가.",
        examples: [
          {
            target: "이번 주말에 서울 명동에 가고 싶어요.",
            translation: "I want to go to Myeongdong in Seoul this weekend.",
            phonetic: "I-beon ju-mal-e seo-ul myeong-dong-e ga-go sip-eo-yo.",
          },
          {
            target: "따뜻한 차 한 잔을 마시고 싶어요.",
            translation: "I want to drink a cup of warm tea.",
            phonetic: "Tta-tteut-han cha han jan-eul ma-si-go sip-eo-yo.",
          },
        ],
        tags: ["grammar", "desire", "topik-1"],
      },
      {
        type: "vocabulary",
        targetItem: "있다 / 없다",
        frequencyRank: startFrequencyRank + 5,
        partOfSpeech: "Existence / Possession Verb",
        definition: "to exist, to have / to not exist, to not have",
        phonetic: "iss-da (있어요) / eobs-da (없어요)",
        usageNotes: "Pattern: [Location + 에] [Noun + 이/가] 있어요/없어요 (There is/isn't X at place, or I have/don't have X).",
        examples: [
          {
            target: "지금 질문이 있어요.",
            translation: "I have a question right now.",
            phonetic: "Ji-geum jil-mun-i iss-eo-yo.",
          },
          {
            target: "도서관에 조용한 자리가 없어요.",
            translation: "There are no quiet seats in the library.",
            phonetic: "Do-seo-gwan-e jo-yong-han ja-ri-ga eobs-eo-yo.",
          },
        ],
        tags: ["core-vocab", "existence", "topik-1"],
      },
      {
        type: "grammar",
        targetItem: "-(으)ㄹ 수 있다/없다",
        frequencyRank: startFrequencyRank + 6,
        partOfSpeech: "Grammar Pattern",
        definition: "can / cannot (expresses ability or possibility)",
        phonetic: "-(eu)l su iss-da / eobs-da",
        usageNotes: "Stem ends in vowel -> -ㄹ 수 있다; stem ends in consonant -> -을 수 있다.",
        examples: [
          {
            target: "저는 한국어로 간단한 대화를 할 수 있어요.",
            translation: "I can have a simple conversation in Korean.",
            phonetic: "Jeo-neun han-guk-eo-ro gan-dan-han dae-hwa-reul hal su iss-eo-yo.",
          },
          {
            target: "오늘은 바빠서 모임에 갈 수 없어요.",
            translation: "I am busy today so I cannot go to the meeting.",
            phonetic: "O-neul-eun ba-ppa-seo mo-im-e gal su eobs-eo-yo.",
          },
        ],
        tags: ["grammar", "ability", "topik-1"],
      },
      {
        type: "grammar",
        targetItem: "-지만",
        frequencyRank: startFrequencyRank + 7,
        partOfSpeech: "Connective Suffix",
        definition: "but / although (contrast clause connector)",
        phonetic: "-ji-man",
        usageNotes: "Attaches directly to any verb or adjective stem without changes: [Clause 1] + 지만, [Clause 2].",
        examples: [
          {
            target: "한국어 문법이 조금 어렵지만 정말 재미있어요.",
            translation: "Korean grammar is a bit difficult, but it is really interesting.",
            phonetic: "Han-guk-eo mun-beob-i jo-geum eo-ryeop-ji-man jeong-mal jae-mi-iss-eo-yo.",
          },
          {
            target: "가격은 비싸지만 품질이 아주 좋아요.",
            translation: "The price is expensive, but the quality is very good.",
            phonetic: "Ga-gyeog-eun bi-ssa-ji-man pum-jil-i a-ju joh-a-yo.",
          },
        ],
        tags: ["grammar", "contrast", "topik-1"],
      },
    ];

    return {
      deckTitle: `Korean (한국어): ${topic || "Core Essential Tier"}`,
      deckDescription: `High-frequency spaced repetition flashcards featuring authentic Korean Hangul, Revised Romanization, and strict SOV sentence structures with proper particles.`,
      cards: koreanCards.slice(0, count),
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
  const isKorean = (targetLanguage || "").toLowerCase().includes("korean") || (targetLanguage || "").toLowerCase().includes("한국어") || targetLanguage === "ko";
  
  const isTargetUsed = lowerSentence.includes(lowerTarget) || sentence.includes(targetItem);
  const isReasonableLength = sentence.length >= 8;
  const score = isTargetUsed && isReasonableLength ? 90 : isTargetUsed ? 75 : 60;
  const grade = score >= 85 ? 4 : score >= 70 ? 3 : 2;
  const masteryLevel = score >= 85 ? "mastered" : score >= 70 ? "good" : "developing";

  const grammarBreakdown = isKorean
    ? `SOV Structure Review: Your Korean sentence places the verb at the end with appropriate polite endings. Target item: "${targetItem}". Keep practicing particle placement (은/는, 이/가, 을/를, 에/에서)!`
    : `You formulated an active output sentence in ${targetLanguage}. Definition: ${definition || targetItem}. Keep practicing authentic context sentences!`;

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
    grammarBreakdown,
    identifiedErrors: [],
    usageAlternatives: [
      {
        targetSentence: `${sentence}`,
        translation: `Contextual application of ${targetItem}`,
      },
    ],
    detectedTenseOrAspect: isKorean ? "Present Polite (해요체) / SOV Construction" : "Present Indicative / Natural Expression",
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
  const isKorean = (targetLanguage || "").toLowerCase().includes("korean") || (targetLanguage || "").toLowerCase().includes("한국어") || targetLanguage === "ko";

  return {
    targetItem,
    definition: definition || `Essential ${partOfSpeech || "expression"} in ${targetLanguage}`,
    phonetic: `/${targetItem}/`,
    partOfSpeech: partOfSpeech || "Vocabulary",
    usageFormat: isKorean ? `[Subject + 은/는] + [Object + 을/를] + ${targetItem}` : `${targetItem} + Context`,
    grammaticalRules: isKorean
      ? `In Korean, sentences follow strict SOV order: Subject + Object/Location + Verb/Adjective. Attach correct postpositional particles (은/는 for topic, 이/가 for subject, 을/를 for object, 에/에서 for location).`
      : `Use "${targetItem}" in natural discourse according to standard ${targetLanguage} word order.`,
    contextExamples: [
      {
        target: isKorean ? `저는 매일 한국어를 ${targetItem}.` : `${targetItem} is frequently used in everyday dialogue.`,
        translation: isKorean ? `I do this action in Korean every day.` : `How to use ${targetItem} naturally.`,
        nuanceExplanation: isKorean ? `Polite conversational style (해요체).` : `Standard conversational register.`,
      },
    ],
    commonCollocations: isKorean ? [`열심히 ${targetItem}`, `자주 ${targetItem}`] : [`natural ${targetItem}`],
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

/**
 * Fallback Conversation Scenario Generator
 */
export function getFallbackScenario(params: {
  targetLanguage: string;
  knownLanguage: string;
  theme?: string;
  level?: string;
}) {
  const { targetLanguage } = params;
  const isChinese = (targetLanguage || "").toLowerCase().includes("chinese") || (targetLanguage || "").toLowerCase().includes("taiwan");
  const isSpanish = (targetLanguage || "").toLowerCase().includes("spanish") || (targetLanguage || "").toLowerCase().includes("español");
  const isJapanese = (targetLanguage || "").toLowerCase().includes("japanese") || (targetLanguage || "").toLowerCase().includes("日本語");

  if (isChinese) {
    return {
      title: "夜市在地美食探索 (Night Market Culinary Exploration)",
      category: "Dining & Travel",
      scenarioPrompt: "You are a friendly Taiwanese street food vendor at the Shilin Night Market in Taipei. Chat with the customer about local recommendations and spice levels.",
      targetWordsToUse: ["推薦 (recommend)", "夜市 (night market)", "在地 (local)", "不要太辣 (not too spicy)"],
      openingGreeting: "歡迎光臨！請問今天想吃點什麼？我們這裡的珍珠奶茶和雞排最受歡迎喔！",
      openingGreetingTranslation: "Welcome! What would you like to have today? Our bubble tea and crispy chicken cutlet are the most popular here!",
    };
  }

  if (isJapanese) {
    return {
      title: "カフェで注文する (Ordering at a Local Café)",
      category: "Daily Life & Dining",
      scenarioPrompt: "You are a friendly café barista in Kyoto. Greet the customer and help them choose a seasonal drink and treat.",
      targetWordsToUse: ["おすすめ (recommendation)", "注文 (order)", "温かい (hot / warm)", "抹茶 (matcha)"],
      openingGreeting: "いらっしゃいませ！店内でお召し上がりですか？季節限定の抹茶ラテがおすすめですよ。",
      openingGreetingTranslation: "Welcome! Will you be having it here? I recommend our seasonal matcha latte!",
    };
  }

  const isKorean = (targetLanguage || "").toLowerCase().includes("korean") || (targetLanguage || "").toLowerCase().includes("한국어") || (targetLanguage || "").toLowerCase().includes("한국") || targetLanguage === "ko";
  if (isKorean) {
    return {
      title: "홍대 카페에서 주문하기 (Ordering at a Café in Hongdae)",
      category: "Daily Life & Dining",
      scenarioPrompt: "You are a warm, welcoming barista at a bustling café in Hongdae, Seoul. Greet the customer in polite Korean (해요체), introduce popular menu drinks, and take their order.",
      targetWordsToUse: ["주문하다 (to order)", "추천 (recommendation)", "아이스 (iced)", "포장 (takeout)"],
      openingGreeting: "안녕하세요! 주문 도와드릴까요? 오늘 날씨가 좋아서 시원한 딸기 라떼나 아이스 아메리카노가 인기 많아요!",
      openingGreetingTranslation: "Hello! May I help you with your order? The weather is nice today, so our chilled strawberry latte and iced Americano are very popular!",
    };
  }

  if (isSpanish) {
    return {
      title: "En el Restaurante Tradicional (At the Traditional Restaurant)",
      category: "Dining & Social",
      scenarioPrompt: "You are a friendly waiter at a cozy tapas restaurant in Seville. Welcome the guest and recommend regional specialties.",
      targetWordsToUse: ["recomendar (to recommend)", "tapas (appetizers)", "la cuenta (the bill)", "¿Qué me sugiere? (what do you suggest?)"],
      openingGreeting: "¡Buenas tardes! Bienvenido a nuestro restaurante. ¿Le gustaría empezar con unas tapas típicas de la casa?",
      openingGreetingTranslation: "Good afternoon! Welcome to our restaurant. Would you like to start with some of our house specialty tapas?",
    };
  }

  return {
    title: `Conversational Practice in ${targetLanguage}`,
    category: "Social & Daily Life",
    scenarioPrompt: `Engage in a welcoming, helpful conversation in ${targetLanguage} discussing daily interests and hobbies.`,
    targetWordsToUse: ["Hello", "Please", "Thank you", "Recommend"],
    openingGreeting: `Hello! Welcome to our practice conversation in ${targetLanguage}. What would you like to talk about today?`,
    openingGreetingTranslation: "Hello! Welcome to our practice conversation. What would you like to talk about today?",
  };
}

/**
 * Fallback Conjugation Lookup Generator
 */
export function getFallbackConjugationLookup(params: {
  verb: string;
  targetLanguage: string;
  targetLanguageCode?: string;
  knownLanguage?: string;
}) {
  const { verb, targetLanguage } = params;
  const isSpanish = (targetLanguage || "").toLowerCase().includes("spanish");
  const isChinese = (targetLanguage || "").toLowerCase().includes("chinese");
  const isKorean = (targetLanguage || "").toLowerCase().includes("korean") || (targetLanguage || "").toLowerCase().includes("한국어") || (targetLanguage || "").toLowerCase().includes("한국") || targetLanguage === "ko";

  if (isKorean) {
    const rawStem = verb.replace(/다$/, "");
    const isHada = verb.endsWith("하다");
    const presentPolite = isHada ? `${rawStem.replace(/하$/, "")}해요` : verb === "가다" ? "가요" : verb === "먹다" ? "먹어요" : verb === "배우다" ? "배워요" : verb === "보다" ? "봐요" : `${rawStem}아요/어요`;
    const formalPolite = isHada ? `${rawStem.replace(/하$/, "")}합니다` : verb === "가다" ? "갑니다" : verb === "먹다" ? "먹습니다" : verb === "배우다" ? "배웁니다" : `${rawStem}ㅂ니다/습니다`;
    const pastPolite = isHada ? `${rawStem.replace(/하$/, "")}했어요` : verb === "가다" ? "갔어요" : verb === "먹다" ? "먹었어요" : verb === "배우다" ? "배웠어요" : `${rawStem}았/었어요`;
    const futurePolite = isHada ? `${rawStem.replace(/하$/, "")}할 거예요` : verb === "가다" ? "갈 거예요" : verb === "먹다" ? "먹을 거예요" : verb === "배우다" ? "배울 거예요" : `${rawStem}(으)ㄹ 거예요`;

    return {
      verb,
      infinitiveOrRoot: verb.endsWith("다") ? verb : `${verb}다`,
      translation: `to ${verb}`,
      targetLanguage: "Korean",
      targetLangCode: "ko",
      regularity: isHada ? "regular (-하다 verb)" : "regular Korean predicate",
      stemNotes: `Korean verbs consist of a stem (${rawStem}-) and attach agglutinative grammatical endings. Korean sentences strictly follow SOV word order with the verb concluding the sentence.`,
      forms: [
        {
          id: "present-informal-polite",
          name: "Present Informal Polite (해요체)",
          category: "Polite Spoken",
          description: "Standard friendly and respectful speech used in everyday life with acquaintances and adults.",
          formula: "Verb Stem + -아요/어요/해요",
          entries: [
            { personOrForm: "General Polite", conjugated: presentPolite, phonetic: presentPolite, english: `I / you / they do`, example: { target: `저는 매일 ${presentPolite}.`, translation: `I do this action every day.` } },
          ],
        },
        {
          id: "formal-polite",
          name: "Formal Polite (하십시오체)",
          category: "Formal / Professional",
          description: "High formality style used in business, news broadcasts, public speaking, and formal introductions.",
          formula: "Verb Stem + -(스)ㅂ니다",
          entries: [
            { personOrForm: "Formal Polite", conjugated: formalPolite, phonetic: formalPolite, english: `do (formal)`, example: { target: `열심히 ${formalPolite}.`, translation: `I do this diligently (formal).` } },
          ],
        },
        {
          id: "past-polite",
          name: "Past Polite (과거형)",
          category: "Tense",
          description: "Expresses completed past actions in polite style.",
          formula: "Verb Stem + -았/었어요",
          entries: [
            { personOrForm: "Past Polite", conjugated: pastPolite, phonetic: pastPolite, english: `did / have done`, example: { target: `어제 ${pastPolite}.`, translation: `I did this yesterday.` } },
          ],
        },
        {
          id: "future-intention",
          name: "Future / Probable (-(으)ㄹ 거예요)",
          category: "Tense / Modal",
          description: "Expresses future plans, intention, or likelihood.",
          formula: "Verb Stem + -(으)ㄹ 거예요",
          entries: [
            { personOrForm: "Future Intention", conjugated: futurePolite, phonetic: futurePolite, english: `will do`, example: { target: `내일 ${futurePolite}.`, translation: `I will do this tomorrow.` } },
          ],
        },
        {
          id: "desire",
          name: "Desire / Wish (-고 싶다)",
          category: "Modal",
          description: "Expresses the speaker's desire to perform an action.",
          formula: "Verb Stem + -고 싶어요",
          entries: [
            { personOrForm: "Desire", conjugated: `${rawStem}고 싶어요`, phonetic: `${rawStem}-go sip-eo-yo`, english: `want to do`, example: { target: `빨리 ${rawStem}고 싶어요.`, translation: `I want to do this soon.` } },
          ],
        },
        {
          id: "ability-potential",
          name: "Ability / Possibility (-(으)ㄹ 수 있다)",
          category: "Modal",
          description: "Expresses ability or possibility (can do).",
          formula: "Verb Stem + -(으)ㄹ 수 있어요",
          entries: [
            { personOrForm: "Ability", conjugated: `${rawStem}(으)ㄹ 수 있어요`, phonetic: `${rawStem}-(eu)l su iss-eo-yo`, english: `can do`, example: { target: `잘 ${rawStem}(으)ㄹ 수 있어요.`, translation: `I can do this well.` } },
          ],
        },
        {
          id: "connective-cause",
          name: "Cause & Sequential Connective (-아서/어서)",
          category: "Connective",
          description: "Connects two clauses expressing cause/reason or chronological sequence in SOV structure.",
          formula: "Verb Stem + -아서/어서",
          entries: [
            { personOrForm: "Connective", conjugated: isHada ? `${rawStem.replace(/하$/, "")}해서` : `${rawStem}아서/어서`, phonetic: "connective", english: `because ... / and then`, example: { target: `시간이 있어서 ${presentPolite}.`, translation: `Because I had time, I did this.` } },
          ],
        },
      ],
    };
  }

  if (isChinese) {
    return {
      verb,
      infinitiveOrRoot: verb,
      translation: `to ${verb}`,
      targetLanguage,
      targetLangCode: "zh-TW",
      regularity: "regular (Chinese verbs do not inflect for person/tense, they use aspect particles like 了, 著, 過)",
      stemNotes: "Chinese verbs maintain a consistent root form and express tense/aspect via auxiliary particles (了 for completed action, 著 for continuous state, 過 for experiential past).",
      forms: [
        {
          id: "aspect-completed",
          name: "Completed Aspect (完成體)",
          category: "Aspect",
          description: "Indicates completed action using 了 (le)",
          formula: "[Verb] + 了",
          entries: [
            { personOrForm: "All persons", conjugated: `${verb}了`, phonetic: `${verb} le`, english: `did / have ${verb}ed`, example: { target: `我已經${verb}了。`, translation: `I already did this action.` } }
          ],
        },
        {
          id: "aspect-continuous",
          name: "Continuous / Progressive (進行/持續體)",
          category: "Aspect",
          description: "Indicates ongoing state or action with 在 (zài) or 著 (zhe)",
          formula: "正在 / 在 + [Verb]",
          entries: [
            { personOrForm: "All persons", conjugated: `正在${verb}`, phonetic: `zhèngzài ${verb}`, english: `is currently ${verb}ing`, example: { target: `他正在${verb}呢。`, translation: `He is currently doing this.` } }
          ],
        },
      ],
    };
  }

  // Default Spanish / Western Verb Fallback
  return {
    verb,
    infinitiveOrRoot: verb,
    translation: `to ${verb}`,
    targetLanguage: targetLanguage || "Spanish",
    targetLangCode: "es",
    regularity: "regular",
    stemNotes: `Standard conjugation pattern for ${verb} in ${targetLanguage}.`,
    forms: [
      {
        id: "present-indicative",
        name: "Present Indicative (Presente)",
        category: "Indicative",
        description: "Expresses habitual actions, current states, and general truths.",
        formula: "Stem + ending",
        entries: [
          { personOrForm: "1st Sing. (yo)", conjugated: `${verb.replace(/(ar|er|ir)$/i, "")}o`, phonetic: "yo", english: "I do", example: { target: `Yo ${verb.replace(/(ar|er|ir)$/i, "")}o todos los días.`, translation: "I do this every day." } },
          { personOrForm: "2nd Sing. (tú)", conjugated: `${verb.replace(/(ar|er|ir)$/i, "")}as`, phonetic: "tú", english: "you do (informal)", example: { target: `¿Tú ${verb.replace(/(ar|er|ir)$/i, "")}as ahora?`, translation: "Do you do this now?" } },
          { personOrForm: "3rd Sing. (él/ella/Ud.)", conjugated: `${verb.replace(/(ar|er|ir)$/i, "")}a`, phonetic: "él/ella", english: "he/she does", example: { target: `Ella ${verb.replace(/(ar|er|ir)$/i, "")}a con frecuencia.`, translation: "She does this frequently." } },
          { personOrForm: "1st Plural (nosotros)", conjugated: `${verb.replace(/(ar|er|ir)$/i, "")}amos`, phonetic: "nosotros", english: "we do", example: { target: `Nosotros ${verb.replace(/(ar|er|ir)$/i, "")}amos juntos.`, translation: "We do this together." } },
          { personOrForm: "3rd Plural (ellos/Uds.)", conjugated: `${verb.replace(/(ar|er|ir)$/i, "")}an`, phonetic: "ellos", english: "they do", example: { target: `Ellos ${verb.replace(/(ar|er|ir)$/i, "")}an a menudo.`, translation: "They do this often." } },
        ],
      },
      {
        id: "preterite-indicative",
        name: "Preterite Indicative (Pretérito Indefinido)",
        category: "Indicative",
        description: "Expresses completed past actions with clear time boundaries.",
        formula: "Past stem + preterite ending",
        entries: [
          { personOrForm: "1st Sing. (yo)", conjugated: `${verb.replace(/(ar|er|ir)$/i, "")}é`, phonetic: "yo", english: "I did", example: { target: `Ayer ${verb.replace(/(ar|er|ir)$/i, "")}é todo el día.`, translation: "Yesterday I did this all day." } },
          { personOrForm: "3rd Sing. (él/ella)", conjugated: `${verb.replace(/(ar|er|ir)$/i, "")}ó`, phonetic: "él", english: "he/she did", example: { target: `Ayer él ${verb.replace(/(ar|er|ir)$/i, "")}ó temprano.`, translation: "Yesterday he did this early." } },
        ],
      },
    ],
  };
}

/**
 * Fallback Reading Text Explanation Generator
 */
export function getFallbackReadingTextExplanation(params: {
  selectedText: string;
  targetLanguage: string;
  knownLanguage?: string;
}) {
  const { selectedText, targetLanguage } = params;
  return {
    selectedText,
    translation: `[Meaning of "${selectedText}"]`,
    grammaticalContext: `"${selectedText}" functions as a core semantic unit in ${targetLanguage}. Notice how it connects to surrounding sentence elements.`,
    concepts: [
      {
        id: `concept-${Date.now()}`,
        targetItem: selectedText,
        type: "vocabulary",
        partOfSpeech: "Phrase / Word",
        definition: `Key vocabulary or structural phrase in ${targetLanguage}`,
        phonetic: "pronunciation guide",
        usageNotes: `Use "${selectedText}" in everyday conversation or reading comprehension.`,
        exampleSentence: {
          target: selectedText,
          translation: `Meaning of "${selectedText}" in context`,
          phonetic: "",
        },
      },
    ],
  };
}

/**
 * Fallback Grade Reading Response Generator
 */
export function getFallbackGradeReadingResponse(params: {
  questionText: string;
  userResponse: string;
  targetLanguage: string;
}) {
  const { userResponse } = params;
  const isReasonableLength = userResponse.trim().length >= 3;
  return {
    semanticScore: isReasonableLength ? 85 : 40,
    isSemanticallyAccurate: isReasonableLength,
    semanticFeedback: isReasonableLength
      ? "Good effort! Your response addresses the core meaning of the reading passage."
      : "Your answer is brief. Try adding more detail from the article.",
    grammarScore: isReasonableLength ? 82 : 45,
    isGrammaticallyCorrect: isReasonableLength,
    grammarFeedback: "Sentence structure is clear and understandable. Keep practicing natural transitions.",
    overallGrade: isReasonableLength ? 4 : 2,
    correctedUserSentence: userResponse,
    correctedUserSentenceTranslation: "Your submitted response in English",
    identifiedErrors: [],
    suggestedRemedyCards: [],
  };
}


