import { VerbConjugationTable, ConjugationFormGroup } from "../types";

export const IS_CONJUGATION_LANGUAGE: Record<string, boolean> = {
  es: true,
  ja: true,
  ko: true,
  "zh-TW": false,
  nan: false,
};

export const CONJUGATION_FORM_OPTIONS: Record<string, Array<{ id: string; name: string; category: string; description: string; formula: string }>> = {
  es: [
    {
      id: "present_indicative",
      name: "Present Indicative (Presente)",
      category: "indicative",
      description: "Habitual actions, current states, facts, and immediate future.",
      formula: "-ar: -o, -as, -a, -amos, -áis, -an | -er: -o, -es, -e, -emos, -éis, -en | -ir: -o, -es, -e, -imos, -ís, -en",
    },
    {
      id: "preterite",
      name: "Preterite Past (Pretérito Indefinido)",
      category: "indicative",
      description: "Completed actions at a specific time in the past.",
      formula: "-ar: -é, -aste, -ó, -amos, -asteis, -aron | -er/-ir: -í, -iste, -ió, -imos, -isteis, -ieron",
    },
    {
      id: "imperfect",
      name: "Imperfect Past (Pretérito Imperfecto)",
      category: "indicative",
      description: "Past habits, background descriptions, ongoing actions, age/time.",
      formula: "-ar: -aba, -abas, -aba, -ábamos, -abais, -aban | -er/-ir: -ía, -ías, -ía, -íamos, -íais, -ían",
    },
    {
      id: "future",
      name: "Future Simple (Futuro)",
      category: "indicative",
      description: "Future events, intentions, and present conjectures/probabilities.",
      formula: "Infinitive + -é, -ás, -á, -emos, -éis, -án",
    },
    {
      id: "conditional",
      name: "Conditional (Condicional)",
      category: "indicative",
      description: "Hypothetical actions, polite requests, and past conjectures.",
      formula: "Infinitive + -ía, -ías, -ía, -íamos, -íais, -ían",
    },
    {
      id: "present_subjunctive",
      name: "Present Subjunctive (Presente de Subjuntivo)",
      category: "subjunctive",
      description: "Wishes, doubts, emotions, hypothetical conditions, recommendations.",
      formula: "Yo stem + opposite vowel endings: -ar: -e, -es, -e, -emos, -éis, -en | -er/-ir: -a, -as, -a, -amos, -áis, -an",
    },
    {
      id: "imperative",
      name: "Affirmative Imperative (Imperativo)",
      category: "imperative",
      description: "Direct commands, instructions, and practical requests.",
      formula: "tú: 3rd person singular present | usted: subjunctive 3rd sing | nosotros: subj 1st pl | ustedes: subj 3rd pl",
    },
    {
      id: "gerund_participle",
      name: "Gerund & Participle (Gerundio y Participio)",
      category: "participle",
      description: "Continuous progressive aspect (estar + gerund) & perfect compound tenses (haber + participle).",
      formula: "Gerund: -ando / -iendo | Participle: -ado / -ido",
    },
  ],

  ja: [
    {
      id: "polite_masu",
      name: "Polite Non-Past (ます形)",
      category: "polite",
      description: "Standard polite conversation for current actions, habits, and future events.",
      formula: "Ichidan: stem + ます | Godan: u -> i + ます | Irreg: します, 来ます (kimasu)",
    },
    {
      id: "polite_past_masita",
      name: "Polite Past (ました形)",
      category: "polite",
      description: "Polite completed past actions.",
      formula: "ます -> ました (affirmative) / ませんでした (negative)",
    },
    {
      id: "te_form",
      name: "Te-form (て形)",
      category: "connective",
      description: "Sentence linking, polite requests (~てください), and continuous aspect (~ています).",
      formula: "Ichidan: stem + て | Godan: -く -> -いて, -ぐ -> -いで, -す -> -して, -つ/-る/-う -> -って, -ぬ/-ぶ/-む -> -んで",
    },
    {
      id: "past_ta",
      name: "Plain Past (た形)",
      category: "plain",
      description: "Casual/informal completed past events and past experience (~たことがある).",
      formula: "Same sound changes as て-form replacing て/で with た/だ.",
    },
    {
      id: "negative_nai",
      name: "Plain Negative (ない形)",
      category: "plain",
      description: "Casual negative, prohibition (~ないでください), obligation (~なければならない).",
      formula: "Ichidan: stem + ない | Godan: u -> a + ない (u -> wa) | する -> しない, 来る -> こない",
    },
    {
      id: "potential",
      name: "Potential / Ability Form (可能形)",
      category: "modal",
      description: "Ability or possibility to do an action ('can do').",
      formula: "Ichidan: stem + られる | Godan: u -> e + る | する -> できる, 来る -> こられる",
    },
    {
      id: "volitional",
      name: "Volitional / Let's Form (意向形)",
      category: "plain",
      description: "Casual invitation or expressing intention ('let's do', ~ようと思う).",
      formula: "Ichidan: stem + よう | Godan: u -> ō (お段+う) | する -> しよう, 来る -> こよう",
    },
    {
      id: "conditional_ba_tara",
      name: "Conditional (条件形・たら)",
      category: "plain",
      description: "Expressing 'if' or 'when' conditions.",
      formula: "ば-form: u -> e + ば | たら-form: past た + ら",
    },
    {
      id: "passive",
      name: "Passive Form (受身形)",
      category: "modal",
      description: "Being affected by an action (passive voice / suffering passive).",
      formula: "Ichidan: stem + られる | Godan: u -> a + れる | する -> される, 来る -> こられる",
    },
    {
      id: "causative",
      name: "Causative Form (使役形)",
      category: "modal",
      description: "Making or letting someone do an action.",
      formula: "Ichidan: stem + させる | Godan: u -> a + せる | する -> させる, 来る -> こさせる",
    },
    {
      id: "tai_form",
      name: "Desire Form (たい形)",
      category: "modal",
      description: "Expressing personal wish/desire ('want to do').",
      formula: "Masu stem + たい (conjugates like an い-adjective)",
    },
  ],

  ko: [
    {
      id: "present_polite",
      name: "Present Informal Polite (해요체)",
      category: "polite",
      description: "Most common everyday polite ending for current states, habits, and immediate plans.",
      formula: "Stem vowel ㅏ/ㅗ -> -아요 | Other vowels -> -어요 | 하다 -> 해요",
    },
    {
      id: "formal_polite",
      name: "Formal Polite (하십시오체)",
      category: "honorific",
      description: "High-respect formal situations, broadcasts, presentations, and military/business.",
      formula: "No batchim: -ㅂ니다 | Batchim: -습니다",
    },
    {
      id: "past_polite",
      name: "Past Polite (과거형)",
      category: "polite",
      description: "Completed past actions in polite speech.",
      formula: "Stem vowel ㅏ/ㅗ -> -았어요 | Other vowels -> -었어요 | 하다 -> 했어요",
    },
    {
      id: "future_intent",
      name: "Future / Intention (-(으)ㄹ 거예요)",
      category: "modal",
      description: "Expressing future plans, intentions, or probabilistic predictions.",
      formula: "No batchim/ㄹ: -ㄹ 거예요 | Batchim: -을 거예요",
    },
    {
      id: "continuous",
      name: "Continuous Action (진행형 -고 있다)",
      category: "indicative",
      description: "Ongoing present action ('is doing').",
      formula: "Verb stem + -고 있어요",
    },
    {
      id: "desire",
      name: "Desire / Wish (-고 싶다)",
      category: "modal",
      description: "Expressing desire ('want to do').",
      formula: "Verb stem + -고 싶어요",
    },
    {
      id: "connective",
      name: "Connective Sequence & Cause (-고 / -아/어서)",
      category: "connective",
      description: "Linking sequential events (-고) or cause-and-effect reason (-아/어서).",
      formula: "Sequence: stem + -고 | Reason: stem + -아/어서",
    },
    {
      id: "conditional",
      name: "Conditional 'If' (-(으)면)",
      category: "plain",
      description: "Expressing conditions or hypothetical prerequisites ('if/when').",
      formula: "No batchim/ㄹ: -면 | Batchim: -으면",
    },
    {
      id: "honorific",
      name: "Subject Honorific (존댓말 -(으)시-)",
      category: "honorific",
      description: "Elevating the person performing the action (elders, teachers, customers).",
      formula: "No batchim: -(으)세요 / -십니다 | Batchim: -으세요 / -으십니다",
    },
  ],
};

// Built-in high quality conjugation tables for common core verbs
export const COMMON_VERB_CONJUGATIONS: Record<string, Record<string, VerbConjugationTable>> = {
  es: {
    hablar: {
      verb: "hablar",
      infinitiveOrRoot: "hablar",
      translation: "to speak, to talk",
      targetLanguage: "Spanish",
      targetLangCode: "es",
      regularity: "regular",
      stemNotes: "Regular -ar verb paradigm",
      forms: [
        {
          id: "present_indicative",
          name: "Present Indicative (Presente)",
          category: "indicative",
          description: "Habitual actions, current states, facts, and immediate future.",
          formula: "habl- + -o, -as, -a, -amos, -áis, -an",
          entries: [
            { personOrForm: "yo", conjugated: "hablo", phonetic: "ah-blo", english: "I speak", example: { target: "Yo hablo español todos los días.", translation: "I speak Spanish every day." } },
            { personOrForm: "tú", conjugated: "hablas", phonetic: "ah-blas", english: "you speak", example: { target: "¿Hablas inglés también?", translation: "Do you speak English too?" } },
            { personOrForm: "él / ella / usted", conjugated: "habla", phonetic: "ah-bla", english: "he/she/you(formal) speaks", example: { target: "Ella habla con mucha claridad.", translation: "She speaks with great clarity." } },
            { personOrForm: "nosotros / nosotras", conjugated: "hablamos", phonetic: "ah-blah-mos", english: "we speak", example: { target: "Nosotros hablamos de proyectos.", translation: "We talk about projects." } },
            { personOrForm: "vosotros / vosotras", conjugated: "habláis", phonetic: "ah-blice", english: "you all speak (Spain)", example: { target: "¿Vosotros habláis con él?", translation: "Do you all speak with him?" } },
            { personOrForm: "ellos / ellas / ustedes", conjugated: "hablan", phonetic: "ah-blan", english: "they / you all speak", example: { target: "Ellos hablan varios idiomas.", translation: "They speak several languages." } },
          ],
        },
        {
          id: "preterite",
          name: "Preterite Past (Pretérito Indefinido)",
          category: "indicative",
          description: "Completed past actions at a specific time.",
          formula: "habl- + -é, -aste, -ó, -amos, -asteis, -aron",
          entries: [
            { personOrForm: "yo", conjugated: "hablé", phonetic: "ah-bleh", english: "I spoke", example: { target: "Ayer hablé con mi profesor.", translation: "Yesterday I spoke with my teacher." } },
            { personOrForm: "tú", conjugated: "hablaste", phonetic: "ah-blahs-teh", english: "you spoke", example: { target: "¿Hablaste con María anoche?", translation: "Did you speak with María last night?" } },
            { personOrForm: "él / ella / usted", conjugated: "habló", phonetic: "ah-bloh", english: "he/she spoke", example: { target: "El director habló en la reunión.", translation: "The director spoke in the meeting." } },
            { personOrForm: "nosotros / nosotras", conjugated: "hablamos", phonetic: "ah-blah-mos", english: "we spoke", example: { target: "Hablamos durante dos horas.", translation: "We spoke for two hours." } },
            { personOrForm: "vosotros / vosotras", conjugated: "hablasteis", phonetic: "ah-blahs-tays", english: "you all spoke", example: { target: "¿Hablasteis del plan?", translation: "Did you all speak about the plan?" } },
            { personOrForm: "ellos / ellas / ustedes", conjugated: "hablaron", phonetic: "ah-blah-ron", english: "they spoke", example: { target: "Ellos hablaron francamente.", translation: "They spoke frankly." } },
          ],
        },
        {
          id: "imperfect",
          name: "Imperfect Past (Pretérito Imperfecto)",
          category: "indicative",
          description: "Ongoing, habitual, or descriptive past actions.",
          formula: "habl- + -aba, -abas, -aba, -ábamos, -abais, -aban",
          entries: [
            { personOrForm: "yo", conjugated: "hablaba", phonetic: "ah-blah-bah", english: "I used to speak / was speaking", example: { target: "De niño hablaba poco.", translation: "As a child I used to speak little." } },
            { personOrForm: "tú", conjugated: "hablabas", phonetic: "ah-blah-bas", english: "you used to speak", example: { target: "¿Hablabas con tus abuelos?", translation: "Did you use to talk with your grandparents?" } },
            { personOrForm: "él / ella / usted", conjugated: "hablaba", phonetic: "ah-blah-bah", english: "he/she used to speak", example: { target: "Ella hablaba mientras caminaba.", translation: "She was speaking while walking." } },
            { personOrForm: "nosotros / nosotras", conjugated: "hablábamos", phonetic: "ah-blah-bah-mos", english: "we used to speak", example: { target: "Hablábamos siempre en la cena.", translation: "We always used to talk at dinner." } },
            { personOrForm: "vosotros / vosotras", conjugated: "hablabais", phonetic: "ah-blah-bice", english: "you all used to speak", example: { target: "¿Hablabais de eso a menudo?", translation: "Did you all use to speak of that often?" } },
            { personOrForm: "ellos / ellas / ustedes", conjugated: "hablaban", phonetic: "ah-blah-ban", english: "they used to speak", example: { target: "Ellos hablaban con entusiasmo.", translation: "They were speaking with enthusiasm." } },
          ],
        },
        {
          id: "future",
          name: "Future Simple (Futuro)",
          category: "indicative",
          description: "Future actions and probability.",
          formula: "hablar + -é, -ás, -á, -emos, -éis, -án",
          entries: [
            { personOrForm: "yo", conjugated: "hablaré", phonetic: "ah-blah-reh", english: "I will speak", example: { target: "Mañana hablaré con el equipo.", translation: "Tomorrow I will speak with the team." } },
            { personOrForm: "tú", conjugated: "hablarás", phonetic: "ah-blah-rahs", english: "you will speak", example: { target: "¿Hablarás en la conferencia?", translation: "Will you speak at the conference?" } },
            { personOrForm: "él / ella / usted", conjugated: "hablará", phonetic: "ah-blah-rah", english: "he/she will speak", example: { target: "El experto hablará a las diez.", translation: "The expert will speak at ten." } },
            { personOrForm: "nosotros / nosotras", conjugated: "hablaremos", phonetic: "ah-blah-reh-mos", english: "we will speak", example: { target: "Hablaremos de esto luego.", translation: "We will talk about this later." } },
            { personOrForm: "vosotros / vosotras", conjugated: "hablaréis", phonetic: "ah-blah-rays", english: "you all will speak", example: { target: "Pronto hablaréis con fluidez.", translation: "Soon you all will speak fluently." } },
            { personOrForm: "ellos / ellas / ustedes", conjugated: "hablarán", phonetic: "ah-blah-ran", english: "they will speak", example: { target: "Ellos hablarán después del almuerzo.", translation: "They will speak after lunch." } },
          ],
        },
        {
          id: "present_subjunctive",
          name: "Present Subjunctive (Presente de Subjuntivo)",
          category: "subjunctive",
          description: "Wishes, doubts, recommendations, and hypotheticals.",
          formula: "habl- + -e, -es, -e, -emos, -éis, -en",
          entries: [
            { personOrForm: "yo", conjugated: "hable", phonetic: "ah-bleh", english: "that I speak", example: { target: "Quieren que yo hable primero.", translation: "They want me to speak first." } },
            { personOrForm: "tú", conjugated: "hables", phonetic: "ah-bles", english: "that you speak", example: { target: "Espero que hables con ella.", translation: "I hope you speak with her." } },
            { personOrForm: "él / ella / usted", conjugated: "hable", phonetic: "ah-bleh", english: "that he/she speaks", example: { target: "Es importante que él hable.", translation: "It is important that he speaks." } },
            { personOrForm: "nosotros / nosotras", conjugated: "hablemos", phonetic: "ah-bleh-mos", english: "that we speak", example: { target: "Sugiero que hablemos ahora.", translation: "I suggest that we speak now." } },
            { personOrForm: "vosotros / vosotras", conjugated: "habléis", phonetic: "ah-blays", english: "that you all speak", example: { target: "Dudo que habléis en público.", translation: "I doubt that you all speak in public." } },
            { personOrForm: "ellos / ellas / ustedes", conjugated: "hablen", phonetic: "ah-blen", english: "that they speak", example: { target: "Ojalá que hablen pronto.", translation: "Hopefully they speak soon." } },
          ],
        },
        {
          id: "imperative",
          name: "Affirmative Imperative (Imperativo)",
          category: "imperative",
          description: "Commands and direct requests.",
          formula: "tú habla | usted hable | nosotros hablemos | ustedes hablen",
          entries: [
            { personOrForm: "tú (informal)", conjugated: "¡habla!", phonetic: "ah-bla", english: "speak!", example: { target: "¡Habla más despacio, por favor!", translation: "Speak more slowly, please!" } },
            { personOrForm: "usted (formal)", conjugated: "¡hable!", phonetic: "ah-bleh", english: "speak! (formal)", example: { target: "¡Hable con confianza!", translation: "Speak with confidence!" } },
            { personOrForm: "nosotros (let's)", conjugated: "¡hablemos!", phonetic: "ah-bleh-mos", english: "let's speak!", example: { target: "¡Hablemos en español!", translation: "Let's speak in Spanish!" } },
            { personOrForm: "ustedes (plural)", conjugated: "¡hablen!", phonetic: "ah-blen", english: "speak! (you all)", example: { target: "¡Hablen sin miedo!", translation: "Speak without fear!" } },
          ],
        },
        {
          id: "gerund_participle",
          name: "Gerund & Participle (Gerundio y Participio)",
          category: "participle",
          description: "Non-finite forms for continuous and compound constructions.",
          formula: "Gerund: hablando | Participle: hablado",
          entries: [
            { personOrForm: "Gerundio (Progressive)", conjugated: "hablando", phonetic: "ah-blahn-doh", english: "speaking", example: { target: "Estoy hablando por teléfono.", translation: "I am speaking on the phone." } },
            { personOrForm: "Participio (Perfect)", conjugated: "hablado", phonetic: "ah-blah-doh", english: "spoken", example: { target: "Hemos hablado de esa idea.", translation: "We have spoken about that idea." } },
          ],
        },
      ],
    },

    ser: {
      verb: "ser",
      infinitiveOrRoot: "ser",
      translation: "to be (essential qualities, identity, origin, time)",
      targetLanguage: "Spanish",
      targetLangCode: "es",
      regularity: "irregular",
      stemNotes: "Highly irregular fundamental verb",
      forms: [
        {
          id: "present_indicative",
          name: "Present Indicative (Presente)",
          category: "indicative",
          description: "Identity, profession, nationality, origin, characteristic.",
          formula: "soy, eres, es, somos, sois, son",
          entries: [
            { personOrForm: "yo", conjugated: "soy", phonetic: "soy", english: "I am", example: { target: "Soy estudiante de idiomas.", translation: "I am a language student." } },
            { personOrForm: "tú", conjugated: "eres", phonetic: "eh-res", english: "you are", example: { target: "¿Eres de España?", translation: "Are you from Spain?" } },
            { personOrForm: "él / ella / usted", conjugated: "es", phonetic: "es", english: "he/she is", example: { target: "Madrid es una ciudad hermosa.", translation: "Madrid is a beautiful city." } },
            { personOrForm: "nosotros / nosotras", conjugated: "somos", phonetic: "soh-mos", english: "we are", example: { target: "Somos amigos desde hace años.", translation: "We are friends for years." } },
            { personOrForm: "vosotros / vosotras", conjugated: "sois", phonetic: "soys", english: "you all are", example: { target: "Vosotros sois muy amables.", translation: "You all are very kind." } },
            { personOrForm: "ellos / ellas / ustedes", conjugated: "son", phonetic: "son", english: "they are", example: { target: "Ellos son ingenieros.", translation: "They are engineers." } },
          ],
        },
        {
          id: "preterite",
          name: "Preterite Past (Pretérito Indefinido)",
          category: "indicative",
          description: "Completed past event or definitive state.",
          formula: "fui, fuiste, fue, fuimos, fuisteis, fueron",
          entries: [
            { personOrForm: "yo", conjugated: "fui", phonetic: "fwee", english: "I was", example: { target: "Fui el primero en llegar.", translation: "I was the first to arrive." } },
            { personOrForm: "tú", conjugated: "fuiste", phonetic: "fwees-teh", english: "you were", example: { target: "¿Fuiste voluntario el año pasado?", translation: "Were you a volunteer last year?" } },
            { personOrForm: "él / ella / usted", conjugated: "fue", phonetic: "fweh", english: "he/she was", example: { target: "La fiesta fue increíble.", translation: "The party was incredible." } },
            { personOrForm: "nosotros / nosotras", conjugated: "fuimos", phonetic: "fwee-mos", english: "we were", example: { target: "Fuimos compañeros de clase.", translation: "We were classmates." } },
            { personOrForm: "vosotros / vosotras", conjugated: "fuisteis", phonetic: "fwees-tays", english: "you all were", example: { target: "¿Fuisteis felices allí?", translation: "Were you all happy there?" } },
            { personOrForm: "ellos / ellas / ustedes", conjugated: "fueron", phonetic: "fweh-ron", english: "they were", example: { target: "Ellos fueron muy generosos.", translation: "They were very generous." } },
          ],
        },
        {
          id: "imperfect",
          name: "Imperfect Past (Pretérito Imperfecto)",
          category: "indicative",
          description: "Describing past qualities, conditions, and background.",
          formula: "era, eras, era, éramos, erais, eran",
          entries: [
            { personOrForm: "yo", conjugated: "era", phonetic: "eh-rah", english: "I was / used to be", example: { target: "Cuando era joven, leía mucho.", translation: "When I was young, I read a lot." } },
            { personOrForm: "tú", conjugated: "eras", phonetic: "eh-ras", english: "you were", example: { target: "Tú eras muy tímido.", translation: "You used to be very shy." } },
            { personOrForm: "él / ella / usted", conjugated: "era", phonetic: "eh-rah", english: "he/she was", example: { target: "La casa era grande y luminosa.", translation: "The house was big and bright." } },
            { personOrForm: "nosotros / nosotras", conjugated: "éramos", phonetic: "eh-rah-mos", english: "we were", example: { target: "Éramos inseparables.", translation: "We were inseparable." } },
            { personOrForm: "vosotros / vosotras", conjugated: "erais", phonetic: "eh-rice", english: "you all were", example: { target: "¿Erais vecinos antes?", translation: "Were you all neighbors before?" } },
            { personOrForm: "ellos / ellas / ustedes", conjugated: "eran", phonetic: "eh-ran", english: "they were", example: { target: "Eran las tres de la tarde.", translation: "It was three in the afternoon." } },
          ],
        },
        {
          id: "present_subjunctive",
          name: "Present Subjunctive (Presente de Subjuntivo)",
          category: "subjunctive",
          description: "Wishes, advice, and hypotheticals regarding identity.",
          formula: "sea, seas, sea, seamos, seáis, sean",
          entries: [
            { personOrForm: "yo", conjugated: "sea", phonetic: "seh-ah", english: "that I be", example: { target: "Aunque sea difícil, lo haré.", translation: "Even if it be difficult, I will do it." } },
            { personOrForm: "tú", conjugated: "seas", phonetic: "seh-as", english: "that you be", example: { target: "Quiero que seas feliz.", translation: "I want you to be happy." } },
            { personOrForm: "él / ella / usted", conjugated: "sea", phonetic: "seh-ah", english: "that he/she be", example: { target: "Espero que sea puntual.", translation: "I hope he is punctual." } },
            { personOrForm: "nosotros / nosotras", conjugated: "seamos", phonetic: "seh-ah-mos", english: "that we be", example: { target: "Es mejor que seamos honestos.", translation: "It is better that we be honest." } },
            { personOrForm: "vosotros / vosotras", conjugated: "seáis", phonetic: "seh-ice", english: "that you all be", example: { target: "Dudo que seáis hermanos.", translation: "I doubt you all are siblings." } },
            { personOrForm: "ellos / ellas / ustedes", conjugated: "sean", phonetic: "seh-an", english: "that they be", example: { target: "Pido que sean pacientes.", translation: "I ask that they be patient." } },
          ],
        },
      ],
    },

    tener: {
      verb: "tener",
      infinitiveOrRoot: "tener",
      translation: "to have, to possess",
      targetLanguage: "Spanish",
      targetLangCode: "es",
      regularity: "irregular",
      stemNotes: "Go-verb & e->ie stem-changing in present; irregular pretérito tuv-",
      forms: [
        {
          id: "present_indicative",
          name: "Present Indicative (Presente)",
          category: "indicative",
          description: "Possession, age (tener X años), sensations (tener hambre/frío/miedo).",
          formula: "tengo, tienes, tiene, tenemos, tenéis, tienen",
          entries: [
            { personOrForm: "yo", conjugated: "tengo", phonetic: "ten-goh", english: "I have", example: { target: "Tengo muchas ganas de aprender.", translation: "I have a big desire to learn." } },
            { personOrForm: "tú", conjugated: "tienes", phonetic: "tee-eh-nes", english: "you have", example: { target: "¿Tienes tiempo hoy?", translation: "Do you have time today?" } },
            { personOrForm: "él / ella / usted", conjugated: "tiene", phonetic: "tee-eh-neh", english: "he/she has", example: { target: "Ella tiene veinticinco años.", translation: "She is 25 years old." } },
            { personOrForm: "nosotros / nosotras", conjugated: "tenemos", phonetic: "teh-neh-mos", english: "we have", example: { target: "Tenemos una reunión a las tres.", translation: "We have a meeting at three." } },
            { personOrForm: "vosotros / vosotras", conjugated: "tenéis", phonetic: "teh-nays", english: "you all have", example: { target: "¿Tenéis alguna pregunta?", translation: "Do you all have any questions?" } },
            { personOrForm: "ellos / ellas / ustedes", conjugated: "tienen", phonetic: "tee-eh-nen", english: "they have", example: { target: "Ellos tienen razón.", translation: "They are right (have reason)." } },
          ],
        },
        {
          id: "preterite",
          name: "Preterite Past (Pretérito Indefinido)",
          category: "indicative",
          description: "Had / obtained at a specific point in time.",
          formula: "tuve, tuviste, tuvo, tuvimos, tuvisteis, tuvieron",
          entries: [
            { personOrForm: "yo", conjugated: "tuve", phonetic: "too-veh", english: "I had / received", example: { target: "Ayer tuve una sorpresa agradable.", translation: "Yesterday I had a pleasant surprise." } },
            { personOrForm: "tú", conjugated: "tuviste", phonetic: "too-vees-teh", english: "you had", example: { target: "¿Tuviste suerte en el examen?", translation: "Did you have luck on the exam?" } },
            { personOrForm: "él / ella / usted", conjugated: "tuvo", phonetic: "too-voh", english: "he/she had", example: { target: "El coche tuvo una avería.", translation: "The car had a breakdown." } },
            { personOrForm: "nosotros / nosotras", conjugated: "tuvimos", phonetic: "too-vee-mos", english: "we had", example: { target: "Tuvimos que esperar un poco.", translation: "We had to wait a little." } },
            { personOrForm: "vosotros / vosotras", conjugated: "tuvisteis", phonetic: "too-vees-tays", english: "you all had", example: { target: "¿Tuvisteis problemas con el tren?", translation: "Did you all have issues with the train?" } },
            { personOrForm: "ellos / ellas / ustedes", conjugated: "tuvieron", phonetic: "too-vyeh-ron", english: "they had", example: { target: "Ellos tuvieron una gran idea.", translation: "They had a great idea." } },
          ],
        },
      ],
    },
  },

  ja: {
    話す: {
      verb: "話す (hanasu)",
      infinitiveOrRoot: "話す",
      translation: "to speak, to talk",
      targetLanguage: "Japanese",
      targetLangCode: "ja",
      regularity: "regular (Godan)",
      stemNotes: "Godan verb with す root consonant",
      forms: [
        {
          id: "polite_masu",
          name: "Polite Non-Past (ます形)",
          category: "polite",
          description: "Standard polite statement for current actions or future events.",
          formula: "話す -> 話します (hanashimasu)",
          entries: [
            { personOrForm: "Affirmative (Present)", conjugated: "話します (hanashimasu)", phonetic: "ha-na-shi-ma-su", english: "speak / will speak", example: { target: "日本語を話します。", translation: "I speak Japanese." } },
            { personOrForm: "Negative (Present)", conjugated: "話しません (hanashimasen)", phonetic: "ha-na-shi-ma-sen", english: "do not speak", example: { target: "ドイツ語は話しません。", translation: "I do not speak German." } },
          ],
        },
        {
          id: "te_form",
          name: "Te-form (て形)",
          category: "connective",
          description: "Connecting sentences, making requests, continuous aspect.",
          formula: "話す -> 話して (hanashite)",
          entries: [
            { personOrForm: "Te-form Base", conjugated: "話して (hanashite)", phonetic: "ha-na-shi-te", english: "speaking / and speaking", example: { target: "ゆっくり話してください。", translation: "Please speak slowly." } },
            { personOrForm: "Progressive (~ています)", conjugated: "話しています (hanashite imasu)", phonetic: "ha-na-shi-te-i-ma-su", english: "is speaking / am speaking", example: { target: "今、先生と話しています。", translation: "I am talking with the teacher now." } },
          ],
        },
        {
          id: "past_ta",
          name: "Plain Past (た形)",
          category: "plain",
          description: "Casual completed past action.",
          formula: "話す -> 話した (hanashita)",
          entries: [
            { personOrForm: "Plain Past Affirmative", conjugated: "話した (hanashita)", phonetic: "ha-na-shi-ta", english: "spoke", example: { target: "昨日友達と話した。", translation: "I spoke with my friend yesterday." } },
            { personOrForm: "Plain Past Negative", conjugated: "話さなかった (hanasanakatta)", phonetic: "ha-na-sa-na-kat-ta", english: "did not speak", example: { target: "その事は話さなかった。", translation: "I didn't talk about that matter." } },
          ],
        },
        {
          id: "potential",
          name: "Potential Form (可能形)",
          category: "modal",
          description: "Ability to speak ('can speak').",
          formula: "話す -> 話せる (hanaseru) / 話せます (hanasemasu)",
          entries: [
            { personOrForm: "Plain Potential", conjugated: "話せる (hanaseru)", phonetic: "ha-na-se-ru", english: "can speak", example: { target: "英語が少し話せる。", translation: "I can speak a little English." } },
            { personOrForm: "Polite Potential", conjugated: "話せます (hanasemasu)", phonetic: "ha-na-se-ma-su", english: "can speak (polite)", example: { target: "スペイン語が話せます。", translation: "I can speak Spanish." } },
          ],
        },
      ],
    },

    食べる: {
      verb: "食べる (taberu)",
      infinitiveOrRoot: "食べる",
      translation: "to eat",
      targetLanguage: "Japanese",
      targetLangCode: "ja",
      regularity: "regular (Ichidan / Ru-verb)",
      stemNotes: "Ichidan verb: drop る to add endings",
      forms: [
        {
          id: "polite_masu",
          name: "Polite Non-Past (ます形)",
          category: "polite",
          description: "Standard polite statement for eating.",
          formula: "食べ + ます -> 食べます (tabemasu)",
          entries: [
            { personOrForm: "Affirmative (Polite)", conjugated: "食べます (tabemasu)", phonetic: "ta-be-ma-su", english: "eat / will eat", example: { target: "毎朝朝ごはんを食べます。", translation: "I eat breakfast every morning." } },
            { personOrForm: "Negative (Polite)", conjugated: "食べません (tabemasen)", phonetic: "ta-be-ma-sen", english: "do not eat", example: { target: "辛い物は食べません。", translation: "I do not eat spicy food." } },
          ],
        },
        {
          id: "te_form",
          name: "Te-form (て形)",
          category: "connective",
          description: "Requests, sequential eating, continuous aspect.",
          formula: "食べ + て -> 食べて (tabete)",
          entries: [
            { personOrForm: "Te-form Base", conjugated: "食べて (tabete)", phonetic: "ta-be-te", english: "eating / and eat", example: { target: "これを食べてみてください。", translation: "Please try eating this." } },
            { personOrForm: "Progressive (~ています)", conjugated: "食べています (tabete imasu)", phonetic: "ta-be-te-i-ma-su", english: "is eating / am eating", example: { target: "今ラーメンを食べています。", translation: "I am eating ramen right now." } },
          ],
        },
        {
          id: "tai_form",
          name: "Desire Form (たい形)",
          category: "modal",
          description: "Expressing desire to eat ('want to eat').",
          formula: "食べ + たい -> 食べたい (tabetai)",
          entries: [
            { personOrForm: "Plain Desire", conjugated: "食べたい (tabetai)", phonetic: "ta-be-ta-i", english: "want to eat", example: { target: "寿司が食べたい。", translation: "I want to eat sushi." } },
            { personOrForm: "Polite Desire", conjugated: "食べたいです (tabetai desu)", phonetic: "ta-be-ta-i-de-su", english: "want to eat (polite)", example: { target: "和菓子が食べたいです。", translation: "I would like to eat Japanese sweets." } },
          ],
        },
      ],
    },
  },

  ko: {
    하다: {
      verb: "하다",
      infinitiveOrRoot: "하다",
      translation: "to do, to perform (fundamental verb & suffix builder)",
      targetLanguage: "Korean",
      targetLangCode: "ko",
      regularity: "irregular / fundamental paradigm",
      stemNotes: "Root 하- undergoes regular vowel change (하 + 여 -> 해). Used to turn nouns into verbs (공부하다, 운동하다).",
      forms: [
        {
          id: "present_polite",
          name: "Present Informal Polite (해요체)",
          category: "polite",
          description: "Everyday conversational present ending for doing.",
          formula: "하- + 여요 -> 해요",
          entries: [
            { personOrForm: "Affirmative (Polite)", conjugated: "해요", phonetic: "hae-yo", english: "do / does / will do", example: { target: "한국어를 열심히 공부해요.", translation: "I study Korean hard." } },
            { personOrForm: "Negative (Polite)", conjugated: "안 해요 / 하지 않아요", phonetic: "an hae-yo", english: "do not do", example: { target: "오늘은 운동을 안 해요.", translation: "I don't exercise today." } },
            { personOrForm: "Question (Polite)", conjugated: "해요?", phonetic: "hae-yo?", english: "do you do?", example: { target: "지금 뭐 해요?", translation: "What are you doing now?" } },
          ],
        },
        {
          id: "formal_polite",
          name: "Formal Polite (하십시오체)",
          category: "honorific",
          description: "Formal presentations, news broadcasts, business announcements.",
          formula: "하- + ㅂ니다 -> 합니다",
          entries: [
            { personOrForm: "Formal Statement", conjugated: "합니다", phonetic: "ham-ni-da", english: "do / will do (formal)", example: { target: "지금부터 회의를 시작합니다.", translation: "We will start the meeting now." } },
            { personOrForm: "Formal Question", conjugated: "합니까?", phonetic: "ham-ni-kka", english: "do you do? (formal)", example: { target: "무슨 일을 하십니까?", translation: "What kind of work do you do?" } },
            { personOrForm: "Formal Negative", conjugated: "하지 않습니다", phonetic: "ha-ji an-seum-ni-da", english: "do not do (formal)", example: { target: "거짓말을 하지 않습니다.", translation: "I do not tell lies." } },
          ],
        },
        {
          id: "past_polite",
          name: "Past Polite (과거형)",
          category: "polite",
          description: "Completed past actions in polite speech.",
          formula: "하- + 였어요 -> 했어요",
          entries: [
            { personOrForm: "Past Affirmative", conjugated: "했어요", phonetic: "haes-seo-yo", english: "did", example: { target: "숙제를 다 했어요.", translation: "I did all my homework." } },
            { personOrForm: "Past Formal", conjugated: "했습니다", phonetic: "haes-seum-ni-da", english: "did (formal)", example: { target: "준비를 완료했습니다.", translation: "I completed the preparations." } },
            { personOrForm: "Past Negative", conjugated: "안 했어요", phonetic: "an haes-seo-yo", english: "did not do", example: { target: "아침 식사를 안 했어요.", translation: "I didn't have breakfast." } },
          ],
        },
        {
          id: "future_intent",
          name: "Future / Intention (-(으)ㄹ 거예요)",
          category: "modal",
          description: "Future plans, intentions, and predictions.",
          formula: "하- + ㄹ 거예요 -> 할 거예요",
          entries: [
            { personOrForm: "Future Plan", conjugated: "할 거예요", phonetic: "hal geo-ye-yo", english: "will do / plan to do", example: { target: "내일 친구와 여행을 할 거예요.", translation: "I will go on a trip with a friend tomorrow." } },
            { personOrForm: "Formal Future", conjugated: "하겠습니까 / 하겠습니다", phonetic: "ha-ges-seum-ni-da", english: "will do (determined/formal)", example: { target: "최선을 다하겠습니다.", translation: "I will do my best." } },
          ],
        },
        {
          id: "continuous",
          name: "Continuous Action (진행형 -고 있다)",
          category: "indicative",
          description: "Ongoing present action ('is doing').",
          formula: "하- + -고 있어요 -> 하고 있어요",
          entries: [
            { personOrForm: "Present Progressive", conjugated: "하고 있어요", phonetic: "ha-go is-seo-yo", english: "is/are doing right now", example: { target: "지금 전화 통화하고 있어요.", translation: "I am on the phone right now." } },
            { personOrForm: "Past Progressive", conjugated: "하고 있었어요", phonetic: "ha-go is-seos-seo-yo", english: "was doing", example: { target: "그때 청소를 하고 있었어요.", translation: "I was cleaning at that time." } },
          ],
        },
        {
          id: "desire",
          name: "Desire / Wish (-고 싶다)",
          category: "modal",
          description: "Expressing desire to do ('want to do').",
          formula: "하- + -고 싶어요 -> 하고 싶어요",
          entries: [
            { personOrForm: "Polite Desire", conjugated: "하고 싶어요", phonetic: "ha-go si-peo-yo", english: "want to do", example: { target: "한국 여행을 하고 싶어요.", translation: "I want to travel in Korea." } },
            { personOrForm: "Negative Desire", conjugated: "하고 싶지 않아요", phonetic: "ha-go sip-ji an-a-yo", english: "do not want to do", example: { target: "야근을 하고 싶지 않아요.", translation: "I don't want to work overtime." } },
          ],
        },
        {
          id: "connective",
          name: "Connective Sequence & Reason (-고 / -아/어서)",
          category: "connective",
          description: "Linking actions sequentially (-고) or giving a cause/reason (-어서).",
          formula: "Sequence: 하고 | Reason: 해서",
          entries: [
            { personOrForm: "Sequential (-고)", conjugated: "하고", phonetic: "ha-go", english: "do and then...", example: { target: "운동을 하고 샤워를 해요.", translation: "I exercise and then take a shower." } },
            { personOrForm: "Reason / Cause (-어서)", conjugated: "해서", phonetic: "hae-seo", english: "do, so / because of doing", example: { target: "열심히 공부해서 시험에 합격했어요.", translation: "I studied hard, so I passed the exam." } },
          ],
        },
        {
          id: "conditional",
          name: "Conditional 'If' (-(으)면)",
          category: "plain",
          description: "Expressing 'if you do' or 'when you do'.",
          formula: "하- + 면 -> 하면",
          entries: [
            { personOrForm: "Conditional (If)", conjugated: "하면", phonetic: "ha-myeon", english: "if (one) does / when doing", example: { target: "매일 연습하면 실력이 늘어요.", translation: "If you practice every day, your skills improve." } },
          ],
        },
        {
          id: "honorific",
          name: "Honorific Polite (-(으)세요)",
          category: "honorific",
          description: "Polite request, instruction, or speaking about elders/superiors.",
          formula: "하- + 세요 -> 하세요",
          entries: [
            { personOrForm: "Honorific / Polite Command", conjugated: "하세요", phonetic: "ha-se-yo", english: "please do / (honorific subject) does", example: { target: "편하게 말씀하세요.", translation: "Please speak comfortably." } },
            { personOrForm: "Formal Honorific", conjugated: "하십니다", phonetic: "ha-sim-ni-da", english: "does (high honorific)", example: { target: "선생님께서 강의를 하십니다.", translation: "The professor gives a lecture." } },
          ],
        },
      ],
    },

    가다: {
      verb: "가다",
      infinitiveOrRoot: "가다",
      translation: "to go",
      targetLanguage: "Korean",
      targetLangCode: "ko",
      regularity: "regular",
      stemNotes: "Root 가- (vowel ㅏ contraction: 가 + 아요 -> 가요)",
      forms: [
        {
          id: "present_polite",
          name: "Present Informal Polite (해요체)",
          category: "polite",
          description: "Everyday conversation ending for going.",
          formula: "가- + 아요 -> 가요",
          entries: [
            { personOrForm: "Affirmative (Polite)", conjugated: "가요", phonetic: "ga-yo", english: "go / am going", example: { target: "지금 학교에 가요.", translation: "I am going to school now." } },
            { personOrForm: "Negative (Polite)", conjugated: "안 가요", phonetic: "an ga-yo", english: "do not go", example: { target: "오늘은 파티에 안 가요.", translation: "I'm not going to the party today." } },
          ],
        },
        {
          id: "formal_polite",
          name: "Formal Polite (하십시오체)",
          category: "honorific",
          description: "High respect or broadcast formal ending.",
          formula: "가- + ㅂ니다 -> 갑니다",
          entries: [
            { personOrForm: "Formal Statement", conjugated: "갑니다", phonetic: "gam-ni-da", english: "go / will go (formal)", example: { target: "서울로 출장을 갑니다.", translation: "I am going on a business trip to Seoul." } },
          ],
        },
        {
          id: "past_polite",
          name: "Past Polite (과거형)",
          category: "polite",
          description: "Completed travel / departure in the past.",
          formula: "가- + 았어요 -> 갔어요",
          entries: [
            { personOrForm: "Past Affirmative", conjugated: "갔어요", phonetic: "gas-seo-yo", english: "went", example: { target: "어제 서울에 갔어요.", translation: "I went to Seoul yesterday." } },
          ],
        },
        {
          id: "desire",
          name: "Desire / Wish (-고 싶다)",
          category: "modal",
          description: "Expressing desire to go ('want to go').",
          formula: "가- + -고 싶어요 -> 가고 싶어요",
          entries: [
            { personOrForm: "Polite Desire", conjugated: "가고 싶어요", phonetic: "ga-go-sip-eo-yo", english: "want to go", example: { target: "제주도에 정말 가고 싶어요.", translation: "I really want to go to Jeju Island." } },
          ],
        },
        {
          id: "future_intent",
          name: "Future / Intention (-(으)ㄹ 거예요)",
          category: "modal",
          description: "Future travel plans.",
          formula: "가- + ㄹ 거예요 -> 갈 거예요",
          entries: [
            { personOrForm: "Future Plan", conjugated: "갈 거예요", phonetic: "gal geo-ye-yo", english: "will go / plan to go", example: { target: "다음 달에 한국에 갈 거예요.", translation: "I will go to Korea next month." } },
          ],
        },
      ],
    },

    먹다: {
      verb: "먹다",
      infinitiveOrRoot: "먹다",
      translation: "to eat",
      targetLanguage: "Korean",
      targetLangCode: "ko",
      regularity: "regular (dark vowel stem)",
      stemNotes: "Stem 먹- has batchim ㄱ. Takes ㅓ-series endings (먹 + 어요).",
      forms: [
        {
          id: "present_polite",
          name: "Present Informal Polite (해요체)",
          category: "polite",
          description: "Everyday conversation ending for eating.",
          formula: "먹- + 어요 -> 먹어요",
          entries: [
            { personOrForm: "Affirmative (Polite)", conjugated: "먹어요", phonetic: "meo-geo-yo", english: "eat / am eating", example: { target: "아침마다 사과를 먹어요.", translation: "I eat an apple every morning." } },
            { personOrForm: "Negative (Polite)", conjugated: "안 먹어요", phonetic: "an meo-geo-yo", english: "do not eat", example: { target: "매운 음식은 잘 안 먹어요.", translation: "I don't really eat spicy food." } },
          ],
        },
        {
          id: "formal_polite",
          name: "Formal Polite (하십시오체)",
          category: "honorific",
          description: "Formal ending for eating.",
          formula: "먹- + 습니다 -> 먹습니다",
          entries: [
            { personOrForm: "Formal Statement", conjugated: "먹습니다", phonetic: "meok-seum-ni-da", english: "eat (formal)", example: { target: "한국 음식을 맛있게 먹습니다.", translation: "I enjoy eating Korean food." } },
          ],
        },
        {
          id: "past_polite",
          name: "Past Polite (과거형)",
          category: "polite",
          description: "Completed meal in the past.",
          formula: "먹- + 었어요 -> 먹었어요",
          entries: [
            { personOrForm: "Past Affirmative", conjugated: "먹었어요", phonetic: "meo-geos-seo-yo", english: "ate", example: { target: "점심에 비빔밥을 먹었어요.", translation: "I ate bibimbap for lunch." } },
          ],
        },
        {
          id: "desire",
          name: "Desire / Wish (-고 싶다)",
          category: "modal",
          description: "Expressing desire to eat.",
          formula: "먹- + -고 싶어요 -> 먹고 싶어요",
          entries: [
            { personOrForm: "Polite Desire", conjugated: "먹고 싶어요", phonetic: "meok-go si-peo-yo", english: "want to eat", example: { target: "떡볶이가 정말 먹고 싶어요.", translation: "I really want to eat tteokbokki." } },
          ],
        },
      ],
    },
  },
};

// Heuristic rule-based fallback generator for any verb in Spanish, Japanese, or Korean
export function generateLocalConjugation(
  verbInput: string,
  targetLangCode: string
): VerbConjugationTable | null {
  if (!verbInput) return null;
  // Clean input: remove parentheses, brackets, and extra tokens
  const stripped = verbInput.replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").trim();
  const clean = stripped.split(/[\s—\/:;,]/)[0].trim() || verbInput.trim();
  const lower = clean.toLowerCase();
  const fullLower = verbInput.toLowerCase();

  // Check direct common database match first
  const langTable = COMMON_VERB_CONJUGATIONS[targetLangCode];
  if (langTable) {
    // 1. Exact match on clean token
    if (langTable[clean]) {
      return langTable[clean];
    }
    // 2. Scan keys for partial inclusion
    for (const key of Object.keys(langTable)) {
      const kLower = key.toLowerCase();
      if (
        kLower === lower ||
        fullLower.includes(kLower) ||
        kLower.includes(lower) ||
        clean.includes(key) ||
        key.includes(clean)
      ) {
        return langTable[key];
      }
    }
  }

  // Spanish Regular Rule Generator
  if (targetLangCode === "es") {
    let ending = "";
    if (lower.endsWith("ar")) ending = "ar";
    else if (lower.endsWith("er")) ending = "er";
    else if (lower.endsWith("ir")) ending = "ir";

    if (ending) {
      const stem = clean.slice(0, -2);
      const isAr = ending === "ar";
      const isEr = ending === "er";

      return {
        verb: clean,
        infinitiveOrRoot: clean,
        translation: `to ${clean}`,
        targetLanguage: "Spanish",
        targetLangCode: "es",
        regularity: "regular",
        stemNotes: `Regular -${ending} conjugation pattern (stem: ${stem})`,
        forms: [
          {
            id: "present_indicative",
            name: "Present Indicative (Presente)",
            category: "indicative",
            description: "Habitual actions, current states, facts, and immediate future.",
            formula: isAr ? `${stem} + -o, -as, -a, -amos, -áis, -an` : `${stem} + -o, -es, -e, -emos/-imos, -éis/-ís, -en`,
            entries: [
              { personOrForm: "yo", conjugated: `${stem}o`, english: `I ${clean}`, example: { target: `Yo ${stem}o a diario.`, translation: `I ${clean} daily.` } },
              { personOrForm: "tú", conjugated: `${stem}${isAr ? "as" : "es"}`, english: `you ${clean}`, example: { target: `¿Tú ${stem}${isAr ? "as" : "es"} a menudo?`, translation: `Do you ${clean} often?` } },
              { personOrForm: "él / ella / usted", conjugated: `${stem}${isAr ? "a" : "e"}`, english: `he/she ${clean}s`, example: { target: `Ella ${stem}${isAr ? "a" : "e"} muy bien.`, translation: `She ${clean}s very well.` } },
              { personOrForm: "nosotros / nosotras", conjugated: `${stem}${isAr ? "amos" : isEr ? "emos" : "imos"}`, english: `we ${clean}`, example: { target: `Nosotros ${stem}${isAr ? "amos" : isEr ? "emos" : "imos"} juntos.`, translation: `We ${clean} together.` } },
              { personOrForm: "vosotros / vosotras", conjugated: `${stem}${isAr ? "áis" : isEr ? "éis" : "ís"}`, english: `you all ${clean}`, example: { target: `¿Vosotros ${stem}${isAr ? "áis" : isEr ? "éis" : "ís"} hoy?`, translation: `Do you all ${clean} today?` } },
              { personOrForm: "ellos / ellas / ustedes", conjugated: `${stem}${isAr ? "an" : "en"}`, english: `they ${clean}`, example: { target: `Ellos ${stem}${isAr ? "an" : "en"} con alegría.`, translation: `They ${clean} joyfully.` } },
            ],
          },
          {
            id: "preterite",
            name: "Preterite Past (Pretérito Indefinido)",
            category: "indicative",
            description: "Completed actions in the past.",
            formula: isAr ? `${stem} + -é, -aste, -ó, -amos, -asteis, -aron` : `${stem} + -í, -iste, -ió, -imos, -isteis, -ieron`,
            entries: [
              { personOrForm: "yo", conjugated: `${stem}${isAr ? "é" : "í"}`, english: `I ${clean}ed` },
              { personOrForm: "tú", conjugated: `${stem}${isAr ? "aste" : "iste"}`, english: `you ${clean}ed` },
              { personOrForm: "él / ella / usted", conjugated: `${stem}${isAr ? "ó" : "ió"}`, english: `he/she ${clean}ed` },
              { personOrForm: "nosotros / nosotras", conjugated: `${stem}${isAr ? "amos" : "imos"}`, english: `we ${clean}ed` },
              { personOrForm: "ellos / ellas / ustedes", conjugated: `${stem}${isAr ? "aron" : "ieron"}`, english: `they ${clean}ed` },
            ],
          },
          {
            id: "future",
            name: "Future Simple (Futuro)",
            category: "indicative",
            description: "Future actions and intentions.",
            formula: `${clean} + -é, -ás, -á, -emos, -éis, -án`,
            entries: [
              { personOrForm: "yo", conjugated: `${clean}é`, english: `I will ${clean}` },
              { personOrForm: "tú", conjugated: `${clean}ás`, english: `you will ${clean}` },
              { personOrForm: "él / ella / usted", conjugated: `${clean}á`, english: `he/she will ${clean}` },
              { personOrForm: "nosotros / nosotras", conjugated: `${clean}emos`, english: `we will ${clean}` },
              { personOrForm: "ellos / ellas / ustedes", conjugated: `${clean}án`, english: `they will ${clean}` },
            ],
          },
          {
            id: "present_subjunctive",
            name: "Present Subjunctive (Presente de Subjuntivo)",
            category: "subjunctive",
            description: "Wishes, recommendations, and hypotheticals.",
            formula: isAr ? `${stem} + -e, -es, -e, -emos, -éis, -en` : `${stem} + -a, -as, -a, -amos, -áis, -an`,
            entries: [
              { personOrForm: "yo / él / ella", conjugated: `${stem}${isAr ? "e" : "a"}`, english: `that I/he/she ${clean}` },
              { personOrForm: "tú", conjugated: `${stem}${isAr ? "es" : "as"}`, english: `that you ${clean}` },
              { personOrForm: "nosotros / nosotras", conjugated: `${stem}${isAr ? "emos" : "amos"}`, english: `that we ${clean}` },
              { personOrForm: "ellos / ellas / ustedes", conjugated: `${stem}${isAr ? "en" : "an"}`, english: `that they ${clean}` },
            ],
          },
          {
            id: "gerund_participle",
            name: "Gerund & Participle (Gerundio y Participio)",
            category: "participle",
            description: "Progressive aspect and compound tenses.",
            entries: [
              { personOrForm: "Gerundio (-ing)", conjugated: `${stem}${isAr ? "ando" : "iendo"}`, english: `${clean}ing` },
              { personOrForm: "Participio (-ed)", conjugated: `${stem}${isAr ? "ado" : "ido"}`, english: `${clean}ed` },
            ],
          },
        ],
      };
    }
  }

  // Japanese Generic Builder
  if (targetLangCode === "ja") {
    return {
      verb: clean,
      infinitiveOrRoot: clean,
      translation: `to ${clean}`,
      targetLanguage: "Japanese",
      targetLangCode: "ja",
      regularity: "regular",
      stemNotes: "Japanese verb inflection forms",
      forms: [
        {
          id: "polite_masu",
          name: "Polite Non-Past (ます形)",
          category: "polite",
          description: "Polite statement for habits, present actions, and future plans.",
          entries: [
            { personOrForm: "Affirmative (ます)", conjugated: `${clean.replace(/る$/, "")}ます`, english: "speak / do (polite)" },
            { personOrForm: "Negative (ません)", conjugated: `${clean.replace(/る$/, "")}ません`, english: "do not (polite)" },
          ],
        },
        {
          id: "te_form",
          name: "Te-form (て形)",
          category: "connective",
          description: "Connecting clauses and polite requests (~てください).",
          entries: [
            { personOrForm: "Te-form Base", conjugated: `${clean.replace(/る$/, "")}て`, english: "doing / and then" },
            { personOrForm: "Progressive (~ています)", conjugated: `${clean.replace(/る$/, "")}ています`, english: "is doing" },
          ],
        },
      ],
    };
  }

  // Korean Generic Builder
  if (targetLangCode === "ko") {
    const stem = clean.replace(/다$/, "");
    return {
      verb: clean,
      infinitiveOrRoot: clean,
      translation: `to ${clean}`,
      targetLanguage: "Korean",
      targetLangCode: "ko",
      regularity: "regular",
      stemNotes: `Root stem: ${stem}-`,
      forms: [
        {
          id: "present_polite",
          name: "Present Informal Polite (해요체)",
          category: "polite",
          description: "Everyday conversation ending.",
          entries: [
            { personOrForm: "Present Polite (-아요/어요)", conjugated: `${stem}어요`, english: "do / does / will do" },
          ],
        },
        {
          id: "formal_polite",
          name: "Formal Polite (하십시오체)",
          category: "honorific",
          description: "Formal speech ending.",
          entries: [
            { personOrForm: "Formal Statement", conjugated: `${stem}습니다`, english: "do (formal)" },
          ],
        },
        {
          id: "past_polite",
          name: "Past Polite (과거형)",
          category: "polite",
          description: "Completed past action.",
          entries: [
            { personOrForm: "Past Polite", conjugated: `${stem}었어요`, english: "did" },
          ],
        },
      ],
    };
  }

  return null;
}
