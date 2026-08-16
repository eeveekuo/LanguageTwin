import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  generateWithFallback,
  getFallbackPlacementQuestions,
  getFallbackPlacementEvaluation,
} from "./server/geminiResilience";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Serve Service Worker with proper scope header
app.get("/sw.js", (_req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Service-Worker-Allowed", "/");
  const swPath = path.join(process.cwd(), "public", "sw.js");
  if (fs.existsSync(swPath)) {
    res.sendFile(swPath);
  } else {
    res.status(404).send("Service worker file not found");
  }
});

// Initialize Gemini SDK with User-Agent header as required
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Evaluate User Sentence for Active Production Flashcard Mastery
app.post("/api/evaluate-sentence", async (req, res) => {
  try {
    const {
      targetItem,
      cardType,
      partOfSpeech,
      targetLanguage,
      knownLanguage,
      definition,
      userSentence,
      inputMethod,
    } = req.body;

    if (!targetItem || !userSentence || !targetLanguage) {
      return res.status(400).json({ error: "Missing required evaluation fields." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a world-class, encouraging, and meticulous language learning professor and linguistic evaluator.
Your mission is to evaluate a language learner's sentence in ${targetLanguage} (native/known language: ${knownLanguage}).
The learner is practicing the target item "${targetItem}" (Type: ${cardType || "vocabulary"}, Part of speech / context: ${partOfSpeech || "general"}, Meaning: "${definition || ""}").

You must rigorously evaluate:
1. Did the learner actually incorporate the target item (or an appropriate grammatical conjugation/inflection of it) into their sentence?
2. Is the sentence grammatically accurate according to ${targetLanguage} rules (verb conjugation, gender agreement, case, word order, particle usage, punctuation, orthography/spelling)?
3. Is the sentence contextually coherent, meaningful, and natural (idiomatic)?
4. Assign an objective Score (0 to 100).
5. Assign a Spaced Repetition Grade (integer 0 to 5 for the SM-2 algorithm):
   - 5: Flawless, highly natural, idiomatic sentence using the target item perfectly.
   - 4: Very good; target item used correctly with only minor punctuation/spelling slip or slightly unnatural word order.
   - 3: Correct meaning and target item used appropriately, but noticeable grammatical mistake (e.g. wrong tense or agreement) that doesn't hinder basic comprehension.
   - 2: Target item was attempted but used incorrectly in context, or major grammatical breakdown.
   - 1: Target item was missing or completely misunderstood.
   - 0: Nonsense, empty, or unrelated language.
6. Provide a corrected version of the learner's sentence in ${targetLanguage}. If the sentence is already perfect, return the original or a natural polished version.
7. Provide a detailed, encouraging explanation and breakdown in ${knownLanguage} explaining why it is correct or what was adjusted.
8. Identify any specific discrete errors (originalMistake, correctedForm, errorType such as 'grammar', 'conjugation', 'agreement', 'spelling', 'vocab', 'nuance', and explanation) so the learner can track recurrent mistakes. If none, return an empty array [].
9. Provide 2 to 3 natural alternative sentences in ${targetLanguage} showing different real-world ways to use "${targetItem}", along with translations in ${knownLanguage}.`;

    const prompt = `Target Item to practice: "${targetItem}"
Target Language: ${targetLanguage}
Learner's Known Language: ${knownLanguage}
Card Definition / Context: ${definition}
Input Method: ${inputMethod || "typed"}
Learner's Submitted Sentence: "${userSentence}"

Evaluate the sentence and return the structured JSON assessment.`;

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.NUMBER,
              description: "Mastery score between 0 and 100",
            },
            grade: {
              type: Type.INTEGER,
              description: "SM-2 spaced repetition grade from 0 to 5",
            },
            masteryLevel: {
              type: Type.STRING,
              description: "One of 'mastered', 'good', 'developing', 'incorrect'",
            },
            isTargetUsed: {
              type: Type.BOOLEAN,
              description: "Whether the target item or valid inflected form was used",
            },
            isGrammaticallyCorrect: {
              type: Type.BOOLEAN,
              description: "Whether the sentence is grammatically error-free",
            },
            feedbackSummary: {
              type: Type.STRING,
              description: "A concise 1-2 sentence encouraging feedback summary in known language",
            },
            correctedSentence: {
              type: Type.STRING,
              description: "The grammatically correct and natural version in the target language",
            },
            correctedSentenceTranslation: {
              type: Type.STRING,
              description: "Translation of the corrected sentence in known language",
            },
            detailedExplanation: {
              type: Type.STRING,
              description: "Clear pedagogical explanation of corrections, grammar rules, and nuance",
            },
            identifiedErrors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalMistake: { type: Type.STRING, description: "The specific mistaken phrase or word user wrote" },
                  correctedForm: { type: Type.STRING, description: "The corrected form" },
                  errorType: { type: Type.STRING, description: "'grammar', 'conjugation', 'agreement', 'spelling', 'vocab', or 'nuance'" },
                  explanation: { type: Type.STRING, description: "Short explanation of why it was wrong" },
                },
                required: ["originalMistake", "correctedForm", "errorType", "explanation"],
              },
              description: "List of discrete errors made in the user sentence, empty if sentence is perfect",
            },
            breakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "Type of feedback: 'positive', 'grammar', 'vocab', 'spelling', 'nuance'",
                  },
                  message: {
                    type: Type.STRING,
                    description: "Specific feedback point in known language",
                  },
                },
                required: ["type", "message"],
              },
              description: "List of specific feedback points",
            },
            naturalAlternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sentence: {
                    type: Type.STRING,
                    description: "Alternative natural sentence in target language",
                  },
                  translation: {
                    type: Type.STRING,
                    description: "Translation in known language",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "Why or when native speakers use this phrase",
                  },
                },
                required: ["sentence", "translation", "explanation"],
              },
              description: "2-3 high quality alternative example sentences",
            },
          },
          required: [
            "score",
            "grade",
            "masteryLevel",
            "isTargetUsed",
            "isGrammaticallyCorrect",
            "feedbackSummary",
            "correctedSentence",
            "correctedSentenceTranslation",
            "detailedExplanation",
            "breakdown",
            "naturalAlternatives",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Sentence evaluation error:", error);
    res.status(500).json({
      error: error.message || "Failed to evaluate sentence",
    });
  }
});

// Explain Card (Definition, Usage Format, Rules, & Examples when learner doesn't know the card)
app.post("/api/explain-card", async (req, res) => {
  try {
    const { targetItem, cardType, partOfSpeech, targetLanguage, knownLanguage, frequencyRank } = req.body;

    if (!targetItem || !targetLanguage) {
      return res.status(400).json({ error: "Missing required card parameters." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a master polyglot tutor and linguist.
The student is learning ${targetLanguage} (known language: ${knownLanguage}) and hit "I don't know this" on the flashcard: "${targetItem}".
(Type: ${cardType || "vocabulary"}, Frequency Rank: #${frequencyRank || "N/A"}, Part of speech: ${partOfSpeech || "N/A"}).

Your job is to provide an crystal-clear, comprehensive learning guide with:
1. Precise definition in ${knownLanguage}.
2. Phonetic guide / IPA / Romanization / Pinyin / Furigana as appropriate for ${targetLanguage}.
3. Usage format / grammar pattern / conjugation formula (e.g. how it fits into a sentence).
4. Pedagogical rule explanation in ${knownLanguage}.
5. 3 to 4 varied, practical real-life example sentences in ${targetLanguage} with exact translations and phonetic guides.
6. 2-3 common collocations or set expressions.
7. A memorable mnemonic / memory hook to make it stick permanently.
8. Common pitfalls/mistakes learners make with this word or grammar concept.`;

    const prompt = `Explain the target item: "${targetItem}" in ${targetLanguage} for a native ${knownLanguage} speaker.`;

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetItem: { type: Type.STRING },
            definition: { type: Type.STRING, description: "Clear definition in known language" },
            phonetic: { type: Type.STRING, description: "Phonetic transcription or pronunciation guide" },
            usageFormat: { type: Type.STRING, description: "Sentence formula or structure template, e.g. Subject + [Verb] + Object" },
            ruleExplanation: { type: Type.STRING, description: "Clear explanation of grammar rules, nuances, and nuances" },
            examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  target: { type: Type.STRING, description: "Sentence in target language" },
                  translation: { type: Type.STRING, description: "Sentence in known language" },
                  phonetic: { type: Type.STRING, description: "Phonetic pronunciation guide" },
                },
                required: ["target", "translation"],
              },
            },
            collocations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Common phrases or collocations using this word",
            },
            mnemonicTip: { type: Type.STRING, description: "Creative memory hook or etymology tip" },
            commonMistakes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Frequent errors to avoid",
            },
          },
          required: [
            "targetItem",
            "definition",
            "phonetic",
            "usageFormat",
            "ruleExplanation",
            "examples",
            "collocations",
            "mnemonicTip",
            "commonMistakes",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Explain card error:", error);
    res.status(500).json({ error: error.message || "Failed to explain card" });
  }
});

// Generate Custom Frequency-Ranked Flashcard Deck
app.post("/api/generate-deck", async (req, res) => {
  try {
    const {
      targetLanguage,
      knownLanguage,
      topic,
      level, // e.g. 'A1 - Beginner', 'A2 - Elementary', 'B1 - Intermediate', 'B2 - Upper Intermediate', 'C1 - Advanced'
      count = 15,
      startFrequencyRank = 1,
    } = req.body;

    if (!targetLanguage || !knownLanguage) {
      return res.status(400).json({ error: "Target and known language are required." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are an expert computational linguist and language curriculum designer.
Generate a high-frequency spaced repetition flashcard deck for learning ${targetLanguage} (for ${knownLanguage} speakers).
Level: ${level || "A1-A2"}
Topic / Domain: ${topic || "Top Most Frequent Core Vocabulary & Essential Grammar"}
Number of cards: ${count}
Starting frequency rank index: ${startFrequencyRank}

Ensure:
1. Every card has an accurate, realistic Frequency Rank in the target language (e.g. Rank 1 = most frequent word, Rank 2, etc. or ordered within this frequency tier).
2. Mix of core vocabulary and high-utility grammar patterns (e.g. modal verbs, conjunctions, core sentence connectors, interrogatives).
3. Rich definitions, phonetic guides (IPA/Pinyin/Romaji where applicable), part of speech, usage rules, and 2 contextual example sentences with translations.
4. All content is strictly accurate and natural.`;

    const prompt = `Generate ${count} frequency-ranked flashcards for learning ${targetLanguage} from ${knownLanguage}.
Topic: ${topic || "General Core Frequency"}
Level: ${level || "Beginner (A1/A2)"}
Start Frequency Rank: ${startFrequencyRank}`;

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckTitle: { type: Type.STRING, description: "Descriptive title for this deck" },
            deckDescription: { type: Type.STRING, description: "Description of what this deck covers" },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "'vocabulary' or 'grammar'" },
                  targetItem: { type: Type.STRING, description: "Target word, phrase, or grammar formula" },
                  frequencyRank: { type: Type.INTEGER, description: "Frequency rank in language (1, 2, 3...)" },
                  partOfSpeech: { type: Type.STRING, description: "e.g. Verb, Noun, Particle, Preposition, Conjunction" },
                  definition: { type: Type.STRING, description: "Meaning in known language" },
                  phonetic: { type: Type.STRING, description: "Pronunciation guide / IPA / romanization" },
                  usageNotes: { type: Type.STRING, description: "Brief grammar rule or usage template" },
                  examples: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        target: { type: Type.STRING, description: "Example sentence in target language" },
                        translation: { type: Type.STRING, description: "Translation in known language" },
                        phonetic: { type: Type.STRING, description: "Pronunciation guide" },
                      },
                      required: ["target", "translation"],
                    },
                  },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  "type",
                  "targetItem",
                  "frequencyRank",
                  "partOfSpeech",
                  "definition",
                  "usageNotes",
                  "examples",
                ],
              },
            },
          },
          required: ["deckTitle", "deckDescription", "cards"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Deck generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate deck" });
  }
});

// Multi-turn AI Language Tutor Chat with Cross-Evaluation of Flashcard Mastery
app.post("/api/ai-tutor-chat", async (req, res) => {
  try {
    const {
      messages, // [{ role: 'user' | 'model', text: string }]
      targetLanguage,
      knownLanguage,
      activeDeckTitle,
      recentTargetWords, // Array of target words currently in the deck
      userProficiency,
      scenarioPrompt,
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages history required." });
    }

    const ai = getGeminiClient();
    const lastUserMessage = messages[messages.length - 1]?.text || "";

    const scenarioInstruction = scenarioPrompt && scenarioPrompt.trim()
      ? `\n\nACTIVE CONVERSATION SCENARIO & ROLEPLAY OBJECTIVE:
"${scenarioPrompt.trim()}"
You MUST strictly stay in character according to this scenario! Frame the context, conversational tone, setting, and persona naturally around this objective, while helping the learner practice.`
      : "";

    const systemInstruction = `You are a supportive, conversational AI Language Partner and master Tutor for a student learning ${targetLanguage} (native language: ${knownLanguage}).
Proficiency level: ${userProficiency || "Intermediate A2/B1"}.
The student is currently mastering this deck: "${activeDeckTitle || "Frequency Vocabulary"}".
Deck flashcard items / target words available: ${recentTargetWords?.slice(0, 35)?.join(", ") || "core vocabulary"}.${scenarioInstruction}

Your dual tasks for every response:
1. CONVERSATIONAL REPLY:
   - Respond warmly and naturally in ${targetLanguage} with engaging dialogue (and ask natural follow-up questions in character with the scenario if one is active).
   - Weave in 1-2 relevant vocabulary words or phrases from the learner's deck where appropriate.
   - If the student made any grammar or vocabulary slip, provide a gentle, brief correction tip in ${knownLanguage} alongside your response.
   - Also provide an English (${knownLanguage}) translation of your response.

2. CROSS-EVALUATION OF DECK FLASHCARDS & VOCABULARY:
   - Check the learner's latest message ("${lastUserMessage}") for any deck target words or grammar patterns they attempted or used (including conjugated/inflected forms).
   - If they used or attempted any deck target words (or if their sentence demonstrates usage of any key vocabulary), evaluate each item:
     * targetItem: exact word or concept from the deck
     * score: 0 to 100
     * grade: 0 to 5 for SM-2 spaced repetition (5=flawless & natural, 4=minor slip, 3=understood with grammar slip, 2=misused, 1=failed)
     * masteryLevel: 'mastered' | 'good' | 'developing' | 'incorrect'
     * isGrammaticallyCorrect: true/false
     * feedback: 1 sentence explaining their usage
     * identifiedErrors: array of { originalMistake, correctedForm, errorType, explanation } if they made any error with this item.
   - If no specific deck target item was used, you may evaluate the primary key word or verb they produced, or return an empty array if minimal.`;

    const prompt = `Conversation history:
${messages.map((m: any) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.text}`).join("\n")}

Respond to the student's latest message and return structured JSON with your conversational reply and evaluated deck items.`;

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.5,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: "Natural conversational response in target language with correction tip and English translation",
            },
            evaluatedItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  targetItem: { type: Type.STRING, description: "Deck flashcard item or word identified" },
                  score: { type: Type.NUMBER, description: "0-100 mastery score" },
                  grade: { type: Type.INTEGER, description: "0-5 SM-2 grade" },
                  masteryLevel: { type: Type.STRING, description: "'mastered', 'good', 'developing', or 'incorrect'" },
                  isGrammaticallyCorrect: { type: Type.BOOLEAN },
                  feedback: { type: Type.STRING, description: "Brief pedagogical feedback on their usage" },
                  userExcerpt: { type: Type.STRING, description: "The phrase or clause where user used it" },
                  identifiedErrors: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        originalMistake: { type: Type.STRING },
                        correctedForm: { type: Type.STRING },
                        errorType: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                      },
                      required: ["originalMistake", "correctedForm", "errorType", "explanation"],
                    },
                  },
                },
                required: ["targetItem", "score", "grade", "masteryLevel", "isGrammaticallyCorrect", "feedback"],
              },
              description: "Evaluations of any deck flashcards or vocabulary produced by the user in this message",
            },
          },
          required: ["reply", "evaluatedItems"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      reply: parsed.reply || "",
      evaluatedItems: parsed.evaluatedItems || [],
    });
  } catch (error: any) {
    console.error("Tutor chat error:", error);
    res.status(500).json({ error: error.message || "Tutor chat failed" });
  }
});

// Quick Lookup & Linguistic Co-Pilot for Side Tab Assistant
app.post("/api/quick-assist", async (req, res) => {
  try {
    const { query, targetLanguage, knownLanguage, queryType = "general" } = req.body;

    if (!query || !targetLanguage) {
      return res.status(400).json({ error: "Missing query or target language." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a real-time Linguistic Co-Pilot and Translation Assistant for a student learning ${targetLanguage} (native language: ${knownLanguage}).
The student is in the middle of a live conversation and is asking a quick query in a side lookup drawer: "${query}".

Query Type: ${queryType} (e.g. 'how_to_say', 'lookup_word', 'grammar_check', 'polite_vs_casual', 'general').

Provide a fast, highly accurate, pedagogical response formatted with:
1. Target translation or expression in ${targetLanguage}.
2. Phonetic / Romanization / Furigana / Pinyin pronunciation guide if applicable.
3. Natural variation alternatives (e.g. Casual, Polite, Formal / Written).
4. Literal word-by-word breakdown.
5. 1 practical example sentence with translation.
6. A short tip on nuance or usage context.`;

    const prompt = `Student query: "${query}"
Target language: ${targetLanguage}
Known language: ${knownLanguage}
Query intention: ${queryType}`;

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetExpression: { type: Type.STRING, description: "Primary recommended translation or phrase in target language" },
            phonetic: { type: Type.STRING, description: "Pronunciation or romanization" },
            meaningInKnown: { type: Type.STRING, description: "Clear meaning in known language" },
            formalityVariants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  register: { type: Type.STRING, description: "'Casual/Informal', 'Polite/Standard', 'Formal/Honorific'" },
                  phrase: { type: Type.STRING },
                  note: { type: Type.STRING },
                },
                required: ["register", "phrase", "note"],
              },
            },
            wordBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  partOfSpeech: { type: Type.STRING },
                },
                required: ["word", "meaning"],
              },
            },
            exampleSentence: {
              type: Type.OBJECT,
              properties: {
                target: { type: Type.STRING },
                translation: { type: Type.STRING },
              },
              required: ["target", "translation"],
            },
            nuanceTip: { type: Type.STRING, description: "1-2 sentence tip on cultural context or nuances" },
          },
          required: ["targetExpression", "phonetic", "meaningInKnown", "formalityVariants", "wordBreakdown", "exampleSentence", "nuanceTip"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Quick assist error:", error);
    res.status(500).json({ error: error.message || "Quick assist lookup failed" });
  }
});

// Generate Random Conversation Scenario
app.post("/api/generate-scenario", async (req, res) => {
  try {
    const { targetLanguage, knownLanguage, theme = "any", level = "A2/B1" } = req.body;

    const ai = getGeminiClient();

    const systemInstruction = `You are a language learning curriculum designer. Generate a fun, realistic, roleplay conversation scenario for a student learning ${targetLanguage} (native: ${knownLanguage}, level: ${level}).
Theme requested: ${theme}.

Provide:
1. Scenario Title (e.g. "Ordering at a Traditional Teahouse in Insadong", "Asking for Train Platform Change in Kyoto", "Debating Movie Choices with a Roommate in Madrid").
2. Scenario Prompt / Roleplay Context for the AI tutor to act out (describing who the AI is, who the student is, where they are, and what the goal of the conversation is).
3. 3-4 Suggested vocabulary/phrases to try using in this scenario.
4. An engaging opening message for the AI tutor to kick off the conversation in character.`;

    const prompt = `Generate a realistic conversation scenario for ${targetLanguage} (${level}) with theme '${theme}'.`;

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING, description: "Category like 'Dining', 'Travel', 'Work', 'Social', 'Emergency', 'Hobbies'" },
            scenarioPrompt: { type: Type.STRING, description: "Detailed roleplay instruction and setting for the AI to adopt" },
            targetWordsToUse: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 recommended vocabulary or grammar patterns to attempt",
            },
            openingGreeting: { type: Type.STRING, description: "Opening line in target language spoken by the AI in character" },
            openingGreetingTranslation: { type: Type.STRING, description: "Opening line translated into known language" },
          },
          required: ["title", "category", "scenarioPrompt", "targetWordsToUse", "openingGreeting", "openingGreetingTranslation"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Scenario generation error:", error);
    res.status(500).json({ error: error.message || "Scenario generation failed" });
  }
});

// Generate Multi-Tier Adaptive Language Placement Test
app.post("/api/generate-placement-test", async (req, res) => {
  try {
    const { targetLanguage, knownLanguage, testType = "comprehensive" } = req.body;

    if (!targetLanguage || !knownLanguage) {
      return res.status(400).json({ error: "Target and known language are required." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a certified international language testing director, psychometrician, and examiner for standardized language frameworks (CEFR, ACTFL, DELE, DELF, Goethe-Zertifikat, JLPT, HSK, etc.).
Your goal is to generate a rigorous, engaging, and accurate adaptive Language Placement Exam for assessing a student's proficiency in ${targetLanguage} (native/known language: ${knownLanguage}).

CRITICAL ANTI-SPOILER & ACCURACY RULES:
1. Do NOT include examples or vocabulary in ${targetLanguage} in the question instructions, challenge prompts, or concept focus explanations.
2. The concept focus ('targetItem') must describe the grammatical, morphological, or syntactic concept PURELY in ${knownLanguage} (e.g., 'Past completed aspect & narrative sequence inflection', 'Expressing subordinate causality & opinions', 'Hypothetical unreal condition combining subjunctive and conditional moods') WITHOUT leaking or mentioning ${targetLanguage} words, verbs, stems, or phrases.
3. In question prompts and instructions, do NOT include sample translations in ${targetLanguage} that give away the answers.

The test MUST contain 6 to 8 questions of escalating CEFR difficulty:
1. Question 1 (A1 Breakthrough): Basic self-introduction or core survival vocabulary. Type: 'production' or 'collocation'.
2. Question 2 (A2 Waystage): Routine past event narration or everyday spatial/temporal marker. Type: 'transformation' or 'production'.
3. Question 3 (B1 Threshold): Expressing an opinion, hypothesis, or subordinate connector (because/although). Type: 'production' or 'transformation'.
4. Question 4 (B1+ / B2 Threshold): Error Spotting - a realistic sentence in ${targetLanguage} containing a subtle grammar or agreement mistake for the user to identify and fix. Type: 'error_spotting'.
5. Question 5 (B2 Vantage): Complex sentence production, hypothetical condition, or idiomatic collocation in ${targetLanguage}. Type: 'production'.
6. Question 6 (B2 / C1 Operational): Nuanced natural discourse, particle/register discrimination, or listening comprehension sentence prompt. Type: 'listening' or 'transformation'.
7. Question 7 (C1 Proficiency): Advanced idiomatic translation or stylistic refinement. Type: 'production' or 'collocation'.

Question Types allowed:
- 'production': Open-ended prompt asking user to compose or translate a sentence in ${targetLanguage} demonstrating specific grammar/vocab.
- 'transformation': Fill-in or reformulate the bracketed idea into the correct tense/form.
- 'error_spotting': Provide a sentence with 1 realistic slip; user must write the corrected sentence.
- 'collocation': Choose or write the natural native phrasing rather than a literal word-for-word translation.
- 'listening': Provide audio text that will be spoken aloud to the student, and ask a question about it.

Make sure every prompt has clear instructions written in ${knownLanguage}.`;

    const prompt = `Generate a ${testType === "quick" ? "5-question quick diagnostic" : "7-question comprehensive placement exam"} for ${targetLanguage} (for native ${knownLanguage} speakers).
Cover CEFR levels A1, A2, B1, B2, and C1.`;

    let parsed: any;
    try {
      const response = await generateWithFallback(ai, {
        primaryModel: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              testTitle: { type: Type.STRING, description: "Title of placement exam" },
              targetLanguage: { type: Type.STRING },
              knownLanguage: { type: Type.STRING },
              estimatedDurationMinutes: { type: Type.INTEGER },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    cefrLevel: { type: Type.STRING, description: "'A1', 'A2', 'B1', 'B2', 'C1', or 'C2'" },
                    questionType: {
                      type: Type.STRING,
                      description: "'production', 'transformation', 'error_spotting', 'collocation', or 'listening'",
                    },
                    prompt: { type: Type.STRING, description: "Clear instructions or prompt in known language with target language context" },
                    targetItem: { type: Type.STRING, description: "Core grammar rule, verb tense, or vocabulary focus" },
                    contextOrAudioText: { type: Type.STRING, description: "Sentence to be spoken aloud for listening or context" },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Optional choices if multiple choice, or empty array if open input",
                    },
                    correctAnswerSample: { type: Type.STRING, description: "Ideal reference answer in target language" },
                    explanation: { type: Type.STRING, description: "What this question assesses" },
                  },
                  required: [
                    "id",
                    "cefrLevel",
                    "questionType",
                    "prompt",
                    "targetItem",
                    "correctAnswerSample",
                    "explanation",
                  ],
                },
              },
            },
            required: ["testTitle", "questions"],
          },
        },
      });

      parsed = JSON.parse(response.text || "{}");
      if (!parsed.questions || parsed.questions.length === 0) {
        throw new Error("Empty questions returned from model.");
      }
    } catch (aiErr) {
      console.warn("AI generation failed, using rich diagnostic fallback:", aiErr);
      parsed = getFallbackPlacementQuestions(targetLanguage, knownLanguage, testType);
    }

    res.json(parsed);
  } catch (error: any) {
    console.error("Placement test generation error:", error);
    // Even on total exception, deliver the diagnostic questions so the app doesn't fail
    const fallback = getFallbackPlacementQuestions(req.body.targetLanguage || "Spanish", req.body.knownLanguage || "English", req.body.testType || "comprehensive");
    res.json(fallback);
  }
});

// Evaluate Language Placement Test Submissions
app.post("/api/evaluate-placement-test", async (req, res) => {
  try {
    const { targetLanguage, knownLanguage, submissions, testQuestions } = req.body;

    if (!targetLanguage || !submissions || !Array.isArray(submissions)) {
      return res.status(400).json({ error: "Missing test submissions data." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a chief international language examiner, standardized test evaluator (CEFR, ACTFL, DELE, DELF, Goethe, JLPT, HSK, etc.), and pedagogical diagnostics director.
Evaluate a learner's placement exam in ${targetLanguage} (known language: ${knownLanguage}).

You must analyze every single answer submitted by the learner:
1. Did the user answer correctly and idiomatically in ${targetLanguage}?
2. Score each question objectively (isCorrect: true/false, feedback in ${knownLanguage}, and idealAnswer).
3. Compute an overall percentage score (0-100%).
4. Determine the precise diagnosed CEFR Level:
   - "A1": Beginner / Breakthrough (Knows basic phrases, struggles with past tense or complex clauses)
   - "A2": Elementary / Waystage (Can narrate simple routine events, struggles with subjunctive/connectors/nuance)
   - "B1": Intermediate / Threshold (Can express opinions, hypotheticals, compound clauses with minor slips)
   - "B2": Upper Intermediate / Vantage (Fluent discourse, understands nuances, occasional high-register mistakes)
   - "C1": Advanced / Effective Operational (High complexity, idioms, sophisticated sentence structure)
   - "C2": Mastery
5. Map to target language official standardized test equivalency:
   - Spanish: DELE / SIELE (e.g. "DELE B1 (Estimated 76/100 points)") & ACTFL ("Intermediate High")
   - French: DELF / DALF (e.g. "DELF B1")
   - German: Goethe-Zertifikat / TestDaF (e.g. "Goethe-Zertifikat B2")
   - Japanese: JLPT (e.g. "JLPT N3")
   - Chinese: HSK (e.g. "HSK Level 4")
   - Italian: CILS / CELI
   - Russian: TORFL
   - Portuguese: Celpe-Bras
   - Korean: TOPIK (e.g. "TOPIK Level 3")
   - English: IELTS / TOEFL / Cambridge
6. Estimate their Active Production Vocabulary Horizon (e.g. ~400 words for A1, ~1,000 words for A2, ~2,200 words for B1, ~4,000 words for B2, ~7,500 words for C1).
7. Recommend the exact Optimal Starting Frequency Rank for flashcard practice:
   - A1: Starting Rank #1
   - A2: Starting Rank #250
   - B1: Starting Rank #650
   - B2: Starting Rank #1500
   - C1: Starting Rank #3000
8. Synthesize specific identifiedErrors made by the student (originalMistake, correctedForm, errorType, explanation) so we can create instant personalized Error Remedy flashcards for them!`;

    const prompt = `Target Language: ${targetLanguage}
Known Language: ${knownLanguage}

Questions and Learner Submissions:
${submissions
  .map((sub: any, idx: number) => {
    const q = testQuestions?.find((item: any) => item.id === sub.questionId) || {};
    return `[Question ${idx + 1}] (CEFR ${sub.cefrLevel || q.cefrLevel}, Type: ${sub.questionType || q.questionType})
Prompt: ${q.prompt || "N/A"}
Target Item: ${q.targetItem || "N/A"}
Expected Reference: ${q.correctAnswerSample || "N/A"}
Learner Answer: "${sub.userAnswer}"`;
  })
  .join("\n\n")}

Analyze the test thoroughly and output the comprehensive evaluation JSON.`;

    let parsed: any;
    try {
      const response = await generateWithFallback(ai, {
        primaryModel: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallCEFR: { type: Type.STRING, description: "'A1', 'A2', 'B1', 'B2', 'C1', or 'C2'" },
              cefrDescription: { type: Type.STRING, description: "Detailed summary of diagnosed level" },
              percentageScore: { type: Type.NUMBER, description: "0 to 100" },
              estimatedActiveVocabularySize: { type: Type.INTEGER, description: "Estimated active vocabulary words count" },
              recommendedStartingRank: { type: Type.INTEGER, description: "Recommended starting rank in frequency list" },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key linguistic strengths demonstrated",
              },
              weaknesses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Identified gap areas to improve",
              },
              identifiedErrors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    originalMistake: { type: Type.STRING },
                    correctedForm: { type: Type.STRING },
                    errorType: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ["originalMistake", "correctedForm", "errorType", "explanation"],
                },
                description: "Discrete errors made during the test for immediate remedy card synthesis",
              },
              standardizedEquivalency: {
                type: Type.OBJECT,
                properties: {
                  frameworkName: { type: Type.STRING, description: "e.g. DELE, JLPT, Goethe, DELF, HSK" },
                  estimatedScoreOrGrade: { type: Type.STRING, description: "e.g. DELE B1 (76/100), JLPT N3" },
                  actflEquivalent: { type: Type.STRING, description: "e.g. Intermediate Mid, Advanced Low" },
                  readinessPercentage: { type: Type.NUMBER, description: "0-100% test readiness" },
                  description: { type: Type.STRING, description: "Summary of readiness for official exam" },
                },
                required: ["frameworkName", "estimatedScoreOrGrade", "actflEquivalent", "readinessPercentage", "description"],
              },
              detailedFeedback: { type: Type.STRING, description: "In-depth encouraging feedback in known language" },
              perQuestionReview: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionId: { type: Type.STRING },
                    cefrLevel: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    userAnswer: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN },
                    feedback: { type: Type.STRING },
                    idealAnswer: { type: Type.STRING },
                  },
                  required: ["questionId", "cefrLevel", "prompt", "userAnswer", "isCorrect", "feedback", "idealAnswer"],
                },
              },
            },
            required: [
              "overallCEFR",
              "cefrDescription",
              "percentageScore",
              "estimatedActiveVocabularySize",
              "recommendedStartingRank",
              "strengths",
              "weaknesses",
              "identifiedErrors",
              "standardizedEquivalency",
              "detailedFeedback",
              "perQuestionReview",
            ],
          },
        },
      });

      parsed = JSON.parse(response.text || "{}");
    } catch (aiErr) {
      console.warn("AI evaluation failed, using diagnostic rule-based fallback:", aiErr);
      parsed = getFallbackPlacementEvaluation(targetLanguage, knownLanguage, submissions, testQuestions);
    }

    res.json(parsed);
  } catch (error: any) {
    console.error("Placement test evaluation error:", error);
    const fallback = getFallbackPlacementEvaluation(req.body.targetLanguage || "Spanish", req.body.knownLanguage || "English", req.body.submissions || [], req.body.testQuestions || []);
    res.json(fallback);
  }
});

// Regenerate Calibrated Flashcard Deck based on Diagnostic Level & Errors
app.post("/api/regenerate-level-deck", async (req, res) => {
  try {
    const {
      targetLanguage,
      knownLanguage,
      cefrLevel,
      recommendedStartingRank = 1,
      identifiedErrors = [],
      cardCount = 15,
    } = req.body;

    if (!targetLanguage || !knownLanguage) {
      return res.status(400).json({ error: "Target and known languages are required." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are an elite language curriculum architect.
Generate a custom-calibrated spaced repetition deck for learning ${targetLanguage} (for ${knownLanguage} speakers).
Diagnosed Level: ${cefrLevel || "B1"}
Starting Frequency Rank: #${recommendedStartingRank}
Card Count: ${cardCount}
Learner Test Slips / Errors to Remedy: ${JSON.stringify(identifiedErrors.slice(0, 5))}

Requirements:
1. Generate ${Math.max(8, cardCount - identifiedErrors.length)} frequency-ranked cards appropriate for CEFR ${cefrLevel}, starting from frequency rank #${recommendedStartingRank}. Skip basic words already mastered.
2. For each identified error, generate a dedicated "common_error" remedy flashcard with:
   - type: "common_error"
   - isCommonError: true
   - originalMistake: the mistake pattern
   - correctedForm: the proper natural construction
   - targetItem: the corrected key word or pattern
   - usageNotes: concise mnemonic explaining the exact grammatical pitfall and remedy
   - frequencyRank: 0
3. Return a cohesive, structured deck with deckTitle, deckDescription, and the full card array.`;

    const prompt = `Generate a calibrated flashcard deck for ${targetLanguage} (native ${knownLanguage}) at CEFR Level ${cefrLevel || "B1"}.
Starting rank: #${recommendedStartingRank}.
Include remedy cards for test slips: ${identifiedErrors.map((e: any) => `"${e.originalMistake}" -> "${e.correctedForm}"`).join("; ")}.`;

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckTitle: { type: Type.STRING },
            deckDescription: { type: Type.STRING },
            level: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "'vocabulary', 'grammar', or 'common_error'" },
                  isCommonError: { type: Type.BOOLEAN },
                  originalMistake: { type: Type.STRING },
                  correctedForm: { type: Type.STRING },
                  targetItem: { type: Type.STRING },
                  frequencyRank: { type: Type.INTEGER },
                  partOfSpeech: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                  usageNotes: { type: Type.STRING },
                  examples: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        target: { type: Type.STRING },
                        translation: { type: Type.STRING },
                        phonetic: { type: Type.STRING },
                      },
                      required: ["target", "translation"],
                    },
                  },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["type", "targetItem", "partOfSpeech", "definition", "usageNotes", "examples"],
              },
            },
          },
          required: ["deckTitle", "deckDescription", "cards"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Calibrated deck generation error:", error);
    res.status(500).json({ error: error.message || "Failed to regenerate calibrated deck" });
  }
});

// Generate Reading & Listening Immersion Article incorporating today's words/grammar
app.post("/api/generate-reading-article", async (req, res) => {
  try {
    const {
      targetLanguage,
      knownLanguage,
      targetLanguageCode,
      knownLanguageCode,
      topic,
      cefrLevel = "A2",
      targetWords = [],
    } = req.body;

    if (!targetLanguage) {
      return res.status(400).json({ error: "Target language is required" });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are a master foreign language pedagogue and author.
Your task is to write an engaging, natural, level-appropriate (CEFR ${cefrLevel}) short story or informative article in ${targetLanguage}.
The learner's native/known language is ${knownLanguage}.

CRITICAL REQUIREMENTS:
1. Seamlessly incorporate the following target words/grammar patterns that the user is studying today: ${targetWords.join(", ")}.
2. The writing must be natural and idiomatic in ${targetLanguage}, NOT awkward or machine-translated.
3. Organize the article into 3 to 5 logical paragraphs.
4. For each paragraph, provide the paragraph in ${targetLanguage} AND an accurate translation in ${knownLanguage}.
5. Give the article a catchy title in ${targetLanguage} and title translation in ${knownLanguage}.
6. Provide a concise summary (1-2 sentences in ${knownLanguage}) and list the target words/patterns used in the story.`;

    const prompt = `Write a reading and listening practice article in ${targetLanguage} at CEFR Level ${cefrLevel}.
Topic / Context: ${topic || "Daily life, culture, or an interesting everyday adventure"}
Target vocabulary & grammar items to weave into the story:
${targetWords.length > 0 ? targetWords.map((w: string, i: number) => `${i + 1}. ${w}`).join("\n") : "High-frequency core words and daily conversational structures"}

Return the structured JSON output.`;

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title in target language" },
            titleTranslation: { type: Type.STRING, description: "Title translation in known language" },
            topic: { type: Type.STRING, description: "Topic theme" },
            cefrLevel: { type: Type.STRING, description: "CEFR Level e.g. A1, A2, B1, B2, C1" },
            content: { type: Type.STRING, description: "Complete article text in target language" },
            paragraphs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  targetText: { type: Type.STRING, description: "Paragraph text in target language" },
                  translation: { type: Type.STRING, description: "Paragraph translation in known language" },
                },
                required: ["targetText", "translation"],
              },
            },
            targetWordsUsed: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of target items actively integrated in the text",
            },
            summary: {
              type: Type.STRING,
              description: "Short summary in known language",
            },
            followUpQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  questionText: { type: Type.STRING, description: "Follow-up question in target language" },
                  questionTranslation: { type: Type.STRING, description: "Question translation in known language" },
                  focusGrammarOrConcept: { type: Type.STRING, description: "Grammar or vocabulary focus of the question" },
                  suggestedAnswerHint: { type: Type.STRING, description: "Gentle hint or starter in known language" },
                },
                required: ["id", "questionText", "questionTranslation"],
              },
              description: "2 to 3 interactive comprehension and discussion questions about this story",
            },
          },
          required: ["title", "titleTranslation", "paragraphs", "content", "targetWordsUsed", "summary"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      id: `article-${Date.now()}`,
      ...parsed,
      targetLanguage,
      knownLanguage,
      targetLanguageCode,
      knownLanguageCode,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Reading article generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate reading article" });
  }
});

// Explain Highlighted Excerpt from Reading Practice
app.post("/api/explain-reading-text", async (req, res) => {
  try {
    const {
      selectedText,
      fullContext,
      targetLanguage,
      knownLanguage,
    } = req.body;

    if (!selectedText || !targetLanguage) {
      return res.status(400).json({ error: "Selected text and target language are required" });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are a linguistic expert and language tutor.
The user highlighted the text: "${selectedText}" within the reading context: "${fullContext || selectedText}".
Target language: ${targetLanguage}. Known/native language: ${knownLanguage || "English"}.

Provide a clear pedagogical breakdown:
1. Accurate translation of the highlighted phrase/sentence in ${knownLanguage}.
2. Grammatical explanation / syntax notes (why words are in this order, verb conjugations, particles, idioms).
3. Break down the key concept(s) and vocabulary word(s) inside this highlighted text into flashcard-ready concepts.
For each concept:
- targetItem (the root word or dictionary form or grammatical formula)
- type ('vocabulary' or 'grammar')
- partOfSpeech (e.g., 'Transitive Verb', 'Conjunction', 'Particle')
- definition (concise meaning in ${knownLanguage})
- phonetic (phonetic pronunciation, IPA, pinyin, romaji, or hangul phonetic)
- usageNotes (how to use it)
- exampleSentence ({ target: string, translation: string, phonetic?: string })`;

    const prompt = `Analyze and explain this highlighted excerpt from reading practice:
Highlighted Text: "${selectedText}"
Context: "${fullContext || ""}"
Target Language: ${targetLanguage}
Learner Known Language: ${knownLanguage}

Return the structured JSON explanation with extractable flashcard concepts.`;

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            selectedText: { type: Type.STRING },
            translation: { type: Type.STRING },
            grammaticalContext: { type: Type.STRING, description: "Grammatical & contextual explanation in known language" },
            concepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  targetItem: { type: Type.STRING },
                  type: { type: Type.STRING, description: "'vocabulary' or 'grammar'" },
                  partOfSpeech: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                  usageNotes: { type: Type.STRING },
                  exampleSentence: {
                    type: Type.OBJECT,
                    properties: {
                      target: { type: Type.STRING },
                      translation: { type: Type.STRING },
                      phonetic: { type: Type.STRING },
                    },
                    required: ["target", "translation"],
                  },
                },
                required: ["targetItem", "type", "partOfSpeech", "definition", "exampleSentence"],
              },
            },
          },
          required: ["selectedText", "translation", "grammaticalContext", "concepts"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Text explanation error:", error);
    res.status(500).json({ error: error.message || "Failed to explain highlighted text" });
  }
});

// Grade User Response to Reading & Listening Follow-up Question
app.post("/api/grade-reading-response", async (req, res) => {
  try {
    const {
      questionText,
      questionTranslation,
      userResponse,
      articleContext,
      targetLanguage,
      knownLanguage = "English",
      targetLanguageCode = "es",
    } = req.body;

    if (!questionText || !userResponse || !targetLanguage) {
      return res.status(400).json({ error: "questionText, userResponse, and targetLanguage are required" });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are a master foreign language instructor and pedagogical evaluator in ${targetLanguage}.
Evaluate a learner's written or dictated response to a reading comprehension follow-up question.
Learner's native/known language: ${knownLanguage}.

Article Story Context:
"""
${articleContext || "Context provided in question."}
"""

Question Asked: "${questionText}" (${questionTranslation || ""})
Learner's Response: "${userResponse}"

You MUST evaluate two independent dimensions:
1. SEMANTIC ACCURACY & COMPREHENSION: Did the learner correctly answer the question based on the facts/nuance of the story? (semanticScore 0-100, isSemanticallyAccurate: boolean, semanticFeedback in ${knownLanguage}).
2. GRAMMATICAL & MORPHOLOGICAL CORRECTNESS: Is the sentence grammatically well-formed in ${targetLanguage}? (grammarScore 0-100, isGrammaticallyCorrect: boolean, grammarFeedback in ${knownLanguage}).
3. CORRECTED / NATIVE POLISH: Provide the most natural, idiomatic version in ${targetLanguage} with its ${knownLanguage} translation.
4. IDENTIFIED ERRORS & REMEDY FLASHCARDS: If the student made any vocabulary, grammar, conjugation, or particle errors, extract them into:
   - identifiedErrors: [{ originalMistake, correctedForm, errorType, explanation }]
   - suggestedRemedyCards: Array of flashcard objects that the learner can add to their Spaced Repetition deck to prevent this mistake from recurring!`;

    const prompt = `Evaluate the learner's response:
Target Language: ${targetLanguage}
Question: "${questionText}"
User Answer: "${userResponse}"

Output structured JSON evaluation.`;

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            semanticScore: { type: Type.NUMBER, description: "0-100 semantic comprehension score" },
            isSemanticallyAccurate: { type: Type.BOOLEAN },
            semanticFeedback: { type: Type.STRING, description: "Feedback on reading comprehension" },
            grammarScore: { type: Type.NUMBER, description: "0-100 grammatical correctness score" },
            isGrammaticallyCorrect: { type: Type.BOOLEAN },
            grammarFeedback: { type: Type.STRING, description: "Feedback on syntax, conjugation, and word choice" },
            correctedResponse: { type: Type.STRING, description: "Idiomatic native formulation in target language" },
            correctedTranslation: { type: Type.STRING, description: "Translation of corrected response in known language" },
            identifiedErrors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalMistake: { type: Type.STRING },
                  correctedForm: { type: Type.STRING },
                  errorType: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ["originalMistake", "correctedForm", "errorType", "explanation"],
              },
            },
            suggestedRemedyCards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "'vocabulary', 'grammar', or 'common_error'" },
                  isCommonError: { type: Type.BOOLEAN },
                  originalMistake: { type: Type.STRING },
                  correctedForm: { type: Type.STRING },
                  targetItem: { type: Type.STRING },
                  partOfSpeech: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                  usageNotes: { type: Type.STRING },
                  examples: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        target: { type: Type.STRING },
                        translation: { type: Type.STRING },
                      },
                      required: ["target", "translation"],
                    },
                  },
                },
                required: ["type", "targetItem", "partOfSpeech", "definition", "usageNotes", "examples"],
              },
            },
          },
          required: [
            "semanticScore",
            "isSemanticallyAccurate",
            "semanticFeedback",
            "grammarScore",
            "isGrammaticallyCorrect",
            "grammarFeedback",
            "correctedResponse",
            "correctedTranslation",
            "identifiedErrors",
            "suggestedRemedyCards",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Reading response grading error:", error);
    // Graceful rule-based fallback
    const userAns = req.body?.userResponse || "";
    const isLenOk = userAns.trim().length >= 8;
    res.json({
      semanticScore: isLenOk ? 85 : 50,
      isSemanticallyAccurate: isLenOk,
      semanticFeedback: isLenOk
        ? "Good effort! Your response addresses the main topic of the question."
        : "Your response is very short. Try elaborating with more details from the passage.",
      grammarScore: isLenOk ? 80 : 60,
      isGrammaticallyCorrect: isLenOk,
      grammarFeedback: "Sentence structure is understood. Practice using complete subject-verb agreement.",
      correctedResponse: userAns,
      correctedTranslation: "Refined native formulation",
      identifiedErrors: [],
      suggestedRemedyCards: [],
    });
  }
});

// Verb Conjugation Table Lookup API
app.post("/api/conjugation-lookup", async (req, res) => {
  try {
    const {
      verb,
      targetLanguage,
      targetLanguageCode,
      knownLanguage = "English",
    } = req.body;

    if (!verb || !targetLanguage) {
      return res.status(400).json({ error: "Verb and targetLanguage are required" });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are a world-class computational linguist and language teacher specializing in verb paradigms and inflectional morphology.
Generate a complete, authoritative conjugation breakdown for the verb "${verb}" in ${targetLanguage}.
The learner's known/native language is ${knownLanguage}.

Requirements:
1. Provide the dictionary infinitive / root form, accurate translation into ${knownLanguage}, and whether it is regular, irregular, or stem-changing.
2. Include ALL key inflectional tenses/moods/forms appropriate for ${targetLanguage}:
   - For Spanish: Present Indicative, Preterite Indefinido, Imperfect Past, Future Simple, Conditional, Present Subjunctive, Imperfect Subjunctive, Affirmative Imperative, Gerund & Participle.
   - For Japanese: Plain/Dictionary, Polite ます-form, Polite ました-form, て-form, Plain Past た-form, Plain Negative ない-form, Potential 可能形, Volitional 意向形, Conditional たら/ば-form, Passive, Causative, Desire たい-form.
   - For Korean: Present Informal Polite (해요체), Formal Polite (하십시오체), Past Polite (과거형), Future Intention (-(으)ㄹ 거예요), Continuous (-고 있다), Desire (-고 싶다), Connective (-고 / -아/어서), Conditional (-(으)면), Subject Honorific (-(으)시-).
3. For each form group:
   - Unique id (e.g. "present_indicative", "preterite", "te_form", "polite_masu", "present_polite")
   - Descriptive name
   - Category ('indicative', 'subjunctive', 'imperative', 'participle', 'polite', 'plain', 'connective', 'modal', 'honorific')
   - Concise pedagogical explanation & rule formula
   - Full list of conjugated entries (e.g. for Spanish: yo, tú, él/ella/usted, nosotros, vosotros, ellos/ellas/ustedes; for Japanese/Korean: affirmative, negative, question, etc.)
   - For each entry: personOrForm, conjugated string, phonetic/pronunciation guide, English translation, and a concise realistic example sentence with translation.`;

    const prompt = `Lookup and construct the comprehensive conjugation table for verb: "${verb}" in ${targetLanguage} (${targetLanguageCode}). Known language: ${knownLanguage}.`;

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verb: { type: Type.STRING },
            infinitiveOrRoot: { type: Type.STRING },
            translation: { type: Type.STRING },
            targetLanguage: { type: Type.STRING },
            targetLangCode: { type: Type.STRING },
            regularity: { type: Type.STRING, description: "'regular', 'irregular', or 'stem-changing'" },
            stemNotes: { type: Type.STRING },
            forms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  formula: { type: Type.STRING },
                  entries: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        personOrForm: { type: Type.STRING },
                        conjugated: { type: Type.STRING },
                        phonetic: { type: Type.STRING },
                        english: { type: Type.STRING },
                        example: {
                          type: Type.OBJECT,
                          properties: {
                            target: { type: Type.STRING },
                            translation: { type: Type.STRING },
                          },
                          required: ["target", "translation"],
                        },
                      },
                      required: ["personOrForm", "conjugated", "english"],
                    },
                  },
                },
                required: ["id", "name", "category", "description", "entries"],
              },
            },
          },
          required: ["verb", "infinitiveOrRoot", "translation", "forms"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Conjugation lookup error:", error);
    res.status(500).json({ error: error.message || "Failed to lookup verb conjugations" });
  }
});

// Text-to-Speech API using gemini-3.1-flash-tts-preview as server-side high-quality audio fallback
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required for TTS" });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say clearly and naturally: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audioBase64: base64Audio, sampleRate: 24000 });
    } else {
      res.status(400).json({ error: "No audio generated" });
    }
  } catch (error: any) {
    console.error("TTS generation error:", error);
    res.status(500).json({ error: error.message || "TTS failed" });
  }
});

// Vite middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Frequency SRS server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
