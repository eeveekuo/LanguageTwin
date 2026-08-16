/**
 * Prompt templates and system instructions for AI Tutor conversational chat, scenario generation, and quick assistance.
 */

export interface AITutorChatPromptOptions {
  targetLanguage: string;
  knownLanguage: string;
  level?: string;
  scenario?: any;
  targetDeckCards?: Array<{ id?: string; targetItem: string; definition?: string; usageNotes?: string; phonetic?: string }>;
  learnerErrors?: Array<{ originalMistake: string; correctedForm: string; errorType?: string }>;
  scenarioContext?: { title: string; setting: string; role: string; userRole: string; suggestedVocab?: string[] };
  conversationHistory?: Array<{ sender?: string; role?: string; text?: string; content?: string }>;
  messages?: Array<{ sender?: string; role?: string; text?: string; content?: string }>;
  userMessage?: string;
}

export function getAiTutorSystemInstruction(options: AITutorChatPromptOptions): string {
  const { targetLanguage, knownLanguage, level = "Intermediate", targetDeckCards = [], learnerErrors = [], scenario } = options;

  const targetCardsStr = targetDeckCards.slice(0, 15).map((c, i) =>
    `${i + 1}. [Target Item: "${c.targetItem}"] Meaning: "${c.definition || ""}"`
  ).join("\n");

  const recentErrorsStr = learnerErrors.slice(0, 5).map((e, i) =>
    `${i + 1}. Mistake: "${e.originalMistake}" -> Correct: "${e.correctedForm}"`
  ).join("\n");

  let scenarioDirective = "";
  if (scenario) {
    if (typeof scenario === "string") {
      scenarioDirective = `\nROLEPLAY SCENARIO:\n${scenario}`;
    } else {
      scenarioDirective = `
ROLEPLAY SCENARIO ACTIVE:
Theme/Title: ${scenario.title || "Daily Conversation"}
Setting: ${scenario.setting || scenario.scenarioPrompt || "Everyday situation"}
Your Role: ${scenario.role || "Conversation Partner"}
User Role: ${scenario.userRole || "Language Learner"}
Suggested Vocabulary to naturally weave in: ${(scenario.targetWordsToUse || []).join(", ")}
Maintain this persona consistently while responding in ${targetLanguage}.`;
    }
  }

  return `You are "LanguageTwin AI Tutor", a charismatic, supportive, and pedagogically sharp native conversational partner in ${targetLanguage}.
Student Level: ${level}
Student Known Language: ${knownLanguage}
${scenarioDirective}

ACTIVE STUDY DECK ITEMS TO RECOGNIZE & EVALUATE IN CONVERSATION:
${targetCardsStr || "None specified."}

STUDENT'S HISTORICAL ERROR PATTERNS TO WATCH FOR:
${recentErrorsStr || "No recorded error patterns."}

YOUR GOALS:
1. Respond in natural, conversational ${targetLanguage} matching their CEFR level (${level}). Keep replies engaging, conversational, and end with an open prompt/question to keep the dialogue flowing. Include a supportive correction/coaching note and English translation when helpful.
2. Evaluate if the student used any words or grammar items from their active study deck. For each detected item, assign a mastery score (0-100), SRS grade (1-5), and constructive feedback.
3. If the student made grammatical slips, identify the specific mistake and provide the corrected form.`;
}

export function getAiTutorUserPrompt(options: AITutorChatPromptOptions): string {
  const { messages = [], conversationHistory = [], userMessage } = options;
  const allMessages = messages.length > 0 ? messages : conversationHistory;

  const historyStr = allMessages.map((m: any) => `${(m.sender || m.role || "USER").toUpperCase()}: ${m.text || m.content || ""}`).join("\n");

  return `CONVERSATION LOG:
${historyStr}
${userMessage ? `STUDENT: ${userMessage}` : ""}

Respond to the student's latest message and return structured JSON with your conversational reply and evaluated deck items.`;
}

export const getAITutorChatSystemInstruction = getAiTutorSystemInstruction;
export const getAITutorChatUserPrompt = getAiTutorUserPrompt;

export interface ScenarioGenerationPromptOptions {
  targetLanguage: string;
  knownLanguage: string;
  level?: string;
  theme?: string;
  activeDeckCards?: Array<{ targetItem: string; definition?: string }>;
}

export function getScenarioGenerationSystemInstruction(options: ScenarioGenerationPromptOptions): string {
  const { targetLanguage, knownLanguage, level = "A2/B1" } = options;

  return `You are a conversational linguist creating immersive language immersion roleplay scenarios.
Target Language: ${targetLanguage}
Learner Level: ${level}
Learner Reference Language: ${knownLanguage}

Create a lively, realistic everyday immersion scenario. Include:
1. Clear scenario title and category.
2. Tutor persona and user role.
3. Realistic starter message in ${targetLanguage} to kick off the dialogue with translation in ${knownLanguage}.
4. 4-6 recommended vocabulary items/idioms for the student to practice.`;
}

export function getScenarioGenerationUserPrompt(options: ScenarioGenerationPromptOptions): string {
  const { targetLanguage, level = "A2/B1", theme = "any", activeDeckCards = [] } = options;
  const cardsSnippet = activeDeckCards.slice(0, 8).map((c) => c.targetItem).join(", ");

  return `Generate a realistic conversation scenario for ${targetLanguage} (${level}) with theme '${theme}'.
Active flashcards in deck: ${cardsSnippet || "General conversation"}.`;
}

export interface QuickAssistPromptOptions {
  query: string;
  queryType?: string;
  targetLanguage: string;
  knownLanguage: string;
}

export function getQuickAssistSystemInstruction(options: QuickAssistPromptOptions): string {
  const { targetLanguage, knownLanguage } = options;

  return `You are an elite bilingual linguistic co-pilot and real-time translator for ${targetLanguage} (for ${knownLanguage} speakers).
Provide:
1. Primary natural expression in ${targetLanguage} with precise phonetics (IPA/Pinyin/Romaji/Hangul phonetics).
2. Literal & contextual meaning in ${knownLanguage}.
3. 2-3 Formality variants (Casual/Informal, Polite/Standard, Formal/Honorific) with clear notes.
4. Word-by-word morphemic breakdown.
5. 1 practical, high-frequency example sentence with translation.
6. A concise cultural or linguistic nuance tip.`;
}

export function getQuickAssistUserPrompt(options: QuickAssistPromptOptions): string {
  const { query, targetLanguage, knownLanguage, queryType = "general" } = options;
  return `Lookup / Query: "${query}" (Type: ${queryType})
Target Language: ${targetLanguage}
Known Language: ${knownLanguage}`;
}
