import { ReadingArticle } from "../types";

export const DEFAULT_READING_ARTICLES: Record<string, ReadingArticle> = {
  es: {
    id: "article-es-default",
    title: "Un Día en el Mercado de San Miguel",
    titleTranslation: "A Day in San Miguel Market",
    topic: "Daily Life & Food Culture",
    cefrLevel: "A2",
    targetLanguage: "Spanish",
    knownLanguage: "English",
    targetLanguageCode: "es",
    knownLanguageCode: "en",
    content: `Hoy es sábado y hace muy buen tiempo en Madrid. Juan y Elena deciden ir al Mercado de San Miguel para comprar ingredientes frescos y disfrutar de unas ricas tapas.

Al llegar, hay mucha gente alegre. Juan tiene hambre y pide una porción de tortilla de patatas con jamón ibérico. "Esta tortilla está deliciosa", dice Elena con una gran sonrisa.

Después de comer, ellos compran queso manchego y aceitunas para llevar a casa. Hay que tener paciencia porque hay una fila larga, pero vale la pena. Es una hermosa tarde para pasear por la ciudad.`,
    paragraphs: [
      {
        targetText: "Hoy es sábado y hace muy buen tiempo en Madrid. Juan y Elena deciden ir al Mercado de San Miguel para comprar ingredientes frescos y disfrutar de unas ricas tapas.",
        translation: "Today is Saturday and the weather is very nice in Madrid. Juan and Elena decide to go to the San Miguel Market to buy fresh ingredients and enjoy some delicious tapas.",
      },
      {
        targetText: "Al llegar, hay mucha gente alegre. Juan tiene hambre y pide una porción de tortilla de patatas con jamón ibérico. \"Esta tortilla está deliciosa\", dice Elena con una gran sonrisa.",
        translation: "Upon arriving, there are many cheerful people. Juan is hungry and orders a slice of potato omelet with Iberian ham. \"This omelet is delicious,\" Elena says with a big smile.",
      },
      {
        targetText: "Después de comer, ellos compran queso manchego y aceitunas para llevar a casa. Hay que tener paciencia porque hay una fila larga, pero vale la pena. Es una hermosa tarde para pasear por la ciudad.",
        translation: "After eating, they buy Manchego cheese and olives to take home. One must have patience because there is a long line, but it is worth it. It is a beautiful afternoon to stroll through the city.",
      },
    ],
    targetWordsUsed: ["ser", "estar", "tener", "hacer", "hay que + infinitive", "tapas", "paciencia"],
    summary: "Juan and Elena spend a pleasant Saturday visiting the bustling San Miguel Market in Madrid, tasting traditional tapas and buying fresh ingredients.",
    followUpQuestions: [
      {
        id: "q-es-f1",
        questionText: "¿Por qué decidieron Juan y Elena ir al Mercado de San Miguel hoy?",
        questionTranslation: "Why did Juan and Elena decide to go to the San Miguel Market today?",
        focusGrammarOrConcept: "Expressing reasons with 'para + infinitivo' or 'porque'",
        suggestedAnswerHint: "Mention the pleasant weather and their desire to buy ingredients and eat tapas.",
      },
      {
        id: "q-es-f2",
        questionText: "¿Qué comida típica pidieron cuando llegaron al mercado y qué opinaron de ella?",
        questionTranslation: "What typical food did they order when they arrived and what did they think of it?",
        focusGrammarOrConcept: "Describing food taste with 'estar delicioso/a' and preterite verb forms",
        suggestedAnswerHint: "Refer to the tortilla de patatas con jamón ibérico.",
      },
    ],
    createdAt: new Date().toISOString(),
  },
  ja: {
    id: "article-ja-default",
    title: "京都の小さな喫茶店での午後",
    titleTranslation: "An Afternoon in a Small Kyoto Café",
    topic: "Travel & Daily Routine",
    cefrLevel: "N5 / A2",
    targetLanguage: "Japanese",
    knownLanguage: "English",
    targetLanguageCode: "ja",
    knownLanguageCode: "en",
    content: `週末、私は友達と一緒に京都へ旅行に行きました。古い町並みをゆっくり散歩して、小さな喫茶店に入りました。

店の中で、温かい抹茶と美味しい和菓子を食べました。店員さんはとても親切で、「写真を撮ってもいいですよ」と笑顔で言ってくれました。

いつかまた京都へ行きたいです。日本の伝統的な文化を体験するのは本当に楽しいです。`,
    paragraphs: [
      {
        targetText: "週末、私は友達と一緒に京都へ旅行に行きました。古い町並みをゆっくり散歩して、小さな喫茶店に入りました。",
        translation: "On the weekend, I went on a trip to Kyoto with my friend. We strolled slowly through the old streets and entered a small café.",
      },
      {
        targetText: "店の中で、温かい抹茶と美味しい和菓子を食べました。店員さんはとても親切で、「写真を撮ってもいいですよ」と笑顔で言ってくれました。",
        translation: "Inside the shop, we ate warm matcha and delicious Japanese sweets. The clerk was very kind and said with a smile, \"It is okay to take photos.\"",
      },
      {
        targetText: "いつかまた京都へ行きたいです。日本の伝統的な文化を体験するのは本当に楽しいです。",
        translation: "I want to go to Kyoto again someday. Experiencing traditional Japanese culture is truly enjoyable.",
      },
    ],
    targetWordsUsed: ["する (suru)", "行く (iku)", "食べる (taberu)", "〜てもいい (te mo ii)", "〜たい (tai)"],
    summary: "A peaceful weekend trip to Kyoto, exploring historic streets and enjoying matcha and sweets in a traditional café.",
    followUpQuestions: [
      {
        id: "q-ja-f1",
        questionText: "主人公は喫茶店で何を食べたり飲んだりしましたか？",
        questionTranslation: "What did the protagonist eat and drink at the café?",
        focusGrammarOrConcept: "Past completed action with 〜ました and food vocabulary",
        suggestedAnswerHint: "Mention matcha (green tea) and wagashi (Japanese traditional sweets).",
      },
      {
        id: "q-ja-f2",
        questionText: "店員さんは写真について何と言ってくれましたか？",
        questionTranslation: "What did the store clerk say regarding taking photographs?",
        focusGrammarOrConcept: "Permission expression 〜てもいいです and quotation と言いました",
        suggestedAnswerHint: "Mention that the clerk kindly allowed them to take pictures.",
      },
    ],
    createdAt: new Date().toISOString(),
  },
  ko: {
    id: "article-ko-default",
    title: "봄날의 한강 공원 소풍",
    titleTranslation: "A Spring Picnic at Han River Park",
    topic: "Leisure & Daily Life",
    cefrLevel: "TOPIK I / A2",
    targetLanguage: "Korean",
    knownLanguage: "English",
    targetLanguageCode: "ko",
    knownLanguageCode: "en",
    content: `오늘 날씨가 정말 따뜻해서 친구와 같이 한강 공원에 갔어요. 공원에는 자전거를 타는 사람들과 산책하는 사람들이 많았어요.

우리는 잔디밭에 돗자리를 펴고 맛있는 라면과 김밥을 먹었어요. 바람이 시원하게 불어서 기분이 아주 좋았어요.

주말마다 이런 소풍을 자주 오고 싶어요. 저녁에는 강변의 아름다운 야경을 구경했어요.`,
    paragraphs: [
      {
        targetText: "오늘 날씨가 정말 따뜻해서 친구와 같이 한강 공원에 갔어요. 공원에는 자전거를 타는 사람들과 산책하는 사람들이 많았어요.",
        translation: "Because the weather was really warm today, I went to the Han River Park with my friend. There were many people riding bicycles and taking walks in the park.",
      },
      {
        targetText: "우리는 잔디밭에 돗자리를 펴고 맛있는 라면과 김밥을 먹었어요. 바람이 시원하게 불어서 기분이 아주 좋았어요.",
        translation: "We spread a mat on the lawn and ate delicious ramyeon and gimbap. The cool breeze blew, making us feel very good.",
      },
      {
        targetText: "주말마다 이런 소풍을 자주 오고 싶어요. 저녁에는 강변의 아름다운 야경을 구경했어요.",
        translation: "I want to come on picnics like this often every weekend. In the evening, we admired the beautiful night view along the riverside.",
      },
    ],
    targetWordsUsed: ["하다 (hada)", "가다 (gada)", "먹다 (meokda)", "-고 싶다 (-go sipda)", "-아/어서 (-a/eoseo)"],
    summary: "Enjoying a refreshing spring picnic at the Han River park, eating street food and taking in the riverside scenery.",
    followUpQuestions: [
      {
        id: "q-ko-f1",
        questionText: "오늘 왜 한강 공원으로 소풍을 갔고, 공원에서 무엇을 먹었나요?",
        questionTranslation: "Why did they go on a picnic to Han River Park today, and what did they eat at the park?",
        focusGrammarOrConcept: "Cause marker -아/어서 and food objects with -을/를 먹었어요",
        suggestedAnswerHint: "Mention the warm weather and eating ramyeon and gimbap on the picnic mat.",
      },
      {
        id: "q-ko-f2",
        questionText: "저녁에 강변에서 무엇을 구경했나요?",
        questionTranslation: "What did they view and enjoy alongside the river in the evening?",
        focusGrammarOrConcept: "Past tense 구경했어요 and noun modifier 아름다운",
        suggestedAnswerHint: "Mention admiring the beautiful night skyline (야경).",
      },
    ],
    createdAt: new Date().toISOString(),
  },
  "zh-TW": {
    id: "article-zht-default",
    title: "臺北巷弄裡的咖啡香與慢生活",
    titleTranslation: "Coffee Aroma and Slow Living in Taipei's Alleys",
    topic: "City Life & Culture",
    cefrLevel: "B1 / TOCFL Band A",
    targetLanguage: "Traditional Chinese",
    knownLanguage: "English",
    targetLanguageCode: "zh-TW",
    knownLanguageCode: "en",
    content: `每逢週末，我最喜歡做的事情就是探索臺北巷弄裡的特色咖啡店。今天陽光溫暖，我和朋友約在赤峰街見面。

雖然這條老街的店面不大，但是每一間店都很有設計感。我們走進一家充滿綠意的小店，店主人親切地為我們沖煮臺灣阿里山手沖咖啡。

我們一邊品嚐咖啡，一邊分享這週的生活心得。我想把生活中的美好瞬間都記錄下來，放慢腳步感受城市的溫度。`,
    paragraphs: [
      {
        targetText: "每逢週末，我最喜歡做的事情就是探索臺北巷弄裡的特色咖啡店。今天陽光溫暖，我和朋友約在赤峰街見面。",
        translation: "Every weekend, my favorite thing to do is explore unique cafés hidden in Taipei's alleys. Today the sunshine is warm, and my friend and I arranged to meet on Chifeng Street.",
      },
      {
        targetText: "雖然這條老街的店面不大，但是每一間店都很有設計感。我們走進一家充滿綠意的小店，店主人親切地為我們沖煮臺灣阿里山手沖咖啡。",
        translation: "Although the shops on this old street are not large, each has a strong sense of design. We walked into a cozy shop filled with greenery, where the friendly owner brewed Alishan pour-over coffee for us.",
      },
      {
        targetText: "我們一邊品嚐咖啡，一邊分享這週的生活心得。我想把生活中的美好瞬間都記錄下來，放慢腳步感受城市的溫度。",
        translation: "While savoring our coffee, we shared our insights from the week. I want to record all the beautiful moments in life and slow down to appreciate the city's warmth.",
      },
    ],
    targetWordsUsed: ["是 (shì)", "有 (yǒu)", "把 (bǎ) 字句", "雖然...但是... (suīrán... dànshì...)", "想 (xiǎng)"],
    summary: "Exploring the artistic alleys of Chifeng Street in Taipei, savoring local Alishan pour-over coffee, and embracing mindful slow living.",
    followUpQuestions: [
      {
        id: "q-zh-f1",
        questionText: "作者和朋友在赤峰街做了什麼？喝了什麼咖啡？",
        questionTranslation: "What did the author and friend do on Chifeng Street, and what coffee did they drink?",
        focusGrammarOrConcept: "Simultaneous action 一邊...一邊... and location markers",
        suggestedAnswerHint: "Mention exploring the alley café and drinking Alishan pour-over coffee.",
      },
    ],
    createdAt: new Date().toISOString(),
  },
  nan: {
    id: "article-nan-default",
    title: "透早的傳統菜市仔與人情味",
    titleTranslation: "Early Morning Traditional Market & Warm Hospitality",
    topic: "Taiwanese Culture & Local Life",
    cefrLevel: "Intermediate / 臺灣話日常",
    targetLanguage: "Taiwanese Hokkien",
    knownLanguage: "Traditional Chinese",
    targetLanguageCode: "nan",
    knownLanguageCode: "zh-TW",
    content: `今仔日透早，阿母𤆬我去巷仔口的傳統菜市仔買菜。菜市仔內底誠鬧熱，逐家攏咧認真做生理。

賣菜的阿伯看到阮，真親切噉問：「食飽未？今仔日的青菜有影鮮甜喔！」阿母笑微微應講：「有影讚，幫我包兩斤！」

行到巷仔尾，阿母閣買了燒烙的肉包。人潮真濟，阿母講：「歹勢借過一下！」逐家攏相借問，這就是臺灣最溫暖的人情味。`,
    paragraphs: [
      {
        targetText: "今仔日透早，阿母𤆬我去巷仔口的傳統菜市仔買菜。菜市仔內底誠鬧熱，逐家攏咧認真做生理。",
        translation: "今天大清早，媽媽帶我去巷口的傳統菜市場買菜。菜市場裡面非常熱鬧，大家都在認真做生意。(Early this morning, mom took me to the traditional morning market to buy groceries. The market was bustling with people doing business.)",
      },
      {
        targetText: "賣菜的阿伯看到阮，真親切噉問：「食飽未？今仔日的青菜有影鮮甜喔！」阿母笑微微應講：「有影讚，幫我包兩斤！」",
        translation: "賣菜的阿伯看到我們，很親切地問：「吃飽沒？今天的蔬菜真的很鮮甜喔！」媽媽微笑回答：「真的很讚，幫我包兩斤！」(The vegetable vendor saw us and warmly asked: 'Have you eaten? Today's greens are truly fresh and sweet!' Mom smiled and replied: 'Truly awesome, please pack two catties for me!')",
      },
      {
        targetText: "行到巷仔尾，阿母閣買了燒烙的肉包。人潮真濟，阿母講：「歹勢借過一下！」逐家攏相借問，這就是臺灣最溫暖的人情味。",
        translation: "走到巷子底，媽媽又買了熱騰騰的肉包。人潮很多，媽媽說：「不好意思借過一下！」大家都互相問候關心，這就是臺灣最溫暖的人情味。(Walking to the end of the alley, mom also bought steaming hot meat buns. It was crowded, so mom said: 'Excuse me, please let me pass!' Everyone greeted each other warmly—this is Taiwan's most touching warmth and hospitality.)",
      },
    ],
    targetWordsUsed: ["有影 (ū-iáⁿ)", "歹勢 (pháinn-sè)", "食飽未 (tsia̍h-pá--buē)", "敢 (kám) 問句結構", "逐家 (ta̍k-ke)"],
    summary: "Experiencing the lively warmth and native Taiwanese expressions in a bustling morning market with mom.",
    followUpQuestions: [
      {
        id: "q-nan-f1",
        questionText: "賣菜的阿伯怎樣問候阿母？阿母買了啥物？",
        questionTranslation: "How did the vegetable seller greet mom, and what did mom buy?",
        focusGrammarOrConcept: "Common greeting 食飽未 and quantity expression 兩斤",
        suggestedAnswerHint: "Mention the greeting '食飽未?' and buying 2 catties of vegetables and hot meat buns.",
      },
    ],
    createdAt: new Date().toISOString(),
  },
};
