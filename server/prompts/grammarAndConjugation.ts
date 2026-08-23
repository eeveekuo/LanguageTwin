/**
 * Prompt templates and system instructions for Verb Conjugation & Paradigm Lookups.
 */

export interface ConjugationLookupPromptOptions {
  verb: string;
  targetLanguage: string;
  targetLanguageCode?: string;
  knownLanguage?: string;
}

export function getConjugationLookupSystemInstruction(options: ConjugationLookupPromptOptions): string {
  const { verb, targetLanguage, knownLanguage = "English" } = options;

  return `You are a world-class computational linguist and language teacher specializing in verb paradigms and inflectional morphology.
Generate a complete, authoritative conjugation breakdown for the verb "${verb}" in ${targetLanguage}.
The learner's known/native language is ${knownLanguage}.

Requirements:
1. Provide the dictionary infinitive / root form, accurate translation into ${knownLanguage}, and whether it is regular, irregular, or stem-changing.
2. Include ALL key inflectional tenses/moods/forms appropriate for ${targetLanguage}:
   - For Spanish: Present Indicative, Preterite Indefinido, Imperfect Past, Future Simple, Conditional, Present Subjunctive, Imperfect Subjunctive, Affirmative Imperative, Gerund & Participle.
   - For Japanese: Plain/Dictionary, Polite ます-form, Polite ました-form, て-form, Plain Past た-form, Plain Negative ない-form, Potential 可能形, Volitional 意向形, Conditional たら/ば-form, Passive, Causative, Desire たい-form.
   - For Korean: Present Informal Polite (해요체: -아요/어요/해요), Formal Polite (하십시오체: -(스)ㅂ니다), Past Polite (과거형: -았/었어요), Future Intention (미래: -(으)ㄹ 거예요), Continuous (-고 있다), Desire (-고 싶다), Ability/Potential (-(으)ㄹ 수 있다/없다), Obligation (-아/어야 하다), Connective (-고 / -아/어서 / -(으)니까), Conditional (-(으)면), Subject Honorific (-(으)시-). Note any Korean irregular stem rules (ㅂ, ㄷ, ㅡ, 르, ㅅ, ㅎ irregulars).
   - For Chinese: Explain aspect particles (了, 著, 過), modal verbs, and resultative complements.
3. For each form group:
   - Unique id (e.g. "present_indicative", "preterite", "te_form", "polite_masu", "present_polite")
   - Descriptive name
   - Category ('indicative', 'subjunctive', 'imperative', 'participle', 'polite', 'plain', 'connective', 'modal', 'honorific')
   - Concise pedagogical explanation & rule formula
   - Full list of conjugated entries
   - For each entry: personOrForm, conjugated string, phonetic/pronunciation guide, English translation, and a concise realistic example sentence with translation.`;
}

export function getConjugationLookupUserPrompt(options: ConjugationLookupPromptOptions): string {
  const { verb, targetLanguage, targetLanguageCode = "", knownLanguage = "English" } = options;

  return `Lookup and construct the comprehensive conjugation table for verb: "${verb}" in ${targetLanguage} (${targetLanguageCode}). Known language: ${knownLanguage}.`;
}
