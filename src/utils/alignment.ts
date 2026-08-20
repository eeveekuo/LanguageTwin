/**
 * Bidirectional Token and Phrase Alignment for Parallel Translations
 * 
 * Provides linguistic tokenization, cross-lingual dictionary matching,
 * compound word segmentation, clitic/particle syntactic grouping,
 * and bidirectional hover alignments.
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

// High-frequency compound words for Chinese segmentation to prev// High-frequency compound words for Chinese segmentation to prevent single-character fragmentation
const CHINESE_COMPOUND_LEXICON: string[] = [
  "來自", "台灣", "臺灣", "學生", "老師", "今天", "明天", "昨天", "作業", "功課",
  "很多", "非常", "喜歡", "運動", "窗戶", "關上", "打開", "外面", "裡面", "天氣",
  "雖然", "但是", "因為", "所以", "如果", "一邊", "越來", "越來越", "夜市", "美食",
  "品嚐", "旅行", "旅遊", "推薦", "圖書館", "咖啡店", "咖啡", "電影", "看書", "寫字",
  "吃飯", "喝水", "謝謝", "你好", "歹勢", "有影", "逐家", "食飽未", "出門", "容易",
  "我們", "你們", "他們", "她們", "自己", "已經", "準備", "開始", "結束", "問題",
  "回答", "幫助", "協助", "學習", "中文", "英文", "日文", "韓文", "西文", "西班牙文",
  "請問", "不好意思", "火車站", "特色菜", "在地", "當地", "餐廳", "好吃", "美味",
  "多少錢", "捷運站", "公車站"
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

// Chinese/East Asian Classifiers & Measure words (which link with adjacent noun / numeral)
const EAST_ASIAN_CLASSIFIERS = new Set([
  "本", "個", "个", "隻", "只", "張", "张", "條", "条", "道", "家", "種", "种", "把", "杯", "瓶", "位", "件", "份"
]);

// Bilingual Alignment Lexicon (Maps source words/phrases to candidate target words/phrases across languages)
const BILINGUAL_ALIGNMENT_MAP: Record<string, string[]> = {
  // Pronouns & Demonstratives
  "i": ["我", "私", "わたし", "yo", "je", "저", "나", "guá", "ich", "io", "eu"],
  "me": ["我", "私", "わたし", "mí", "me", "moi", "저", "나", "mich", "mir"],
  "my": ["我的", "私の", "わたしの", "mi", "mis", "mon", "ma", "mes", "제", "mein", "meine"],
  "mine": ["我的", "私", "mío", "mía", "le mien"],
  "you": ["你", "您", "tú", "usted", "vos", "あなた", "toi", "vous", "당신", "너", "lí", "du", "sie", "tu"],
  "your": ["你的", "您的", "tu", "tus", "su", "sus", "votre", "ton", "ta", "tes", "dein", "ihr"],
  "yours": ["你的", "您的", "tuyo", "tuya", "suyo", "suya"],
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
  "this": ["這", "這個", "esto", "esta", "este", "ce", "cette", "cet", "これ", "この", "이", "이것", "tsit", "dieses", "questo"],
  "that": ["那", "那個", "eso", "esa", "ese", "aquel", "ce", "cette", "que", "それ", "あれ", "その", "あの", "그", "저", "hit", "jenes", "quello"],
  "these": ["這些", "estos", "estas", "ces", "これら", "これらの", "이것들"],
  "those": ["那些", "esos", "esas", "aquellos", "ces", "あれら", "あれらの", "그것들"],

  // Copula & State Verbs
  "am": ["是", "soy", "estoy", "suis", "です", "だ", "이다", "이에요", "예요", "sī", "bin", "sono", "sou"],
  "is": ["是", "在", "es", "está", "est", "です", "だ", "あります", "います", "이다", "이에요", "예요", "sī", "ist", "è", "é"],
  "are": ["是", "在", "son", "están", "somos", "estamos", "eres", "estás", "êtes", "sont", "sommes", "です", "だ", "sī", "sind", "bist", "seid", "siamo", "siete", "sono"],
  "be": ["是", "在", "ser", "estar", "être", "sein", "essere", "ser"],
  "was": ["是", "era", "fue", "estaba", "estuvo", "était", "fut", "でした", "였다", "sī", "war"],
  "were": ["是", "eran", "fueron", "estaban", "estuvieron", "étaient", "でした", "였다", "waren"],
  "from": ["來自", "從", "de", "desde", "du", "de la", "des", "から", "で", "에서", "부터", "uì", "aus", "von", "da"],
  "student": ["學生", "estudiante", "alumno", "étudiant", "学生", "がくせい", "학생", "ha̍k-sing", "student", "schüler"],
  "students": ["學生", "estudiantes", "alumnos", "étudiants", "学生", "학생들", "studenten"],
  "taiwan": ["台灣", "臺灣", "taiwán", "taiwan", "台湾", "たいわん", "대만", "tâi-uân"],
  "japan": ["日本", "japón", "japon", "日本", "にほん", "일본", "ji̍t-pún"],
  "spain": ["西班牙", "españa", "espagne", "スペイン", "스페인"],
  "korea": ["韓國", "corea", "corée", "韓国", "かんこく", "한국"],

  // Core Verbs
  "have": ["有", "擁有", "tener", "tengo", "tiene", "tenemos", "tienen", "avoir", "ai", "a", "持つ", "ある", "いる", "가지다", "있다", "ū", "haben", "avere", "ter"],
  "has": ["有", "tiene", "a", "ある", "いる", "있다", "ū", "hat", "ha", "tem"],
  "had": ["有", "tenía", "tuvo", "avait", "eu", "있었다", "hatte", "aveva", "teve"],
  "close": ["關上", "關", "cerrar", "cierra", "fermer", "閉める", "閉めて", "닫다", "닫아", "kuainn", "schließen", "chiudere", "fechar"],
  "shut": ["關上", "關", "cerrar", "fermer", "閉める", "닫다"],
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
  "would like": ["想", "想要", "gustaría", "voudrais", "たい", "싶어요", "möchte", "vorrei", "gostaria"],
  "like": ["喜歡", "gustar", "gusta", "aimer", "好き", "大好き", "좋아하다", "kah-ì", "mögen", "piacere", "gostar"],
  "love": ["愛", "喜歡", "amar", "encantar", "aimer", "愛する", "大好き", "사랑하다", "lieben", "amare", "amar"],
  "travel": ["旅行", "旅遊", "viajar", "viaje", "voyager", "旅行する", "旅行に行く", "여행하다", "lí-hîng", "reisen", "viaggiare", "viajar"],
  "taste": ["品嚐", "嚐", "probar", "degustar", "goûter", "味わう", "味見する", "맛보다", "tshì"],
  "recommend": ["推薦", "recomendar", "recomiende", "recommander", "おすすめ", "お勧め", "薦める", "추천하다", "thui-tsiàn", "empfehlen", "raccomandare", "recomendar"],
  "go": ["去", "出門", "ir", "voy", "va", "aller", "行く", "行きます", "가다", "khi", "gehen", "andare", "ir"],
  "went": ["去", "出門了", "fue", "fui", "allé", "行った", "갔다", "ging", "andato", "foi"],
  "say": ["說", "講", "decir", "dice", "dire", "言う", "言います", "말하다", "kóng", "sagen", "dire", "dizer"],
  "speak": ["講", "說", "hablar", "habla", "parler", "話す", "話します", "말하다", "sprechen", "parlare", "falar"],
  "please": ["請", "por favor", "s'il vous plaît", "ください", "お願いします", "제발", "부탁합니다", "tshiánn", "bitte", "per favore", "por favor"],
  "could": ["可以", "能", "podría", "pourriez", "できますか", "줄 수 있나요", "könnten"],
  "can": ["可以", "能", "puede", "peux", "できる", "할 수 있다", "kann"],

  // Determiners, Articles & Numerals
  "a": ["一", "一個", "一本", "un", "una", "ein", "eine", "uno"],
  "an": ["一", "一個", "一本", "un", "una", "ein", "eine"],
  "one": ["一", "一個", "一本", "uno", "una", "un", "ひとつ", "一つ", "하나", "일", "tsit"],

  // Nouns & Objects
  "window": ["窗戶", "窗", "ventana", "fenêtre", "窓", "まど", "창문", "thang-á", "fenster", "finestra", "janela"],
  "windows": ["窗戶", "ventanas", "fenêtres", "窓", "창문들"],
  "wind": ["風", "viento", "vent", "風", "かぜ", "바람", "hong", "wind", "vento"],
  "windy": ["風很大", "有風", "mucho viento", "ventoso", "風が強い", "바람이 많이 불다"],
  "homework": ["作業", "功課", "tarea", "tareas", "devoirs", "宿題", "しゅくだい", "숙제", "hausaufgaben"],
  "book": ["書", "libro", "livre", "本", "ほん", "책", "tsheh", "buch", "livro"],
  "books": ["書", "libros", "livres", "本", "책들", "bücher", "libri", "livros"],
  "coffee": ["咖啡", "café", "cafe", "コーヒー", "커피", "ka-pi", "kaffee", "caffè"],
  "cafe": ["咖啡店", "cafetería", "café", "カフェ", "喫茶店", "카페", "cafeteria"],
  "library": ["圖書館", "biblioteca", "bibliothèque", "図書館", "としょかん", "도서관", "bibliothek"],
  "movie": ["電影", "película", "film", "映画", "えいが", "영화", "kino"],
  "food": ["美食", "食物", "菜", "comida", "nourriture", "料理", "グルメ", "음식", "essen", "cibo"],
  "dish": ["菜", "特色菜", "料理", "plato", "plat", "料理", "음식", "요리", "gericht", "piatto", "prato"],
  "dishes": ["菜", "特色菜", "platos", "plats", "料理", "gerichte", "piatti", "pratos"],
  "night market": ["夜市", "mercado nocturno", "night market", "夜市", "よいち", "야시장", "iā-tshī"],
  "house": ["房子", "家", "casa", "maison", "家", "いえ", "집", "haus"],
  "time": ["時間", "tiempo", "temps", "時間", "じかん", "시간", "zeit", "tempo"],
  "question": ["問題", "pregunta", "question", "質問", "問題", "질문", "frage", "domanda"],
  "weather": ["天氣", "tiempo", "clima", "temps", "天気", "てんき", "날씨", "wetter", "clima"],
  "station": ["火車站", "車站", "estación", "gare", "駅", "えき", "역", "bahnhof", "stazione"],

  // Modifiers, Adverbs & Connectors
  "today": ["今天", "今仔日", "hoy", "aujourd'hui", "今日", "きょう", "오늘", "kin-á-ji̍t", "heute", "oggi", "hoje"],
  "tomorrow": ["明天", "明仔載", "mañana", "demain", "明日", "あした", "내일", "mî-á-tsài", "morgen", "domani", "amanhã"],
  "yesterday": ["昨天", "ayer", "hier", "昨日", "きのう", "어제", "gestern", "ieri", "ontem"],
  "cold": ["冷", "很冷", "frío", "froid", "寒い", "さむい", "춥다", "추운", "lénn", "kalt", "freddo", "frio"],
  "hot": ["熱", "很熱", "caliente", "calor", "chaud", "暑い", "あつい", "뜨거운", "더운", "jua̍h", "heiß", "caldo", "quente"],
  "outside": ["外面", "afuera", "fuera", "dehors", "外", "そと", "밖", "gōo-bīn", "draußen", "fuori", "fora"],
  "inside": ["裡面", "adentro", "dentro", "dedans", "中", "うち", "안", "lāi-té", "drinnen", "dentro"],
  "although": ["雖然", "aunque", "bien que", "が", "けれども", "비록", "수록", "sui-jiân", "obwohl", "sebbene", "embora"],
  "even though": ["雖然", "aunque", "bien que", "が", "비록"],
  "but": ["但是", "可是", "pero", "mais", "でも", "しかし", "하지만", "그렇지만", "tān-sī", "aber", "ma", "mas"],
  "yet": ["但是", "可是", "todavía", "encore", "でも", "하지만", "doch"],
  "still": ["還是", "仍然", "todavía", "aún", "encore", "それでも", "やはり", "여전히", "그래도", "iáu-kú", "noch", "ancora", "ainda"],
  "very": ["很", "非常", "muy", "très", "とても", "非常に", "매우", "아주", "tsin", "sehr", "molto", "muito"],
  "a lot": ["很多", "mucho", "beaucoup", "たくさん", "많이", "tsē", "viel", "molto", "muito"],
  "a lot of": ["很多", "mucho", "muchos", "muchas", "beaucoup de", "たくさんの", "많은", "viel"],
  "many": ["很多", "muchos", "muchas", "beaucoup", "多い", "おおい", "많은", "viele", "molti", "muitos"],
  "much": ["很多", "mucho", "mucha", "beaucoup", "多い", "많이", "viel"],
  "easy": ["容易", "簡單", "fácil", "facile", "簡単", "かんたん", "優しい", "쉬운", "쉽다", "iông-ī", "einfach", "facile"],
  "popular": ["受歡迎", "熱門", "popular", "populaire", "人気", "にんき", "인기 있는", "beliebt", "popolare"],
  "local": ["在地", "當地", "local", "locaux", "地元の", "じもと", "현지의", "在地", "lokal", "locale"],
  "here": ["這裡", "這兒", "aquí", "acá", "ici", "ここ", "ここで", "여기", "tsia", "hier", "qui", "aqui"],
  "there": ["那裡", "那兒", "allí", "allá", "là", "あそこ", "そこ", "거기", "저기", "dort", "lì", "lá"],
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

      // Greedy Match known compound words (3-char or 2-char)
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

  // Direct check in dictionary (tClean as key or trClean as key)
  const mappings1 = BILINGUAL_ALIGNMENT_MAP[trClean];
  if (mappings1 && mappings1.some((m) => m === tClean || tClean.includes(m) || m.includes(tClean))) {
    return true;
  }

  const mappings2 = BILINGUAL_ALIGNMENT_MAP[tClean];
  if (mappings2 && mappings2.some((m) => m === trClean || trClean.includes(m) || m.includes(tClean))) {
    return true;
  }

  // Cross-lingual key matching
  for (const [engKey, variants] of Object.entries(BILINGUAL_ALIGNMENT_MAP)) {
    const keyMatchesTranslation = trClean === engKey || trClean.includes(engKey) || engKey.includes(trClean);
    const variantMatchesTarget = variants.some((v) => v === tClean || tClean.includes(v) || v.includes(tClean));
    if (keyMatchesTranslation && variantMatchesTarget) {
      return true;
    }

    const keyMatchesTarget = tClean === engKey || tClean.includes(engKey) || engKey.includes(tClean);
    const variantMatchesTranslation = variants.some((v) => v === trClean || trClean.includes(v) || v.includes(trClean));
    if (keyMatchesTarget && variantMatchesTranslation) {
      return true;
    }
  }

  return false;
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

  // 1. First Pass: If explicit tokenBreakdown was passed from AI translation API, match those directly
  if (tokenBreakdown && Array.isArray(tokenBreakdown) && tokenBreakdown.length > 0) {
    for (const breakdown of tokenBreakdown) {
      const bTargetClean = (breakdown.token || "").trim().toLowerCase();
      const bTransClean = (breakdown.translatedToken || "").trim().toLowerCase();

      if (!bTargetClean || !bTransClean) continue;

      // Exact match preferred
      let matchedTargets = meaningfulTarget.filter(
        (t) => t.cleanText === bTargetClean || t.text === breakdown.token
      );
      if (matchedTargets.length === 0) {
        matchedTargets = meaningfulTarget.filter(
          (t) => t.text.includes(breakdown.token) || (breakdown.token.length <= 4 && breakdown.token.includes(t.text))
        );
      }

      let matchedTranslations = meaningfulTranslation.filter(
        (tr) => tr.cleanText === bTransClean || tr.text.toLowerCase() === bTransClean
      );
      if (matchedTranslations.length === 0) {
        matchedTranslations = meaningfulTranslation.filter(
          (tr) => tr.text.toLowerCase().includes(bTransClean) || (bTransClean.split(/\s+/).includes(tr.cleanText))
        );
      }

      // If 1-to-1 or specific mapping, align matched items
      if (matchedTargets.length > 0 && matchedTranslations.length > 0) {
        for (const t of matchedTargets) {
          for (const tr of matchedTranslations) {
            addAlignment(t.id, tr.id);
          }
        }
      }
    }
  }

  // 2. Second Pass: Semantic Dictionary and Exact Cognate Matching
  meaningfulTarget.forEach((tToken) => {
    meaningfulTranslation.forEach((trToken) => {
      if (areTokensSemanticallyAligned(tToken.cleanText, trToken.cleanText)) {
        addAlignment(tToken.id, trToken.id);
      }
    });
  });

  // 3. Third Pass: Clitic, Article, Auxiliary & Particle Syntactic Grouping
  // Propagate alignments to adjacent functional articles ("a", "the", "un") and particles ("的", "は")
  meaningfulTranslation.forEach((trToken, idx) => {
    const isArticle = NOUN_ARTICLES_AND_DETERMINERS.has(trToken.cleanText);
    const isAuxiliary = VERBAL_AUXILIARIES.has(trToken.cleanText);
    const isPrep = PREPOSITIONS.has(trToken.cleanText);

    if ((isArticle || isAuxiliary || isPrep) && (!translationMap[trToken.id] || translationMap[trToken.id].length === 0)) {
      // Look at next token first (e.g. "a student" -> student is at idx + 1)
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
      // For particles like "的" or "は", attach to preceding noun/phrase first, then next noun
      const prevNeighbor = meaningfulTarget[idx - 1];
      const nextNeighbor = meaningfulTarget[idx + 1];

      if (prevNeighbor && targetMap[prevNeighbor.id] && targetMap[prevNeighbor.id].length > 0) {
        targetMap[prevNeighbor.id].forEach((trId) => addAlignment(tToken.id, trId));
      } else if (nextNeighbor && targetMap[nextNeighbor.id] && targetMap[nextNeighbor.id].length > 0) {
        targetMap[nextNeighbor.id].forEach((trId) => addAlignment(tToken.id, trId));
      }
    }
  });

  // 4. Fourth Pass: Syntactic Anchor Neighbor Fallback
  // For any token that still has 0 alignments, attach to the nearest aligned syntactic anchor
  meaningfulTarget.forEach((tToken, tIdx) => {
    if (!targetMap[tToken.id] || targetMap[tToken.id].length === 0) {
      let closestTransId: string | null = null;
      for (let offset = 1; offset < meaningfulTarget.length; offset++) {
        const prev = meaningfulTarget[tIdx - offset];
        if (prev && targetMap[prev.id] && targetMap[prev.id].length > 0) {
          closestTransId = targetMap[prev.id][0];
          break;
        }
        const next = meaningfulTarget[tIdx + offset];
        if (next && targetMap[next.id] && targetMap[next.id].length > 0) {
          closestTransId = targetMap[next.id][0];
          break;
        }
      }

      if (closestTransId) {
        addAlignment(tToken.id, closestTransId);
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
      let closestTgtId: string | null = null;
      for (let offset = 1; offset < meaningfulTranslation.length; offset++) {
        const prev = meaningfulTranslation[trIdx - offset];
        if (prev && translationMap[prev.id] && translationMap[prev.id].length > 0) {
          closestTgtId = translationMap[prev.id][0];
          break;
        }
        const next = meaningfulTranslation[trIdx + offset];
        if (next && translationMap[next.id] && translationMap[next.id].length > 0) {
          closestTgtId = translationMap[next.id][0];
          break;
        }
      }

      if (closestTgtId) {
        addAlignment(closestTgtId, trToken.id);
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
