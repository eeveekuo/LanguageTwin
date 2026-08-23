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
  "ko": {
    langCode: "ko",
    langName: "Korean",
    flag: "🇰🇷",
    wordOrderType: "SOV (Subject-Object-Verb)",
    overview:
      "Korean is strictly a Verb-Final (SOV) agglutinative language. Words do not change their root stems; grammatical functions are marked by particles (은/는, 이/가, 을/를, 에/에서) attached directly to nouns, and verbs/adjectives conjugate with speech levels (-아요/어요, -(스)ㅂ니다) at the very end of the clause.",
    topDifferencesFromEnglish: [
      "Strict SOV word order: The main verb or descriptive adjective ALWAYS anchors the sentence at the end",
      "Particles dictate grammatical function (Topic: 은/는, Subject: 이/가, Object: 을/를, Location/Time: 에/에서)",
      "Subject pronouns are routinely omitted when clear from conversational context",
      "Adjectives function as descriptive verbs (상태동사) and conjugate directly with polite endings (e.g. 예뻐요 = 'is pretty')",
      "Modifiers and relative clauses always precede the noun using participle suffixes (-는, -(으)ㄴ, -(으)ㄹ)",
    ],
    formulas: [
      {
        id: "ko-basic-sov",
        name: "Standard Action Sentence (SOV)",
        category: "word_order",
        summary: "Topic (은/는) + Time + Location (에서) + Object (을/를) + Verb",
        formulaSlots: [
          { label: "Topic", role: "Who (Context)", exampleTarget: "저는", exampleEng: "As for me", color: "bg-blue-100 text-blue-900 border-blue-200" },
          { label: "Time", role: "When", exampleTarget: "오늘", exampleEng: "today", color: "bg-amber-100 text-amber-900 border-amber-200" },
          { label: "Place + 에서", role: "Action Location", exampleTarget: "도서관에서", exampleEng: "at the library", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
          { label: "Object + 을/를", role: "What", exampleTarget: "한국어를", exampleEng: "Korean (obj)", color: "bg-purple-100 text-purple-900 border-purple-200" },
          { label: "Verb", role: "Action (Final)", exampleTarget: "공부해요", exampleEng: "study", color: "bg-rose-100 text-rose-900 border-rose-200" },
        ],
        explanation:
          "In Korean, circumstantial context (Time, Location) and Objects must be stated before the verb. The conjugated verb (-해요 / -합니다) closes the sentence. Particles attach directly to nouns with no spaces.",
        keyRule: "Word order is Topic/Subject -> Time -> Place -> Object -> Verb.",
        examples: [
          {
            target: "저는 도서관에서 책을 읽어요.",
            translation: "I read books at the library.",
            phonetic: "jeo-neun do-seo-gwan-e-seo chaeg-eul ilg-eo-yo",
            breakdownNote: "저 (I) + 는 (topic) -> 도서관 (library) + 에서 (at) -> 책 (book) + 을 (object) -> 읽어요 (read).",
          },
          {
            target: "친구가 카페에서 커피를 마셔요.",
            translation: "A friend drinks coffee at the cafe.",
            phonetic: "chin-gu-ga ka-pe-e-seo keo-pi-reul ma-syeo-yo",
            breakdownNote: "친구 (friend) + 가 (subject) -> 카페 (cafe) + 에서 (at) -> 커피 (coffee) + 를 (object) -> 마셔요 (drink).",
          },
        ],
      },
      {
        id: "ko-particles-topic-subject",
        name: "Topic (은/는) vs Subject (이/가)",
        category: "particles",
        summary: "Context / Contrast (은/는) vs Specific Agent / New Info (이/가)",
        formulaSlots: [
          { label: "Topic (은/는)", role: "Old Info / Contrast", exampleTarget: "이것은 사과예요", exampleEng: "As for this, it's an apple", color: "bg-indigo-100 text-indigo-900 border-indigo-200" },
          { label: "Subject (이/가)", role: "Focus / Perception", exampleTarget: "비가 와요", exampleEng: "Rain is falling", color: "bg-amber-100 text-amber-900 border-amber-200" },
        ],
        explanation:
          "은/는 introduces or shifts the conversational topic ('as for X...') or creates contrast between items. 이/가 points out the specific subject doing an action or answers 'who/which'. Note morphophonology: use 는/가 after vowels, 은/이 after consonants (받침).",
        keyRule: "Vowel ending -> 는 / 가. Consonant ending (받침) -> 은 / 이.",
        examples: [
          {
            target: "저는 미국 사람이에요. 하지만 친구는 한국 사람이에요.",
            translation: "I am American. But as for my friend, they are Korean.",
            phonetic: "jeo-neun mi-guk sa-ram-i-e-yo. ha-ji-man chin-gu-neun han-guk sa-ram-i-e-yo.",
            breakdownNote: "Shows contrast between 'I' (저 + 는) and 'friend' (친구 + 는).",
          },
          {
            target: "누가 한국어를 가르쳐요?",
            translation: "Who teaches Korean?",
            phonetic: "nu-ga han-guk-eo-reul ga-reu-chyeo-yo?",
            breakdownNote: "누가 (누구 + 가) focuses specifically on identifying the actor.",
          },
        ],
      },
      {
        id: "ko-location-particles",
        name: "Location Particles: 에 vs 에서",
        category: "particles",
        summary: "Destination / Existence (에) vs Dynamic Action Location (에서)",
        formulaSlots: [
          { label: "Static / Destination (에)", role: "Where to / at [time]", exampleTarget: "서울에 가요", exampleEng: "go to Seoul", color: "bg-teal-100 text-teal-900 border-teal-200" },
          { label: "Action Location (에서)", role: "Where action occurs", exampleTarget: "식당에서 먹어요", exampleEng: "eat at restaurant", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
        ],
        explanation:
          "에 is used with movement verbs (가다, 오다, 다니다), static existence verbs (있다, 없다), and specific times. 에서 is strictly used for the venue where an active physical action is carried out.",
        keyRule: "Going to / existing in -> 에. Doing an action at -> 에서.",
        examples: [
          {
            target: "저는 내일 공항에 가요.",
            translation: "I am going to the airport tomorrow.",
            phonetic: "jeo-neun nae-il gong-hang-e ga-yo",
            breakdownNote: "공항 (airport) + 에 (destination) + 가요 (go).",
          },
          {
            target: "공원에서 친구와 운동했어요.",
            translation: "I exercised with a friend in the park.",
            phonetic: "gong-won-e-seo chin-gu-wa un-dong-haess-eo-yo",
            breakdownNote: "공원 (park) + 에서 (action location) + 운동했어요 (exercised).",
          },
        ],
      },
      {
        id: "ko-noun-modifiers",
        name: "Noun Modifiers & Relative Clauses",
        category: "modifiers",
        summary: "Verb/Adjective Stem + Modifier Ending (-는 / -(으)ㄴ / -(으)ㄹ) + Noun",
        formulaSlots: [
          { label: "Modifier Phrase", role: "Description / Action", exampleTarget: "내가 어제 산", exampleEng: "that I bought yesterday", color: "bg-indigo-100 text-indigo-900 border-indigo-200" },
          { label: "Core Noun", role: "Head Word", exampleTarget: "책", exampleEng: "book", color: "bg-purple-100 text-purple-900 border-purple-200" },
          { label: "Copula / Verb", role: "Ending", exampleTarget: "이에요", exampleEng: "is", color: "bg-rose-100 text-rose-900 border-rose-200" },
        ],
        explanation:
          "Korean does not use relative pronouns (no 'that', 'which', or 'who'). Instead, the entire descriptive clause is attached directly in front of the noun using modifier endings: -는 (present action), -(으)ㄴ (past action or descriptive adjective), -(으)ㄹ (future/prospective).",
        keyRule: "Modifiers strictly precede the noun: Present action -> -는; Adjective -> -(으)ㄴ; Past action -> -(으)ㄴ.",
        examples: [
          {
            target: "이것은 내가 제일 좋아하는 노래예요.",
            translation: "This is the song that I like the most.",
            phonetic: "i-geos-eun nae-ga je-il jo-ha-ha-neun no-rae-ye-yo",
            breakdownNote: "좋아하다 (to like) + -는 (present modifier) -> 노래 (song).",
          },
          {
            target: "따뜻한 차를 마시고 싶어요.",
            translation: "I want to drink warm tea.",
            phonetic: "tta-tteut-han cha-reul ma-si-go sip-eo-yo",
            breakdownNote: "따뜻하다 (warm) + -ㄴ -> 따뜻한 (warm modifier) -> 차 (tea).",
          },
        ],
      },
      {
        id: "ko-negation",
        name: "Negation & Inability (안 vs 못)",
        category: "negation_questions",
        summary: "안 / 못 + Verb (Short form) OR Verb + -지 않다 / -지 못하다 (Long form)",
        formulaSlots: [
          { label: "General Not (안)", role: "Will not / Do not", exampleTarget: "안 먹어요", exampleEng: "do not eat", color: "bg-rose-100 text-rose-900 border-rose-200" },
          { label: "Inability (못)", role: "Cannot / Unable", exampleTarget: "못 가요", exampleEng: "cannot go", color: "bg-amber-100 text-amber-900 border-amber-200" },
        ],
        explanation:
          "Korean distinguishes between intentional/general negation (안 / -지 않다: 'I do not want to / do not') and situational inability (못 / -지 못하다: 'I cannot / am unable to despite wanting to').",
        keyRule: "안 = intentional choice ('do not'); 못 = external inability or lack of skill ('cannot').",
        examples: [
          {
            target: "저는 매운 음식을 안 먹어요.",
            translation: "I do not eat spicy food (personal preference).",
            phonetic: "jeo-neun mae-un eum-sig-eul an meog-eo-yo",
            breakdownNote: "안 + 먹어요 expresses an intentional habit or preference.",
          },
          {
            target: "바빠서 파티에 못 갔어요.",
            translation: "I could not go to the party because I was busy.",
            phonetic: "ba-ppa-seo pa-ti-e mot gass-eo-yo",
            breakdownNote: "못 + 갔어요 expresses inability caused by circumstances.",
          },
        ],
      },
      {
        id: "ko-clause-connectors",
        name: "Clause Linkers & Sequence (-고, -아서/어서)",
        category: "advanced",
        summary: "Clause 1 Stem + Connector (-고 / -아서/어서 / -(으)면) + Clause 2",
        formulaSlots: [
          { label: "Clause 1 + Linker", role: "First Action / Reason", exampleTarget: "친구를 만나서", exampleEng: "met a friend and...", color: "bg-indigo-100 text-indigo-900 border-indigo-200" },
          { label: "Clause 2", role: "Next Action / Result", exampleTarget: "영화를 봤어요", exampleEng: "watched a movie", color: "bg-rose-100 text-rose-900 border-rose-200" },
        ],
        explanation:
          "Clauses are joined by attaching connective suffixes directly to the verb stem of the first clause. -고 expresses sequential or parallel addition; -아서/어서 expresses tightly connected chronological cause-and-effect; -(으)면 creates conditional clauses ('if/when').",
        keyRule: "Never use English conjunctions ('And', 'Because') to start separate sentences—attach suffixes directly to the verb stem.",
        examples: [
          {
            target: "주말에 날씨가 좋으면 등산할 거예요.",
            translation: "If the weather is good this weekend, I will go hiking.",
            phonetic: "ju-mal-e nal-ssi-ga joh-eu-myeon deung-san-hal geo-ye-yo",
            breakdownNote: "좋다 (good) + -(으)면 (if) creates the conditional clause.",
          },
          {
            target: "숙제를 다 하고 게임을 했어요.",
            translation: "I finished all my homework and then played games.",
            phonetic: "suk-je-reul da ha-go ge-im-eul haess-eo-yo",
            breakdownNote: "하다 (do) + -고 (and then) links two actions in sequence.",
          },
        ],
      },
    ],
  },
  "nan": {
    langCode: "nan",
    langName: "Taiwanese Hokkien",
    flag: "🇹🇼",
    wordOrderType: "Topic-Comment + SVO",
    overview:
      "Taiwanese Hokkien (臺灣話 / Tâi-gí) features Topic-Comment and Subject-Verb-Object word order with pre-verbal aspect markers (有, 無, 咧, 矣), disposal structures (共 ká/kā), and tone sandhi rules where syllables change tone when followed by another word.",
    topDifferencesFromEnglish: [
      "Time, location, and progressive markers (咧 teh) precede the main verb",
      "Aspect and negation are handled by specialized pre-verbal auxiliaries (有, 無, 毋, 袂, 莫)",
      "Disposal particle 共 (kā) brings direct or indirect objects before the verb",
      "Modifiers precede nouns using the connector particle 的/个 (ê)",
    ],
    formulas: [
      {
        id: "nan-basic-svo",
        name: "Standard Action & Progressive Aspect",
        category: "word_order",
        summary: "Subject + Time/Place + Progressive (咧 teh) + Verb + Object",
        formulaSlots: [
          { label: "Subject", role: "Who", exampleTarget: "我", exampleEng: "I (guá)", color: "bg-blue-100 text-blue-900 border-blue-200" },
          { label: "Place", role: "Where", exampleTarget: "佇圖書館", exampleEng: "at library (tī)", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
          { label: "Progressive", role: "Aspect Marker", exampleTarget: "咧", exampleEng: "in progress (teh)", color: "bg-amber-100 text-amber-900 border-amber-200" },
          { label: "Verb + Object", role: "Action & Object", exampleTarget: "看冊", exampleEng: "read books (khuànn-tsheh)", color: "bg-rose-100 text-rose-900 border-rose-200" },
        ],
        explanation:
          "In Taiwanese Hokkien, location (佇 tī...) and progressive aspect (咧 teh) set the scene immediately in front of the main verb phrase.",
        keyRule: "Subject -> Location (佇) -> Progressive Aspect (咧) -> Verb -> Object.",
        examples: [
          {
            target: "我佇客廳咧聽音樂。",
            translation: "I am listening to music in the living room.",
            phonetic: "Guá tī khek-thiann teh thiann im-ga̍k.",
            breakdownNote: "我 (I) -> 佇客廳 (in living room) -> 咧 (progressive) -> 聽音樂 (listen to music).",
          },
        ],
      },
      {
        id: "nan-disposal-ka",
        name: "Disposal & Dative Particle (共 kā)",
        category: "particles",
        summary: "Subject + 共 (kā) + Object/Person + Verb Phrase",
        formulaSlots: [
          { label: "Subject", role: "Agent", exampleTarget: "請你", exampleEng: "Please you", color: "bg-blue-100 text-blue-900 border-blue-200" },
          { label: "共 kā", role: "Disposal / Target Marker", exampleTarget: "共", exampleEng: "take / to (kā)", color: "bg-rose-100 text-rose-900 border-rose-200" },
          { label: "Object", role: "Target", exampleTarget: "這扇門", exampleEng: "this door", color: "bg-purple-100 text-purple-900 border-purple-200" },
          { label: "Resultative Verb", role: "Action & Result", exampleTarget: "關起來", exampleEng: "close shut", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
        ],
        explanation:
          "共 (kā) serves as both the disposal particle (moving an affected object before the verb) and the marker for 'to / for / on behalf of' someone.",
        keyRule: "Use 共 (kā) before an object to express doing an action to it or for someone.",
        examples: [
          {
            target: "伊共我講一個秘密。",
            translation: "He told me a secret.",
            phonetic: "I kā guá kóng tsi̍t ê pì-bi̍t.",
            breakdownNote: "共我 (kā guá = to me) precedes the verb 講 (kóng = tell).",
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
