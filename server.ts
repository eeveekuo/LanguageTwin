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
  safeParseJson,
  getFallbackDeck,
  getFallbackSentenceEvaluation,
  getFallbackExplainCard,
  getFallbackAiTutorReply,
  getFallbackQuickAssist,
  getFallbackReadingArticle,
  getFallbackJournalCheck,
} from "./server/geminiResilience";
import {
  getDeckGenerationSystemInstruction,
  getDeckGenerationUserPrompt,
  getCalibratedDeckSystemInstruction,
  getCalibratedDeckUserPrompt,
  getSentenceEvaluationSystemInstruction,
  getSentenceEvaluationUserPrompt,
  getAiTutorSystemInstruction,
  getAiTutorUserPrompt,
  getQuickAssistSystemInstruction,
  getQuickAssistUserPrompt,
  getScenarioGenerationSystemInstruction,
  getScenarioGenerationUserPrompt,
  getPlacementQuestionsSystemInstruction,
  getPlacementQuestionsUserPrompt,
  getAdaptivePlacementTestSystemInstruction,
  getAdaptivePlacementTestUserPrompt,
  getEvaluatePlacementSystemInstruction,
  getEvaluatePlacementUserPrompt,
  getReadingArticleSystemInstruction,
  getReadingArticleUserPrompt,
  getExplainReadingTextSystemInstruction,
  getExplainReadingTextUserPrompt,
  getGradeReadingResponseSystemInstruction,
  getGradeReadingResponseUserPrompt,
  getConjugationLookupSystemInstruction,
  getConjugationLookupUserPrompt,
  getExplainCardSystemInstruction,
  getExplainCardUserPrompt,
  getJournalCheckSystemInstruction,
  getJournalCheckUserPrompt,
} from "./server/prompts";

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

// Initialize Gemini SDK with User-Agent header
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

    const systemInstruction = getSentenceEvaluationSystemInstruction({
      targetItem,
      cardType,
      partOfSpeech,
      targetLanguage,
      knownLanguage,
      definition,
    });

    const prompt = getSentenceEvaluationUserPrompt({
      targetItem,
      cardType,
      partOfSpeech,
      targetLanguage,
      knownLanguage,
      definition,
      userSentence,
      inputMethod,
    });

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-3.7-flash",
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
              description: "Grammatically corrected and natural sentence in target language",
            },
            grammarBreakdown: {
              type: Type.STRING,
              description: "Clear pedagogical explanation in known language",
            },
            identifiedErrors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalMistake: { type: Type.STRING, description: "The incorrect word, particle, or phrase produced" },
                  correctedForm: { type: Type.STRING, description: "The correct form or construction" },
                  errorType: {
                    type: Type.STRING,
                    description: "'grammar', 'conjugation', 'agreement', 'spelling', 'vocab', 'particle', or 'nuance'",
                  },
                  explanation: { type: Type.STRING, description: "Why this was an error and how to remember it" },
                },
                required: ["originalMistake", "correctedForm", "errorType", "explanation"],
              },
              description: "List of specific discrete errors to register in learner error ledger",
            },
            usageAlternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  targetSentence: { type: Type.STRING },
                  translation: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                },
                required: ["targetSentence", "translation"],
              },
              description: "2-3 natural real-world alternative sentences using the target item",
            },
            detectedTenseOrAspect: {
              type: Type.STRING,
              description: "Tense or mood detected (e.g. 'Preterite Indicative', 'Subjunctive', 'Polite ます-form')",
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
            "grammarBreakdown",
            "identifiedErrors",
            "usageAlternatives",
          ],
        },
      },
    });

    const parsed = safeParseJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    console.error("Sentence evaluation error, using fallback:", error);
    const fallback = getFallbackSentenceEvaluation({
      targetItem: req.body?.targetItem || "",
      userSentence: req.body?.userSentence || "",
      targetLanguage: req.body?.targetLanguage || "Spanish",
      knownLanguage: req.body?.knownLanguage || "English",
      definition: req.body?.definition,
    });
    res.json(fallback);
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

    const systemInstruction = getExplainCardSystemInstruction({
      targetItem,
      cardType,
      partOfSpeech,
      targetLanguage,
      knownLanguage,
      frequencyRank,
    });

    const prompt = getExplainCardUserPrompt({
      targetItem,
      targetLanguage,
      knownLanguage,
    });

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-3.7-flash",
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

    const parsed = safeParseJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    console.error("Explain card error, using fallback:", error);
    const fallback = getFallbackExplainCard({
      targetItem: req.body?.targetItem || "",
      targetLanguage: req.body?.targetLanguage || "Spanish",
      knownLanguage: req.body?.knownLanguage || "English",
      partOfSpeech: req.body?.partOfSpeech,
      definition: req.body?.definition,
    });
    res.json(fallback);
  }
});

// Generate Custom Frequency-Ranked Flashcard Deck
app.post("/api/generate-deck", async (req, res) => {
  try {
    const {
      targetLanguage,
      knownLanguage,
      topic,
      level,
      count = 15,
      startFrequencyRank = 1,
    } = req.body;

    if (!targetLanguage || !knownLanguage) {
      return res.status(400).json({ error: "Target and known language are required." });
    }

    const ai = getGeminiClient();

    const systemInstruction = getDeckGenerationSystemInstruction({
      targetLanguage,
      knownLanguage,
      topic,
      level,
      count,
      startFrequencyRank,
    });

    const prompt = getDeckGenerationUserPrompt({
      targetLanguage,
      knownLanguage,
      topic,
      level,
      count,
      startFrequencyRank,
    });

    let parsed: any;
    try {
      const response = await generateWithFallback(ai, {
        primaryModel: "gemini-3.7-flash",
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

      parsed = safeParseJson(response.text);
      if (!parsed.cards || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
        throw new Error("No cards in AI response");
      }
    } catch (aiErr) {
      console.warn("AI generation failed, providing rich fallback deck:", aiErr);
      parsed = getFallbackDeck(targetLanguage, knownLanguage, topic, level, count, startFrequencyRank);
    }

    res.json(parsed);
  } catch (error: any) {
    console.error("Deck generation error:", error);
    const fallback = getFallbackDeck(
      req.body?.targetLanguage || "Traditional Chinese",
      req.body?.knownLanguage || "English",
      req.body?.topic,
      req.body?.level,
      req.body?.count || 15,
      req.body?.startFrequencyRank || 1
    );
    res.json(fallback);
  }
});

// Interactive AI Tutor Chat with Active Flashcard Production Evaluation
app.post("/api/ai-tutor-chat", async (req, res) => {
  try {
    const {
      messages,
      scenario,
      targetLanguage,
      knownLanguage,
      deckKeywords = [],
      targetDeckCards = [],
      learnerErrors = [],
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing conversation messages." });
    }

    const ai = getGeminiClient();

    const systemInstruction = getAiTutorSystemInstruction({
      targetLanguage,
      knownLanguage,
      scenario,
      targetDeckCards,
      learnerErrors,
    });

    const prompt = getAiTutorUserPrompt({
      messages,
      targetLanguage,
      knownLanguage,
    });

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-3.7-flash",
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

    const parsed = safeParseJson(response.text);
    res.json({
      reply: parsed.reply || "",
      evaluatedItems: parsed.evaluatedItems || [],
    });
  } catch (error: any) {
    console.error("Tutor chat error, using fallback:", error);
    const messages = req.body?.messages || [];
    const lastMsg = messages[messages.length - 1]?.content || "";
    const fallback = getFallbackAiTutorReply({
      userMessage: lastMsg,
      targetLanguage: req.body?.targetLanguage || "Spanish",
      knownLanguage: req.body?.knownLanguage || "English",
    });
    res.json(fallback);
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

    const systemInstruction = getQuickAssistSystemInstruction({
      targetLanguage,
      knownLanguage,
      query,
      queryType,
    });

    const prompt = getQuickAssistUserPrompt({
      query,
      targetLanguage,
      knownLanguage,
      queryType,
    });

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-3.7-flash",
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

    const parsed = safeParseJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    console.error("Quick assist error, using fallback:", error);
    const fallback = getFallbackQuickAssist({
      query: req.body?.query || "",
      targetLanguage: req.body?.targetLanguage || "Spanish",
      knownLanguage: req.body?.knownLanguage || "English",
    });
    res.json(fallback);
  }
});

// Generate Random Conversation Scenario
app.post("/api/generate-scenario", async (req, res) => {
  try {
    const { targetLanguage, knownLanguage, theme = "any", level = "A2/B1" } = req.body;

    const ai = getGeminiClient();

    const systemInstruction = getScenarioGenerationSystemInstruction({
      targetLanguage,
      knownLanguage,
      theme,
      level,
    });

    const prompt = getScenarioGenerationUserPrompt({
      targetLanguage,
      knownLanguage,
      theme,
      level,
    });

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-3.7-flash",
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

    const parsed = safeParseJson(response.text);
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

    const systemInstruction = getAdaptivePlacementTestSystemInstruction({
      targetLanguage,
      knownLanguage,
      testType,
    });

    const prompt = getAdaptivePlacementTestUserPrompt({
      targetLanguage,
      knownLanguage,
      testType,
    });

    let parsed: any;
    try {
      const response = await generateWithFallback(ai, {
        primaryModel: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              testTitle: { type: Type.STRING },
              testDescription: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    cefrLevel: { type: Type.STRING, description: "'A1', 'A2', 'B1', 'B2', or 'C1'" },
                    questionType: {
                      type: Type.STRING,
                      description: "'production', 'transformation', 'error_spotting', 'collocation', or 'listening'",
                    },
                    prompt: { type: Type.STRING, description: "Clear instructions in known language" },
                    challengeText: { type: Type.STRING, description: "The sentence or bracketed prompt for the user to complete or fix" },
                    targetItem: { type: Type.STRING, description: "The grammatical or vocabulary concept assessed (e.g. 'Subjunctive vs Indicative')" },
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

    const systemInstruction = getEvaluatePlacementSystemInstruction({
      targetLanguage,
      knownLanguage,
    });

    const prompt = getEvaluatePlacementUserPrompt({
      targetLanguage,
      knownLanguage,
      submissions,
      testQuestions,
    });

    let parsed: any;
    try {
      const response = await generateWithFallback(ai, {
        primaryModel: "gemini-3.7-flash",
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
              standardizedEquivalency: { type: Type.STRING, description: "e.g. 'DELE B1 / ACTFL Intermediate High'" },
              estimatedVocabularyHorizon: { type: Type.STRING, description: "e.g. '~2,200 active words'" },
              recommendedStartingRank: { type: Type.INTEGER, description: "Optimal starting rank for frequency SRS" },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of linguistic strengths demonstrated",
              },
              growthAreas: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key grammatical or structural areas to strengthen",
              },
              questionAssessments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionId: { type: Type.STRING },
                    cefrLevel: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN },
                    feedback: { type: Type.STRING },
                    idealAnswer: { type: Type.STRING },
                  },
                  required: ["questionId", "cefrLevel", "isCorrect", "feedback", "idealAnswer"],
                },
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
                description: "Specific slip patterns to convert into immediate Error Remedy flashcards",
              },
            },
            required: [
              "overallCEFR",
              "cefrDescription",
              "percentageScore",
              "standardizedEquivalency",
              "estimatedVocabularyHorizon",
              "recommendedStartingRank",
              "strengths",
              "growthAreas",
              "questionAssessments",
              "identifiedErrors",
            ],
          },
        },
      });

      parsed = safeParseJson(response.text);
    } catch (aiErr) {
      console.warn("AI evaluation failed, using resilience fallback:", aiErr);
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

    const systemInstruction = getCalibratedDeckSystemInstruction({
      targetLanguage,
      knownLanguage,
      cefrLevel,
      recommendedStartingRank,
      identifiedErrors,
      cardCount,
    });

    const prompt = getCalibratedDeckUserPrompt({
      targetLanguage,
      knownLanguage,
      cefrLevel,
      recommendedStartingRank,
      identifiedErrors,
      cardCount,
    });

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-3.7-flash",
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

    const parsed = safeParseJson(response.text);
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
    const systemInstruction = getReadingArticleSystemInstruction({
      targetLanguage,
      knownLanguage,
      targetLanguageCode,
      knownLanguageCode,
      topic,
      cefrLevel,
      targetWords,
    });

    const prompt = getReadingArticleUserPrompt({
      targetLanguage,
      knownLanguage,
      topic,
      cefrLevel,
      targetWords,
    });

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-3.7-flash",
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
            summary: { type: Type.STRING, description: "1-2 sentence summary in known language" },
            vocabularyUsed: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  partOfSpeech: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                },
                required: ["word", "definition"],
              },
            },
            comprehensionQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING, description: "Question in target language" },
                  questionTranslation: { type: Type.STRING, description: "Question in known language" },
                  focusWordOrGrammar: { type: Type.STRING },
                  hint: { type: Type.STRING },
                  idealAnswer: { type: Type.STRING },
                },
                required: ["id", "question", "questionTranslation", "idealAnswer"],
              },
            },
          },
          required: [
            "title",
            "titleTranslation",
            "topic",
            "cefrLevel",
            "content",
            "paragraphs",
            "summary",
            "vocabularyUsed",
            "comprehensionQuestions",
          ],
        },
      },
    });

    const parsed = safeParseJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    console.error("Reading generation error, using fallback:", error);
    const fallback = getFallbackReadingArticle({
      targetLanguage: req.body?.targetLanguage || "Spanish",
      knownLanguage: req.body?.knownLanguage || "English",
      level: req.body?.cefrLevel || req.body?.level || "A2",
      topic: req.body?.topic || "Culture & Daily Life",
    });
    res.json(fallback);
  }
});

// Explain Selected Reading Excerpt / Word Lookup with 1-Click Flashcard extraction
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
    const systemInstruction = getExplainReadingTextSystemInstruction({
      selectedText,
      fullContext,
      targetLanguage,
      knownLanguage,
    });

    const prompt = getExplainReadingTextUserPrompt({
      selectedText,
      fullContext,
      targetLanguage,
      knownLanguage,
    });

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-3.7-flash",
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

    const parsed = safeParseJson(response.text);
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
    const systemInstruction = getGradeReadingResponseSystemInstruction({
      targetLanguage,
      knownLanguage,
      questionText,
      questionTranslation,
      articleContext,
    });

    const prompt = getGradeReadingResponseUserPrompt({
      targetLanguage,
      knownLanguage,
      questionText,
      userResponse,
    });

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-3.7-flash",
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
            grammarFeedback: { type: Type.STRING, description: "Feedback on language morphology, syntax, and accuracy" },
            overallGrade: { type: Type.INTEGER, description: "SM-2 grade (0 to 5)" },
            correctedUserSentence: { type: Type.STRING, description: "Polished and natural version of student sentence" },
            correctedUserSentenceTranslation: { type: Type.STRING },
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
                  targetItem: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  partOfSpeech: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                  usageNotes: { type: Type.STRING },
                  exampleTarget: { type: Type.STRING },
                  exampleTranslation: { type: Type.STRING },
                },
                required: ["targetItem", "definition", "partOfSpeech", "usageNotes"],
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
            "overallGrade",
            "correctedUserSentence",
            "correctedUserSentenceTranslation",
            "identifiedErrors",
          ],
        },
      },
    });

    const parsed = safeParseJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    console.error("Reading response grade error:", error);
    res.status(500).json({ error: error.message || "Failed to grade reading response" });
  }
});

// Real-Time Inflectional Morphology & Conjugation Engine
app.post("/api/conjugation-lookup", async (req, res) => {
  try {
    const {
      verb,
      targetLanguage,
      targetLanguageCode = "es",
      knownLanguage = "English",
    } = req.body;

    if (!verb || !targetLanguage) {
      return res.status(400).json({ error: "Verb and targetLanguage are required" });
    }

    const ai = getGeminiClient();
    const systemInstruction = getConjugationLookupSystemInstruction({
      verb,
      targetLanguage,
      targetLanguageCode,
      knownLanguage,
    });

    const prompt = getConjugationLookupUserPrompt({
      verb,
      targetLanguage,
      targetLanguageCode,
      knownLanguage,
    });

    const response = await generateWithFallback(ai, {
      primaryModel: "gemini-3.7-flash",
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

    const parsed = safeParseJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    console.error("Conjugation lookup error:", error);
    res.status(500).json({ error: error.message || "Failed to lookup verb conjugations" });
  }
});

// AI Language Journal Error Check & Prose Polish Endpoint
app.post("/api/check-journal-prose", async (req, res) => {
  try {
    const { title, content, targetLanguage, knownLanguage, estimatedLevel } = req.body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Content is required for journal evaluation" });
    }

    const tLang = targetLanguage || "Spanish";
    const kLang = knownLanguage || "English";

    try {
      const ai = getGeminiClient();
      const systemInstruction = getJournalCheckSystemInstruction(tLang, kLang);
      const userPrompt = getJournalCheckUserPrompt(title || "", content, tLang, kLang, estimatedLevel);

      const response = await generateWithFallback(ai, {
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        config: {
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.INTEGER, description: "0-100 overall mastery score" },
              estimatedCEFR: { type: Type.STRING, description: "'A1', 'A2', 'B1', 'B2', 'C1', or 'C2'" },
              fluencyRating: { type: Type.STRING, description: "'beginner', 'developing', 'intermediate', 'fluent', or 'native_like'" },
              summaryFeedback: { type: Type.STRING },
              correctedText: { type: Type.STRING },
              translatedText: { type: Type.STRING },
              grammarScore: { type: Type.INTEGER },
              vocabularyScore: { type: Type.INTEGER },
              naturalnessScore: { type: Type.INTEGER },
              errors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    originalText: { type: Type.STRING },
                    correctedText: { type: Type.STRING },
                    errorType: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ["originalText", "correctedText", "errorType", "explanation"],
                },
              },
              positiveHighlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              naturalPhrasings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    originalExcerpt: { type: Type.STRING },
                    suggestedAlternative: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ["originalExcerpt", "suggestedAlternative", "explanation"],
                },
              },
              extractedVocabulary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    translation: { type: Type.STRING },
                    partOfSpeech: { type: Type.STRING },
                    phonetic: { type: Type.STRING },
                    exampleSentence: { type: Type.STRING },
                  },
                  required: ["word", "translation", "partOfSpeech"],
                },
              },
              suggestedTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3-5 relevant contextual tags for this entry in lowercase",
              },
              suggestedEmoji: {
                type: Type.STRING,
                description: "Single fitting emoji matching entry mood and topic",
              },
              suggestedMood: {
                type: Type.STRING,
                description: "Fitting mood descriptor e.g. happy, reflective, motivated, relaxed, proud",
              },
            },
            required: [
              "overallScore",
              "estimatedCEFR",
              "fluencyRating",
              "summaryFeedback",
              "correctedText",
              "translatedText",
              "grammarScore",
              "vocabularyScore",
              "naturalnessScore",
              "errors",
              "positiveHighlights",
            ],
          },
        },
      });

      const parsed = safeParseJson(response.text);
      if (parsed && typeof parsed.overallScore === "number") {
        return res.json(parsed);
      }
    } catch (aiErr: any) {
      console.warn("AI journal check failed, using fallback resilience:", aiErr?.message || aiErr);
    }

    const fallback = getFallbackJournalCheck({
      title: title || "",
      content,
      targetLanguage: tLang,
      knownLanguage: kLang,
    });
    return res.json(fallback);
  } catch (error: any) {
    console.error("Journal prose check error:", error);
    res.status(500).json({ error: error.message || "Failed to check journal prose" });
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
