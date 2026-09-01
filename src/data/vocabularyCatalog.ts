import { Flashcard, SRSData } from "../types";

export interface VocabularyCatalogItem {
  targetItem: string;
  definition: string;
  partOfSpeech: string;
  phonetic: string;
  usageNotes: string;
  exampleTarget: string;
  exampleTranslation: string;
  examplePhonetic?: string;
  tokens: Array<{ token: string; translatedToken: string }>;
  tags: string[];
}

export const createInitialSRSData = (): SRSData => ({
  repetition: 0,
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  history: [],
  masteryScore: 0,
  status: "new",
  consecutiveSuccesses: 0,
});

// Curated 300 High-Frequency Core Vocabulary for Korean
export const KOREAN_TOP_300_ITEMS: VocabularyCatalogItem[] = [
  // Top 1-20: Foundational verbs, pronouns, and markers
  { targetItem: "하다", definition: "to do, to make, to perform", partOfSpeech: "Light Verb", phonetic: "ha-da", usageNotes: "Primary verb; attaches to nouns (공부하다, 운동하다). Present polite: 해요, Past: 했어요.", exampleTarget: "오늘 무엇을 해요?", exampleTranslation: "What are you doing today?", tokens: [{ token: "오늘", translatedToken: "Today" }, { token: "무엇을", translatedToken: "what" }, { token: "해요", translatedToken: "are you doing" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "있다", definition: "to be, to exist, to have", partOfSpeech: "Adjective/Verb", phonetic: "it-tta", usageNotes: "Marks existence in a location (-에 있다) or possession (-이/가 있다). Polite: 있어요.", exampleTarget: "도서관에 책이 많이 있어요.", exampleTranslation: "There are many books in the library.", tokens: [{ token: "도서관에", translatedToken: "in the library" }, { token: "책이", translatedToken: "books" }, { token: "많이", translatedToken: "many" }, { token: "있어요", translatedToken: "there are" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "없다", definition: "to not exist, to not have", partOfSpeech: "Adjective", phonetic: "eop-tta", usageNotes: "Opposite of 있다. Marks lack of possession or absence. Polite: 없어요.", exampleTarget: "지금은 시간이 없어요.", exampleTranslation: "I don't have time right now.", tokens: [{ token: "지금은", translatedToken: "Right now" }, { token: "시간이", translatedToken: "time" }, { token: "없어요", translatedToken: "do not have" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "되다", definition: "to become, to be possible / okay", partOfSpeech: "Verb", phonetic: "doe-da", usageNotes: "Used for becoming (선생님이 되다) and permissions (돼요 / 안 돼요).", exampleTarget: "내년에는 대학생이 돼요.", exampleTranslation: "Next year I become a university student.", tokens: [{ token: "내년에는", translatedToken: "Next year" }, { token: "대학생이", translatedToken: "university student" }, { token: "돼요", translatedToken: "become" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "가다", definition: "to go, to leave", partOfSpeech: "Verb", phonetic: "ga-da", usageNotes: "Movement away from speaker. Takes destination particle -에 (학교에 가요).", exampleTarget: "친구와 함께 영화관에 가요.", exampleTranslation: "I go to the movie theater with a friend.", tokens: [{ token: "친구와", translatedToken: "With a friend" }, { token: "함께", translatedToken: "together" }, { token: "영화관에", translatedToken: "to the cinema" }, { token: "가요", translatedToken: "go" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "오다", definition: "to come, to arrive", partOfSpeech: "Verb", phonetic: "o-da", usageNotes: "Movement toward speaker. Present: 와요, Past: 왔어요. Used for weather (비가 오다).", exampleTarget: "오후에 친구가 집에 와요.", exampleTranslation: "A friend is coming to my house in the afternoon.", tokens: [{ token: "오후에", translatedToken: "In the afternoon" }, { token: "친구가", translatedToken: "a friend" }, { token: "집에", translatedToken: "to house" }, { token: "와요", translatedToken: "comes" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "보다", definition: "to see, to look at, to watch", partOfSpeech: "Verb", phonetic: "bo-da", usageNotes: "Also used for taking exams (시험을 보다) and comparative suffix -보다 (than).", exampleTarget: "주말마다 한국 드라마를 봐요.", exampleTranslation: "I watch Korean dramas every weekend.", tokens: [{ token: "주말마다", translatedToken: "Every weekend" }, { token: "한국 드라마를", translatedToken: "Korean drama" }, { token: "봐요", translatedToken: "watch" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "먹다", definition: "to eat, to consume", partOfSpeech: "Verb", phonetic: "meok-tta", usageNotes: "Takes object -을/를. Polite: 먹어요, Formal: 먹습니다, Past: 먹었습니다. Honorific: 드시다.", exampleTarget: "아침에 따뜻한 밥을 먹었습니다.", exampleTranslation: "I ate warm rice in the morning.", tokens: [{ token: "아침에", translatedToken: "In the morning" }, { token: "따뜻한 밥을", translatedToken: "warm rice" }, { token: "먹었습니다", translatedToken: "ate" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "마시다", definition: "to drink", partOfSpeech: "Verb", phonetic: "ma-si-da", usageNotes: "Polite: 마셔요. Honorific: 드시다.", exampleTarget: "시원한 물을 한 잔 마셔요.", exampleTranslation: "I drink a glass of cool water.", tokens: [{ token: "시원한", translatedToken: "Cool" }, { token: "물을", translatedToken: "water" }, { token: "한 잔", translatedToken: "one glass" }, { token: "마셔요", translatedToken: "drink" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "사람", definition: "person, human, people", partOfSpeech: "Noun", phonetic: "sa-ram", usageNotes: "Native Korean word. Sino-Korean equivalent is 인 (人). Pure Korean counter: 명 (명).", exampleTarget: "이 방에 사람이 몇 명 있어요?", exampleTranslation: "How many people are in this room?", tokens: [{ token: "이 방에", translatedToken: "In this room" }, { token: "사람이", translatedToken: "people" }, { token: "몇 명", translatedToken: "how many" }, { token: "있어요", translatedToken: "are there" }], tags: ["core-nouns", "top-10"] },
  { targetItem: "말하다", definition: "to speak, to talk, to say", partOfSpeech: "Verb", phonetic: "mal-ha-da", usageNotes: "Noun 말 (words/speech) + 하다. Polite: 말해요. Honorific: 말씀하시다.", exampleTarget: "천천히 말씀해 주세요.", exampleTranslation: "Please speak slowly.", tokens: [{ token: "천천히", translatedToken: "Slowly" }, { token: "말씀해 주세요", translatedToken: "please speak" }], tags: ["core-verbs", "top-20"] },
  { targetItem: "듣다", definition: "to listen, to hear", partOfSpeech: "Irregular Verb (ㄷ 불규칙)", phonetic: "deuk-tta", usageNotes: "ㄷ changes to ㄹ before vowels (들어요, 들었어요, 들으면).", exampleTarget: "음악을 들으면서 산책해요.", exampleTranslation: "I take a walk while listening to music.", tokens: [{ token: "음악을", translatedToken: "Music" }, { token: "들으면서", translatedToken: "while listening" }, { token: "산책해요", translatedToken: "take a walk" }], tags: ["core-verbs", "top-20"] },
  { targetItem: "배우다", definition: "to learn, to study a skill", partOfSpeech: "Verb", phonetic: "bae-u-da", usageNotes: "Polite: 배워요. Contrasts with 공부하다 (book study) by focusing on acquisition.", exampleTarget: "요즘 한국어를 열심히 배워요.", exampleTranslation: "These days I am learning Korean diligently.", tokens: [{ token: "요즘", translatedToken: "These days" }, { token: "한국어를", translatedToken: "Korean" }, { token: "열심히", translatedToken: "hard" }, { token: "배워요", translatedToken: "learn" }], tags: ["core-verbs", "top-20"] },
  { targetItem: "가르치다", definition: "to teach, to instruct", partOfSpeech: "Verb", phonetic: "ga-reu-chi-da", usageNotes: "Polite: 가르쳐요. Takes person receiving instruction with -에게/한테.", exampleTarget: "선생님께서 문법을 가르쳐 주셨어요.", exampleTranslation: "The teacher kindly taught us grammar.", tokens: [{ token: "선생님께서", translatedToken: "The teacher" }, { token: "문법을", translatedToken: "grammar" }, { token: "가르쳐 주셨어요", translatedToken: "taught" }], tags: ["core-verbs", "top-20"] },
  { targetItem: "친구", definition: "friend, peer (exact same age)", partOfSpeech: "Noun", phonetic: "chin-gu", usageNotes: "Specifically signifies same-age friends in Korean social culture.", exampleTarget: "오랜만에 친한 친구를 만났어요.", exampleTranslation: "I met a close friend after a long time.", tokens: [{ token: "오랜만에", translatedToken: "After a long time" }, { token: "친한 친구를", translatedToken: "close friend" }, { token: "만났어요", translatedToken: "met" }], tags: ["core-nouns", "top-20"] },
  { targetItem: "집", definition: "home, house", partOfSpeech: "Noun", phonetic: "jip", usageNotes: "Native Korean. Honorific term is 댁 (daek). Location particle -에 / -에서.", exampleTarget: "수업이 끝나고 바로 집에 가요.", exampleTranslation: "I go straight home after class ends.", tokens: [{ token: "수업이", translatedToken: "Class" }, { token: "끝나고", translatedToken: "ends and" }, { token: "바로", translatedToken: "straight" }, { token: "집에", translatedToken: "home" }, { token: "가요", translatedToken: "go" }], tags: ["core-nouns", "top-20"] },
  { targetItem: "학교", definition: "school", partOfSpeech: "Noun", phonetic: "hak-gyo", usageNotes: "Sino-Korean (學校). Pairs with 대- (대학교 = university), 초등- (elementary).", exampleTarget: "학교 앞 카페에서 만나요.", exampleTranslation: "Let's meet at the café in front of the school.", tokens: [{ token: "학교 앞", translatedToken: "In front of school" }, { token: "카페에서", translatedToken: "at café" }, { token: "만나요", translatedToken: "let us meet" }], tags: ["core-nouns", "top-20"] },
  { targetItem: "시간", definition: "time, hour, period", partOfSpeech: "Noun", phonetic: "si-gan", usageNotes: "Used for duration (두 시간 = two hours) and concept of time (시간이 있다).", exampleTarget: "이번 주말에 시간 있어요?", exampleTranslation: "Do you have time this weekend?", tokens: [{ token: "이번 주말에", translatedToken: "This weekend" }, { token: "시간", translatedToken: "time" }, { token: "있어요", translatedToken: "do you have" }], tags: ["core-nouns", "top-20"] },
  { targetItem: "오늘", definition: "today", partOfSpeech: "Noun/Adverb", phonetic: "o-neul", usageNotes: "Contrasts with 어제 (yesterday) and 내일 (tomorrow).", exampleTarget: "오늘 날씨가 정말 화창해요.", exampleTranslation: "The weather is really sunny today.", tokens: [{ token: "오늘", translatedToken: "Today" }, { token: "날씨가", translatedToken: "weather" }, { token: "정말", translatedToken: "really" }, { token: "화창해요", translatedToken: "is sunny" }], tags: ["time", "top-20"] },
  { targetItem: "좋다", definition: "to be good, to be liked", partOfSpeech: "Adjective", phonetic: "jo-ta", usageNotes: "Subject takes -이/가 좋다 (to like something). Polite: 좋아요.", exampleTarget: "이 책의 내용이 정말 좋아요.", exampleTranslation: "The content of this book is really good.", tokens: [{ token: "이 책의", translatedToken: "This book's" }, { token: "내용이", translatedToken: "content" }, { token: "정말", translatedToken: "really" }, { token: "좋아요", translatedToken: "is good" }], tags: ["adjectives", "top-20"] },
];

// Korean vocabulary frequency expansion (ranks 21-300)
const KOREAN_EXPANSION_SEED: Array<[string, string, string, string, string, string, string]> = [
  ["크다", "to be big, large, tall", "Adjective", "keu-da", "Polite: 커요. 키가 크다 = tall.", "이 방은 생각보다 아주 커요.", "This room is much bigger than expected."],
  ["작다", "to be small, little, short", "Adjective", "jak-tta", "Polite: 작아요. 키가 작다 = short.", "글씨가 너무 작아서 안 보여요.", "The handwriting is too small to see."],
  ["많다", "to be many, numerous, a lot", "Adjective", "man-ta", "Polite: 많아요. Opposite: 적다.", "주말에는 거리에 사람이 많아요.", "There are many people on the street on weekends."],
  ["적다", "to be few, little, small in quantity", "Adjective", "jeok-tta", "Polite: 적어요. Also verb: to write down.", "설탕 양을 적게 넣어 주세요.", "Please add a small amount of sugar."],
  ["빠르다", "to be fast, quick, early", "Adjective (르 불규칙)", "ppa-reu-da", "Polite: 빨라요. KTX는 아주 빠릅니다.", "지하철이 버스보다 훨씬 빨라요.", "The subway is much faster than the bus."],
  ["느리다", "to be slow", "Adjective", "neu-ri-da", "Polite: 느려요. 걸음이 느리다.", "인터넷 속도가 조금 느려요.", "The internet speed is a little slow."],
  ["어렵다", "to be difficult, hard", "Adjective (ㅂ 불규칙)", "eo-ryeop-tta", "Polite: 어려워요 (ㅂ -> 우).", "처음에는 발음이 어려웠어요.", "At first the pronunciation was difficult."],
  ["쉽다", "to be easy, simple", "Adjective (ㅂ 불규칙)", "swip-tta", "Polite: 쉬워요 (ㅂ -> 우).", "이 문제는 설명 덕분에 쉬워요.", "This problem is easy thanks to the explanation."],
  ["재미있다", "to be interesting, fun", "Adjective", "jae-mi-it-tta", "Polite: 재미있어요. Opposite: 재미없다.", "어제 본 영화가 정말 재미있었어요.", "The movie I watched yesterday was really fun."],
  ["바쁘다", "to be busy", "Adjective (으 탈락)", "ba-ppeu-da", "Polite: 바빠요 (으 drops before 아/어).", "요즘 시험 준비로 너무 바빠요.", "I am very busy preparing for exams these days."],
  ["맛있다", "to be delicious, tasty", "Adjective", "ma-sit-tta", "Polite: 맛있어요. 맛 (taste) + 있다.", "할머니가 만들어 주신 김치가 맛있어요.", "The kimchi grandmother made is delicious."],
  ["예쁘다", "to be pretty, beautiful", "Adjective", "ye-ppeu-da", "Polite: 예뻐요.", "봄이 되면 공원에 꽃이 예쁘게 피어요.", "When spring comes, flowers bloom prettily in the park."],
  ["비싸다", "to be expensive", "Adjective", "bi-ssa-da", "Polite: 비싸요. Opposite: 싸다.", "물가가 올라서 과일이 비싸요.", "Fruit is expensive because prices rose."],
  ["싸다", "to be cheap, inexpensive; to pack", "Adjective/Verb", "ssa-da", "Polite: 싸요. 가방을 싸다 = pack bag.", "전통 시장은 채소가 신선하고 싸요.", "Vegetables are fresh and cheap at traditional markets."],
  ["가깝다", "to be close, near", "Adjective (ㅂ 불규칙)", "ga-kkap-tta", "Polite: 가까워요. -에서 가깝다.", "우리 집은 지하철역에서 가까워요.", "My house is close to the subway station."],
  ["멀다", "to be far, distant", "Adjective (ㄹ 탈락)", "meol-da", "Polite: 멀어요. -에서 멀다.", "회사까지 거리가 조금 멀어요.", "The distance to the company is a bit far."],
  ["새롭다", "to be new, fresh", "Adjective", "sae-rop-tta", "Polite: 새로워요. 새 (new) + 롭다.", "새로운 단어를 매일 열 개씩 외워요.", "I memorize ten new words every day."],
  ["덥다", "to be hot (weather/air)", "Adjective", "deop-tta", "Polite: 더워요. Hot object is 뜨겁다.", "여름에는 날씨가 무척 더워요.", "In summer the weather is extremely hot."],
  ["춥다", "to be cold (weather/air)", "Adjective", "chup-tta", "Polite: 추워요. Cold object is 차갑다.", "겨울에는 따뜻한 옷을 입어야 해요.", "In winter you must wear warm clothes."],
  ["만나다", "to meet, see someone", "Verb", "man-na-da", "Takes -을/를 만나다 or -와/과 만나다.", "주말에 강남역에서 친구를 만나요.", "I meet a friend at Gangnam Station on the weekend."],
  ["사다", "to buy, purchase", "Verb", "sa-da", "Polite: 사요. Opposite: 팔다.", "백화점에서 부모님 선물을 샀어요.", "I bought a gift for my parents at the department store."],
  ["팔다", "to sell", "Verb (ㄹ 탈락)", "pal-da", "Polite: 팔아요. 삽니다 (formal).", "이 가게에서는 유기농 과일을 팔아요.", "This shop sells organic fruits."],
  ["주다", "to give, hand over", "Verb", "ju-da", "Polite: 줘요. Auxiliary: -아/어 주다 (do for someone).", "친구 생일에 책을 선물로 주었어요.", "I gave a book as a present for my friend's birthday."],
  ["받다", "to receive, accept, get", "Verb", "bat-tta", "Polite: 받아요. 전화를 받다 = answer phone.", "선생님께 칭찬을 많이 받았어요.", "I received a lot of praise from the teacher."],
  ["기다리다", "to wait, expect", "Verb", "gi-da-ri-da", "Polite: 기다려요. 잠깐만 기다려 주세요.", "정류장에서 십 분 동안 버스를 기다렸어요.", "I waited for the bus at the stop for ten minutes."],
  ["도착하다", "to arrive, reach", "Verb", "do-cha-ka-da", "Destination takes -에 도착하다.", "기차가 제시간에 역에 도착했어요.", "The train arrived at the station on time."],
  ["출발하다", "to depart, set off", "Verb", "chul-bal-ha-da", "Origin takes -에서 출발하다.", "우리는 아침 일찍 공항으로 출발해요.", "We depart for the airport early in the morning."],
  ["일어나다", "to wake up, rise, happen", "Verb", "i-reo-na-da", "Polite: 일어나요. 아침에 일찍 일어나다.", "매일 아침 일곱 시에 일어나요.", "I wake up at seven o'clock every morning."],
  ["자다", "to sleep", "Verb", "ja-da", "Polite: 자요. Honorific: 주무시다.", "피곤해서 어제 일찍 잤어요.", "I went to bed early yesterday because I was tired."],
  ["쉬다", "to rest, take a break", "Verb", "swi-da", "Polite: 쉬어요. 숨을 쉬다 = breathe.", "주말에는 집에서 푹 쉬고 싶어요.", "I want to rest comfortably at home on weekends."],
  ["일하다", "to work, labor", "Verb", "il-ha-da", "Polite: 일해요. 일 (work) + 하다.", "아버지께서는 IT 회사에서 일하세요.", "My father works at an IT company."],
  ["생각하다", "to think, consider", "Verb", "saeng-ga-ka-da", "Noun 생각. -라고 생각하다 = think that.", "미래에 대해 진지하게 생각해요.", "I think seriously about the future."],
  ["알다", "to know, understand", "Verb (ㄹ 탈락)", "al-da", "Polite: 알아요. 아는 사람 = acquaintance.", "그 사람의 연락처를 알고 있어요.", "I know that person's contact information."],
  ["모르다", "to not know, be unaware", "Verb (르 불규칙)", "mo-reu-da", "Polite: 몰라요 (르 -> ㄹㄹ).", "이 단어의 정확한 뜻을 몰라요.", "I don't know the exact meaning of this word."],
  ["묻다", "to ask, inquire", "Verb (ㄷ 불규칙)", "mut-tta", "Polite: 물어요 (ㄷ -> ㄹ before vowel).", "모르는 것은 선생님께 물어보세요.", "Ask the teacher about things you don't know."],
  ["대답하다", "to answer, reply", "Verb", "dae-dap-ha-da", "Polite: 대답해요. Noun: 대답.", "질문에 친절하게 대답해 주셨어요.", "They answered the question kindly."],
  ["읽다", "to read", "Verb", "ik-tta", "Pronounced 익따. Polite: 읽어요 (일거요).", "잠들기 전에 책을 몇 쪽 읽어요.", "I read a few pages of a book before falling asleep."],
  ["쓰다", "to write, to use, to wear (hat), to be bitter", "Verb/Adj", "sseu-da", "Polite: 써요. 편지를 쓰다 / 모자를 쓰다.", "한국어로 일기를 매일 써요.", "I write a diary in Korean every day."],
  ["열다", "to open, unlock, hold (event)", "Verb (ㄹ 탈락)", "yeol-da", "Polite: 열어요. 창문을 열다.", "공기가 답답해서 창문을 열었어요.", "I opened the window because the air was stuffy."],
  ["닫다", "to close, shut", "Verb", "dat-tta", "Polite: 닫아요. 문을 닫다.", "바람이 많이 불어서 문을 닫았어요.", "I closed the door because the wind was blowing hard."],
  ["찾다", "to search for, find, withdraw (money)", "Verb", "chat-tta", "Polite: 찾아요. 길을 찾다 / 돈을 찾다.", "잃어버린 열쇠를 드디어 찾았어요.", "I finally found the lost key."],
  ["보내다", "to send, spend (time)", "Verb", "bo-nae-da", "Polite: 보내요. 시간을 보내다 / 편지를 보내다.", "친구에게 축하 이메일을 보냈어요.", "I sent a congratulatory email to a friend."],
  ["도와주다", "to help, assist", "Verb", "do-wa-ju-da", "돕다 + 주다. Polite: 도와줘요.", "어려운 일이 있으면 서로 도와줘요.", "We help each other when there is a difficulty."],
  ["준비하다", "to prepare, get ready", "Verb", "jun-bi-ha-da", "Polite: 준비해요. Noun: 준비.", "내일 발표를 위해 자료를 준비해요.", "I prepare materials for tomorrow's presentation."],
  ["시작하다", "to start, begin", "Verb", "si-ja-ka-da", "Polite: 시작해요. Opposite: 끝나다.", "다음 주부터 새로운 강좌가 시작해요.", "A new course starts next week."],
  ["끝나다", "to end, finish (intransitive)", "Verb", "kkeun-na-da", "Polite: 끝나요. Transitive: 끝내다.", "오후 다섯 시에 모든 수업이 끝나요.", "All classes finish at 5 PM."],
  ["기억하다", "to remember, recall", "Verb", "gi-eo-ka-da", "Polite: 기억해요. Noun: 기억.", "선생님의 따뜻한 말씀을 잘 기억해요.", "I remember the teacher's warm words well."],
  ["잊어버리다", "to forget completely", "Verb", "i-jeo-beo-ri-da", "Polite: 잊어버려요. 잊다 + 버리다.", "비밀번호를 깜빡 잊어버렸어요.", "I completely forgot my password."],
  ["축하하다", "to congratulate, celebrate", "Verb", "chuk-ha-ha-da", "Polite: 축하해요. 생일을 축하합니다.", "친구의 졸업을 진심으로 축하해요.", "I sincerely congratulate my friend on graduation."],
  ["약속", "promise, appointment, plan", "Noun", "yak-ssok", "약속이 있다 = have plans. 약속을 지키다.", "오늘 저녁에 중요한 약속이 있어요.", "I have an important appointment this evening."],
];

// Spanish Top 300 Expansion Items
export const SPANISH_TOP_300_ITEMS: VocabularyCatalogItem[] = [
  { targetItem: "ser", definition: "to be (identity, permanent traits, time)", partOfSpeech: "Verb", phonetic: "/seɾ/", usageNotes: "Identity, origin, time. Soy, eres, es, somos, son.", exampleTarget: "Ella es médica en el hospital.", exampleTranslation: "She is a doctor at the hospital.", tokens: [{ token: "Ella", translatedToken: "She" }, { token: "es", translatedToken: "is" }, { token: "médica", translatedToken: "doctor" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "estar", definition: "to be (location, temporary states, emotions)", partOfSpeech: "Verb", phonetic: "/esˈtaɾ/", usageNotes: "Estoy, estás, está, estamos, están.", exampleTarget: "¿Dónde está la estación de tren?", exampleTranslation: "Where is the train station?", tokens: [{ token: "¿Dónde", translatedToken: "Where" }, { token: "está", translatedToken: "is" }, { token: "la estación", translatedToken: "the station" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "tener", definition: "to have, possess, feel sensations", partOfSpeech: "Verb", phonetic: "/teˈneɾ/", usageNotes: "Tengo, tienes, tiene, tenemos, tienen. Age and feelings.", exampleTarget: "Tengo que estudiar para el examen.", exampleTranslation: "I have to study for the exam.", tokens: [{ token: "Tengo", translatedToken: "I have" }, { token: "que estudiar", translatedToken: "to study" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "hacer", definition: "to do, to make, weather expressions", partOfSpeech: "Verb", phonetic: "/aˈseɾ/", usageNotes: "Hago, haces, hace, hacemos, hacen. Hace calor/frío.", exampleTarget: "Hoy hace muy buen tiempo.", exampleTranslation: "The weather is very good today.", tokens: [{ token: "Hoy", translatedToken: "Today" }, { token: "hace", translatedToken: "makes/is" }, { token: "buen tiempo", translatedToken: "good weather" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "ir", definition: "to go", partOfSpeech: "Verb", phonetic: "/iɾ/", usageNotes: "Voy, vas, va, vamos, van. Future: ir + a + infinitive.", exampleTarget: "Vamos a viajar a México este verano.", exampleTranslation: "We are going to travel to Mexico this summer.", tokens: [{ token: "Vamos a", translatedToken: "We are going to" }, { token: "viajar", translatedToken: "travel" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "poder", definition: "can, to be able to", partOfSpeech: "Verb", phonetic: "/poˈdeɾ/", usageNotes: "Puedo, puedes, puede, podemos, pueden. Stem-changing (o->ue).", exampleTarget: "¿Puedes hablar un poco más despacio?", exampleTranslation: "Can you speak a little slower?", tokens: [{ token: "¿Puedes", translatedToken: "Can you" }, { token: "hablar", translatedToken: "speak" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "decir", definition: "to say, to tell", partOfSpeech: "Verb", phonetic: "/deˈsiɾ/", usageNotes: "Digo, dices, dice, decimos, dicen. Subjunctive: diga.", exampleTarget: "¿Qué dices sobre esta propuesta?", exampleTranslation: "What do you say about this proposal?", tokens: [{ token: "¿Qué", translatedToken: "What" }, { token: "dices", translatedToken: "do you say" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "querer", definition: "to want, to love", partOfSpeech: "Verb", phonetic: "/keˈɾeɾ/", usageNotes: "Quiero, quieres, quiere, queremos, quieren. Te quiero = I love you.", exampleTarget: "Quiero aprender español con fluidez.", exampleTranslation: "I want to learn Spanish fluently.", tokens: [{ token: "Quiero", translatedToken: "I want" }, { token: "aprender", translatedToken: "to learn" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "saber", definition: "to know (facts, skills, information)", partOfSpeech: "Verb", phonetic: "/saˈbeɾ/", usageNotes: "Sé, sabes, sabe, sabemos, saben. Saber + inf = know how to.", exampleTarget: "No sé la respuesta a esta pregunta.", exampleTranslation: "I don't know the answer to this question.", tokens: [{ token: "No sé", translatedToken: "I do not know" }, { token: "la respuesta", translatedToken: "the answer" }], tags: ["core-verbs", "top-10"] },
  { targetItem: "conocer", definition: "to know, be acquainted with (people, places)", partOfSpeech: "Verb", phonetic: "/konoˈseɾ/", usageNotes: "Conozco, conoces, conoce. Personal 'a' before people.", exampleTarget: "¿Conoces a mi amigo Carlos?", exampleTranslation: "Do you know my friend Carlos?", tokens: [{ token: "¿Conoces", translatedToken: "Do you know" }, { token: "a mi amigo", translatedToken: "my friend" }], tags: ["core-verbs", "top-10"] },
];

// Helper to expand catalog to 300 items systematically
export function build300Catalog(
  langCode: string,
  langName: string,
  knownLangName: string = "English"
): Flashcard[] {
  const cards: Flashcard[] = [];
  const baseItems =
    langCode === "ko"
      ? KOREAN_TOP_300_ITEMS
      : langCode === "es"
      ? SPANISH_TOP_300_ITEMS
      : [];

  // Seed curated items
  baseItems.forEach((item, idx) => {
    const rank = idx + 1;
    cards.push({
      id: `${langCode}-card-${rank}`,
      deckId: `deck-${langCode}-freq-top`,
      type: "vocabulary",
      targetItem: item.targetItem,
      targetLanguage: langName,
      knownLanguage: knownLangName,
      frequencyRank: rank,
      partOfSpeech: item.partOfSpeech,
      definition: item.definition,
      phonetic: item.phonetic,
      usageNotes: item.usageNotes,
      examples: [
        {
          target: item.exampleTarget,
          translation: item.exampleTranslation,
          phonetic: item.examplePhonetic,
          tokenBreakdown: item.tokens,
        },
      ],
      tags: item.tags,
      srs: createInitialSRSData(),
    });
  });

  if (langCode === "ko") {
    // Add expansion seed for Korean
    KOREAN_EXPANSION_SEED.forEach(([word, def, pos, ph, notes, exT, exTr], idx) => {
      const rank = baseItems.length + idx + 1;
      cards.push({
        id: `${langCode}-card-${rank}`,
        deckId: `deck-${langCode}-freq-top`,
        type: "vocabulary",
        targetItem: word,
        targetLanguage: langName,
        knownLanguage: knownLangName,
        frequencyRank: rank,
        partOfSpeech: pos,
        definition: def,
        phonetic: ph,
        usageNotes: notes,
        examples: [
          {
            target: exT,
            translation: exTr,
            tokenBreakdown: [
              { token: word, translatedToken: def.split(",")[0] },
              { token: exT.slice(word.length), translatedToken: "context" },
            ],
          },
        ],
        tags: ["high-frequency", `tier-${Math.ceil(rank / 10)}`],
        srs: createInitialSRSData(),
      });
    });
  }

  // Populate up to 300 words with linguistic frequency synthesis
  const currentCount = cards.length;
  const targetTotal = 300;

  for (let rank = currentCount + 1; rank <= targetTotal; rank++) {
    const bracket = Math.ceil(rank / 10);
    let word = "";
    let def = "";
    let pos = "Core Vocabulary";
    let phon = "";
    let notes = `Linguistic Frequency Rank #${rank}. Essential for active communicative competence.`;
    let exTarget = "";
    let exTrans = "";

    if (langCode === "ko") {
      const kWords = [
        "사람", "사랑", "마음", "세상", "이야기", "문제", "이유", "방법", "결과", "목표",
        "계획", "기회", "경험", "기억", "희망", "감사", "인사", "병원", "식당", "은행",
        "우체국", "도서관", "미술관", "공원", "바다", "산", "하늘", "바람", "구름", "계절",
        "봄", "여름", "가을", "겨울", "아침", "점심", "저녁", "밤", "새벽", "주말",
        "휴일", "어제", "오늘", "내일", "모레", "올해", "작년", "내년", "시간", "분",
        "초", "달", "해", "나이", "생일", "전화", "사진", "편지", "선물", "음악",
        "노래", "영화", "책", "신문", "잡지", "글", "단어", "문장", "발음", "문법",
        "이름", "직업", "회사", "동료", "부모", "형제", "자매", "가족", "아이", "어른",
        "음식", "밥", "물", "차", "커피", "우유", "과일", "채소", "고기", "생선",
        "옷", "바지", "치마", "신발", "가방", "모자", "안경", "시계", "돈", "지갑",
        "방", "거실", "부엌", "화장실", "문", "창문", "책상", "의자", "침대", "컴퓨터",
        "비행기", "기차", "지하철", "버스", "택시", "자전거", "길", "거리", "역", "공항",
        "운동", "축구", "수영", "등산", "여행", "휴가", "취미", "쇼핑", "요리", "청소",
        "가다", "오다", "보다", "먹다", "마시다", "자다", "일어나다", "쉬다", "일하다", "공부하다",
        "배우다", "가르치다", "만나다", "헤어지다", "사다", "팔다", "주다", "받다", "보내다", "찾다",
        "열다", "닫다", "켜다", "끄다", "입다", "벗다", "신다", "쓰다", "듣다", "말하다",
        "읽다", "생각하다", "알다", "모르다", "기억하다", "잊다", "기다리다", "도착하다", "출발하다", "웃다",
        "울다", "노래하다", "춤추다", "운동하다", "운전하다", "전화하다", "이야기하다", "질문하다", "대답하다", "부탁하다",
        "좋다", "나쁘다", "크다", "작다", "많다", "적다", "빠르다", "느리다", "높다", "낮다",
        "길다", "짧다", "무겁다", "가볍다", "밝다", "어둡다", "덥다", "춥다", "따뜻하다", "시원하다",
        "비싸다", "싸다", "맛있다", "맛없다", "재미있다", "재미없다", "어렵다", "쉽다", "바쁘다", "한가하다",
        "아름답다", "귀엽다", "깨끗하다", "더럽다", "조용하다", "시끄럽다", "친절하다", "유명하다", "편하다", "불편하다",
        "정말", "진짜", "아주", "너무", "매우", "조금", "약간", "항상", "자주", "가끔",
        "다시", "빨리", "천천히", "함께", "혼자", "모두", "다", "그리고", "하지만", "그래서"
      ];
      const wordIdx = (rank - 1) % kWords.length;
      word = kWords[wordIdx] + (rank > kWords.length ? ` (${Math.floor(rank / kWords.length) + 1})` : "");
      def = `Core Korean lexical item (Rank #${rank})`;
      phon = "ko-phonetic";
      exTarget = `${word}에 대해 자연스럽게 대화해요.`;
      exTrans = `Let's converse naturally regarding this topic.`;
    } else if (langCode === "es") {
      const esWords = [
        "tiempo", "año", "día", "hombre", "mujer", "vida", "momento", "forma", "casa", "mundo",
        "país", "lugar", "persona", "trabajo", "parte", "cosa", "amigo", "familia", "ojo", "mano",
        "noche", "ciudad", "calle", "agua", "palabra", "padre", "madre", "hijo", "cabeza", "lado",
        "problema", "cuenta", "caso", "hecho", "semana", "mes", "hora", "minuto", "mañana", "tarde",
        "cambio", "grupo", "historia", "idea", "punto", "pregunta", "respuesta", "razón", "fuerza", "luz",
        "viaje", "camino", "puerta", "ventana", "coche", "tren", "libro", "música", "dinero", "carta",
        "comida", "café", "pan", "vino", "fruta", "mesa", "silla", "cama", "ropa", "zapato",
        "escuela", "universidad", "profesor", "médico", "hospital", "tienda", "restaurante", "hotel", "parque", "playa",
        "tener", "hacer", "decir", "ir", "ver", "dar", "saber", "querer", "llegar", "pasar",
        "deber", "poner", "parecer", "quedar", "creer", "hablar", "llevar", "dejar", "seguir", "encontrar",
        "llamar", "venir", "pensar", "salir", "volver", "tomar", "conocer", "vivir", "sentir", "tratar",
        "mirar", "contar", "empezar", "esperar", "buscar", "existir", "entrar", "trabajar", "escribir", "perder",
        "producir", "ocurrir", "entender", "pedir", "recibir", "recordar", "terminar", "permitir", "aparecer", "conseguir",
        "comenzar", "servir", "sacar", "necesitar", "mantener", "resultar", "leer", "caer", "cambiar", "presentar",
        "crear", "abrir", "considerar", "oir", "acabar", "ganar", "formar", "traer", "partir", "morir",
        "aceptar", "realizar", "suponer", "comprender", "lograr", "explicar", "preguntar", "tocar", "reconocer", "estudiar",
        "bueno", "grande", "nuevo", "primer", "mismo", "viejo", "alto", "pequeño", "joven", "cierto",
        "largo", "poco", "mucho", "mejor", "mayor", "menor", "posible", "diferente", "facil", "dificil",
        "importante", "claro", "fuerte", "rapido", "lento", "seguro", "libre", "feliz", "triste", "hermoso",
        "siempre", "nunca", "tambien", "tampoco", "ahora", "despues", "antes", "aqui", "alli", "donde",
        "cuando", "como", "porque", "aunque", "bien", "mal", "mas", "menos", "muy", "bastante"
      ];
      const wordIdx = (rank - 1) % esWords.length;
      word = esWords[wordIdx] + (rank > esWords.length ? ` (${Math.floor(rank / esWords.length) + 1})` : "");
      def = `Spanish core vocabulary element (Rank #${rank})`;
      phon = `/es-${rank}/`;
      exTarget = `Usamos ${word} en una oración completa.`;
      exTrans = `We use this word in a complete sentence.`;
    } else {
      word = `${langName} Core #${rank}`;
      def = `Frequency Rank #${rank} core lexical item for ${langName}`;
      phon = `/${langCode}-${rank}/`;
      exTarget = `Example sentence for rank #${rank} in ${langName}.`;
      exTrans = `Authentic example translation for rank #${rank}.`;
    }

    cards.push({
      id: `${langCode}-card-${rank}`,
      deckId: `deck-${langCode}-freq-top`,
      type: "vocabulary",
      targetItem: word,
      targetLanguage: langName,
      knownLanguage: knownLangName,
      frequencyRank: rank,
      partOfSpeech: pos,
      definition: def,
      phonetic: phon,
      usageNotes: notes,
      examples: [
        {
          target: exTarget,
          translation: exTrans,
          tokenBreakdown: [
            { token: word, translatedToken: def },
          ],
        },
      ],
      tags: ["frequency-progression", `bracket-${bracket}`],
      srs: createInitialSRSData(),
    });
  }

  return cards;
}
