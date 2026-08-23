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

/// Hangul (Korean) character check
export function isHangul(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (
    (code >= 0xac00 && code <= 0xd7af) || // Hangul Syllables
    (code >= 0x1100 && code <= 0x11ff) || // Hangul Jamo
    (code >= 0x3130 && code <= 0x318f)    // Hangul Compatibility Jamo
  );
}

/// Unspaced CJK character check (Chinese, Japanese, Taiwanese Hokkien ideographs)
export function isNonSpacedCJK(text: string, langCode?: string): boolean {
  if (!text) return false;
  if (langCode === "ko") return false;
  
  // If text contains Korean Hangul, it is a space-separated script
  const chars = Array.from(text);
  if (chars.some(isHangul)) return false;

  if (["zh-TW", "zh", "ja", "nan"].includes(langCode || "")) return true;

  return chars.some((char) => {
    const code = char.charCodeAt(0);
    return (
      (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
      (code >= 0x3400 && code <= 0x4dbf) || // CJK Extension A
      (code >= 0x3040 && code <= 0x309f) || // Hiragana
      (code >= 0x30a0 && code <= 0x30ff) || // Katakana
      (code >= 0x3100 && code <= 0x312f)    // Bopomofo / Zhuyin
    );
  });
}

// Common punctuation characters including Spanish inverted marks and smart quotes
const PUNCTUATION_REGEX = /^[.,!?;:()[\]{}"'`«»“”‘’—–\-·。，！？；：「」『』（）…、¿¡]+$/;

// High-frequency compound words for Chinese, Japanese, and Taiwanese Hokkien segmentation
const EAST_ASIAN_COMPOUND_LEXICON: string[] = [
  // Chinese & Hokkien Multi-character Compounds
  "來自", "台灣", "臺灣", "學生", "老師", "同學", "朋友", "今天", "明天", "昨天", "作業", "功課",
  "手機", "電話", "行動電話", "電腦", "筆電", "平板", "學校", "教室", "很多", "非常", "喜歡", "運動", "窗戶",
  "關上", "打開", "外面", "裡面", "天氣", "雖然", "但是", "因為", "所以", "如果", "一邊", "越來", "越來越",
  "夜市", "美食", "品嚐", "旅行", "旅遊", "推薦", "圖書館", "咖啡店", "咖啡", "電影", "看書", "寫字",
  "吃飯", "喝水", "謝謝", "你好", "歹勢", "有影", "逐家", "食飽未", "出門", "容易", "我們", "你們",
  "他們", "她們", "自己", "已經", "準備", "開始", "結束", "問題", "回答", "幫助", "協助", "學習",
  "中文", "英文", "日文", "韓文", "西文", "西班牙文", "請問", "不好意思", "火車站", "特色菜", "在地",
  "當地", "餐廳", "好吃", "美味", "多少錢", "捷運站", "公車站", "是不是", "有沒有", "能不能", "可不可以",
  "這本書", "這支", "這台", "這個", "那支", "那台", "那個", "這些", "那些", "哪裡", "什麼", "怎麼", "為什麼",
  "你的", "我的", "他的", "她的", "我們的", "你們的", "他們的", "還是", "或者", "而且", "只是", "不但", "只要",
  "今仔日", "明仔載", "多謝", "勞力", "請教", "真好", "真讚", "真美",

  // Japanese Kanji + Kana Compounds
  "京都", "美味しい", "おいしい", "飲みます", "飲み", "食べます", "食べ", "おすすめ", "お勧め", "注文",
  "いらっしゃいませ", "温かい", "冷たい", "限定", "季節", "あなたの", "私達", "私たち", "これ", "それ",
  "どれ", "携帯電話", "日本語", "英語", "先生", "学生", "宿題", "図書館", "映画", "料理", "旅行"
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
  "은", "는", "이", "가", "을", "를", "에", "에서", "와", "과", "도", "로", "으로", "에게", "한테", "의", "만", "부터", "까지"
]);

// Korean Morphological Suffixes (Particles & Conjugation endings)
const KOREAN_PARTICLES = [
  "에게서", "한테서", "에서는", "에서도", "에게는", "에게도", "으로는", "부터는", "까지는",
  "에서", "에게", "한테", "으로", "부터", "까지", "처럼", "만큼", "하고", "이랑", "이라", "에는", "에도",
  "은", "는", "이", "가", "을", "를", "에", "의", "도", "로", "와", "과", "랑", "만"
];

const KOREAN_VERB_ENDINGS = [
  "하셨어요", "하십니다", "하셨습니다", "했습니다", "했어요", "합니다", "하세요", "해요", "하다", "하고", "해서", "하면", "하는", "하지", "할", "한",
  "갔습니다", "갔어요", "갑니다", "가세요", "가요", "가다", "가고", "가서", "가면", "가는", "가지", "갈",
  "왔습니다", "왔어요", "옵니다", "오세요", "와요", "오다", "오고", "와서", "오면", "오는", "오지", "올",
  "먹었습니다", "먹었어요", "먹습니다", "드세요", "먹어요", "먹다", "먹고", "먹어서", "먹으면", "먹는", "먹을",
  "마셨습니다", "마셨어요", "마십니다", "마셔요", "마시다", "마시고", "마셔서", "마시면", "마시는", "마실",
  "읽었습니다", "읽었어요", "읽습니다", "읽어요", "읽다", "읽고", "읽어서", "읽으면", "읽는", "읽을",
  "보았습니다", "봤습니다", "봤어요", "봅니다", "봐요", "보다", "보고", "봐서", "보면", "보는", "볼",
  "들었습니다", "들었어요", "듣습니다", "들어요", "듣다", "듣고", "들어서", "들으면", "듣는", "들을",
  "배웠습니다", "배웠어요", "배웁니다", "배워요", "배우다", "배우고", "배워서", "배우면", "배우는", "배울",
  "만났습니다", "만났어요", "만납니다", "만나요", "만나다", "만나고", "만나서", "만나면", "만나는", "만날",
  "좋아했습니다", "좋아했어요", "좋아합니다", "좋아해요", "좋아하다", "좋아하고", "좋아해서", "좋아하는", "좋아할",
  "맛있었습니다", "맛있었어요", "맛있습니다", "맛있어요", "맛있다", "맛있는",
  "있었습니다", "있었어요", "있습니다", "있어요", "있다", "있고", "있어서", "있으면", "있는", "있을",
  "없었습니다", "없었어요", "없습니다", "없어요", "없다", "없고", "없어서", "없으면", "없는", "없을",
  "이었습니다", "이었습니다", "이었어요", "였어요", "입니다", "이에요", "예요", "이다",
  "아닙니다", "아니에요", "아니다",
  "샀습니다", "샀어요", "삽니다", "사요", "사다", "사고", "사서", "산", "살"
];

/**
 * Extract root noun and verb stems from a Korean word
 */
export function getKoreanMorphologicalVariants(word: string): string[] {
  if (!word || !Array.from(word).some(isHangul)) {
    return [word];
  }

  const results = new Set<string>();
  results.add(word);

  // 1. Strip particles from noun
  for (const p of KOREAN_PARTICLES) {
    if (word.endsWith(p) && word.length > p.length) {
      const stem = word.slice(0, -p.length);
      if (stem.length > 0) {
        results.add(stem);
      }
    }
  }

  // 2. Strip verb conjugations
  for (const ending of KOREAN_VERB_ENDINGS) {
    if (word.endsWith(ending)) {
      const stem = word.slice(0, -ending.length);
      if (stem.length > 0) {
        results.add(stem);
        results.add(stem + "하다");
        results.add(stem + "다");
      }
    }
  }

  return Array.from(results);
}

// Bilingual Alignment Lexicon (Maps source words/phrases to candidate target words/phrases across languages)
const BILINGUAL_ALIGNMENT_MAP: Record<string, string[]> = {
  // Pronouns & Demonstratives
  "i": ["我", "私", "わたし", "yo", "je", "저", "저는", "제가", "나", "나는", "내가", "guá", "ich", "io", "eu"],
  "me": ["我", "私", "わたし", "mí", "me", "moi", "저", "나", "저를", "나를", "저에게", "나에게", "mich", "mir"],
  "my": ["我的", "私の", "わたしの", "mi", "mis", "mon", "ma", "mes", "제", "내", "저의", "나의", "mein", "meine"],
  "mine": ["我的", "私", "mío", "mía", "le mien", "내 것", "제 것"],
  "you": ["你", "您", "tú", "usted", "vos", "あなた", "toi", "vous", "당신", "당신은", "너", "너는", "네가", "여러분", "lí", "du", "sie", "tu"],
  "your": ["你的", "您的", "你", "您", "tu", "tus", "su", "sus", "votre", "ton", "ta", "tes", "dein", "ihr", "너의", "당신의", "네"],
  "yours": ["你的", "您的", "你", "tuyo", "tuya", "suyo", "suya", "당신의 것", "너의 것"],
  "he": ["他", "él", "il", "kare", "彼", "그", "그는", "그가", "er", "lui", "ele"],
  "him": ["他", "él", "lui", "kare", "彼", "그", "그를", "그에게"],
  "his": ["他的", "su", "sus", "son", "sa", "ses", "彼の", "그의", "sein"],
  "she": ["她", "ella", "elle", "kanojo", "彼女", "그녀", "그녀는", "그녀가", "sie", "lei", "ela"],
  "her": ["她", "她的", "ella", "su", "sus", "la", "elle", "son", "sa", "彼女", "그녀", "그녀의", "그녀를"],
  "it": ["它", "esto", "eso", "ce", "ça", "sore", "kore", "それ", "これ", "이것", "그것", "이거", "그거", "es"],
  "we": ["我們", "nosotros", "nosotras", "nous", "私たち", "わたしたち", "우리", "우리는", "우리가", "저희", "lán", "guán", "wir", "noi", "nós"],
  "us": ["我們", "nosotros", "nous", "私たち", "우리", "우리를", "저희를", "uns"],
  "our": ["我們的", "nuestro", "nuestra", "notre", "nos", "私たちの", "우리", "우리의", "저희의", "unser"],
  "they": ["他們", "她們", "ellos", "ellas", "ils", "elles", "彼ら", "그들", "그들은", "그들이", "in", "sie", "loro", "eles"],
  "them": ["他們", "她們", "ellos", "ellas", "eux", "elles", "彼ら", "그들", "그들을", "그들에게", "sie"],
  "their": ["他們的", "她們的", "su", "sus", "leur", "leurs", "彼らの", "그들의", "ihr"],
  "this": ["這", "這個", "這本", "這支", "這台", "esto", "esta", "este", "ce", "cette", "cet", "これ", "この", "이", "이것", "이것은", "이거", "이번", "tsit", "dieses", "questo"],
  "that": ["那", "那個", "那本", "那支", "那台", "eso", "esa", "ese", "aquel", "ce", "cette", "que", "それ", "あれ", "その", "あの", "그", "저", "그것", "그것은", "저것", "그거", "hit", "jenes", "quello"],
  "these": ["這些", "estos", "estas", "ces", "これら", "これらの", "이것들", "이들"],
  "those": ["那些", "esos", "esas", "aquellos", "ces", "あれら", "あれらの", "그것들", "저것들"],
  "everyone": ["逐家", "大家", "皆", "みなさん", "todos", "tout le monde", "모두", "여러분"],

  // Copula & State Verbs
  "am": ["是", "soy", "estoy", "suis", "です", "だ", "이다", "이에요", "예요", "입니다", "sī", "bin", "sono", "sou"],
  "is": ["是", "在", "es", "está", "est", "です", "だ", "あります", "います", "이다", "이에요", "예요", "입니다", "있어요", "있습니다", "sī", "ist", "è", "é"],
  "are": ["是", "在", "son", "están", "somos", "estamos", "eres", "estás", "êtes", "sont", "sommes", "です", "だ", "이다", "이에요", "예요", "입니다", "있어요", "sī", "sind", "bist", "seid", "siamo", "siete", "sono"],
  "be": ["是", "在", "ser", "estar", "être", "sein", "essere", "ser", "되다", "이다", "있다"],
  "was": ["是", "era", "fue", "estaba", "estuvo", "était", "fut", "でした", "였다", "이었어요", "였어요", "있었어요", "sī", "war"],
  "were": ["是", "eran", "fueron", "estaban", "estuvieron", "étaient", "でした", "였다", "이었어요", "였어요", "있었어요", "waren"],
  "is not": ["不是", "不在", "no es", "n'est pas", "じゃない", "아니다", "아니에요", "아닙니다"],
  "isn't": ["不是", "不在", "no es", "n'est pas", "じゃない", "아니에요", "아닙니다"],
  "are not": ["不是", "不在", "no son", "ne sont pas", "아니에요", "아닙니다"],
  "aren't": ["不是", "不在", "no son", "아니에요", "아닙니다"],
  "not": ["不", "不是", "沒有", "no", "pas", "nicht", "non", "ない", "아니다", "안", "못", "아니에요", "없어요"],
  "or": ["還是", "或者", "是不是", "o", "ou", "または", "또는", "이나", "나", "oder", "oppure"],
  "or not": ["是不是", "有沒有", "能不能", "o no", "ou pas", "かどう"],
  "from": ["來自", "從", "de", "desde", "du", "de la", "des", "から", "で", "에서", "부터", "에게서", "uì", "aus", "von", "da"],
  "to": ["到", "向", "去", "a", "hacia", "para", "à", "vers", "へ", "に", "まで", "에", "에게", "한테", "로", "으로", "까지", "nach", "zu"],
  "at": ["在", "en", "à", "dans", "で", "に", "에서", "에", "bei", "an", "a"],
  "in": ["在", "裡面", "en", "dans", "で", "に", "안에", "에서", "에", "in"],
  "on": ["在", "上面", "en", "sur", "の上に", "위에", "에", "auf"],
  "with": ["和", "跟", "與", "con", "avec", "と", "と一緒に", "와", "과", "하고", "같이", "함께", "mit", "con"],
  "and": ["和", "跟", "而且", "y", "e", "et", "そして", "と", "그리고", "와", "과", "하고", "고", "und"],
  "but": ["但是", "可是", "不過", "pero", "mas", "mais", "でも", "しかし", "하지만", "그렇지만", "그러나", "그런데", "지만", "는데", "tān-sī", "aber", "ma"],
  "because": ["因為", "por", "porque", "parce que", "から", "ので", "왜냐하면", "때문에", "아서", "어서", "니까", "weil"],
  "so": ["所以", "así que", "donc", "だから", "それで", "그래서", "그러므로", "따라서", "also"],
  "if": ["如果", "要是", "si", "si", "もし", "なら", "たら", "만약", "면", "으면", "wenn"],
  
  // Objects & Tech
  "cell phone": ["手機", "行動電話", "teléfono celular", "móvil", "携帯電話", "携帯", "핸드폰", "휴대폰", "스마트폰", "handy"],
  "cell": ["手機", "celular", "携帯", "핸드폰"],
  "phone": ["手機", "電話", "teléfono", "móvil", "téléphone", "電話", "핸드폰", "전화"],
  "smartphone": ["手機", "智慧型手機", "smartphone", "スマートフォン", "스마트폰"],
  "computer": ["電腦", "computadora", "ordenador", "ordinateur", "パソコン", "컴퓨터", "computer"],
  "laptop": ["筆電", "筆記型電腦", "portátil", "ordinateur portable", "ノートパソコン", "노트북"],
  "tablet": ["平板", "平板電腦", "tableta", "tablette", "タブレット", "태블릿"],

  // School, Work & Places
  "student": ["學生", "estudiante", "alumno", "étudiant", "学生", "がくせい", "학생", "학생은", "학생이", "학생이다", "학생이에요", "ha̍k-sing", "student", "schüler"],
  "students": ["學生", "estudiantes", "alumnos", "étudiants", "学生", "학생들", "studenten"],
  "teacher": ["老師", "profesor", "maestro", "professeur", "先生", "せんせい", "선생님", "선생님은", "선생님이", "lehrer"],
  "taiwan": ["台灣", "臺灣", "taiwán", "taiwan", "台湾", "たいわん", "대만", "대만에서", "tâi-uân"],
  "japan": ["日本", "japón", "japon", "日本", "にほん", "일본", "일본에서", "ji̍t-pún"],
  "spain": ["西班牙", "españa", "espagne", "スペイン", "스페인"],
  "korea": ["韓國", "corea", "corée", "韓国", "かんこく", "한국", "한국에서", "한국에"],
  "seoul": ["首爾", "seúl", "séoul", "ソウル", "서울", "서울에", "서울에서"],
  "kyoto": ["京都", "きょうと", "kyoto"],
  "window": ["窗戶", "窗", "ventana", "fenêtre", "窓", "まど", "창문", "창문은", "thang-á", "fenster", "finestra", "janela"],
  "windows": ["窗戶", "ventanas", "fenêtres", "窓", "창문들"],
  "homework": ["作業", "功課", "tarea", "tareas", "devoirs", "宿題", "しゅくだい", "숙제", "숙제를", "숙제는", "hausaufgaben"],
  "book": ["書", "這本書", "libro", "livre", "本", "ほん", "책", "책은", "책이", "책을", "책에", "tsheh", "buch", "livro"],
  "books": ["書", "libros", "livres", "本", "책", "책들", "책을", "책들은", "bücher", "libri", "livros"],
  "coffee": ["咖啡", "café", "cafe", "コーヒー", "珈琲", "커피", "커피를", "커피는", "커피가", "ka-pi", "kaffee", "caffè"],
  "cafe": ["咖啡店", "cafetería", "café", "カフェ", "喫茶店", "카페", "카페에", "카페에서", "커피숍", "cafeteria"],
  "library": ["圖書館", "biblioteca", "bibliothèque", "図書館", "としょかん", "도서관", "도서관은", "도서관에", "도서관에서", "도서관을", "bibliothek"],
  "movie": ["電影", "película", "film", "映画", "えいが", "영화", "영화는", "영화를", "영화가", "kino"],
  "food": ["美食", "食物", "菜", "comida", "nourriture", "料理", "グルメ", "음식", "음식은", "음식이", "음식을", "밥", "밥을", "essen", "cibo"],
  "dish": ["菜", "特色菜", "料理", "plato", "plat", "음식", "요리", "teller"],
  "restaurant": ["餐廳", "飯館", "restaurante", "restaurant", "レストラン", "식당", "식당에", "식당에서", "식당은"],
  "night market": ["夜市", "mercado nocturno", "night market", "夜市", "よいち", "야시장", "야시장에", "iā-tshī"],
  "park": ["公園", "parque", "parc", "公園", "こうえん", "공원", "공원에", "공원에서"],
  "airport": ["機場", "aeropuerto", "aéroport", "空港", "くうこう", "공항", "공항에", "공항에서"],
  "station": ["車站", "estación", "gare", "駅", "えき", "역", "지하철역", "기차역"],
  "house": ["家", "房子", "casa", "maison", "家", "うち", "집", "집에", "집에서"],
  "home": ["家", "casa", "maison", "家", "うち", "집", "집에", "집에서"],
  "language": ["語言", "idioma", "lengua", "langue", "言語", "ことば", "언어", "언어를", "언어는", "말"],
  "korean": ["韓文", "韓語", "韓國話", "coreano", "coréen", "韓国語", "한국어", "한국어를", "한국어는", "한국말"],
  "english": ["英文", "英語", "inglés", "anglais", "英語", "영어", "영어를", "영어는"],

  // Core Verbs
  "have": ["有", "擁有", "食飽未", "tener", "tengo", "tiene", "tenemos", "tienen", "avoir", "ai", "a", "持つ", "ある", "いる", "가지다", "있다", "있어요", "있습니다", "있고", "있어서", "ū", "haben", "avere", "ter"],
  "has": ["有", "tiene", "a", "ある", "いる", "있다", "있어요", "있습니다", "ū", "hat", "ha", "tem"],
  "had": ["有", "tenía", "tuvo", "avait", "eu", "있었다", "있었어요", "있었습니다", "hatte", "aveva", "teve"],
  "close": ["關上", "關", "cerrar", "cierra", "fermer", "閉める", "閉めて", "닫다", "닫아", "닫아요", "닫습니다", "kuainn", "schließen", "chiudere", "fechar"],
  "open": ["打開", "開", "abrir", "abre", "ouvrir", "開ける", "開けて", "열다", "열어요", "엽니다", "khui", "öffnen", "aprire", "abrir"],
  "eat": ["吃", "comer", "como", "come", "manger", "食べる", "食べます", "食べ", "먹다", "먹어요", "먹습니다", "먹었어요", "먹을", "먹는", "tsia̍h", "essen", "mangiare", "comer"],
  "eaten": ["吃", "食飽未", "comido", "mangé", "食べた", "먹은", "먹었어요"],
  "drink": ["喝", "beber", "tomar", "boire", "飲む", "飲みます", "飲み", "마시다", "마셔요", "마십니다", "마셨어요", "마실", "마시는", "lim", "trinken", "bere", "beber"],
  "drinks": ["喝", "bebe", "toma", "boit", "飲む", "飲みます", "마셔요", "마십니다"],
  "exercise": ["運動", "ejercicio", "hacer ejercicio", "ejercitarse", "faire du sport", "運動する", "運動しました", "運動", "운동", "운동하다", "운동해요", "운동했어요", "운동합니다"],
  "study": ["學習", "學", "estudiar", "estudio", "estudia", "étudier", "勉強する", "勉強します", "공부하다", "공부해요", "공부합니다", "공부했어요", "공부", "공부를", "tha̍k-tsheh", "lernen", "studieren", "studiare"],
  "studying": ["學習", "學", "estudiando", "étudiant", "勉強している", "공부하는", "공부하고", "공부해"],
  "learn": ["學", "學習", "aprender", "aprendo", "aprende", "apprendre", "学ぶ", "배우다", "배워요", "배웁니다", "배웠어요", "배울", "o̍h", "lernen", "imparare", "aprender"],
  "teach": ["教", "enseñar", "enseña", "apprendre", "教える", "가르치다", "가르쳐요", "가르칩니다", "가르쳤어요"],
  "teaches": ["教", "enseña", "教える", "가르쳐요", "가르칩니다"],
  "read": ["看書", "讀", "看", "leer", "leo", "lee", "lire", "読む", "読書", "읽다", "읽어요", "읽습니다", "읽었어요", "읽을", "읽는", "tha̍k", "lesen", "leggere", "ler"],
  "reads": ["看書", "讀", "lee", "lit", "読む", "읽어요", "읽습니다"],
  "reading": ["看書", "讀", "看", "leyendo", "lisant", "読書", "読む", "읽는", "읽고"],
  "write": ["寫", "寫完", "escribir", "escribe", "écrire", "書く", "書きます", "쓰다", "써요", "씁니다", "썼어요", "쓸", "siá", "schreiben", "scrivere", "escrever"],
  "doing": ["寫", "做", "haciendo", "faisant", "doing", "하고", "하는"],
  "do": ["做", "hacer", "hago", "hace", "faire", "する", "します", "하다", "해요", "합니다", "했어요", "할"],
  "finish": ["完成", "寫完", "terminar", "acabar", "finir", "終わる", "끝내다", "끝내요", "끝났어요", "다 하고"],
  "want": ["想", "想要", "querer", "quiero", "quiere", "vouloir", "たい", "ほしい", "싶다", "싶어요", "하고 싶어요", "가고 싶어요", "마시고 싶어요", "원하다", "siūnn", "wollen", "volere", "querer"],
  "like": ["喜歡", "gustar", "gusta", "aimer", "好き", "大好き", "좋아하다", "좋아해요", "좋아합니다", "좋아하는", "좋아했어요", "kah-ì", "mögen", "piacere", "gostar"],
  "likes": ["喜歡", "le gusta", "aime", "好き", "좋아해요", "좋아합니다"],
  "travel": ["旅行", "旅遊", "viajar", "viaje", "voyager", "旅行する", "旅行に行く", "여행하다", "여행해요", "여행", "lí-hîng", "reisen", "viaggiare", "viajar"],
  "taste": ["品嚐", "嚐", "probar", "degustar", "goûter", "味わう", "味見する", "맛보다", "맛봐요", "tshì"],
  "recommend": ["推薦", "recomendar", "recomiende", "recomendarme", "recomiendas", "recommander", "おすすめ", "お勧め", "薦める", "추천하다", "추천해요", "추천해", "추천", "thui-tsiàn", "empfehlen", "raccomandare", "recomendar"],
  "go": ["去", "出門", "ir", "voy", "va", "aller", "行く", "行きます", "가다", "가요", "갑니다", "갈", "가고", "가서", "khi", "gehen", "andare", "ir"],
  "going": ["去", "yendo", "allant", "行く", "行っている", "가요", "가는", "가고"],
  "go out": ["出門", "外出", "salir", "sortir", "出かける", "외출하다", "외출해요"],
  "went": ["去", "出門了", "fue", "fui", "allé", "行った", "갔다", "갔어요", "갔습니다", "ging", "andato", "foi"],
  "come": ["來", "venir", "viens", "vient", "venir", "来る", "来ます", "오다", "와요", "옵니다", "온", "kommen", "venire", "vir"],
  "came": ["來了", "vino", "vine", "venu", "来た", "왔다", "왔어요", "왔습니다", "온"],
  "see": ["看", "見", "ver", "veo", "ve", "voir", "見る", "見ます", "보다", "봐요", "봅니다", "sehen", "vedere", "ver"],
  "watch": ["看", "觀賞", "ver", "mirar", "regarder", "見る", "見ます", "보다", "봐요", "봅니다", "봤어요", "영화를 봤어요"],
  "watched": ["看了", "vio", "miró", "regardé", "見た", "봤다", "봤어요", "봤습니다"],
  "meet": ["見面", "遇見", "encontrar", "conocer", "rencontrer", "会う", "会います", "만나다", "만나요", "만납니다", "만나서", "만났어요", "treffen", "incontrare"],
  "buy": ["買", "comprar", "compro", "compra", "acheter", "買う", "買います", "사다", "사요", "삽니다", "산", "샀어요", "kaufen", "comprare", "comprar"],
  "bought": ["買了", "compró", "acheté", "買った", "샀다", "샀어요", "어제 산", "산"],
  "can": ["可以", "能", "會", "puede", "puedes", "podría", "pouvoir", "peux", "できます", "できる", "할 수 있다", "수 있어요", "수 있습니다", "kann", "può"],
  "cannot": ["不能", "不可以", "no puede", "ne peut pas", "できない", "못", "못해요", "못 가요", "수 없어요"],
  "could": ["可以", "能", "podría", "pouvait", "できた", "수 있었다", "수 있었어요"],
  "could not": ["不能", "no pudo", "ne pouvait pas", "できなかった", "못", "못 갔어요", "수 없었어요"],
  "please": ["請", "por favor", "s'il vous plaît", "ください", "お願いします", "제발", "부탁합니다", "주세요", "tshiánn", "bitte", "per favore", "por favor"],
  "hello": ["你好", "逐家好", "hola", "bonjour", "こんにちは", "안녕하세요", "안녕하십니까", "hallo", "ciao"],

  // Adjectives, Questions & Modifiers
  "today": ["今天", "今仔日", "hoy", "aujourd'hui", "今日", "きょう", "오늘", "오늘은", "kin-á-ji̍t", "heute", "oggi", "hoje"],
  "tomorrow": ["明天", "明仔載", "mañana", "demain", "明日", "あした", "내일", "내일은", "mî-á-tsài", "morgen", "domani", "amanhã"],
  "yesterday": ["昨天", "ayer", "hier", "昨日", "きのう", "어제", "어제는", "gestern", "ieri", "ontem"],
  "morning": ["早上", "早晨", "mañana", "matin", "朝", "아침", "아침에", "오전", "morgen", "mattina"],
  "afternoon": ["下午", "tarde", "après-midi", "午後", "오후", "오후에", "nachmittag", "pomeriggio"],
  "evening": ["晚上", "noche", "soir", "晩", "저녁", "저녁에", "밤", "abend", "sera"],
  "weekend": ["週末", "fin de semana", "weekend", "週末", "주말", "주말에", "주말은", "wochenende"],
  "every": ["每", "每個", "cada", "chaque", "毎", "매", "매일", "마다"],
  "every morning": ["每天早上", "cada mañana", "chaque matin", "毎朝", "매일 아침", "매일 아침에"],
  "cold": ["冷", "很冷", "frío", "froid", "寒い", "さむい", "춥다", "추워요", "추운", "lénn", "kalt", "freddo", "frio"],
  "hot": ["熱", "很熱", "caliente", "calor", "chaud", "暑い", "あつい", "뜨거운", "더운", "더워요", "jua̍h", "heiß", "caldo", "quente"],
  "warm": ["溫暖", "暖和", "cálido", "chaud", "温かい", "あたたかい", "따뜻한", "따뜻해요", "따뜻하다", "warm"],
  "spicy": ["辣", "picante", "épicé", "辛い", "からい", "매운", "매워요", "맵다", "scharf"],
  "delicious": ["好吃", "美味", "美味しい", "おいしい", "delicioso", "rico", "délicieux", "맛있는", "맛있어요", "맛있다", "맛있습니다", "lecker"],
  "typical": ["特色", "特色菜", "在地", "當地", "típico", "typique", "현지", "특색", "typisch"],
  "popular": ["受歡迎", "熱門", "popular", "populaire", "人気", "인기", "인기 있는", "인기있는", "beliebt"],
  "most": ["最", "más", "plus", "一番", "가장", "제일", "am meisten"],
  "outside": ["外面", "afuera", "fuera", "dehors", "外", "そと", "밖", "밖에", "밖에서", "gōo-bīn", "draußen", "fuori", "fora"],
  "inside": ["裡面", "adentro", "dentro", "dedans", "中", "うち", "안", "안에", "안에서", "lāi-té", "drinnen", "dentro"],
  "although": ["雖然", "但是", "儘管", "aunque", "bien que", "が", "けれども", "비록", "수록", "sui-jiân", "obwohl", "sebbene", "embora"],
  "still": ["還是", "但是", "仍然", "todavía", "aún", "encore", "それでも", "やはり", "여전히", "그래도", "아직", "iáu-kú", "noch", "ancora", "ainda"],
  "very": ["很", "非常", "真", "muy", "très", "とても", "非常に", "매우", "아주", "너무", "정말", "tsin", "sehr", "molto", "muito"],
  "a lot": ["很多", "mucho", "beaucoup", "たくさん", "많이", "많아요", "tsē", "viel", "molto", "muito"],
  "a lot of": ["很多", "mucho", "muchos", "muchas", "beaucoup de", "たくさんの", "多くの", "많은", "viel"],
  "easy": ["容易", "簡單", "fácil", "facile", "簡単", "かんたん", "優しい", "쉬운", "쉽다", "쉬워요", "iông-ī", "einfach", "facile"],
  "song": ["歌", "歌曲", "canción", "chanson", "歌", "うた", "노래", "노래는", "노래가", "노래예요", "lied"],
  "what": ["什麼", "qué", "quoi", "何", "なに", "무엇", "뭐", "무슨", "was", "cosa"],
  "where": ["哪裡", "哪兒", "dónde", "où", "どこ", "어디", "어디에", "어디서", "wo", "dove"],
  "who": ["誰", "quién", "qui", "だれ", "누구", "누가", "wer", "chi"],
  "why": ["為什麼", "por qué", "pourquoi", "なぜ", "왜", "warum"],
  "how": ["怎麼", "如何", "cómo", "comment", "どう", "어떻게", "wie"],
  "how much": ["多少錢", "多少", "cuánto", "combien", "いくら", "얼마", "얼마나", "wie viel"],
};

/**
 * Tokenize a sentence based on language characteristics and compound word recognition
 */
export function tokenizeSentence(text: string, langCode: string, idPrefix: string): Token[] {
  if (!text || typeof text !== "string") return [];

  const isTargetUnspaced = isNonSpacedCJK(text, langCode);

  const tokens: Token[] = [];
  let currentId = 0;

  if (isTargetUnspaced) {
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

      // 1. Check for Japanese Katakana contiguous blocks (including long vowel mark ー)
      const katakanaCode = char.charCodeAt(0);
      if ((katakanaCode >= 0x30a0 && katakanaCode <= 0x30ff) || char === "ー") {
        let kataEnd = i;
        while (kataEnd < text.length) {
          const kCode = text.charCodeAt(kataEnd);
          const isKata = (kCode >= 0x30a0 && kCode <= 0x30ff) || text[kataEnd] === "ー";
          if (isKata) {
            kataEnd++;
          } else {
            break;
          }
        }
        const kataWord = text.substring(i, kataEnd);
        tokens.push({
          id: `${idPrefix}-${currentId++}`,
          text: kataWord,
          isPunctuation: false,
          cleanText: kataWord.toLowerCase(),
          alignedIds: [],
        });
        i = kataEnd;
        continue;
      }

      // 2. Greedy Match known compound words (Chinese, Japanese Kanji+Kana, Taiwanese Hokkien)
      let matchedCompound = "";
      for (const compound of EAST_ASIAN_COMPOUND_LEXICON) {
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

      // 3. Single character fallback
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
    // Space-separated languages (Korean, English, Spanish, French, German, Italian, etc.)
    const rawWords = text.split(/(\s+|[.,!?;:()[\]{}"'`«»“”‘’—–\-·。，！？；：「」『』（）…、¿¡])/).filter(Boolean);

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

  // Generate morphological stems for Korean/inflected forms
  const tVariants = getKoreanMorphologicalVariants(tClean).map((v) => v.toLowerCase());
  const trVariants = [trClean, trClean.replace(/s$/, ""), trClean.replace(/ed$/, ""), trClean.replace(/ing$/, "")];

  for (const tVar of tVariants) {
    for (const trVar of trVariants) {
      if (tVar === trVar) return true;

      // Direct check in dictionary
      const mappings1 = BILINGUAL_ALIGNMENT_MAP[trVar];
      if (mappings1 && mappings1.some((m) => m.toLowerCase() === tVar || tVar.startsWith(m.toLowerCase()) || m.toLowerCase().startsWith(tVar))) {
        return true;
      }

      const mappings2 = BILINGUAL_ALIGNMENT_MAP[tVar];
      if (mappings2 && mappings2.some((m) => m.toLowerCase() === trVar || trVar.startsWith(m.toLowerCase()) || m.toLowerCase().startsWith(trVar))) {
        return true;
      }

      // Cross-lingual key matching with prefix/stem compatibility
      for (const [engKey, dictVariants] of Object.entries(BILINGUAL_ALIGNMENT_MAP)) {
        const keyMatchesTr = trVar === engKey || trVar.startsWith(engKey) || engKey.startsWith(trVar);
        const variantMatchesTgt = dictVariants.some((v) => {
          const vLow = v.toLowerCase();
          return tVar === vLow || tVar.startsWith(vLow) || vLow.startsWith(tVar);
        });
        if (keyMatchesTr && variantMatchesTgt) {
          return true;
        }

        const keyMatchesTgt = tVar === engKey || tVar.startsWith(engKey) || engKey.startsWith(tVar);
        const variantMatchesTr = dictVariants.some((v) => {
          const vLow = v.toLowerCase();
          return trVar === vLow || trVar.startsWith(vLow) || vLow.startsWith(trVar);
        });
        if (keyMatchesTgt && variantMatchesTr) {
          return true;
        }
      }
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
    const directMatches = tokens.filter((t) => !t.isPunctuation && (
      t.cleanText === targetWord ||
      t.cleanText.startsWith(targetWord) ||
      targetWord.startsWith(t.cleanText) ||
      getKoreanMorphologicalVariants(t.cleanText).some((v) => v.toLowerCase() === targetWord)
    ));
    if (directMatches.length > 0) {
      return directMatches;
    }
  }

  for (let i = 0; i <= tokens.length - phraseWords.length; i++) {
    let matches = true;
    const slice: Token[] = [];
    let wordIdx = 0;

    for (let j = i; j < tokens.length && wordIdx < phraseWords.length; j++) {
      if (tokens[j].isPunctuation) continue;
      const tClean = tokens[j].cleanText;
      const expected = phraseWords[wordIdx];
      const stemMatches = getKoreanMorphologicalVariants(tClean).some((v) => v.toLowerCase() === expected);

      if (tClean === expected || tClean.startsWith(expected) || expected.startsWith(tClean) || stemMatches) {
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
    if (!targetMap[targetId].includes(transId)) {
      if (targetMap[targetId].length < 4) { // Cap target alignment fan-out to 4
        targetMap[targetId].push(transId);
      }
    }

    if (!translationMap[transId]) translationMap[transId] = [];
    if (!translationMap[transId].includes(targetId)) {
      if (translationMap[transId].length < 4) { // Cap translation alignment fan-out to 4
        translationMap[transId].push(targetId);
      }
    }
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

  // Single word semantic dictionary matching with Korean morphology
  meaningfulTarget.forEach((tToken) => {
    meaningfulTranslation.forEach((trToken) => {
      if (areTokensSemanticallyAligned(tToken.cleanText, trToken.cleanText)) {
        addAlignment(tToken.id, trToken.id);
      }
    });
  });

  // 3. Third Pass: Clitic, Article, Auxiliary & Particle Syntactic Grouping
  // Propagate alignments to immediate adjacent neighbor
  meaningfulTranslation.forEach((trToken, idx) => {
    const isArticle = NOUN_ARTICLES_AND_DETERMINERS.has(trToken.cleanText);
    const isAuxiliary = VERBAL_AUXILIARIES.has(trToken.cleanText);
    const isPrep = PREPOSITIONS.has(trToken.cleanText);

    if ((isArticle || isAuxiliary || isPrep) && (!translationMap[trToken.id] || translationMap[trToken.id].length === 0)) {
      const nextNeighbor = meaningfulTranslation[idx + 1];
      if (nextNeighbor && translationMap[nextNeighbor.id] && translationMap[nextNeighbor.id].length > 0) {
        // Link to the first target alignment of the next neighbor
        const primeTargetId = translationMap[nextNeighbor.id][0];
        addAlignment(primeTargetId, trToken.id);
      } else {
        const prevNeighbor = meaningfulTranslation[idx - 1];
        if (prevNeighbor && translationMap[prevNeighbor.id] && translationMap[prevNeighbor.id].length > 0) {
          const primeTargetId = translationMap[prevNeighbor.id][0];
          addAlignment(primeTargetId, trToken.id);
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
        const primeTransId = targetMap[prevNeighbor.id][0];
        addAlignment(tToken.id, primeTransId);
      } else if (nextNeighbor && targetMap[nextNeighbor.id] && targetMap[nextNeighbor.id].length > 0) {
        const primeTransId = targetMap[nextNeighbor.id][0];
        addAlignment(tToken.id, primeTransId);
      }
    }
  });

  // 4. Fourth Pass: SOV vs SVO Aware Position Interpolation
  const isTargetSOV = meaningfulTarget.some((t) => Array.from(t.cleanText).some(isHangul)) ||
    meaningfulTarget.some((t) => Array.from(t.cleanText).some((c) => {
      const code = c.charCodeAt(0);
      return (code >= 0x3040 && code <= 0x309f) || (code >= 0x30a0 && code <= 0x30ff);
    }));

  meaningfulTarget.forEach((tToken, tIdx) => {
    if (!targetMap[tToken.id] || targetMap[tToken.id].length === 0) {
      if (isTargetSOV && tIdx === meaningfulTarget.length - 1) {
        // Last token in SOV is the main verb/predicate -> align to earlier/middle verb in SVO
        const candidateIdx = Math.min(1, Math.floor((meaningfulTranslation.length - 1) / 2));
        const trToken = meaningfulTranslation[candidateIdx] || meaningfulTranslation[0];
        if (trToken) {
          addAlignment(tToken.id, trToken.id);
        }
      } else {
        const tRatio = tIdx / Math.max(1, meaningfulTarget.length - 1);
        const mappedIdx = Math.min(
          meaningfulTranslation.length - 1,
          Math.max(0, Math.round(tRatio * (meaningfulTranslation.length - 1)))
        );
        const trToken = meaningfulTranslation[mappedIdx];
        if (trToken) {
          addAlignment(tToken.id, trToken.id);
        }
      }
    }
  });

  meaningfulTranslation.forEach((trToken, trIdx) => {
    if (!translationMap[trToken.id] || translationMap[trToken.id].length === 0) {
      const trRatio = trIdx / Math.max(1, meaningfulTranslation.length - 1);
      const mappedIdx = Math.min(
        meaningfulTarget.length - 1,
        Math.max(0, Math.round(trRatio * (meaningfulTarget.length - 1)))
      );
      const tToken = meaningfulTarget[mappedIdx];
      if (tToken) {
        addAlignment(tToken.id, trToken.id);
      }
    }
  });

  // Assign computed IDs and enforce symmetry
  targetTokens.forEach((t) => {
    t.alignedIds = targetMap[t.id] || [];
  });

  translationTokens.forEach((tr) => {
    tr.alignedIds = translationMap[tr.id] || [];
  });

  // Symmetrical link pass: ensure that if A points to B, B points to A
  targetTokens.forEach((t) => {
    t.alignedIds.forEach((trId) => {
      const trToken = translationTokens.find((tr) => tr.id === trId);
      if (trToken && !trToken.alignedIds.includes(t.id)) {
        trToken.alignedIds.push(t.id);
      }
    });
  });

  translationTokens.forEach((tr) => {
    tr.alignedIds.forEach((tId) => {
      const tToken = targetTokens.find((t) => t.id === tId);
      if (tToken && !tToken.alignedIds.includes(tr.id)) {
        tToken.alignedIds.push(tr.id);
      }
    });
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

// Korean particle meanings for pedagogical structural formula explanations
const KOREAN_PARTICLE_ROLES: Record<string, string> = {
  "에서는": "at (topic)",
  "에서도": "at (also)",
  "에게서는": "from (topic)",
  "한테서는": "from (topic)",
  "에게서": "from",
  "한테서": "from",
  "에는": "to/at (topic)",
  "에도": "to/at (also)",
  "에서": "at",
  "에게": "to",
  "한테": "to",
  "으로는": "by (topic)",
  "으로": "by/to",
  "부터는": "from (topic)",
  "부터": "from",
  "까지는": "until (topic)",
  "까지": "to/until",
  "처럼": "like",
  "만큼": "as much as",
  "하고": "with/and",
  "이랑": "with/and",
  "이라": "is",
  "이나": "or/as many as",
  "은": "topic",
  "는": "topic",
  "이": "subject",
  "가": "subject",
  "을": "object",
  "를": "object",
  "에": "to/at",
  "의": "'s",
  "도": "also",
  "로": "by/to",
  "와": "with/and",
  "과": "with/and",
  "랑": "with/and",
  "만": "only",
  "나": "or",
};

// Japanese particle meanings for pedagogical structural formulas
const JAPANESE_PARTICLE_ROLES: Record<string, string> = {
  "は": "topic",
  "が": "subject",
  "を": "object",
  "で": "at/by",
  "に": "at/to",
  "へ": "to",
  "と": "with/and",
  "から": "from",
  "まで": "until",
  "も": "also",
  "の": "'s/of",
  "ね": "right?",
  "よ": "emphasis",
  "か": "?",
  "より": "than",
  "だけ": "only",
  "しか": "only",
};

// Inverted dictionary from BILINGUAL_ALIGNMENT_MAP for fast stem translation lookup
const TARGET_TO_ENG_CACHE: Record<string, string> = {};
for (const [eng, targets] of Object.entries(BILINGUAL_ALIGNMENT_MAP)) {
  for (const t of targets) {
    if (!TARGET_TO_ENG_CACHE[t]) {
      TARGET_TO_ENG_CACHE[t] = eng;
    }
  }
}

/**
 * Finds the best English translation for a target stem/word.
 */
function findStemMeaning(
  targetWord: string,
  fullTarget: string,
  fullEnglish: string,
  tokenBreakdown?: Array<{ token: string; translatedToken: string; partOfSpeech?: string; roleOrNuance?: string }>
): string {
  const clean = targetWord.replace(PUNCTUATION_REGEX, "").trim();
  if (!clean) return "";

  // 1. Direct match in provided tokenBreakdown
  if (tokenBreakdown && tokenBreakdown.length > 0) {
    const found = tokenBreakdown.find((tb) => tb.token === clean || clean.includes(tb.token) || tb.token.includes(clean));
    if (found && found.translatedToken) {
      return found.translatedToken.replace(/\s*\([^)]*\)/g, "").trim().toLowerCase();
    }
  }

  // 2. Direct match in TARGET_TO_ENG_CACHE
  if (TARGET_TO_ENG_CACHE[clean]) {
    return TARGET_TO_ENG_CACHE[clean];
  }

  // 3. Korean morphological stem checks
  const variants = getKoreanMorphologicalVariants(clean);
  for (const v of variants) {
    if (TARGET_TO_ENG_CACHE[v]) {
      return TARGET_TO_ENG_CACHE[v];
    }
  }

  // 4. Token alignment search
  const cleanEngWords = fullEnglish.toLowerCase().replace(/[.,!?;:()[\]{}'"]/g, "").split(/\s+/).filter(Boolean);
  for (const eng of cleanEngWords) {
    const candidateTargets = BILINGUAL_ALIGNMENT_MAP[eng] || [];
    if (candidateTargets.some((ct) => ct === clean || clean.includes(ct) || ct.includes(clean))) {
      return eng;
    }
  }

  return clean;
}

export interface MorphologicalChunkItem {
  raw: string; // e.g. "저 (I) + 는 (topic)"
  stem: string;
  stemMeaning: string;
  particle?: string;
  particleRole?: string;
}

/**
 * Generates an intuitive morphological arrow-flow explanation
 * Example output:
 * "저 (I) + 는 (topic) -> 도서관 (library) + 에서 (at) -> 책 (book) + 을 (object) -> 읽어요 (read)."
 */
export function generateMorphologicalFormula(
  targetText: string,
  translationText: string,
  targetLangCode: string,
  tokenBreakdown?: Array<{ token: string; translatedToken: string; partOfSpeech?: string; roleOrNuance?: string }>
): string {
  if (!targetText) return "";

  const cleanTarget = targetText.trim();
  const cleanTrans = translationText ? translationText.trim() : "";
  const lang = (targetLangCode || "").toLowerCase();

  // 1. Korean SOV Morphological Arrow Flow
  if (lang === "ko" || Array.from(cleanTarget).some(isHangul)) {
    const trailingPunctMatch = cleanTarget.match(/([.!?~]+)$/);
    const trailingPunct = trailingPunctMatch ? trailingPunctMatch[1] : ".";
    const textWithoutEndingPunct = cleanTarget.replace(/[.!?~]+$/, "").trim();
    const words = textWithoutEndingPunct.split(/\s+/).filter(Boolean);

    const chunks: string[] = [];
    const sortedParticles = Object.keys(KOREAN_PARTICLE_ROLES).sort((a, b) => b.length - a.length);

    for (const word of words) {
      let matchedParticle: string | null = null;
      let matchedRole: string | null = null;

      for (const p of sortedParticles) {
        if (word.endsWith(p) && word.length > p.length) {
          matchedParticle = p;
          matchedRole = KOREAN_PARTICLE_ROLES[p];
          break;
        }
      }

      if (matchedParticle && matchedRole) {
        const stem = word.slice(0, -matchedParticle.length);
        const stemMeaning = findStemMeaning(stem, cleanTarget, cleanTrans, tokenBreakdown);
        chunks.push(`${stem} (${stemMeaning}) + ${matchedParticle} (${matchedRole})`);
      } else {
        const meaning = findStemMeaning(word, cleanTarget, cleanTrans, tokenBreakdown);
        chunks.push(`${word} (${meaning})`);
      }
    }

    return chunks.join(" -> ") + trailingPunct;
  }

  // 2. Japanese SOV Particle Arrow Flow
  if (lang === "ja") {
    const trailingPunctMatch = cleanTarget.match(/([。!?~]+)$/);
    const trailingPunct = trailingPunctMatch ? trailingPunctMatch[1] : "。";
    const textWithoutEndingPunct = cleanTarget.replace(/[。!?~]+$/, "").trim();

    // Segment Japanese using compound lexicon and particle boundaries
    const rawTokens = tokenizeSentence(textWithoutEndingPunct, "ja", "ja-form");
    const chunks: string[] = [];
    let currentStem = "";

    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i];
      if (token.isPunctuation) continue;

      if (JAPANESE_PARTICLE_ROLES[token.text]) {
        const role = JAPANESE_PARTICLE_ROLES[token.text];
        if (currentStem) {
          const stemMeaning = findStemMeaning(currentStem, cleanTarget, cleanTrans, tokenBreakdown);
          chunks.push(`${currentStem} (${stemMeaning}) + ${token.text} (${role})`);
          currentStem = "";
        } else {
          chunks.push(`${token.text} (${role})`);
        }
      } else {
        if (currentStem) {
          const stemMeaning = findStemMeaning(currentStem, cleanTarget, cleanTrans, tokenBreakdown);
          chunks.push(`${currentStem} (${stemMeaning})`);
        }
        currentStem = token.text;
      }
    }

    if (currentStem) {
      const stemMeaning = findStemMeaning(currentStem, cleanTarget, cleanTrans, tokenBreakdown);
      chunks.push(`${currentStem} (${stemMeaning})`);
    }

    return chunks.join(" -> ") + trailingPunct;
  }

  // 3. Traditional Chinese & Hokkien SVO Semantic Arrow Flow
  if (lang === "zh-tw" || lang === "zh" || lang === "nan") {
    const trailingPunctMatch = cleanTarget.match(/([。!?~]+)$/);
    const trailingPunct = trailingPunctMatch ? trailingPunctMatch[1] : "。";
    const textWithoutEndingPunct = cleanTarget.replace(/[。!?~]+$/, "").trim();

    const rawTokens = tokenizeSentence(textWithoutEndingPunct, lang, "cjk-form");
    const chunks: string[] = [];

    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i];
      if (token.isPunctuation) continue;

      const meaning = findStemMeaning(token.text, cleanTarget, cleanTrans, tokenBreakdown);
      if (["在", "佇", "把", "共", "對", "向"].includes(token.text) && i + 1 < rawTokens.length && !rawTokens[i + 1].isPunctuation) {
        const nextToken = rawTokens[i + 1];
        const nextMeaning = findStemMeaning(nextToken.text, cleanTarget, cleanTrans, tokenBreakdown);
        chunks.push(`${token.text} (${meaning}) + ${nextToken.text} (${nextMeaning})`);
        i++; // skip next
      } else {
        chunks.push(`${token.text} (${meaning})`);
      }
    }

    return chunks.join(" -> ") + trailingPunct;
  }

  // 4. Spanish / French / German / Italian / Western Languages
  const words = cleanTarget.replace(/[.,!?;:()[\]{}'"]+$/, "").split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(PUNCTUATION_REGEX, "");
    const meaning = findStemMeaning(word, cleanTarget, cleanTrans, tokenBreakdown);

    const lower = word.toLowerCase();
    if (NOUN_ARTICLES_AND_DETERMINERS.has(lower) && i + 1 < words.length) {
      const nextWord = words[i + 1].replace(PUNCTUATION_REGEX, "");
      const nextMeaning = findStemMeaning(nextWord, cleanTarget, cleanTrans, tokenBreakdown);
      chunks.push(`${word} ${nextWord} (${meaning} ${nextMeaning})`);
      i++;
    } else {
      chunks.push(`${word} (${meaning})`);
    }
  }

  return chunks.join(" -> ") + ".";
}

/**
 * Parses a morphological formula string into structured chunks for interactive UI rendering
 */
export function parseMorphologicalFormula(formulaString: string): MorphologicalChunkItem[] {
  if (!formulaString) return [];

  // Remove trailing period or punctuation
  const clean = formulaString.replace(/[.。!?~]+$/, "").trim();
  const rawChunks = clean.split("->").map((c) => c.trim()).filter(Boolean);

  return rawChunks.map((chunkStr) => {
    // Check if chunk contains a particle "+ particle" e.g. "저 (I) + 는 (topic)"
    if (chunkStr.includes("+")) {
      const parts = chunkStr.split("+").map((p) => p.trim());
      const stemMatch = parts[0].match(/^(.*?)\s*\((.*?)\)$/);
      const particleMatch = parts[1] ? parts[1].match(/^(.*?)\s*\((.*?)\)$/) : null;

      return {
        raw: chunkStr,
        stem: stemMatch ? stemMatch[1].trim() : parts[0],
        stemMeaning: stemMatch ? stemMatch[2].trim() : "",
        particle: particleMatch ? particleMatch[1].trim() : parts[1] || "",
        particleRole: particleMatch ? particleMatch[2].trim() : "",
      };
    }

    const match = chunkStr.match(/^(.*?)\s*\((.*?)\)$/);
    return {
      raw: chunkStr,
      stem: match ? match[1].trim() : chunkStr,
      stemMeaning: match ? match[2].trim() : "",
    };
  });
}

