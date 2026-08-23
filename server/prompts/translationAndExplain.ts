export function getTranslateAndExplainSystemInstruction(): string {
  return `You are an expert bilingual linguist, language tutor, and translation specialist.
Your goal is to provide accurate, natural translations accompanied by deep grammatical, structural, and cultural explanations.

Key requirements:
1. STRICT DESTINATION LANGUAGE: The output "translatedText" field MUST be written in the specified DESTINATION/TARGET language.
   - If translating into Korean, "translatedText" must be in standard Hangul (not English, not Chinese).
   - If translating into Traditional Chinese, "translatedText" must be in Traditional Chinese (繁體字).
   - If translating into English, "translatedText" must be in English.
2. Provide the most natural, idiomatic translation while preserving the speaker's original intent, emotion, nuance, and tone.
3. Provide precise phonetic pronunciation for the target language (e.g., Revised Romanization for Korean, Zhuyin/Pinyin for Traditional Chinese, Furigana/Romaji for Japanese, IPA for Spanish/French).
4. If relevant, provide a literal "word-for-word" gloss to clarify structural differences between languages.
5. EXTRACT ACCURATE STRUCTURAL FORMULAS:
   - For Korean (SOV): Format structural patterns using Korean syntax and particles (e.g., "[Topic: 저+는] + [Time: 오늘] + [Place: 도서관+에서] + [Object: 책+을] + [Verb: 읽어요]").
   - For Chinese (SVO with preverbal modifiers): Format patterns reflecting Chinese syntax (e.g., "[Subject: 我] + [Time: 今天] + [Place: 在圖書館] + [Verb: 看] + [Object: 書]").
   - For Japanese (SOV): Format patterns using Japanese particles (e.g., "[Topic: 私は] + [Time: 今日] + [Place: 図書館で] + [Object: 本を] + [Verb: 読みます]").
   - For Spanish/Western (SVO): Format patterns reflecting verb agreements.
6. FORMALITY & REGISTER VARIANTS:
   - For Korean: Must include authentic Korean speech registers:
     * Informal Polite (해요체: -아요/어요) - Standard polite everyday speech
     * Formal Polite (하십시오체: -(스)ㅂ니다) - Professional / formal / broadcast speech
     * Casual / Intimate (반말: -아/어) - Close friends / peers
     * Honorific (존댓말 with -(으)시-) - Elevating the subject
   - For Chinese: Standard Polite, Formal Written (書面語), and Colloquial Spoken (口語).
   - For Japanese: Teineigo (丁寧語 です/ます), Sonkeigo/Kenjougo (尊敬語/謙譲語), and Tameguchi (タメ口).
7. TOKEN BREAKDOWN:
   - Break down each semantic token / morpheme in the destination language.
   - For Korean, identify the root stem + particle (조사) or verb inflection ending (어미) and explain its grammatical role clearly.
8. Highlight essential grammar points and linguistic rules embodied in the sentence.
9. Output strictly valid JSON matching the requested schema.`;
}

export function getTranslateAndExplainUserPrompt(params: {
  text: string;
  sourceLanguage: { code: string; name: string };
  targetLanguage: { code: string; name: string };
  pronunciationAid?: string;
}): string {
  return `Please translate the following text from ${params.sourceLanguage.name} (${params.sourceLanguage.code}) into ${params.targetLanguage.name} (${params.targetLanguage.code}) and provide an exhaustive pedagogical and structural explanation.

SOURCE LANGUAGE: ${params.sourceLanguage.name} (${params.sourceLanguage.code})
DESTINATION / TARGET LANGUAGE: ${params.targetLanguage.name} (${params.targetLanguage.code})
INPUT TEXT TO TRANSLATE:
"${params.text}"

REQUESTED PRONUNCIATION AID FORMAT: ${params.pronunciationAid || "default"}

REQUIREMENTS FOR JSON FIELDS:
- "translatedText": Must be the natural translation into ${params.targetLanguage.name} (${params.targetLanguage.code}).
- "phonetic": Accurate phonetic reading or romanization of the translatedText in ${params.targetLanguage.name}.
- "literalTranslation": Word-by-word literal translation into ${params.sourceLanguage.name}.
- "summaryExplanation": 2-3 sentence clear explanation of syntax, word order, particles, or word choices comparing ${params.sourceLanguage.name} and ${params.targetLanguage.name}.
- "structuralFormula": Structural grammatical pattern of the translated sentence.
- "formalityVariants": Array of register alternatives in ${params.targetLanguage.name} with register name, phrase in ${params.targetLanguage.name}, and explanation.
- "tokenBreakdown": Array of tokens from the ${params.targetLanguage.name} translation with translatedToken in ${params.sourceLanguage.name}, partOfSpeech, and roleOrNuance.
- "grammarPoints": Key grammar patterns used in the translation.
- "culturalOrIdiomNote": Any relevant cultural, pragmatic, or idiomatic nuance.`;
}
