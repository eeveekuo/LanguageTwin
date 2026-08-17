import { JournalEntry, SupportedLanguage } from "../types";

const STORAGE_KEY_JOURNAL = "frequency_srs_journal_entries_v1";

/**
 * Starter sample journal entries to illustrate capabilities for new learners
 */
export function getStarterJournalEntries(
  targetLang: SupportedLanguage,
  knownLang: SupportedLanguage
): JournalEntry[] {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (targetLang.code === "es") {
    return [
      {
        id: "entry-sample-es-1",
        title: "[Example Entry] Un paseo por el parque de la ciudad",
        content:
          "Hoy hace un día muy bonito. Por la mañana caminé por el parque con mi perro. Había muchas flores coloridas y la gente estaba tomando café al sol. Me gusta mucho la tranquilidad de los domingos.",
        date: today,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        targetLangCode: "es",
        targetLangName: "Spanish",
        knownLangCode: "en",
        knownLangName: "English",
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
          summaryFeedback:
            "Excellent and natural descriptive writing in Spanish! The sentence flow, past tense forms ('caminé', 'había', 'estaba'), and vocabulary are very accurate.",
          correctedText:
            "Hoy hace un día muy bonito. Por la mañana caminé por el parque con mi perro. Había muchas flores coloridas y la gente estaba tomando café al sol. Me gusta mucho la tranquilidad de los domingos.",
          translatedText:
            "Today is a very beautiful day. In the morning I walked through the park with my dog. There were many colorful flowers and people were having coffee in the sun. I really like the peacefulness of Sundays.",
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
              translation: "peacefulness, tranquility",
              partOfSpeech: "noun",
              phonetic: "/tɾaŋ.ki.liˈðað/",
              exampleSentence: "Disfruto de la tranquilidad del parque."
            },
            {
              word: "coloridas",
              translation: "colorful (fem. pl.)",
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
        title: "[Example Entry] Mis metas de aprendizaje",
        content:
          "Quiero aprender español porque quiero viajar a México y hablar con la gente local. Cada día practico vocabulario y gramática durante veinte minutos.",
        date: yesterday,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        targetLangCode: "es",
        targetLangName: "Spanish",
        knownLangCode: "en",
        knownLangName: "English",
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
          summaryFeedback:
            "Very clear statement of your language goals. The infinitive structures with 'querer' ('quiero aprender', 'quiero viajar') are used properly.",
          correctedText:
            "Quiero aprender español porque quiero viajar a México y hablar con la gente local. Cada día practico vocabulario y gramática durante veinte minutos.",
          translatedText:
            "I want to learn Spanish because I want to travel to Mexico and speak with local people. Every day I practice vocabulary and grammar for twenty minutes.",
          grammarScore: 94,
          vocabularyScore: 90,
          naturalnessScore: 92,
          errors: [],
          positiveHighlights: [
            "Smooth transition with 'porque' and appropriate preposition 'a México'.",
            "Consistent daily habit expression 'cada día practico'."
          ],
          naturalPhrasings: [
            {
              originalExcerpt: "porque quiero viajar... y hablar",
              suggestedAlternative: "para poder viajar a México y conversar con los lugareños",
              explanation: "Using 'para poder' avoids repeating 'quiero' twice in the same sentence."
            }
          ],
          extractedVocabulary: [
            {
              word: "gente local",
              translation: "local people",
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

  if (targetLang.code === "zh-TW" || targetLang.code === "zh") {
    return [
      {
        id: "entry-sample-zh-1",
        title: "[Example Entry] 早晨的咖啡時光",
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
          summaryFeedback:
            "文筆非常自然且意境優美！正確使用了「一邊……一邊……」並列結構，量詞與語法使用完全道地。",
          correctedText:
            "今天早上下了一點小雨，天氣很涼爽。我去了家裡附近常去的咖啡廳，點了一杯熱拿鐵和肉桂捲。一邊聽音樂一邊寫筆記，感覺非常放鬆。",
          translatedText:
            "It drizzled a little this morning, and the weather was quite cool and pleasant. I went to my usual cafe near my home, ordered a hot latte and a cinnamon roll. Listening to music while writing notes felt very relaxing.",
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
              translation: "cool and pleasant",
              partOfSpeech: "adjective",
              phonetic: "ㄌㄧㄤˊ ㄕㄨㄤˇ (liángshuǎng)",
              exampleSentence: "秋天的天氣格外涼爽。"
            },
            {
              word: "放鬆",
              translation: "to relax / relaxing",
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

  // Generic starter entry for other languages
  return [
    {
      id: "entry-sample-gen-1",
      title: `[Example Entry] My First ${targetLang.name} Journal Entry`,
      content: `Today I am writing my thoughts in ${targetLang.name}. Practicing writing daily is a powerful way to build active grammar and vocabulary confidence.`,
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
 * Load journal entries from LocalStorage
 */
export function loadJournalEntriesFromLocal(
  targetLang?: SupportedLanguage,
  knownLang?: SupportedLanguage
): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JOURNAL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure sample entries are labeled as example
        return parsed.map((entry: JournalEntry) => {
          if (entry.id?.startsWith("entry-sample-") || entry.title?.includes("[Example")) {
            return { ...entry, isExample: true };
          }
          return entry;
        });
      }
    }
  } catch (err) {
    console.warn("Failed to load journal entries from localStorage:", err);
  }

  if (targetLang && knownLang) {
    const starters = getStarterJournalEntries(targetLang, knownLang);
    saveJournalEntriesToLocal(starters);
    return starters;
  }
  return [];
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
