export interface StructureFormula {
  id: string;
  name: string;
  category: "word_order" | "modifiers" | "particles" | "negation_questions" | "advanced";
  summary: string;
  formulaSlots: { label: string; role: string; exampleTarget: string; exampleEng: string; color: string }[];
  explanation: string;
  keyRule: string;
  examples: {
    target: string;
    translation: string;
    phonetic?: string;
    breakdownNote: string;
  }[];
}

export interface LanguageStructureGuide {
  langCode: string;
  langName: string;
  flag: string;
  wordOrderType: "SVO (Subject-Verb-Object)" | "SOV (Subject-Object-Verb)" | "VSO" | "Topic-Comment + SVO" | "V2 (Verb-Second)";
  overview: string;
  topDifferencesFromEnglish: string[];
  formulas: StructureFormula[];
}

export const LANGUAGE_STRUCTURE_GUIDES: Record<string, LanguageStructureGuide> = {
  "zh-TW": {
    langCode: "zh-TW",
    langName: "Traditional Chinese",
    flag: "🇹🇼",
    wordOrderType: "Topic-Comment + SVO",
    overview:
      "Chinese sentence structure fundamentally follows Subject + (Time/Place) + Adverb + Verb + Object. Modifiers (adjectives, relative clauses) always come BEFORE the noun they describe.",
    topDifferencesFromEnglish: [
      "Time & Location come BEFORE the action verb (e.g., 'I yesterday at library studied')",
      "No verb conjugation, tenses, or gender agreement—tense is marked via aspect particles (了, 著, 過)",
      "Modifiers always precede nouns using the connector particle 的 (de)",
      "Special disposal structure 把 (bǎ) moves the object before the verb when an action causes a change",
    ],
    formulas: [
      {
        id: "zh-basic-svo",
        name: "Standard Action Sentence",
        category: "word_order",
        summary: "Subject + Time + Location + Verb + Object",
        formulaSlots: [
          { label: "Subject", role: "Who", exampleTarget: "我", exampleEng: "I", color: "bg-blue-100 text-blue-900 border-blue-200" },
          { label: "Time", role: "When", exampleTarget: "今天早上", exampleEng: "this morning", color: "bg-amber-100 text-amber-900 border-amber-200" },
          { label: "Place", role: "Where", exampleTarget: "在咖啡館", exampleEng: "at cafe", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
          { label: "Verb", role: "Action", exampleTarget: "喝了", exampleEng: "drank", color: "bg-rose-100 text-rose-900 border-rose-200" },
          { label: "Object", role: "What", exampleTarget: "一杯咖啡", exampleEng: "a cup of coffee", color: "bg-purple-100 text-purple-900 border-purple-200" },
        ],
        explanation:
          "In Chinese, context (Time & Location) always sets the stage before the verb occurs. Never place time words at the end of a sentence like English does.",
        keyRule: "Rule of Thumb: Big frame (Time/Place) -> Action -> Outcome.",
        examples: [
          {
            target: "我今天在圖書館看書。",
            translation: "I read books at the library today.",
            phonetic: "wǒ jīntiān zài túshūguǎn kàn shū",
            breakdownNote: "Notice 'today' and 'at library' appear right before 'read books'.",
          },
          {
            target: "我們晚上七點在餐廳見面。",
            translation: "We will meet at the restaurant at 7 PM tonight.",
            phonetic: "wǒmen wǎnshàng qī diǎn zài cāntīng jiànmiàn",
            breakdownNote: "Time (7 PM) -> Place (restaurant) -> Verb (meet).",
          },
        ],
      },
      {
        id: "zh-modifier-de",
        name: "Noun Modifiers & Descriptions",
        category: "modifiers",
        summary: "Description / Adjective + 的 (de) + Noun",
        formulaSlots: [
          { label: "Modifier", role: "Description", exampleTarget: "昨天買的", exampleEng: "bought yesterday", color: "bg-indigo-100 text-indigo-900 border-indigo-200" },
          { label: "Particle", role: "Connector", exampleTarget: "的", exampleEng: "(link)", color: "bg-slate-100 text-slate-900 border-slate-200" },
          { label: "Noun", role: "Head Word", exampleTarget: "書", exampleEng: "book", color: "bg-purple-100 text-purple-900 border-purple-200" },
        ],
        explanation:
          "Whether a single adjective ('beautiful'), a possessive ('my'), or a complex clause ('the book that I bought yesterday'), all modifiers stand strictly BEFORE the noun with 的.",
        keyRule: "No relative pronouns (that/which) needed; simply place the whole description in front with 的.",
        examples: [
          {
            target: "這是很有趣的電影。",
            translation: "This is a very interesting movie.",
            phonetic: "zhè shì hěn yǒuqù de diànyǐng",
            breakdownNote: "很有趣 (very interesting) + 的 + 電影 (movie).",
          },
          {
            target: "我認識那個穿紅衣服的人。",
            translation: "I know the person who is wearing red clothes.",
            phonetic: "wǒ rènshí nàge chuān hóng yīfú de rén",
            breakdownNote: "The entire relative clause 'wearing red clothes' precedes 'person'.",
          },
        ],
      },
      {
        id: "zh-ba-structure",
        name: "Disposal Structure (把字句)",
        category: "particles",
        summary: "Subject + 把 (bǎ) + Specific Object + Action + Result",
        formulaSlots: [
          { label: "Subject", role: "Agent", exampleTarget: "請你", exampleEng: "Please you", color: "bg-blue-100 text-blue-900 border-blue-200" },
          { label: "把", role: "Disposal Marker", exampleTarget: "把", exampleEng: "take", color: "bg-rose-100 text-rose-900 border-rose-200" },
          { label: "Object", role: "Known Object", exampleTarget: "這扇門", exampleEng: "this door", color: "bg-purple-100 text-purple-900 border-purple-200" },
          { label: "Verb + Result", role: "Action & Impact", exampleTarget: "關上", exampleEng: "close shut", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
        ],
        explanation:
          "Used when an action affects, moves, changes, or disposes of a specific object. The verb cannot stand alone; it must have a result or direction complement.",
        keyRule: "Use 把 whenever an action does something TO an object and changes its state.",
        examples: [
          {
            target: "請把你的名字寫在上面。",
            translation: "Please write your name on top.",
            phonetic: "qǐng bǎ nǐ de míngzì xiě zài shàngmiàn",
            breakdownNote: "Object (your name) is brought forward with 把 before the verb (write).",
          },
        ],
      },
      {
        id: "zh-questions",
        name: "Question Formation (嗎 / 疑問詞)",
        category: "negation_questions",
        summary: "Statement + 嗎 (ma) OR Question Word in place",
        formulaSlots: [
          { label: "Statement", role: "Base sentence", exampleTarget: "你想喝茶", exampleEng: "You want to drink tea", color: "bg-slate-100 text-slate-900 border-slate-200" },
          { label: "Question Marker", role: "Particle", exampleTarget: "嗎？", exampleEng: "?", color: "bg-amber-100 text-amber-900 border-amber-200" },
        ],
        explanation:
          "Chinese has NO question word inversion or auxiliary verbs (no 'Do you...'). Keep the exact word order of a statement and either add 嗎 at the end or replace the unknown element with a question word (什麼, 哪裡, 誰).",
        keyRule: "Word order never changes between questions and answers.",
        examples: [
          {
            target: "你在看什麼書？",
            translation: "What book are you reading?",
            phonetic: "nǐ zài kàn shénme shū?",
            breakdownNote: "什麼 (what) simply occupies the object position where the answer would be.",
          },
        ],
      },
    ],
  },
  "es": {
    langCode: "es",
    langName: "Spanish",
    flag: "🇪🇸",
    wordOrderType: "SVO (Subject-Verb-Object)",
    overview:
      "Spanish word order is generally Subject-Verb-Object, but is flexible. Subject pronouns are frequently omitted because verb endings already encode the person and number.",
    topDifferencesFromEnglish: [
      "Subject pronouns are usually dropped (e.g. 'Hablo español' instead of 'Yo hablo español')",
      "Most descriptive adjectives follow the noun and match gender/number ('un libro interesante')",
      "Object pronouns (me, te, lo, la, le, nos, los, las, les) are placed BEFORE conjugated verbs",
      "Questions use inverted punctuation (¿...?) and place the verb before the subject",
    ],
    formulas: [
      {
        id: "es-basic-svo",
        name: "Pronoun-Drop & Action Sentence",
        category: "word_order",
        summary: "(Subject) + Verb + Direct/Indirect Object",
        formulaSlots: [
          { label: "Subject (Optional)", role: "Who", exampleTarget: "(Nosotros)", exampleEng: "(We)", color: "bg-blue-100 text-blue-900 border-blue-200" },
          { label: "Conjugated Verb", role: "Action & Person", exampleTarget: "estudiamos", exampleEng: "study", color: "bg-rose-100 text-rose-900 border-rose-200" },
          { label: "Object", role: "What", exampleTarget: "español", exampleEng: "Spanish", color: "bg-purple-100 text-purple-900 border-purple-200" },
          { label: "Adverbial", role: "When/Where", exampleTarget: "todos los días", exampleEng: "every day", color: "bg-amber-100 text-amber-900 border-amber-200" },
        ],
        explanation:
          "Because 'estudiamos' uniquely means 'we study', including 'nosotros' is optional and only used for emphasis or contrast.",
        keyRule: "Omit subject pronouns unless emphasizing who is doing the action.",
        examples: [
          {
            target: "Vivo en Madrid desde hace tres años.",
            translation: "I have lived in Madrid for three years.",
            phonetic: "VEE-voh en mah-DREED...",
            breakdownNote: "'Vivo' alone signifies 'I live' without needing 'Yo'.",
          },
        ],
      },
      {
        id: "es-adj-placement",
        name: "Adjective Placement & Agreement",
        category: "modifiers",
        summary: "Noun + Descriptive Adjective (Gender/Number Match)",
        formulaSlots: [
          { label: "Article", role: "Gender/Number", exampleTarget: "una", exampleEng: "a (fem)", color: "bg-slate-100 text-slate-900 border-slate-200" },
          { label: "Noun", role: "Core Noun", exampleTarget: "casa", exampleEng: "house (fem)", color: "bg-purple-100 text-purple-900 border-purple-200" },
          { label: "Adjective", role: "Modifier", exampleTarget: "blanca", exampleEng: "white (fem)", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
        ],
        explanation:
          "Descriptive adjectives (color, size, shape, nationality) almost always follow the noun and must match both gender (-o/-a) and plurality (-s/-es).",
        keyRule: "Noun comes first; description comes after, matching in gender and number.",
        examples: [
          {
            target: "Tiene dos gatos negros muy cariñosos.",
            translation: "She has two very affectionate black cats.",
            phonetic: "TYEH-neh dohs GAH-tohs NEH-grohs...",
            breakdownNote: "Gatos (masc. plural) -> negros (masc. plural) -> cariñosos (masc. plural).",
          },
        ],
      },
      {
        id: "es-object-pronouns",
        name: "Object Pronoun Placement",
        category: "particles",
        summary: "Subject + Object Pronoun (Indirect -> Direct) + Conjugated Verb",
        formulaSlots: [
          { label: "Subject", role: "Who", exampleTarget: "María", exampleEng: "Maria", color: "bg-blue-100 text-blue-900 border-blue-200" },
          { label: "Indirect Pronoun", role: "To Whom", exampleTarget: "me", exampleEng: "to me", color: "bg-amber-100 text-amber-900 border-amber-200" },
          { label: "Direct Pronoun", role: "What", exampleTarget: "lo", exampleEng: "it", color: "bg-indigo-100 text-indigo-900 border-indigo-200" },
          { label: "Conjugated Verb", role: "Action", exampleTarget: "explicó", exampleEng: "explained", color: "bg-rose-100 text-rose-900 border-rose-200" },
        ],
        explanation:
          "Object pronouns (me, te, lo, la, nos, les) precede conjugated verbs. When both indirect and direct pronouns appear together, Indirect always precedes Direct.",
        keyRule: "Pronouns go BEFORE conjugated verbs, but ATTACH to the end of infinitives and gerunds.",
        examples: [
          {
            target: "Te lo voy a decir ahora mismo.",
            translation: "I am going to tell it to you right now.",
            phonetic: "teh loh BOY ah deh-SEER...",
            breakdownNote: "Te (to you) + lo (it) placed before the conjugated auxiliary 'voy'.",
          },
        ],
      },
    ],
  },
  "ja": {
    langCode: "ja",
    langName: "Japanese",
    flag: "🇯🇵",
    wordOrderType: "SOV (Subject-Object-Verb)",
    overview:
      "Japanese is strictly Verb-Final (SOV). Grammatical roles are defined by particle markers (は, が, を, に, で) attached directly to nouns.",
    topDifferencesFromEnglish: [
      "The verb is ALWAYS at the very end of the sentence or clause",
      "Particles dictate grammatical function (Topic, Subject, Object, Direction, Location)",
      "Topic (marked with は) establishes context; known subjects are routinely omitted",
      "Modifiers and relative clauses always precede the noun without relative pronouns",
    ],
    formulas: [
      {
        id: "ja-basic-sov",
        name: "Standard Topic-Object-Verb Sentence",
        category: "word_order",
        summary: "Topic (は) + Time/Place (で/に) + Object (を) + Verb",
        formulaSlots: [
          { label: "Topic", role: "Context", exampleTarget: "田中さんは", exampleEng: "As for Tanaka-san", color: "bg-blue-100 text-blue-900 border-blue-200" },
          { label: "Place + Particle", role: "Where", exampleTarget: "カフェで", exampleEng: "at the cafe", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
          { label: "Object + Particle", role: "What", exampleTarget: "コーヒーを", exampleEng: "coffee (obj)", color: "bg-purple-100 text-purple-900 border-purple-200" },
          { label: "Verb", role: "Action (Final)", exampleTarget: "飲みます", exampleEng: "drinks", color: "bg-rose-100 text-rose-900 border-rose-200" },
        ],
        explanation:
          "In Japanese, the verb must anchor the sentence at the end. Particles act as postpositions that tell you what role each preceding noun plays.",
        keyRule: "Verbs stay at the end. Particles follow the words they govern.",
        examples: [
          {
            target: "私は毎日日本語を勉強します。",
            translation: "I study Japanese every day.",
            phonetic: "watashi wa mainichi nihongo o benkyō shimasu",
            breakdownNote: "私 (I) + は (topic) -> 毎日 (every day) -> 日本語 (Japanese) + を (object) -> 勉強します (study).",
          },
        ],
      },
      {
        id: "ja-particles-wa-ga",
        name: "Topic (は) vs Subject (が)",
        category: "particles",
        summary: "Known Topic (は) vs New / Focus Information (が)",
        formulaSlots: [
          { label: "Topic Marker は", role: "General Topic", exampleTarget: "これは本です", exampleEng: "This is a book", color: "bg-indigo-100 text-indigo-900 border-indigo-200" },
          { label: "Subject Marker が", role: "Specific Agent", exampleTarget: "誰が来ましたか", exampleEng: "Who came?", color: "bg-amber-100 text-amber-900 border-amber-200" },
        ],
        explanation:
          "は marks the topic being talked about ('as for X...'). が marks specific grammatical subjects, especially when introducing new information or answering 'who/which'.",
        keyRule: "Use は for general context/contrast; use が for specific identification or automatic phenomena.",
        examples: [
          {
            target: "雨が降っています。",
            translation: "Rain is falling (It is raining).",
            phonetic: "ame ga futte imasu",
            breakdownNote: "が marks the natural subject 'rain' being observed directly.",
          },
        ],
      },
    ],
  },
  "fr": {
    langCode: "fr",
    langName: "French",
    flag: "🇫🇷",
    wordOrderType: "SVO (Subject-Verb-Object)",
    overview:
      "French follows Subject-Verb-Object word order with mandatory subject pronouns, sandwich negation (ne...pas), and pre-verbal object clitics.",
    topDifferencesFromEnglish: [
      "Subject pronouns are mandatory (no pronoun-dropping like Spanish)",
      "Standard negation wraps around the verb ('ne + verb + pas')",
      "Most adjectives follow the noun ('un livre passionnant'), though BANGS adjectives precede it",
      "Object pronouns precede the conjugated verb ('Je t'aime')",
    ],
    formulas: [
      {
        id: "fr-negation-sandwich",
        name: "Negation Sandwich (ne ... pas)",
        category: "negation_questions",
        summary: "Subject + ne (n') + Conjugated Verb + pas + Object",
        formulaSlots: [
          { label: "Subject", role: "Who", exampleTarget: "Je", exampleEng: "I", color: "bg-blue-100 text-blue-900 border-blue-200" },
          { label: "ne / n'", role: "Negation part 1", exampleTarget: "ne", exampleEng: "not (1)", color: "bg-rose-100 text-rose-900 border-rose-200" },
          { label: "Verb", role: "Conjugated Verb", exampleTarget: "comprends", exampleEng: "understand", color: "bg-indigo-100 text-indigo-900 border-indigo-200" },
          { label: "pas", role: "Negation part 2", exampleTarget: "pas", exampleEng: "not (2)", color: "bg-rose-100 text-rose-900 border-rose-200" },
          { label: "Object", role: "What", exampleTarget: "la question", exampleEng: "the question", color: "bg-purple-100 text-purple-900 border-purple-200" },
        ],
        explanation:
          "In formal and written French, negation sandwiches the conjugated verb with 'ne' and 'pas'. In spoken French, 'ne' is frequently dropped.",
        keyRule: "Wrap the conjugated verb between 'ne' and 'pas'.",
        examples: [
          {
            target: "Nous ne voulons pas partir maintenant.",
            translation: "We do not want to leave now.",
            phonetic: "noo nuh voo-LOHN pah par-TEER...",
            breakdownNote: "'ne voulons pas' wraps the conjugated verb 'voulons'.",
          },
        ],
      },
    ],
  },
  "de": {
    langCode: "de",
    langName: "German",
    flag: "🇩🇪",
    wordOrderType: "V2 (Verb-Second)",
    overview:
      "German strictly enforces the Verb-Second (V2) rule in main clauses: whatever element starts the sentence, the conjugated verb MUST occupy position two.",
    topDifferencesFromEnglish: [
      "V2 Rule: The conjugated verb is ALWAYS the second element in main clauses",
      "Subordinate clauses kick the conjugated verb to the very end (after weil, dass, wenn)",
      "Past participles and separable prefixes go to the end of the clause ('bracket structure')",
      "Four cases (Nominative, Accusative, Dative, Genitive) change articles and endings",
    ],
    formulas: [
      {
        id: "de-v2-rule",
        name: "Verb-Second (V2) & Inversion",
        category: "word_order",
        summary: "Element 1 (Time/Place/Subject) + Conjugated Verb (Pos 2) + Subject + Object",
        formulaSlots: [
          { label: "Element 1", role: "Time / Trigger", exampleTarget: "Heute", exampleEng: "Today", color: "bg-amber-100 text-amber-900 border-amber-200" },
          { label: "Verb (Pos 2)", role: "Action", exampleTarget: "gehe", exampleEng: "go", color: "bg-rose-100 text-rose-900 border-rose-200" },
          { label: "Subject", role: "Who (Inverted)", exampleTarget: "ich", exampleEng: "I", color: "bg-blue-100 text-blue-900 border-blue-200" },
          { label: "Place / Object", role: "Where", exampleTarget: "ins Kino", exampleEng: "to the cinema", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
        ],
        explanation:
          "If anything other than the subject starts a German sentence (like 'Heute'), the subject and verb invert so the verb remains locked in position 2.",
        keyRule: "Position 2 is non-negotiable in main clauses. Verb always takes position 2.",
        examples: [
          {
            target: "Gestern habe ich ein interessantes Buch gelesen.",
            translation: "Yesterday I read an interesting book.",
            phonetic: "GEH-stairn HAH-buh ikh...",
            breakdownNote: "Gestern (1) -> habe (2) -> ich (Subject) -> Buch -> gelesen (Past participle at end).",
          },
        ],
      },
    ],
  },
};

/**
 * Get or generate structure guide for a language
 */
export function getSentenceStructureGuide(langCode: string, langName: string, flag: string): LanguageStructureGuide {
  if (LANGUAGE_STRUCTURE_GUIDES[langCode]) {
    return LANGUAGE_STRUCTURE_GUIDES[langCode];
  }

  // Fallback / generalized guide for any other supported language
  return {
    langCode,
    langName,
    flag,
    wordOrderType: "SVO (Subject-Verb-Object)",
    overview: `${langName} sentence structure combines core Subject, Verb, and Object elements. Mastering the foundational word order and modifier rules provides the framework for natural sentence formation.`,
    topDifferencesFromEnglish: [
      `Standard word order establishes basic communicative clarity in ${langName}`,
      "Modifiers and descriptive phrases follow specific placement relative to nouns",
      "Question and negation formations follow consistent structural formulas",
      "Grammatical markers indicate relationship between actions, actors, and objects",
    ],
    formulas: [
      {
        id: `${langCode}-core-svo`,
        name: "Standard Sentence Architecture",
        category: "word_order",
        summary: "Subject + Verb + Direct Object + Context",
        formulaSlots: [
          { label: "Subject", role: "Actor", exampleTarget: "Subject", exampleEng: "The person", color: "bg-blue-100 text-blue-900 border-blue-200" },
          { label: "Verb", role: "Action", exampleTarget: "Verb", exampleEng: "performs action", color: "bg-rose-100 text-rose-900 border-rose-200" },
          { label: "Object", role: "Goal", exampleTarget: "Object", exampleEng: "the object", color: "bg-purple-100 text-purple-900 border-purple-200" },
        ],
        explanation: `In ${langName}, expressing ideas clearly begins with identifying the subject and linking it directly to the conjugated action.`,
        keyRule: `Establish who is acting, what action is taking place, and what is being affected.`,
        examples: [
          {
            target: `[${langName} sample sentence]`,
            translation: "Example translated sentence demonstrating correct word order.",
            breakdownNote: "Follows foundational grammar patterns for the target language.",
          },
        ],
      },
    ],
  };
}
