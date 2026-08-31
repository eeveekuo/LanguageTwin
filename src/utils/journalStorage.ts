import { JournalEntry, SupportedLanguage } from "../types";

const STORAGE_KEY_JOURNAL = "frequency_srs_journal_entries_v1";

/**
 * Starter sample journal entries tailored to each specific language pair
 */
export function getStarterJournalEntries(
  targetLang: SupportedLanguage,
  knownLang: SupportedLanguage
): JournalEntry[] {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const isKnownChinese = knownLang.code === "zh-TW" || knownLang.code === "zh";

  // ==========================================
  // KOREAN (ko) TARGET
  // ==========================================
  if (targetLang.code === "ko") {
    if (isKnownChinese) {
      return [
        {
          id: "entry-sample-ko-1",
          title: "[Example Entry] 오늘 아침의 커피와 산책 (早晨的咖啡與散步)",
          content:
            "오늘 아침에는 날씨가 정말 맑고 상쾌했어요. 집 근처 카페에 가서 따뜻한 아메리카노와 베이글을 주문했습니다. 조용한 음악을 들으면서 오늘 할 일을 정리하니까 마음이 아주 편안해졌어요. 오후에는 공원에서 가볍게 산책할 계획이에요.",
          date: today,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          targetLangCode: "ko",
          targetLangName: "Korean",
          knownLangCode: knownLang.code,
          knownLangName: knownLang.name,
          tags: ["daily-life", "coffee", "morning"],
          wordCount: 29,
          characterCount: 142,
          promptTopic: "Describe a peaceful moment in your morning routine",
          mood: "happy",
          emoji: "☕",
          isFavorite: false,
          isExample: true,
          correctionResult: {
            overallScore: 98,
            estimatedCEFR: "B1",
            fluencyRating: "fluent",
            summaryFeedback:
              "韓語文筆非常自然且文法結構精確！正確使用了非正式敬語（해요體）與連接詞尾「-(으)면서」，時態與副詞搭配完美。",
            correctedText:
              "오늘 아침에는 날씨가 정말 맑고 상쾌했어요. 집 근처 카페에 가서 따뜻한 아메리카노와 베이글을 주문했습니다. 조용한 음악을 들으면서 오늘 할 일을 정리하니까 마음이 아주 편안해졌어요. 오후에는 공원에서 가볍게 산책할 계획이에요.",
            translatedText:
              "今天早上天氣非常晴朗清爽。我去了家附近的咖啡廳，點了一杯熱美式和貝果。一邊聽著輕柔的音樂一邊整理今天要做的事，心情變得非常放鬆。下午打算去公園散步。",
            grammarScore: 99,
            vocabularyScore: 97,
            naturalnessScore: 98,
            errors: [],
            positiveHighlights: [
              "自然使用連接詞尾「-(으)면서」表達同時進行的動作。",
              "正確使用形容詞變化「상쾌했어요」與狀態轉變「편안해졌어요」。",
              "未來計劃句型「-(으)ㄹ 계획이에요」運用恰當。"
            ],
            naturalPhrasings: [
              {
                originalExcerpt: "마음이 아주 편안해졌어요",
                suggestedAlternative: "마음이 한결 여유로워졌어요",
                explanation: "使用「한결 여유로워지다」能呈現更加從容、有層次的放鬆心境。"
              }
            ],
            extractedVocabulary: [
              {
                word: "상쾌하다",
                translation: "清爽的、舒暢的 (refreshing)",
                partOfSpeech: "adjective",
                phonetic: "[sang-kwae-ha-da]",
                exampleSentence: "아침 공기가 정말 상쾌해요."
              },
              {
                word: "편안해지다",
                translation: "變得舒適、平靜 (to become peaceful)",
                partOfSpeech: "verb",
                phonetic: "[pyeon-an-hae-ji-da]",
                exampleSentence: "음악을 들으니 마음이 편안해져요."
              }
            ],
            suggestedTags: ["daily-life", "coffee", "morning"],
            suggestedEmoji: "☕",
            suggestedMood: "relaxed",
            checkedAt: new Date().toISOString(),
          }
        },
        {
          id: "entry-sample-ko-2",
          title: "[Example Entry] 한국어를 배우는 나의 목표 (學習韓語的目標)",
          content:
            "저는 한국 문화와 드라마를 좋아해서 한국어를 배우기 시작했습니다. 매일 20분씩 새로운 단어와 문장 구조를 꾸준히 연습하고 있어요. 나중에 한국으로 여행 가서 현지 사람들과 자연스럽게 대화하고 싶습니다.",
          date: yesterday,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          targetLangCode: "ko",
          targetLangName: "Korean",
          knownLangCode: knownLang.code,
          knownLangName: knownLang.name,
          tags: ["goals", "motivation", "study"],
          wordCount: 26,
          characterCount: 139,
          promptTopic: "Why are you learning your target language?",
          mood: "motivated",
          emoji: "🚀",
          isFavorite: false,
          isExample: true,
          correctionResult: {
            overallScore: 96,
            estimatedCEFR: "A2",
            fluencyRating: "intermediate",
            summaryFeedback:
              "目標表達非常清晰明瞭！正確使用原因連接詞「-아서/어서」與願望句型「-고 싶습니다」。",
            correctedText:
              "저는 한국 문화와 드라마를 좋아해서 한국어를 배우기 시작했습니다. 매일 20분씩 새로운 단어와 문장 구조를 꾸준히 연습하고 있어요. 나중에 한국으로 여행 가서 현지 사람들과 자연스럽게 대화하고 싶습니다.",
            translatedText:
              "因為喜歡韓國文化和韓劇，所以我開始學習韓語。每天堅持練習20分鐘的新單詞和句型結構。希望以後去韓國旅遊時能和當地人自然地交流。",
            grammarScore: 97,
            vocabularyScore: 95,
            naturalnessScore: 96,
            errors: [],
            positiveHighlights: [
              "副詞「꾸준히 (持之以恆)」與進行式「-고 있어요」完美搭配。",
              "願望句型「-고 싶습니다」表達得體。"
            ],
            naturalPhrasings: [],
            extractedVocabulary: [
              {
                word: "꾸준히",
                translation: "堅持不懈地、持續地 (steadily)",
                partOfSpeech: "adverb",
                phonetic: "[kku-jun-hi]",
                exampleSentence: "매일 꾸준히 운동하고 있어요."
              },
              {
                word: "현지 사람",
                translation: "當地人 (local people)",
                partOfSpeech: "noun",
                phonetic: "[hyeon-ji sa-ram]",
                exampleSentence: "여행지에서 친절한 현지 사람을 만났어요."
              }
            ],
            suggestedTags: ["goals", "motivation", "study"],
            suggestedEmoji: "🚀",
            suggestedMood: "motivated",
            checkedAt: new Date(Date.now() - 86400000).toISOString(),
          }
        }
      ];
    }

    // Korean + English pair
    return [
      {
        id: "entry-sample-ko-1",
        title: "[Example Entry] A Morning Walk & Coffee in Seoul",
        content:
          "오늘 아침에는 날씨가 정말 맑고 상쾌했어요. 집 근처 카페에 가서 따뜻한 아메리카노와 베이글을 주문했습니다. 조용한 음악을 들으면서 오늘 할 일을 정리하니까 마음이 아주 편안해졌어요. 오후에는 공원에서 가볍게 산책할 계획이에요.",
        date: today,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        targetLangCode: "ko",
        targetLangName: "Korean",
        knownLangCode: "en",
        knownLangName: "English",
        tags: ["daily-life", "coffee", "morning"],
        wordCount: 29,
        characterCount: 142,
        promptTopic: "Describe a peaceful moment in your morning routine",
        mood: "happy",
        emoji: "☕",
        isFavorite: false,
        isExample: true,
        correctionResult: {
          overallScore: 98,
          estimatedCEFR: "B1",
          fluencyRating: "fluent",
          summaryFeedback:
            "Excellent and natural Korean writing! Great balance of polite verb endings (-았/었어요, -았습니다) and simultaneous action connective -(으)면서.",
          correctedText:
            "오늘 아침에는 날씨가 정말 맑고 상쾌했어요. 집 근처 카페에 가서 따뜻한 아메리카노와 베이글을 주문했습니다. 조용한 음악을 들으면서 오늘 할 일을 정리하니까 마음이 아주 편안해졌어요. 오후에는 공원에서 가볍게 산책할 계획이에요.",
          translatedText:
            "This morning the weather was really clear and refreshing. I went to a cafe near my house and ordered a warm americano and bagel. While listening to quiet music and organizing my tasks for today, my mind felt very peaceful. In the afternoon, I plan to take a light walk in the park.",
          grammarScore: 99,
          vocabularyScore: 97,
          naturalnessScore: 98,
          errors: [],
          positiveHighlights: [
            "Natural use of connective suffix -(으)면서 for simultaneous actions.",
            "Accurate state-change construction with -아/어지다 (편안해졌어요).",
            "Appropriate future intention pattern -(으)ㄹ 계획이에요."
          ],
          naturalPhrasings: [
            {
              originalExcerpt: "마음이 아주 편안해졌어요",
              suggestedAlternative: "마음이 한결 여유로워졌어요",
              explanation: "Using '한결 여유로워지다' adds a sophisticated touch of peaceful relaxation."
            }
          ],
          extractedVocabulary: [
            {
              word: "상쾌하다",
              translation: "refreshing, brisk",
              partOfSpeech: "adjective",
              phonetic: "[sang-kwae-ha-da]",
              exampleSentence: "아침 공기가 정말 상쾌해요."
            },
            {
              word: "편안해지다",
              translation: "to become comfortable / peaceful",
              partOfSpeech: "verb",
              phonetic: "[pyeon-an-hae-ji-da]",
              exampleSentence: "음악을 들으니 마음이 편안해져요."
            }
          ],
          suggestedTags: ["daily-life", "coffee", "morning"],
          suggestedEmoji: "☕",
          suggestedMood: "relaxed",
          checkedAt: new Date().toISOString(),
        }
      },
      {
        id: "entry-sample-ko-2",
        title: "[Example Entry] My Korean Language Learning Journey",
        content:
          "저는 한국 문화와 드라마를 좋아해서 한국어를 배우기 시작했습니다. 매일 20분씩 새로운 단어와 문장 구조를 꾸준히 연습하고 있어요. 나중에 한국으로 여행 가서 현지 사람들과 자연스럽게 대화하고 싶습니다.",
        date: yesterday,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        targetLangCode: "ko",
        targetLangName: "Korean",
        knownLangCode: "en",
        knownLangName: "English",
        tags: ["goals", "motivation", "study"],
        wordCount: 26,
        characterCount: 139,
        promptTopic: "Why are you learning your target language?",
        mood: "motivated",
        emoji: "🚀",
        isFavorite: false,
        isExample: true,
        correctionResult: {
          overallScore: 96,
          estimatedCEFR: "A2",
          fluencyRating: "intermediate",
          summaryFeedback:
            "Very clear statement of your language motivation and goals. Proper use of cause particle -아서/어서 and ambition ending -고 싶습니다.",
          correctedText:
            "저는 한국 문화와 드라마를 좋아해서 한국어를 배우기 시작했습니다. 매일 20분씩 새로운 단어와 문장 구조를 꾸준히 연습하고 있어요. 나중에 한국으로 여행 가서 현지 사람들과 자연스럽게 대화하고 싶습니다.",
          translatedText:
            "I started learning Korean because I like Korean culture and dramas. Every day for 20 minutes, I steadily practice new vocabulary and sentence structures. Later, I want to travel to Korea and talk naturally with local people.",
          grammarScore: 97,
          vocabularyScore: 95,
          naturalnessScore: 96,
          errors: [],
          positiveHighlights: [
            "Good collocation of adverb '꾸준히' (consistently) with progressive '-고 있어요'.",
            "Clear expressing of future travel goals."
          ],
          naturalPhrasings: [],
          extractedVocabulary: [
            {
              word: "꾸준히",
              translation: "steadily, consistently",
              partOfSpeech: "adverb",
              phonetic: "[kku-jun-hi]",
              exampleSentence: "매일 꾸준히 운동하고 있어요."
            },
            {
              word: "현지 사람",
              translation: "local person / locals",
              partOfSpeech: "noun",
              phonetic: "[hyeon-ji sa-ram]",
              exampleSentence: "여행지에서 친절한 현지 사람을 만났어요."
            }
          ],
          suggestedTags: ["goals", "motivation", "study"],
          suggestedEmoji: "🚀",
          suggestedMood: "motivated",
          checkedAt: new Date(Date.now() - 86400000).toISOString(),
        }
      }
    ];
  }

  // ==========================================
  // JAPANESE (ja) TARGET
  // ==========================================
  if (targetLang.code === "ja") {
    const isEn = knownLang.code === "en";
    return [
      {
        id: "entry-sample-ja-1",
        title: isEn ? "[Example Entry] Morning Walk & Cafe Notes" : "[Example Entry] 早晨的散步與咖啡日記",
        content:
          "今朝はとても良い天気で、空気が澄んでいて気持ちが良かったです。近所のカフェに行って、ホットコーヒーと焼きたてのパンを注文しました。静かな音楽を聴きながら今日の一日を計画しました。",
        date: today,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        targetLangCode: "ja",
        targetLangName: "Japanese",
        knownLangCode: knownLang.code,
        knownLangName: knownLang.name,
        tags: ["daily-life", "morning", "coffee"],
        wordCount: 22,
        characterCount: 88,
        promptTopic: "Describe a peaceful moment in your morning routine",
        mood: "relaxed",
        emoji: "☕",
        isFavorite: false,
        isExample: true,
        correctionResult: {
          overallScore: 98,
          estimatedCEFR: "B1",
          fluencyRating: "fluent",
          summaryFeedback: isEn
            ? "Very natural and descriptive Japanese prose! Proper use of te-form conjunctions, polite desu/masu endings, and temporal particle nagara."
            : "日語文筆非常自然道地！正確使用了「〜ながら」伴隨動作與「〜て」接續助詞。",
          correctedText:
            "今朝はとても良い天気で、空気が澄んでいて気持ちが良かったです。近所のカフェに行って、ホットコーヒーと焼きたてのパンを注文しました。静かな音楽を聴きながら今日の一日を計画しました。",
          translatedText: isEn
            ? "This morning the weather was very nice, and the air was clear and refreshing. I went to a neighborhood cafe and ordered hot coffee and freshly baked bread. While listening to quiet music, I planned my day."
            : "今天早上天氣非常好，空氣清新讓人心情舒暢。去了家附近的咖啡廳，點了熱咖啡和剛出爐的麵包。一邊聽著輕柔的音樂，一邊規劃今天的一天。",
          grammarScore: 99,
          vocabularyScore: 97,
          naturalnessScore: 98,
          errors: [],
          positiveHighlights: [
            "Natural use of 〜ながら for concurrent actions.",
            "Accurate descriptive compound 焼きたて (freshly baked)."
          ],
          naturalPhrasings: [],
          extractedVocabulary: [
            {
              word: "澄む (すむ)",
              translation: isEn ? "to become clear / serene" : "清澈、澄澈",
              partOfSpeech: "verb",
              phonetic: "[sumu]",
              exampleSentence: "秋の空は高く澄んでいます。"
            },
            {
              word: "焼きたて (やきたて)",
              translation: isEn ? "freshly baked" : "剛出爐的、剛烤好的",
              partOfSpeech: "noun",
              phonetic: "[yakitate]",
              exampleSentence: "焼きたてのパンはとても美味しいです。"
            }
          ],
          suggestedTags: ["daily-life", "morning", "coffee"],
          suggestedEmoji: "☕",
          suggestedMood: "relaxed",
          checkedAt: new Date().toISOString(),
        }
      }
    ];
  }

  // ==========================================
  // TRADITIONAL CHINESE (zh-TW / zh) TARGET
  // ==========================================
  if (targetLang.code === "zh-TW" || targetLang.code === "zh") {
    const isEn = knownLang.code === "en";
    return [
      {
        id: "entry-sample-zh-1",
        title: isEn ? "[Example Entry] Morning Coffee & Reflection" : "[Example Entry] 早晨的咖啡時光",
        content:
          "今天早上下了一點小雨，天氣很涼爽。我去了家裡附近常去的咖啡廳，點了一杯熱拿鐵和肉桂捲。一邊聽音樂一邊寫筆記，感覺非常放鬆。",
        date: today,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        targetLangCode: targetLang.code,
        targetLangName: targetLang.name,
        knownLangCode: knownLang.code,
        knownLangName: knownLang.name,
        tags: ["daily-life", "coffee", "morning"],
        wordCount: 32,
        characterCount: 66,
        promptTopic: "Describe your favorite coffee shop or morning routine",
        mood: "reflective",
        emoji: "☕",
        isFavorite: false,
        isExample: true,
        correctionResult: {
          overallScore: 98,
          estimatedCEFR: "B2",
          fluencyRating: "fluent",
          summaryFeedback: isEn
            ? "Natural, elegant descriptive writing in Traditional Chinese. Perfect use of parallel structures ('一邊……一邊……') and authentic vocabulary."
            : "文筆非常自然且意境優美！正確使用了「一邊……一邊……」並列結構，量詞與語法使用完全道地。",
          correctedText:
            "今天早上下了一點小雨，天氣很涼爽。我去了家裡附近常去的咖啡廳，點了一杯熱拿鐵和肉桂捲。一邊聽音樂一邊寫筆記，感覺非常放鬆。",
          translatedText: isEn
            ? "It drizzled a little this morning, and the weather was quite cool and pleasant. I went to my favorite cafe near home, ordered a hot latte and a cinnamon roll. Listening to music while writing notes felt very relaxing."
            : "今天早上下了一點小雨，天氣很涼爽。我去了家裡附近常去的咖啡廳，點了一杯熱拿鐵和肉桂捲。一邊聽音樂一邊寫筆記，感覺非常放鬆。",
          grammarScore: 99,
          vocabularyScore: 97,
          naturalnessScore: 98,
          errors: [],
          positiveHighlights: [
            "自然使用「常去的咖啡廳」修飾名詞。",
            "精準使用「一邊聽音樂一邊寫筆記」表達同時進行的動作。"
          ],
          naturalPhrasings: [],
          extractedVocabulary: [
            {
              word: "涼爽",
              translation: isEn ? "cool and pleasant" : "涼爽清涼",
              partOfSpeech: "adjective",
              phonetic: "ㄌㄧㄤˊ ㄕㄨㄤˇ (liángshuǎng)",
              exampleSentence: "秋天的天氣格外涼爽。"
            },
            {
              word: "放鬆",
              translation: isEn ? "to relax / relaxing" : "放鬆、舒緩",
              partOfSpeech: "verb/adj",
              phonetic: "ㄈㄤˋ ㄙㄨㄥ (fàngsōng)",
              exampleSentence: "聽音樂能讓人感到放鬆。"
            }
          ],
          suggestedTags: ["daily-life", "coffee", "morning"],
          suggestedEmoji: "☕",
          suggestedMood: "relaxed",
          checkedAt: new Date().toISOString(),
        }
      }
    ];
  }

  // ==========================================
  // TAIWANESE HOKKIEN (nan) TARGET
  // ==========================================
  if (targetLang.code === "nan") {
    const isEn = knownLang.code === "en";
    return [
      {
        id: "entry-sample-nan-1",
        title: isEn ? "[Example Entry] Morning Breakfast & Coffee (Kin-á-ji̍t ê tsá-tǹg)" : "[Example Entry] 今仔日的早頓佮咖啡",
        content:
          "今仔日早起天氣真好，出日頭。我來到厝邊的咖啡廳，叫一杯熱咖啡佮包仔。邊聽音樂邊寫字，心情感覺真輕鬆。",
        date: today,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        targetLangCode: "nan",
        targetLangName: "Taiwanese Hokkien",
        knownLangCode: knownLang.code,
        knownLangName: knownLang.name,
        tags: ["daily-life", "taiwanese", "morning"],
        wordCount: 22,
        characterCount: 52,
        promptTopic: "Describe your morning in Taiwanese",
        mood: "happy",
        emoji: "☕",
        isFavorite: false,
        isExample: true,
        correctionResult: {
          overallScore: 97,
          estimatedCEFR: "B1",
          fluencyRating: "fluent",
          summaryFeedback: isEn
            ? "Authentic Han-character Taiwanese phrasing with natural colloquial terms (厝邊, 出日頭, 叫)."
            : "道地的臺語漢字書寫，詞彙「厝邊 (鄰居)」、「出日頭 (出太陽)」、「叫一杯 (點一杯)」運用得宜！",
          correctedText:
            "今仔日早起天氣真好，出日頭。我來到厝邊的咖啡廳，叫一杯熱咖啡佮包仔。邊聽音樂邊寫字，心情感覺真輕鬆。",
          translatedText: isEn
            ? "The weather was great this morning with bright sunshine. I went to the cafe near my house, ordered a hot coffee and a bun. Listening to music while writing made me feel very relaxed."
            : "今天早上天氣很好，出太陽。我來到家附近的咖啡廳，點了一杯熱咖啡和包子。一邊聽音樂一邊寫字，心情感覺很輕鬆。",
          grammarScore: 98,
          vocabularyScore: 96,
          naturalnessScore: 97,
          errors: [],
          positiveHighlights: [
            "正確使用臺語慣用連接詞「佮 (kap)」與指示副詞「今仔日 (kin-á-ji̍t)」。"
          ],
          naturalPhrasings: [],
          extractedVocabulary: [
            {
              word: "厝邊 (tshù-pinn)",
              translation: isEn ? "neighbor / nearby" : "鄰居、家附近",
              partOfSpeech: "noun",
              phonetic: "tshù-pinn",
              exampleSentence: "厝邊的阿伯真親切。"
            },
            {
              word: "出日頭 (tshut-ji̍t-thâu)",
              translation: isEn ? "sunny / sunshine comes out" : "出太陽",
              partOfSpeech: "phrase",
              phonetic: "tshut-ji̍t-thâu",
              exampleSentence: "今仔日出日頭，真適合出去行行。"
            }
          ],
          suggestedTags: ["daily-life", "taiwanese", "morning"],
          suggestedEmoji: "☕",
          suggestedMood: "relaxed",
          checkedAt: new Date().toISOString(),
        }
      }
    ];
  }

  // ==========================================
  // SPANISH (es) TARGET
  // ==========================================
  if (targetLang.code === "es") {
    const isEn = knownLang.code === "en";
    return [
      {
        id: "entry-sample-es-1",
        title: isEn ? "[Example Entry] A Walk in the City Park" : "[Example Entry] 城市公園漫步日記",
        content:
          "Hoy hace un día muy bonito. Por la mañana caminé por el parque con mi perro. Había muchas flores coloridas y la gente estaba tomando café al sol. Me gusta mucho la tranquilidad de los domingos.",
        date: today,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        targetLangCode: "es",
        targetLangName: "Spanish",
        knownLangCode: knownLang.code,
        knownLangName: knownLang.name,
        tags: ["daily-life", "nature", "weekend"],
        wordCount: 39,
        characterCount: 226,
        promptTopic: "Describe a peaceful moment in your day",
        mood: "happy",
        emoji: "🌿",
        isFavorite: false,
        isExample: true,
        correctionResult: {
          overallScore: 95,
          estimatedCEFR: "B1",
          fluencyRating: "fluent",
          summaryFeedback: isEn
            ? "Excellent and natural descriptive writing in Spanish! The sentence flow, past tense forms ('caminé', 'había', 'estaba'), and vocabulary are very accurate."
            : "西班牙語描寫生動自然！過去時態（caminé, había, estaba）與形容詞陰陽性搭配非常精準。",
          correctedText:
            "Hoy hace un día muy bonito. Por la mañana caminé por el parque con mi perro. Había muchas flores coloridas y la gente estaba tomando café al sol. Me gusta mucho la tranquilidad de los domingos.",
          translatedText: isEn
            ? "Today is a very beautiful day. In the morning I walked through the park with my dog. There were many colorful flowers and people were having coffee in the sun. I really like the peacefulness of Sundays."
            : "今天天氣非常好。早上我和狗狗在公園裡散步。那裡有許多繽紛的花朵，人們在陽光下喝咖啡。我很喜歡星期天的這份寧靜。",
          grammarScore: 96,
          vocabularyScore: 94,
          naturalnessScore: 95,
          errors: [],
          positiveHighlights: [
            "Correct use of the weather idiom 'hace un día muy bonito'.",
            "Great agreement in 'flores coloridas' (feminine plural).",
            "Natural use of past continuous 'estaba tomando café'."
          ],
          naturalPhrasings: [
            {
              originalExcerpt: "Me gusta mucho la tranquilidad",
              suggestedAlternative: "Disfruto mucho de la tranquilidad",
              explanation: "Using 'disfrutar de' adds sophisticated stylistic variety."
            }
          ],
          extractedVocabulary: [
            {
              word: "tranquilidad",
              translation: isEn ? "peacefulness, tranquility" : "寧靜、平靜",
              partOfSpeech: "noun",
              phonetic: "/tɾaŋ.ki.liˈðað/",
              exampleSentence: "Disfruto de la tranquilidad del parque."
            },
            {
              word: "coloridas",
              translation: isEn ? "colorful (fem. pl.)" : "多彩的、繽紛的",
              partOfSpeech: "adjective",
              phonetic: "/ko.loˈɾi.ðas/",
              exampleSentence: "Las flores coloridas adornan el jardín."
            }
          ],
          suggestedTags: ["daily-life", "nature", "weekend"],
          suggestedEmoji: "🌿",
          suggestedMood: "relaxed",
          checkedAt: new Date().toISOString(),
        }
      },
      {
        id: "entry-sample-es-2",
        title: isEn ? "[Example Entry] My Learning Goals in Spanish" : "[Example Entry] 我的西語學習目標",
        content:
          "Quiero aprender español porque quiero viajar a México y hablar con la gente local. Cada día practico vocabulario y gramática durante veinte minutos.",
        date: yesterday,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        targetLangCode: "es",
        targetLangName: "Spanish",
        knownLangCode: knownLang.code,
        knownLangName: knownLang.name,
        tags: ["goals", "motivation", "study"],
        wordCount: 26,
        characterCount: 161,
        promptTopic: "Why are you learning your target language?",
        mood: "motivated",
        emoji: "🚀",
        isFavorite: false,
        isExample: true,
        correctionResult: {
          overallScore: 92,
          estimatedCEFR: "A2",
          fluencyRating: "intermediate",
          summaryFeedback: isEn
            ? "Very clear statement of your language goals. The infinitive structures with 'querer' ('quiero aprender', 'quiero viajar') are used properly."
            : "目標表達清晰！動詞不定詞結構（quiero aprender, quiero viajar）使用正確。",
          correctedText:
            "Quiero aprender español porque quiero viajar a México y hablar con la gente local. Cada día practico vocabulario y gramática durante veinte minutos.",
          translatedText: isEn
            ? "I want to learn Spanish because I want to travel to Mexico and speak with local people. Every day I practice vocabulary and grammar for twenty minutes."
            : "我想學西班牙語，因為我想去墨西哥旅遊並與當地人交流。每天我都會練習二十分鐘的單字與文法。",
          grammarScore: 94,
          vocabularyScore: 90,
          naturalnessScore: 92,
          errors: [],
          positiveHighlights: [
            "Smooth transition with 'porque' and appropriate preposition 'a México'.",
            "Consistent daily habit expression 'cada día practico'."
          ],
          naturalPhrasings: [],
          extractedVocabulary: [
            {
              word: "gente local",
              translation: isEn ? "local people" : "當地人",
              partOfSpeech: "phrase",
              phonetic: "/ˈxen.te loˈkal/",
              exampleSentence: "Hablé con la gente local para pedir indicaciones."
            }
          ],
          suggestedTags: ["goals", "motivation", "study"],
          suggestedEmoji: "🚀",
          suggestedMood: "motivated",
          checkedAt: new Date(Date.now() - 86400000).toISOString(),
        }
      }
    ];
  }

  // ==========================================
  // DYNAMIC GENERIC FALLBACK
  // ==========================================
  return [
    {
      id: `entry-sample-${targetLang.code}-1`,
      title: `[Example Entry] My First ${targetLang.name} Reflection`,
      content: `Today I am writing my journal entry in ${targetLang.name}. Writing daily thoughts helps connect active grammar and vocabulary into fluent expression.`,
      date: today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetLangCode: targetLang.code,
      targetLangName: targetLang.name,
      knownLangCode: knownLang.code,
      knownLangName: knownLang.name,
      tags: ["first-entry", "goals"],
      wordCount: 23,
      characterCount: 147,
      promptTopic: "First day writing in your language journal",
      mood: "motivated",
      emoji: "📝",
      isFavorite: false,
      isExample: true,
    }
  ];
}

/**
 * Load journal entries from LocalStorage, ensuring example entries match the current target language
 */
export function loadJournalEntriesFromLocal(
  targetLang?: SupportedLanguage,
  knownLang?: SupportedLanguage
): JournalEntry[] {
  if (typeof window === "undefined") return [];

  let savedEntries: JournalEntry[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JOURNAL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        savedEntries = parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to load journal entries from localStorage:", err);
  }

  // Separate user-authored entries from example entries
  const userEntries = savedEntries.filter(
    (e) => !e.isExample && !e.id?.startsWith("entry-sample-") && !e.title?.includes("[Example")
  );

  if (!targetLang || !knownLang) {
    return userEntries.length > 0 ? userEntries : savedEntries;
  }

  // Filter example entries: only keep example entries that match current targetLangCode
  const relevantExamples = savedEntries.filter(
    (e) =>
      (e.isExample || e.id?.startsWith("entry-sample-") || e.title?.includes("[Example")) &&
      e.targetLangCode === targetLang.code
  );

  // If no matching starter entries exist for this language pair, create them
  const targetStarters =
    relevantExamples.length > 0
      ? relevantExamples
      : getStarterJournalEntries(targetLang, knownLang);

  // Combined list: active target language entries first (user + matching examples), then other user entries
  const currentLangUserEntries = userEntries.filter((e) => e.targetLangCode === targetLang.code);
  const otherLangUserEntries = userEntries.filter((e) => e.targetLangCode !== targetLang.code);

  const combined = [
    ...currentLangUserEntries,
    ...targetStarters,
    ...otherLangUserEntries,
  ];

  // Save the synchronized collection back to localStorage
  saveJournalEntriesToLocal(combined);

  return combined;
}

/**
 * Save journal entries to LocalStorage
 */
export function saveJournalEntriesToLocal(entries: JournalEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_JOURNAL, JSON.stringify(entries));
  } catch (err) {
    console.warn("Failed to save journal entries to localStorage:", err);
  }
}
