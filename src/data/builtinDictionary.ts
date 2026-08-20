export interface DictionaryEntry {
  targetItem: string;
  translation: string;
  partOfSpeech: string;
  phonetic?: string;
  definition: string;
  grammarNotes?: string;
  exampleSentence: {
    target: string;
    translation: string;
    phonetic?: string;
  };
}

// Built-in high-quality dictionary entries for instant offline or fallback translation
export const BUILTIN_DICTIONARY: Record<string, Record<string, DictionaryEntry>> = {
  korean: {
    소풍: {
      targetItem: "소풍",
      translation: "picnic, outing, excursion",
      partOfSpeech: "Noun",
      phonetic: "so-pung",
      definition: "An excursion or outing in the countryside, park, or outdoors, typically involving a packed lunch or snacks with friends/family.",
      grammarNotes: "'소풍' is a noun frequently used with verbs like '가다' (소풍을 가다 = to go on a picnic) or '오다'. Particles like '~을/를' attach to mark it as the object.",
      exampleSentence: {
        target: "주말에 날씨가 좋아서 친구들과 공원으로 소풍을 갔어요.",
        translation: "The weather was great over the weekend, so I went on a picnic to the park with friends.",
        phonetic: "Jumal-e nalssi-ga jo-a-seo chin-gu-deul-gwa gong-won-eu-ro so-pung-eul ga-sseo-yo.",
      },
    },
    친구: {
      targetItem: "친구",
      translation: "friend, companion",
      partOfSpeech: "Noun",
      phonetic: "chin-gu",
      definition: "A person whom one knows and with whom one has a bond of mutual affection.",
      grammarNotes: "Takes particles like '~와/과' (with a friend), '~에게' (to a friend), '~가/는' (subject/topic). In Korean culture, '친구' specifically refers to peers of the exact same age.",
      exampleSentence: {
        target: "오늘 오랜만에 친한 친구를 만났어요.",
        translation: "I met a close friend today for the first time in a long while.",
      },
    },
    공부: {
      targetItem: "공부하다",
      translation: "to study, learn",
      partOfSpeech: "Verb",
      phonetic: "gong-bu-ha-da",
      definition: "To acquire knowledge through systematic reading, practice, or schoolwork.",
      grammarNotes: "Combines Sino-Korean noun '공부' (study) with '하다' (to do). Inflects to 공부해요 (present polite), 공부했어요 (past), 공부할 거예요 (future).",
      exampleSentence: {
        target: "도서관에서 한국어를 열심히 공부해요.",
        translation: "I study Korean hard in the library.",
      },
    },
    학교: {
      targetItem: "학교",
      translation: "school",
      partOfSpeech: "Noun",
      phonetic: "hak-gyo",
      definition: "An educational institution where students learn.",
      grammarNotes: "Takes location particles '~에' (destination/existence) and '~에서' (location where an action takes place, e.g. 학교에서 공부하다).",
      exampleSentence: {
        target: "학교가 집에서 가까워요.",
        translation: "The school is close to my house.",
      },
    },
    날씨: {
      targetItem: "날씨",
      translation: "weather",
      partOfSpeech: "Noun",
      phonetic: "nal-ssi",
      definition: "The state of the atmosphere at a particular place and time.",
      grammarNotes: "Frequently paired with adjectives like 좋다 (좋아요 = good), 맑다 (맑아요 = clear), 흐리다 (흐려요 = cloudy).",
      exampleSentence: {
        target: "오늘 날씨가 정말 따뜻해요.",
        translation: "The weather is really warm today.",
      },
    },
    가족: {
      targetItem: "가족",
      translation: "family",
      partOfSpeech: "Noun",
      phonetic: "ga-jok",
      definition: "A group consisting of parents and children living together in a household.",
      grammarNotes: "Nouns of association take '~들과' or '~과 함께' (together with family: 가족과 함께).",
      exampleSentence: {
        target: "주말에는 가족과 함께 시간을 보내요.",
        translation: "On weekends, I spend time together with my family.",
      },
    },
    음식: {
      targetItem: "음식",
      translation: "food, dish, cuisine",
      partOfSpeech: "Noun",
      phonetic: "eum-sik",
      definition: "Any nutritious substance that people or animals eat or drink.",
      grammarNotes: "Object particle '~을' attaches to mark the target of '만들다' (to make) or '먹다' (to eat).",
      exampleSentence: {
        target: "한국 음식은 매콤하고 맛있어요.",
        translation: "Korean food is spicy and delicious.",
      },
    },
    여행: {
      targetItem: "여행",
      translation: "travel, trip, journey",
      partOfSpeech: "Noun",
      phonetic: "yeo-haeng",
      definition: "The act of going from one place to another, usually over a considerable distance.",
      grammarNotes: "Pairs with '가다' (여행을 가다 = to go on a trip) and '하다' (여행하다 = to travel).",
      exampleSentence: {
        target: "다음 달에 제주도로 여행을 가요.",
        translation: "I am traveling to Jeju Island next month.",
      },
    },
    하다: {
      targetItem: "하다",
      translation: "to do, to make, to perform",
      partOfSpeech: "Verb",
      phonetic: "ha-da",
      definition: "The primary light verb in Korean used independently or attached to Sino-Korean nouns to form active verbs.",
      grammarNotes: "Irregular conjugation: Present polite is 해요 (never 하요), Formal is 합니다, Past is 했어요, Future is 할 거예요.",
      exampleSentence: {
        target: "매일 아침에 가벼운 운동을 해요.",
        translation: "I do light exercise every morning.",
      },
    },
  },
  spanish: {
    parque: {
      targetItem: "parque",
      translation: "park, public garden",
      partOfSpeech: "Masculine Noun",
      phonetic: "PAR-keh",
      definition: "A large public green area in a town used for recreation.",
      grammarNotes: "Masculine noun taking the definite article 'el parque' and preposition 'al' (a + el parque).",
      exampleSentence: {
        target: "Ayer fuimos a pasear al parque con amigos.",
        translation: "Yesterday we went for a walk in the park with friends.",
      },
    },
    amigo: {
      targetItem: "amigo",
      translation: "friend",
      partOfSpeech: "Noun",
      phonetic: "ah-MEE-goh",
      definition: "A person with whom one has a bond of mutual affection.",
      grammarNotes: "Agrees in gender and number: amigo (m.sg), amiga (f.sg), amigos (m.pl), amigas (f.pl).",
      exampleSentence: {
        target: "Mi mejor amigo vive en Barcelona.",
        translation: "My best friend lives in Barcelona.",
      },
    },
    tiempo: {
      targetItem: "tiempo",
      translation: "time / weather",
      partOfSpeech: "Masculine Noun",
      phonetic: "TYEHM-poh",
      definition: "Refers both to chronological duration ('hace mucho tiempo') and atmospheric weather conditions ('hace buen tiempo').",
      grammarNotes: "Always masculine 'el tiempo'. In meteorological expressions, pairs with the verb 'hacer' (hace buen tiempo = the weather is good).",
      exampleSentence: {
        target: "Hoy hace muy buen tiempo para salir a caminar.",
        translation: "Today the weather is very nice to go out for a walk.",
      },
    },
    hacer: {
      targetItem: "hacer",
      translation: "to do, to make",
      partOfSpeech: "Irregular Verb",
      phonetic: "ah-SEHR",
      definition: "To perform an action or construct/produce something.",
      grammarNotes: "Irregular present indicative: yo hago, tú haces, él hace. Preterite: yo hice, tú hiciste, él hizo.",
      exampleSentence: {
        target: "¿Qué planes tienes para hacer este fin de semana?",
        translation: "What plans do you have to do this weekend?",
      },
    },
  },
  japanese: {
    ピクニック: {
      targetItem: "ピクニック",
      translation: "picnic, outing",
      partOfSpeech: "Noun (Katakana loanword)",
      phonetic: "pikunikku",
      definition: "An excursion or outing where a meal is eaten outdoors.",
      grammarNotes: "Paired with 'に行く' (ピクニックに行く = to go on a picnic) or 'をする' (to have a picnic).",
      exampleSentence: {
        target: "天気がいいので、公園へピクニックに行きました。",
        translation: "Since the weather was good, I went on a picnic to the park.",
      },
    },
    友達: {
      targetItem: "友達",
      translation: "friend, companion",
      partOfSpeech: "Noun",
      phonetic: "tomodachi",
      definition: "A person with whom one has a close interpersonal relationship.",
      grammarNotes: "Often combined with particle と (友達と = with a friend) or に (友達に会う = to meet a friend).",
      exampleSentence: {
        target: "週末に友達と映画を見ました。",
        translation: "I watched a movie with my friend over the weekend.",
      },
    },
    する: {
      targetItem: "する",
      translation: "to do, perform",
      partOfSpeech: "Irregular Verb (Group 3)",
      phonetic: "suru",
      definition: "Primary irregular verb in Japanese. Combines with verbal nouns (e.g. 勉強する = to study).",
      grammarNotes: "Conjugates to します (polite present), しました (polite past), して (te-form), しない (negative).",
      exampleSentence: {
        target: "毎日日本語の勉強をします。",
        translation: "I study Japanese every day.",
      },
    },
  },
};

/**
 * Look up a word in the dictionary across languages
 */
export function lookupBuiltinDictionary(
  query: string,
  targetLangName: string
): DictionaryEntry | null {
  if (!query) return null;
  const clean = query.trim().toLowerCase();
  const langKey = targetLangName.toLowerCase();

  // Search by exact language or fall through matching languages
  for (const [lang, words] of Object.entries(BUILTIN_DICTIONARY)) {
    if (langKey.includes(lang) || lang.includes(langKey)) {
      // Check direct key match
      for (const [wordKey, entry] of Object.entries(words)) {
        if (
          wordKey.toLowerCase() === clean ||
          entry.targetItem.toLowerCase() === clean ||
          clean.includes(wordKey.toLowerCase()) ||
          wordKey.toLowerCase().includes(clean)
        ) {
          return entry;
        }
      }
    }
  }

  // Cross-language fallback check
  for (const words of Object.values(BUILTIN_DICTIONARY)) {
    for (const [wordKey, entry] of Object.entries(words)) {
      if (
        wordKey.toLowerCase() === clean ||
        entry.targetItem.toLowerCase() === clean ||
        clean.includes(wordKey.toLowerCase()) ||
        wordKey.toLowerCase().includes(clean)
      ) {
        return entry;
      }
    }
  }

  return null;
}
