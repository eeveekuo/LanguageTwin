import {
  PlacementQuestion,
  PlacementTestResult,
  Deck,
  Flashcard,
  SRSData,
  CEFRLevel,
  IdentifiedError,
} from "../types";
import { DEFAULT_DECKS } from "../data/defaultDecks";

export const createInitialSRS = (): SRSData => {
  const now = new Date().toISOString();
  return {
    repetition: 0,
    interval: 0,
    easeFactor: 2.5,
    dueDate: now,
    history: [],
    masteryScore: 0,
    status: "new",
    consecutiveSuccesses: 0,
  };
};

/**
 * Get curated diagnostic placement questions for any target language
 */
export function getDiagnosticPlacementQuestions(
  targetLanguage: string,
  knownLanguage: string,
  testType: "quick" | "comprehensive"
): { testTitle: string; targetLanguage: string; knownLanguage: string; estimatedDurationMinutes: number; questions: PlacementQuestion[] } {
  const langLower = (targetLanguage || "").toLowerCase();

  // 1. Spanish Specific Diagnostic (DELE / CEFR)
  if (langLower.includes("spanish") || langLower.includes("español") || langLower === "es") {
    const spanishQuestions: PlacementQuestion[] = [
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
        prompt: `Complete this hypothetical conditional sentence in ${targetLanguage}: 'If I had a month of vacation, I would travel across Latin America.'`,
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

  // 2. French Specific Diagnostic (DELF / DALF / CEFR)
  if (langLower.includes("french") || langLower.includes("français") || langLower === "fr") {
    const frenchQuestions: PlacementQuestion[] = [
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
        prompt: `Put the bracketed concepts into the completed past tense (passé composé): "Hier, nous [visited] le musée et nous [took/drank] un café."`,
        targetItem: "Compound past auxiliary selection (avoir/être) and past participle agreement",
        contextOrAudioText: "Hier nous avons visité le musée et nous avons pris un café.",
        correctAnswerSample: "Hier, nous avons visité le musée et nous avons pris un café.",
        explanation: "Assesses standard past tense formulation and auxiliary selection (A2).",
      },
      {
        id: "q-fr-3",
        cefrLevel: "B1",
        questionType: "production",
        prompt: `Write a sentence in ${targetLanguage} expressing necessity or advice for a friend who has an important exam tomorrow.`,
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
        targetItem: "Direct object pronoun vs indirect pronoun placement (les vs leur)",
        contextOrAudioText: "Je vais à la maison de mes parents pour les voir.",
        correctAnswerSample: "Je vais chez mes parents pour les voir.",
        explanation: "Assesses direct object clitic pronoun usage with transitive verbs (B1).",
      },
      {
        id: "q-fr-5",
        cefrLevel: "B2",
        questionType: "production",
        prompt: `Formulate a conditional sentence in ${targetLanguage} expressing a past counterfactual regret: 'If I had known the truth earlier, I would have acted differently.'`,
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
      testTitle: `${targetLanguage} DELF & CEFR Placement Diagnostic`,
      targetLanguage,
      knownLanguage,
      estimatedDurationMinutes: testType === "quick" ? 3 : 6,
      questions: testType === "quick" ? frenchQuestions.slice(0, 5) : frenchQuestions,
    };
  }

  // 3. Korean Specific Diagnostic (TOPIK / CEFR)
  if (langLower.includes("korean") || langLower.includes("한국어") || langLower.includes("한국") || langLower === "ko") {
    const koreanQuestions: PlacementQuestion[] = [
      {
        id: "q-ko-1",
        cefrLevel: "A1",
        questionType: "production",
        prompt: `Introduce yourself in ${targetLanguage}: state your name, your nationality or occupation, and a polite greeting.`,
        targetItem: "Self-introduction, polite copula, and topic/subject markers",
        contextOrAudioText: "안녕하세요! 이름이 무엇이고 어디에서 오셨어요?",
        correctAnswerSample: "안녕하세요, 저는 민수예요. 미국 사람이고 학생이에요.",
        explanation: "Assesses basic self-identification, topic markers, and present polite copula (A1 / TOPIK I Level 1).",
      },
      {
        id: "q-ko-2",
        cefrLevel: "A2",
        questionType: "transformation",
        prompt: `Complete the sentence by putting the bracketed English actions into natural polite past tense: "어제 친구를 [met] 같이 영화를 [watched]."`,
        targetItem: "Sequential action clause connection and past polite aspect inflection",
        contextOrAudioText: "어제 친구를 만나서 같이 영화를 봤어요.",
        correctAnswerSample: "어제 친구를 만나서 같이 영화를 봤어요.",
        explanation: "Assesses sequential action connection and regular/irregular past tense conjugation (A2 / TOPIK I Level 2).",
      },
      {
        id: "q-ko-3",
        cefrLevel: "B1",
        questionType: "production",
        prompt: `State your opinion about studying abroad or learning languages in ${targetLanguage}, explaining your reasoning in a natural polite style.`,
        targetItem: "Complex subordinate clause linkage and indirect opinion formulation",
        contextOrAudioText: "제 생각에는 유학이 힘들지만 많은 것을 배울 수 있어서 좋은 것 같아요.",
        correctAnswerSample: "유학 생활은 조금 외롭지만 시야를 넓힐 수 있기 때문에 가치 있다고 생각해요.",
        explanation: "Assesses complex clause linkage and indirect opinion formulation (B1 / TOPIK II Level 3).",
      },
      {
        id: "q-ko-4",
        cefrLevel: "B1",
        questionType: "error_spotting",
        prompt: `Spot the particle mistake in this sentence and rewrite it correctly: "저는 내일 비행기을 타고 제주도에 갈 거예요."`,
        targetItem: "Object particle morphophonological agreement",
        contextOrAudioText: "저는 내일 비행기를 타고 제주도에 갈 거예요.",
        correctAnswerSample: "저는 내일 비행기를 타고 제주도에 갈 거예요.",
        explanation: "Assesses awareness of Korean morphophonological particle selection (을 vs 를) (B1 Error Spotting).",
      },
      {
        id: "q-ko-5",
        cefrLevel: "B2",
        questionType: "production",
        prompt: `Express this past counterfactual condition in ${targetLanguage}: "If I had had more preparation time, I would have passed the exam."`,
        targetItem: "Past counterfactual hypothetical structures and modal consequence endings",
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
        targetItem: "Four-character proverbs and high-register figurative expressions",
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

  // 4. Chinese (Mandarin / Traditional Chinese / Simplified Chinese / TOCFL / HSK)
  if (langLower.includes("chinese") || langLower.includes("中文") || langLower.includes("華語") || langLower.includes("漢語") || langLower.includes("zh")) {
    const isTraditional = langLower.includes("traditional") || langLower.includes("繁體") || langLower.includes("tw") || langLower.includes("taiwan");
    const chineseQuestions: PlacementQuestion[] = [
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
        targetItem: isTraditional ? "動態助詞與時量補語句型" : "动态助词与时量补语句型",
        contextOrAudioText: isTraditional ? "昨天我學了兩個小時的中文。" : "昨天我学了两个小时的中文。",
        correctAnswerSample: isTraditional ? "昨天我學了兩個小時的中文。" : "昨天我学了两个小时的中文。",
        explanation: "Assesses aspect marker (了) and duration complement structure (A2 / TOCFL Level 2 / HSK 3).",
      },
      {
        id: "q-zh-3",
        cefrLevel: "B1",
        questionType: "production",
        prompt: `Express your opinion about public transit or cycling in ${targetLanguage}, connecting your ideas with a contrast or causal clause.`,
        targetItem: isTraditional ? "轉折複句關聯詞與主觀觀點表達" : "转折复句关联词与主观观点表达",
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
        prompt: `Compose a conditional or hypothetical sentence in ${targetLanguage}: 'If we had known the project timeline in advance, we wouldn't have rushed.'`,
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
        contextOrAudioText: isTraditional ? "在跨文化合作的過程中，唯有保持開放包容的心態並建立透明溝通機制，才能化解潛在的分歧。" : "在跨文化合作的过程中，唯有保持开放包容的心态并建立透明沟通机制，才能化解潜在的分歧。",
        correctAnswerSample: isTraditional ? "說話者建議保持開放心態並建立透明溝通機制來化解分歧。" : "说话者建议保持开放心态并建立透明沟通机制来化解分歧。",
        explanation: "Assesses listening comprehension of high-register argumentative discourse (B2 / TOCFL Level 5 / HSK 6).",
      },
      {
        id: "q-zh-7",
        cefrLevel: "C1",
        questionType: "collocation",
        prompt: `Translate this concept using an authentic, high-register four-character idiom (成語): 'To make steady, gradual progress step-by-step through persistent effort / Step by step.'`,
        targetItem: isTraditional ? "典雅四字成語與高階修辭表達" : "典雅四字成语与高阶修辞表达",
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

  // 5. Japanese Specific Diagnostic (JLPT / CEFR)
  if (langLower.includes("japanese") || langLower.includes("日本語") || langLower === "ja") {
    const japaneseQuestions: PlacementQuestion[] = [
      {
        id: "q-ja-1",
        cefrLevel: "A1",
        questionType: "production",
        prompt: `Introduce yourself in ${targetLanguage}: state your name, where you are from or your occupation, using natural polite style.`,
        targetItem: "Basic self-introduction, polite copula, and topic particles",
        contextOrAudioText: "初めまして！お名前とご出身はどちらですか？",
        correctAnswerSample: "初めまして、田中です。東京から来ました。よろしくお願いします。",
        explanation: "Assesses basic self-introduction, polite copula, and essential survival greeting (A1 / JLPT N5).",
      },
      {
        id: "q-ja-2",
        cefrLevel: "A2",
        questionType: "transformation",
        prompt: `Connect the actions in the past into a single natural sentence: "昨日、友達に [met] 一緒に昼ご飯を [ate]。"`,
        targetItem: "Sequential action chaining and past polite inflection",
        contextOrAudioText: "昨日、友達に会って、一緒に昼ご飯を食べました。",
        correctAnswerSample: "昨日、友達に会って、一緒に昼ご飯を食べました。",
        explanation: "Assesses te-form sequential linkage and standard polite past conjugation (A2 / JLPT N4).",
      },
      {
        id: "q-ja-3",
        cefrLevel: "B1",
        questionType: "production",
        prompt: `State your opinion about remote work in ${targetLanguage}, explaining your reasoning in polite Japanese.`,
        targetItem: "Objective causality clauses and indirect opinion endings",
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
        prompt: `Write a conditional or hypothetical sentence in ${targetLanguage}: 'If I had known that earlier, I wouldn't have made that mistake.'`,
        targetItem: "Counterfactual conditionals and modal regret expressions",
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
        targetItem: "Four-character idioms and nuanced literary collocations",
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

  // 6. Universal Multilingual CEFR Matrix
  const universalQuestions: PlacementQuestion[] = [
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
      questionType: "transformation",
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
      questionType: "error_spotting",
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
  errors: IdentifiedError[];
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

  const errors: IdentifiedError[] = [];

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
 * Intelligent Local Placement Evaluation Engine
 */
export function getDiagnosticPlacementEvaluation(
  targetLanguage: string,
  knownLanguage: string,
  submissions: Array<{ questionId: string; userAnswer: string; cefrLevel?: string; questionType?: string }>,
  testQuestions: PlacementQuestion[]
): PlacementTestResult {
  let correctCount = 0;
  const errorList: IdentifiedError[] = [];

  const perQuestionReview = submissions.map((sub, idx) => {
    const q = testQuestions?.find((item) => item.id === sub.questionId) || testQuestions?.[idx] || {
      id: sub.questionId,
      cefrLevel: (sub.cefrLevel as CEFRLevel) || "A2",
      prompt: `Question ${idx + 1}`,
      targetItem: "Language proficiency",
      correctAnswerSample: `Natural ${targetLanguage} expression`,
      explanation: "Grammar & vocabulary assessment",
    };

    const evalRes = evaluateDiagnosticAnswer(targetLanguage, q, sub.userAnswer);

    if (evalRes.isCorrect) {
      correctCount++;
    } else if (evalRes.errors && evalRes.errors.length > 0) {
      errorList.push(...evalRes.errors);
    }

    const validatedCefr: CEFRLevel =
      q.cefrLevel === "A1" || q.cefrLevel === "A2" || q.cefrLevel === "B1" || q.cefrLevel === "B2" || q.cefrLevel === "C1" || q.cefrLevel === "C2"
        ? q.cefrLevel
        : "A2";

    return {
      questionId: sub.questionId,
      cefrLevel: validatedCefr,
      prompt: q.prompt || `Question ${idx + 1}`,
      userAnswer: sub.userAnswer || "(No response provided)",
      isCorrect: evalRes.isCorrect,
      feedback: evalRes.feedback,
      idealAnswer: evalRes.idealAnswer,
    };
  });

  const total = submissions.length || 1;
  const ratio = correctCount / total;

  let diagnosedLevel: CEFRLevel = "A1";
  let startingRank = 1;
  let vocabSize = 350;
  let actflName = "Novice Mid";

  if (ratio >= 0.85) {
    diagnosedLevel = "B2";
    startingRank = 1500;
    vocabSize = 4200;
    actflName = "Advanced Low";
  } else if (ratio >= 0.6) {
    diagnosedLevel = "B1";
    startingRank = 600;
    vocabSize = 2100;
    actflName = "Intermediate Mid";
  } else if (ratio >= 0.35) {
    diagnosedLevel = "A2";
    startingRank = 200;
    vocabSize = 950;
    actflName = "Novice High";
  }

  const scorePct = Math.round(ratio * 100);

  return {
    overallCEFR: diagnosedLevel,
    cefrDescription: `Demonstrates ${diagnosedLevel} active production competence in ${targetLanguage}, capable of expressing thoughts clearly in familiar and contextual scenarios.`,
    percentageScore: scorePct,
    estimatedActiveVocabularySize: vocabSize,
    recommendedStartingRank: startingRank,
    strengths: [
      `Active sentence formulation in ${targetLanguage}`,
      `Grasp of high-frequency vocabulary and foundational syntactic structure`,
      `Contextual reading and listening comprehension`,
    ],
    weaknesses: [
      `Complex subordinate clause linkages and mood distinctions`,
      `Nuanced register modulation (formal vs conversational)`,
    ],
    identifiedErrors:
      errorList.length > 0
        ? errorList.slice(0, 4)
        : [
            {
              originalMistake: "Subordinate clause agreement",
              correctedForm: "Ensure proper verb mood and connector selection in complex sentences",
              errorType: "grammar",
              explanation: "Focus on connecting sentences with varied conjunctions and temporal markers.",
            },
          ],
    standardizedEquivalency: {
      frameworkName: `Standardized CEFR / ACTFL Profile for ${targetLanguage}`,
      estimatedScoreOrGrade: `CEFR Level ${diagnosedLevel} (${scorePct}% Mastery)`,
      actflEquivalent: actflName,
      readinessPercentage: scorePct,
      description: `Solid performance indicating readiness for level ${diagnosedLevel} curriculum track.`,
    },
    detailedFeedback: `Great diagnostic test! Your assessment demonstrates an active foundation in ${targetLanguage}. We recommend starting your frequency-ranked SRS deck around Rank #${startingRank} to accelerate active production.`,
    perQuestionReview,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Generate a Calibrated Deck locally based on placement level and errors
 */
export function getDiagnosticCalibratedDeck(
  targetLanguage: string,
  knownLanguage: string,
  targetLangCode: string,
  knownLangCode: string,
  cefrLevel: string,
  recommendedStartingRank: number = 1,
  identifiedErrors: Array<{ mistake?: string; correction?: string; topic?: string }> = []
): Deck {
  const newDeckId = `deck-${targetLangCode}-calibrated-${cefrLevel.toLowerCase()}-${Date.now()}`;
  
  // Find if a matching default deck exists in the database
  const matchingDefault = DEFAULT_DECKS.find(
    (d) => d.targetLangCode === targetLangCode || d.targetLang.toLowerCase().includes(targetLanguage.toLowerCase())
  );

  let baseCards: Flashcard[] = [];
  if (matchingDefault && matchingDefault.cards && matchingDefault.cards.length > 0) {
    baseCards = matchingDefault.cards.map((c, idx) => ({
      ...c,
      id: `card-${newDeckId}-${idx + 1}`,
      deckId: newDeckId,
      frequencyRank: recommendedStartingRank + idx,
      srs: createInitialSRS(),
    }));
  }

  // If no base cards found, create high-quality calibrated starter cards
  if (baseCards.length === 0) {
    baseCards = [
      {
        id: `card-${newDeckId}-1`,
        deckId: newDeckId,
        type: "vocabulary",
        targetItem: targetLanguage === "Spanish" ? "tener" : targetLanguage === "French" ? "avoir" : "Core Vocabulary",
        targetLanguage,
        knownLanguage,
        frequencyRank: recommendedStartingRank,
        partOfSpeech: "Verb",
        definition: "to have / possess / experience",
        phonetic: "",
        usageNotes: `Fundamental high-frequency verb in ${targetLanguage} essential for CEFR ${cefrLevel}.`,
        examples: [
          {
            target: targetLanguage === "Spanish" ? "Tengo una pregunta importante." : targetLanguage === "French" ? "J'ai une question importante." : `Example sentence in ${targetLanguage}.`,
            translation: "I have an important question.",
            tokenBreakdown: [],
          },
        ],
        tags: ["calibrated", `cefr-${cefrLevel.toLowerCase()}`],
        srs: createInitialSRS(),
      },
      {
        id: `card-${newDeckId}-2`,
        deckId: newDeckId,
        type: "grammar",
        targetItem: targetLanguage === "Spanish" ? "porque vs para que" : targetLanguage === "French" ? "parce que vs pour que" : "Clause Connectors",
        targetLanguage,
        knownLanguage,
        frequencyRank: recommendedStartingRank + 1,
        partOfSpeech: "Conjunction",
        definition: "because (cause) vs in order that (purpose)",
        phonetic: "",
        usageNotes: `Critical sentence connector assessed in your CEFR ${cefrLevel} diagnostic.`,
        examples: [
          {
            target: targetLanguage === "Spanish" ? "Estudio porque quiero viajar." : targetLanguage === "French" ? "J'étudie parce que je veux voyager." : `Connector example in ${targetLanguage}.`,
            translation: "I study because I want to travel.",
            tokenBreakdown: [],
          },
        ],
        tags: ["grammar", `cefr-${cefrLevel.toLowerCase()}`],
        srs: createInitialSRS(),
      },
    ];
  }

  // Append error remediation cards if any
  if (identifiedErrors && identifiedErrors.length > 0) {
    identifiedErrors.forEach((err, idx) => {
      if (err.topic || err.correction) {
        baseCards.unshift({
          id: `card-${newDeckId}-err-${idx + 1}`,
          deckId: newDeckId,
          type: "common_error",
          isCommonError: true,
          originalMistake: err.mistake || "Common learner misconception",
          correctedForm: err.correction || "Accurate target structure",
          targetItem: err.topic || "Error Remediation Focus",
          targetLanguage,
          knownLanguage,
          frequencyRank: 0,
          partOfSpeech: "Error Remediation",
          definition: err.correction || "Corrected grammatical usage",
          phonetic: "",
          usageNotes: `Remediation card generated directly from your placement diagnostic results.`,
          examples: [
            {
              target: err.correction || "Target sentence construction",
              translation: "Accurate phrasing in target language",
              tokenBreakdown: [],
            },
          ],
          tags: ["remediation", "placement-error"],
          srs: createInitialSRS(),
        });
      }
    });
  }

  return {
    id: newDeckId,
    title: `${targetLanguage} — CEFR ${cefrLevel} Calibrated Track`,
    description: `Custom frequency curriculum starting at Rank #${recommendedStartingRank} with error remediation.`,
    targetLang: targetLanguage,
    targetLangCode,
    knownLang: knownLanguage,
    knownLangCode,
    level: `CEFR ${cefrLevel} (Diagnostic Standardized)`,
    createdAt: new Date().toISOString(),
    cards: baseCards,
  };
}
