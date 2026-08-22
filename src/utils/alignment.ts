/**
 * Bidirectional Token and Phrase Alignment for Parallel Translations
 * 
 * Provides linguistic tokenization, cross-lingual dictionary matching,
 * compound word segmentation, clitic/particle syntactic grouping,
 * and high-precision bidirectional hover alignments.
 */

export interface Token {
  id: string;
  text: string;
  isPunctuation: boolean;
  cleanText: string;
  alignedIds: string[]; // IDs of aligned tokens in the other language
}

export interface AlignedSentencePair {
  targetTokens: Token[];
  translationTokens: Token[];
}

// CJK character check
export function isCJK(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf) || // CJK Extension A
    (code >= 0x3040 && code <= 0x309f) || // Hiragana
    (code >= 0x30a0 && code <= 0x30ff) || // Katakana
    (code >= 0xac00 && code <= 0xd7af) || // Hangul Syllables
    (code >= 0x3100 && code <= 0x312f)    // Bopomofo / Zhuyin
  );
}

// Common punctuation characters
const PUNCTUATION_REGEX = /^[.,!?;:()[\]{}"'`«»—–\-·。，！？；：「」『』（）…、]+$/;

// High-frequency compound words for Chinese segmentation to prevent single-character fragmentation
const CHINESE_COMPOUND_LEXICON: string[] = [
  "來自", "台灣", "臺灣", "學生", "老師", "同學", "朋友", "今天", "明天", "昨天", "作業", "功課",
  "手機", "電話", "行動電話", "電腦", "筆電", "平板", "學校", "教室", "很多", "非常", "喜歡", "運動", "窗戶",
  "關上", "打開", "外面", "裡面", "天氣", "雖然", "但是", "因為", "所以", "如果", "一邊", "越來", "越來越",
  "夜市", "美食", "品嚐", "旅行", "旅遊", "推薦", "圖書館", "咖啡店", "咖啡", "電影", "看書", "寫字",
  "吃飯", "喝水", "謝謝", "你好", "歹勢", "有影", "逐家", "食飽未", "出門", "容易", "我們", "你們",
  "他們", "她們", "自己", "已經", "準備", "開始", "結束", "問題", "回答", "幫助", "協助", "學習",
  "中文", "英文", "日文", "韓文", "西文", "西班牙文", "請問", "不好意思", "火車站", "特色菜", "在地",
  "當地", "餐廳", "好吃", "美味", "多少錢", "捷運站", "公車站", "是不是", "有沒有", "能不能", "可不可以",
  "這本書", "這支", "這台", "這個", "那支", "那台", "那個", "這些", "那些", "哪裡", "什麼", "怎麼", "為什麼"
];

// Articles and clitics in Western languages that should group with adjacent nouns
const NOUN_ARTICLES_AND_DETERMINERS = new Set([
  "a", "an", "the", "un", "una", "unos", "unas", "el", "la", "los", "las",
  "le", "les", "des", "ce", "cet", "cette", "ces",
  "der", "die", "das", "ein", "eine", "einen", "einem", "einer", "eines",
  "il", "lo", "i", "gli", "uno"
]);

// Auxiliaries and modals that should group with adjacent main verbs
const VERBAL_AUXILIARIES = new Set([
  "do", "does", "did", "done", "will", "would", "shall", "should", "can", "could", "may", "might", "must",
  "have", "has", "had", "been", "to"
]);

// Prepositions that can group with adjacent nouns if unaligned
const PREPOSITIONS = new Set([
  "of", "in", "to", "for", "with", "on", "at", "from", "by", "about", "as", "into", "like", "through", "after", "over", "between",
  "de", "en", "a", "para", "por", "con", "sin", "sobre", "entre", "hasta", "desde",
  "dans", "pour", "sur", "avec", "sans", "sous", "vers", "chez"
]);

// Grammatical particles in East Asian languages (Chinese, Japanese, Korean)
const EAST_ASIAN_PARTICLES = new Set([
  "的", "之", "得", "地", "了", "著", "过", "過", "嗎", "呢", "吧", "啊",
  "は", "が", "を", "に", "で", "へ", "と", "から", "まで", "の", "ね", "よ", "か", "も",
  "은", "는", "이", "가", "을", "를", "에", "에서", "와", "과", "도", "로", "으로"
]);

// Bilingual Alignment Lexicon (Maps source words/phrases to candidate target words/phrases across languages)
const BILINGUAL_ALIGNMENT_MAP: Record<string, string[]> = {
  // Pronouns & Demonstratives
  "i": ["我", "私", "わたし", "yo", "je", "저", "나", "guá", "ich", "io", "eu"],
  "me": ["我", "私", "わたし", "mí", "me", "moi", "저", "나", "mich", "mir"],
  "my": ["我的", "私の", "わたしの", "mi", "mis", "mon", "ma", "mes", "제", "mein", "meine"],
  "mine": ["我的", "私", "mío", "mía", "le mien"],
  "you": ["你", "您", "tú", "usted", "vos", "あなた", "toi", "vous", "당신", "너", "lí", "du", "sie", "tu"],
  "your": ["你的", "您的", "你", "您", "tu", "tus", "su", "sus", "votre", "ton", "ta", "tes", "dein", "ihr", "너의", "당신의"],
  "yours": ["你的", "您的", "你", "tuyo", "tuya", "suyo", "suya"],
  "he": ["他", "él", "il", "kare", "彼", "그", "er", "lui", "ele"],
  "him": ["他", "él", "lui", "kare", "彼", "그"],
  "his": ["他的", "su", "sus", "son", "sa", "ses", "彼の", "그의", "sein"],
  "she": ["她", "ella", "elle", "kanojo", "彼女", "그녀", "sie", "lei", "ela"],
  "her": ["她", "她的", "ella", "su", "sus", "la", "elle", "son", "sa", "彼女", "그녀"],
  "it": ["它", "esto", "eso", "ce", "ça", "sore", "kore", "それ", "これ", "이것", "그것", "es"],
  "we": ["我們", "nosotros", "nosotras", "nous", "私たち", "わたしたち", "우리", "lán", "guán", "wir", "noi", "nós"],
  "us": ["我們", "nosotros", "nous", "私たち", "우리", "uns"],
  "our": ["我們的", "nuestro", "nuestra", "notre", "nos", "私たちの", "우리", "unser"],
  "they": ["他們", "她們", "ellos", "ellas", "ils", "elles", "彼ら", "그들", "in", "sie", "loro", "eles"],
  "them": ["他們", "她們", "ellos", "ellas", "eux", "elles", "彼ら", "그들", "sie"],
  "their": ["他們的", "她們的", "su", "sus", "leur", "leurs", "彼らの", "그들의", "ihr"],
  "this": ["這", "這個", "這本", "這支", "這台", "esto", "esta", "este", "ce", "cette", "cet", "これ", "この", "이", "이것", "tsit", "dieses", "questo"],
  "that": ["那", "那個", "那本", "那支", "那台", "eso", "esa", "ese", "aquel", "ce", "cette", "que", "それ", "あれ", "その", "あの", "그", "저", "hit", "jenes", "quello"],
  "these": ["這些", "estos", "estas", "ces", "これら", "これらの", "이것들"],
  "those": ["那些", "esos", "esas", "aquellos", "ces", "あれら", "あれらの", "그것들"],

  // Copula & State Verbs
  "am": ["是", "soy", "estoy", "suis", "です", "だ", "이다", "이에요", "예요", "sī", "bin", "sono", "sou"],
  "is": ["是", "在", "es", "está", "est", "です", "だ", "あります", "います", "이다", "이에요", "예요", "sī", "ist", "è", "é"],
  "are": ["是", "在", "son", "están", "somos", "estamos", "eres", "estás", "êtes", "sont", "sommes", "です", "だ", "sī", "sind", "bist", "seid", "siamo", "siete", "sono"],
  "be": ["是", "在", "ser", "estar", "être", "sein", "essere", "ser"],
  "was": ["是", "era", "fue", "estaba", "estuvo", "était", "fut", "でした", "였다", "sī", "war"],
  "were": ["是", "eran", "fueron", "estaban", "estuvieron", "étaient", "でした", "였다", "waren"],
  "is not": ["不是", "不在", "no es", "n'est pas", "じゃない", "아니다"],
  "isn't": ["不是", "不在", "no es", "n'est pas", "じゃない"],
  "are not": ["不是", "不在", "no son", "ne sont pas"],
  "aren't": ["不是", "不在", "no son"],
  "not": ["不", "不是", "沒有", "no", "pas", "nicht", "non", "ない", "아니다", "안"],
  "or": ["還是", "或者", "是不是", "o", "ou", "または", "또는", "oder", "oppure"],
  "or not": ["是不是", "有沒有", "能不能", "o no", "ou pas", "かどう"],
  "from": ["來自", "從", "de", "desde", "du", "de la", "des", "から", "で", "에서", "부터", "uì", "aus", "von", "da"],
  
  // Objects & Tech
  "cell phone": ["手機", "行動電話", "teléfono celular", "móvil", "携帯電話", "핸드폰", "handy"],
  "cell": ["手機", "celular", "携帯"],
  "phone": ["手機", "電話", "teléfono", "móvil", "téléphone", "電話", "핸드폰"],
  "smartphone": ["手機", "智慧型手機", "smartphone", "スマートフォン", "스마트폰"],
  "computer": ["電腦", "computadora", "ordenador", "ordinateur", "パソコン", "컴퓨터", "computer"],
  "laptop": ["筆電", "筆記型電腦", "portátil", "ordinateur portable", "ノートパソコン", "노트북"],
  "tablet": ["平板", "平板電腦", "tableta", "tablette", "タブレット", "태블릿"],

  // School, Work & Places
  "student": ["學生", "estudiante", "alumno", "étudiant", "学生", "がくせい", "학생", "ha̍k-sing", "student", "schüler"],
  "students": ["學生", "estudiantes", "alumnos", "étudiants", "学生", "학생들", "studenten"],
  "teacher": ["老師", "profesor", "maestro", "professeur", "先生", "せんせい", "선생님", "lehrer"],
  "taiwan": ["台灣", "臺灣", "taiwán", "taiwan", "台湾", "たいわん", "대만", "tâi-uân"],
  "japan": ["日本", "japón", "japon", "日本", "にほん", "일본", "ji̍t-pún"],
  "spain": ["西班牙", "españa", "espagne", "スペイン", "스페인"],
  "korea": ["韓國", "corea", "corée", "韓国", "かんこく", "한국"],
  "window": ["窗戶", "窗", "ventana", "fenêtre", "窓", "まど", "창문", "thang-á", "fenster", "finestra", "janela"],
  "windows": ["窗戶", "ventanas", "fenêtres", "窓", "창문들"],
  "homework": ["作業", "功課", "tarea", "tareas", "devoirs", "宿題", "しゅくだい", "숙제", "hausaufgaben"],
  "book": ["書", "這本書", "libro", "livre", "本", "ほん", "책", "tsheh", "buch", "livro"],
  "books": ["書", "libros", "livres", "本", "책들", "bücher", "libri", "livros"],
  "coffee": ["咖啡", "café", "cafe", "コーヒー", "커피", "ka-pi", "kaffee", "caffè"],
  "cafe": ["咖啡店", "cafetería", "café", "カフェ", "喫茶店", "카페", "cafeteria"],
  "library": ["圖書館", "biblioteca", "bibliothèque", "図書館", "としょかん", "도서관", "bibliothek"],
  "movie": ["電影", "película", "film", "映画", "えいが", "영화", "kino"],
  "food": ["美食", "食物", "菜", "comida", "nourriture", "料理", "グルメ", "음식", "essen", "cibo"],
  "night market": ["夜市", "mercado nocturno", "night market", "夜市", "よいち", "야시장", "iā-tshī"],

  // Core Verbs
  "have": ["有", "擁有", "tener", "tengo", "tiene", "tenemos", "tienen", "avoir", "ai", "a", "持つ", "ある", "いる", "가지다", "있다", "ū", "haben", "avere", "ter"],
  "has": ["有", "tiene", "a", "ある", "いる", "있다", "ū", "hat", "ha", "tem"],
  "had": ["有", "tenía", "tuvo", "avait", "eu", "있었다", "hatte", "aveva", "teve"],
  "close": ["關上", "關", "cerrar", "cierra", "fermer", "閉める", "閉めて", "닫다", "닫아", "kuainn", "schließen", "chiudere", "fechar"],
  "open": ["打開", "開", "abrir", "abre", "ouvrir", "開ける", "開けて", "열다", "khui", "öffnen", "aprire", "abrir"],
  "eat": ["吃", "comer", "como", "come", "manger", "食べる", "食べます", "먹다", "먹어요", "tsia̍h", "essen", "mangiare", "comer"],
  "drink": ["喝", "beber", "tomar", "boire", "飲む", "飲みます", "마시다", "lim", "trinken", "bere", "beber"],
  "exercise": ["運動", "ejercicio", "hacer ejercicio", "ejercitarse", "faire du sport", "運動する", "運動しました", "운동", "운동하다"],
  "study": ["學習", "學", "estudiar", "estudio", "estudia", "étudier", "勉強する", "勉強します", "공부하다", "tha̍k-tsheh", "lernen", "studieren", "studiare"],
  "learn": ["學", "學習", "aprender", "aprendo", "aprende", "apprendre", "学ぶ", "배우다", "o̍h", "lernen", "imparare", "aprender"],
  "read": ["看書", "讀", "看", "leer", "leo", "lee", "lire", "読む", "読書", "읽다", "tha̍k", "lesen", "leggere", "ler"],
  "write": ["寫", "寫完", "escribir", "escribe", "écrire", "書く", "書きます", "쓰다", "siá", "schreiben", "scrivere", "escrever"],
  "finish": ["完成", "寫完", "terminar", "acabar", "finir", "終わる", "끝내다"],
  "want": ["想", "想要", "querer", "quiero", "quiere", "vouloir", "たい", "ほしい", "싶다", "원하다", "siūnn", "wollen", "volere", "querer"],
  "like": ["喜歡", "gustar", "gusta", "aimer", "好き", "大好き", "좋아하다", "kah-ì", "mögen", "piacere", "gostar"],
  "travel": ["旅行", "旅遊", "viajar", "viaje", "voyager", "旅行する", "旅行に行く", "여행하다", "lí-hîng", "reisen", "viaggiare", "viajar"],
  "taste": ["品嚐", "嚐", "probar", "degustar", "goûter", "味わう", "味見する", "맛보다", "tshì"],
  "recommend": ["推薦", "recomendar", "recomiende", "recommander", "おすすめ", "お勧め", "薦める", "추천하다", "thui-tsiàn", "empfehlen", "raccomandare", "recomendar"],
  "go": ["去", "出門", "ir", "voy", "va", "aller", "行く", "行きます", "가다", "khi", "gehen", "andare", "ir"],
  "went": ["去", "出門了", "fue", "fui", "allé", "行った", "갔다", "ging", "andato", "foi"],
  "please": ["請", "por favor", "s'il vous plaît", "ください", "お願いします", "제발", "부탁합니다", "tshiánn", "bitte", "per favore", "por favor"],

  // Adjectives, Questions & Modifiers
  "today": ["今天", "今仔日", "hoy", "aujourd'hui", "今日", "きょう", "오늘", "kin-á-ji̍t", "heute", "oggi", "hoje"],
  "tomorrow": ["明天", "明仔載", "mañana", "demain", "明日", "あした", "내일", "mî-á-tsài", "morgen", "domani", "amanhã"],
  "yesterday": ["昨天", "ayer", "hier", "昨日", "きのう", "어제", "gestern", "ieri", "ontem"],
  "cold": ["冷", "很冷", "frío", "froid", "寒い", "さむい", "춥다", "추운", "lénn", "kalt", "freddo", "frio"],
  "hot": ["熱", "很熱", "caliente", "calor", "chaud", "暑い", "あつい", "뜨거운", "더운", "jua̍h", "heiß", "caldo", "quente"],
  "outside": ["外面", "afuera", "fuera", "dehors", "外", "そと", "밖", "gōo-bīn", "draußen", "fuori", "fora"],
  "inside": ["裡面", "adentro", "dentro", "dedans", "中", "うち", "안", "lāi-té", "drinnen", "dentro"],
  "although": ["雖然", "aunque", "bien que", "が", "けれども", "비록", "수록", "sui-jiân", "obwohl", "sebbene", "embora"],
  "but": ["但是", "可是", "pero", "mais", "でも", "しかし", "하지만", "그렇지만", "tān-sī", "aber", "ma", "mas"],
  "still": ["還是", "仍然", "todavía", "aún", "encore", "それでも", "やはり", "여전히", "그래도", "iáu-kú", "noch", "ancora", "ainda"],
  "very": ["很", "非常", "muy", "très", "とても", "非常に", "매우", "아주", "tsin", "sehr", "molto", "muito"],
  "a lot": ["很多", "mucho", "beaucoup", "たくさん", "많이", "tsē", "viel", "molto", "muito"],
  "a lot of": ["很多", "mucho", "muchos", "muchas", "beaucoup de", "たくさんの", "많은", "viel"],
  "easy": ["容易", "簡單", "fácil", "facile", "簡単", "かんたん", "優しい", "쉬운", "쉽다", "iông-ī", "einfach", "facile"],
  "what": ["什麼", "qué", "quoi", "何", "なに", "무엇", "was", "cosa"],
  "where": ["哪裡", "哪兒", "dónde", "où", "どこ", "어디", "wo", "dove"],
  "who": ["誰", "quién", "qui", "だれ", "누구", "wer", "chi"],
  "why": ["為什麼", "por qué", "pourquoi", "なぜ", "왜", "warum"],
  "how": ["怎麼", "如何", "cómo", "comment", "どう", "어떻게", "wie"],
  "how much": ["多少錢", "多少", "cuánto", "combien", "いくら", "얼마", "wie viel"],
};

/**
 * Tokenize a sentence based on language characteristics and compound word recognition
 */
export function tokenizeSentence(text: string, langCode: string, idPrefix: string): Token[] {
  if (!text || typeof text !== "string") return [];

  const isTargetCJK = ["zh-TW", "zh", "ja", "nan"].includes(langCode) || 
    Array.from(text).some(isCJK);

  const tokens: Token[] = [];
  let currentId = 0;

  if (isTargetCJK) {
    let i = 0;
    while (i < text.length) {
      const char = text[i];
      if (char === " ") {
        i++;
        continue;
      }

      const isPunct = PUNCTUATION_REGEX.test(char);
      if (isPunct) {
        tokens.push({
          id: `${idPrefix}-${currentId++}`,
          text: char,
          isPunctuation: true,
          cleanText: char,
          alignedIds: [],
        });
        i++;
        continue;
      }

      // Greedy Match known compound words
      let matchedCompound = "";
      for (const compound of CHINESE_COMPOUND_LEXICON) {
        if (text.startsWith(compound, i)) {
          if (compound.length > matchedCompound.length) {
            matchedCompound = compound;
          }
        }
      }

      if (matchedCompound) {
        tokens.push({
          id: `${idPrefix}-${currentId++}`,
          text: matchedCompound,
          isPunctuation: false,
          cleanText: matchedCompound.toLowerCase(),
          alignedIds: [],
        });
        i += matchedCompound.length;
        continue;
      }

      // Single character fallback
      tokens.push({
        id: `${idPrefix}-${currentId++}`,
        text: char,
        isPunctuation: false,
        cleanText: char.toLowerCase(),
        alignedIds: [],
      });
      i++;
    }
  } else {
    // Space-separated languages (English, Spanish, French, German, Korean, etc.)
    const rawWords = text.split(/(\s+|[.,!?;:()[\]{}"'`«»—–\-·。，！？；：「」『』（）…、])/).filter(Boolean);

    for (const segment of rawWords) {
      if (/^\s+$/.test(segment)) {
        continue; // Skip pure whitespace
      }
      const isPunct = PUNCTUATION_REGEX.test(segment);
      tokens.push({
        id: `${idPrefix}-${currentId++}`,
        text: segment,
        isPunctuation: isPunct,
        cleanText: segment.replace(PUNCTUATION_REGEX, "").trim().toLowerCase(),
        alignedIds: [],
      });
    }
  }

  return tokens;
}

/**
 * Checks if target token and translation token share a cross-lingual semantic alignment
 */
function areTokensSemanticallyAligned(tClean: string, trClean: string): boolean {
  if (!tClean || !trClean) return false;
  if (tClean === trClean) return true;

  // Direct check in dictionary
  const mappings1 = BILINGUAL_ALIGNMENT_MAP[trClean];
  if (mappings1 && mappings1.some((m) => m.toLowerCase() === tClean)) {
    return true;
  }

  const mappings2 = BILINGUAL_ALIGNMENT_MAP[tClean];
  if (mappings2 && mappings2.some((m) => m.toLowerCase() === trClean)) {
    return true;
  }

  // Cross-lingual key matching
  for (const [engKey, variants] of Object.entries(BILINGUAL_ALIGNMENT_MAP)) {
    const keyMatchesTr = trClean === engKey;
    const variantMatchesTgt = variants.some((v) => v.toLowerCase() === tClean);
    if (keyMatchesTr && variantMatchesTgt) {
      return true;
    }

    const keyMatchesTgt = tClean === engKey;
    const variantMatchesTr = variants.some((v) => v.toLowerCase() === trClean);
    if (keyMatchesTgt && variantMatchesTr) {
      return true;
    }
  }

  return false;
}

/**
 * Find contiguous sequence of tokens matching a multi-word phrase
 */
function findContiguousTokens(
  tokens: Token[],
  phrase: string
): Token[] {
  const phraseWords = phrase.toLowerCase().replace(PUNCTUATION_REGEX, "").trim().split(/\s+/).filter(Boolean);
  if (phraseWords.length === 0) return [];

  if (phraseWords.length === 1) {
    const targetWord = phraseWords[0];
    return tokens.filter((t) => !t.isPunctuation && t.cleanText === targetWord);
  }

  for (let i = 0; i <= tokens.length - phraseWords.length; i++) {
    let matches = true;
    const slice: Token[] = [];
    let wordIdx = 0;

    for (let j = i; j < tokens.length && wordIdx < phraseWords.length; j++) {
      if (tokens[j].isPunctuation) continue;
      if (tokens[j].cleanText === phraseWords[wordIdx]) {
        slice.push(tokens[j]);
        wordIdx++;
      } else {
        matches = false;
        break;
      }
    }

    if (matches && wordIdx === phraseWords.length) {
      return slice;
    }
  }

  return [];
}

/**
 * Build bidirectional alignment mappings between target tokens and translation tokens
 */
export function buildTokenAlignment(
  targetTokens: Token[],
  translationTokens: Token[],
  tokenBreakdown?: Array<{ token: string; translatedToken: string }>
): { targetTokens: Token[]; translationTokens: Token[] } {
  const meaningfulTarget = targetTokens.filter((t) => !t.isPunctuation);
  const meaningfulTranslation = translationTokens.filter((t) => !t.isPunctuation);

  if (meaningfulTarget.length === 0 || meaningfulTranslation.length === 0) {
    return { targetTokens, translationTokens };
  }

  const targetMap: Record<string, string[]> = {};
  const translationMap: Record<string, string[]> = {};

  const addAlignment = (targetId: string, transId: string) => {
    if (!targetMap[targetId]) targetMap[targetId] = [];
    if (!targetMap[targetId].includes(transId)) targetMap[targetId].push(transId);

    if (!translationMap[transId]) translationMap[transId] = [];
    if (!translationMap[transId].includes(targetId)) translationMap[transId].push(targetId);
  };

  // 1. First Pass: Pre-calculated / LLM tokenBreakdown (exact multi-word contiguous sequence matching)
  if (tokenBreakdown && Array.isArray(tokenBreakdown) && tokenBreakdown.length > 0) {
    for (const breakdown of tokenBreakdown) {
      const bTarget = (breakdown.token || "").trim();
      const bTrans = (breakdown.translatedToken || "").trim();

      if (!bTarget || !bTrans) continue;

      const matchedTargets = findContiguousTokens(targetTokens, bTarget);
      const matchedTranslations = findContiguousTokens(translationTokens, bTrans);

      // Only link if both sides produced specific matching tokens
      if (matchedTargets.length > 0 && matchedTranslations.length > 0) {
        for (const t of matchedTargets) {
          for (const tr of matchedTranslations) {
            addAlignment(t.id, tr.id);
          }
        }
      }
    }
  }

  // 2. Second Pass: Multi-word & Single-word Semantic Lexicon Matching
  // Check for multi-word dictionary phrases first (e.g. "cell phone" -> "手機", "a lot of" -> "很多", "or not" -> "是不是")
  for (const [dictKey, dictVals] of Object.entries(BILINGUAL_ALIGNMENT_MAP)) {
    if (dictKey.includes(" ")) {
      const transMatches = findContiguousTokens(translationTokens, dictKey);
      if (transMatches.length > 0) {
        for (const val of dictVals) {
          const tgtMatches = findContiguousTokens(targetTokens, val);
          if (tgtMatches.length > 0) {
            for (const t of tgtMatches) {
              for (const tr of transMatches) {
                addAlignment(t.id, tr.id);
              }
            }
          }
        }
      }
    }
  }

  // Single word semantic dictionary matching
  meaningfulTarget.forEach((tToken) => {
    meaningfulTranslation.forEach((trToken) => {
      if (areTokensSemanticallyAligned(tToken.cleanText, trToken.cleanText)) {
        addAlignment(tToken.id, trToken.id);
      }
    });
  });

  // 3. Third Pass: Clitic, Article, Auxiliary & Particle Syntactic Grouping
  // Propagate alignments ONLY to immediate adjacent neighbors (distance 1)
  meaningfulTranslation.forEach((trToken, idx) => {
    const isArticle = NOUN_ARTICLES_AND_DETERMINERS.has(trToken.cleanText);
    const isAuxiliary = VERBAL_AUXILIARIES.has(trToken.cleanText);
    const isPrep = PREPOSITIONS.has(trToken.cleanText);

    if ((isArticle || isAuxiliary || isPrep) && (!translationMap[trToken.id] || translationMap[trToken.id].length === 0)) {
      const nextNeighbor = meaningfulTranslation[idx + 1];
      if (nextNeighbor && translationMap[nextNeighbor.id] && translationMap[nextNeighbor.id].length > 0) {
        translationMap[nextNeighbor.id].forEach((tgtId) => addAlignment(tgtId, trToken.id));
      } else {
        const prevNeighbor = meaningfulTranslation[idx - 1];
        if (prevNeighbor && translationMap[prevNeighbor.id] && translationMap[prevNeighbor.id].length > 0) {
          translationMap[prevNeighbor.id].forEach((tgtId) => addAlignment(tgtId, trToken.id));
        }
      }
    }
  });

  meaningfulTarget.forEach((tToken, idx) => {
    const isEastAsianParticle = EAST_ASIAN_PARTICLES.has(tToken.cleanText);
    const isArticle = NOUN_ARTICLES_AND_DETERMINERS.has(tToken.cleanText);
    const isAuxiliary = VERBAL_AUXILIARIES.has(tToken.cleanText);

    if ((isEastAsianParticle || isArticle || isAuxiliary) && (!targetMap[tToken.id] || targetMap[tToken.id].length === 0)) {
      const prevNeighbor = meaningfulTarget[idx - 1];
      const nextNeighbor = meaningfulTarget[idx + 1];

      if (prevNeighbor && targetMap[prevNeighbor.id] && targetMap[prevNeighbor.id].length > 0) {
        targetMap[prevNeighbor.id].forEach((trId) => addAlignment(tToken.id, trId));
      } else if (nextNeighbor && targetMap[nextNeighbor.id] && targetMap[nextNeighbor.id].length > 0) {
        targetMap[nextNeighbor.id].forEach((trId) => addAlignment(tToken.id, trId));
      }
    }
  });

  // 4. Fourth Pass: Linear Proportional 1-to-1 Position Interpolation (No Unbounded Cascading)
  // For isolated tokens that remain completely unaligned, align only to their corresponding position ratio
  meaningfulTarget.forEach((tToken, tIdx) => {
    if (!targetMap[tToken.id] || targetMap[tToken.id].length === 0) {
      // Check immediate left or right neighbor ONLY
      const prev = meaningfulTarget[tIdx - 1];
      const next = meaningfulTarget[tIdx + 1];
      if (prev && targetMap[prev.id] && targetMap[prev.id].length === 1) {
        addAlignment(tToken.id, targetMap[prev.id][0]);
      } else if (next && targetMap[next.id] && targetMap[next.id].length === 1) {
        addAlignment(tToken.id, targetMap[next.id][0]);
      } else {
        const tRatio = tIdx / Math.max(1, meaningfulTarget.length - 1);
        const mappedIdx = Math.round(tRatio * (meaningfulTranslation.length - 1));
        const trToken = meaningfulTranslation[mappedIdx];
        if (trToken) {
          addAlignment(tToken.id, trToken.id);
        }
      }
    }
  });

  meaningfulTranslation.forEach((trToken, trIdx) => {
    if (!translationMap[trToken.id] || translationMap[trToken.id].length === 0) {
      const prev = meaningfulTranslation[trIdx - 1];
      const next = meaningfulTranslation[trIdx + 1];
      if (prev && translationMap[prev.id] && translationMap[prev.id].length === 1) {
        addAlignment(translationMap[prev.id][0], trToken.id);
      } else if (next && translationMap[next.id] && translationMap[next.id].length === 1) {
        addAlignment(translationMap[next.id][0], trToken.id);
      } else {
        const trRatio = trIdx / Math.max(1, meaningfulTranslation.length - 1);
        const mappedIdx = Math.round(trRatio * (meaningfulTarget.length - 1));
        const tToken = meaningfulTarget[mappedIdx];
        if (tToken) {
          addAlignment(tToken.id, trToken.id);
        }
      }
    }
  });

  // Assign computed IDs
  targetTokens.forEach((t) => {
    t.alignedIds = targetMap[t.id] || [];
  });

  translationTokens.forEach((tr) => {
    tr.alignedIds = translationMap[tr.id] || [];
  });

  return { targetTokens, translationTokens };
}

// In-memory cache for aligned sentence pairs
const alignmentCache = new Map<string, AlignedSentencePair>();

export function getAlignedSentencePair(
  targetText: string,
  translationText: string,
  targetLangCode: string,
  idSeed: string,
  tokenBreakdown?: Array<{ token: string; translatedToken: string }>
): AlignedSentencePair {
  const cacheKey = `${targetLangCode}:::${targetText}:::${translationText}:::${idSeed}`;
  if (alignmentCache.has(cacheKey) && !tokenBreakdown) {
    return alignmentCache.get(cacheKey)!;
  }

  const rawTargetTokens = tokenizeSentence(targetText, targetLangCode, `tgt-${idSeed}`);
  const rawTranslationTokens = tokenizeSentence(translationText, "en", `tra-${idSeed}`);

  const aligned = buildTokenAlignment(rawTargetTokens, rawTranslationTokens, tokenBreakdown);
  alignmentCache.set(cacheKey, aligned);
  return aligned;
}
