# LanguageTwin 🌐

> **Intelligent Multi-Language Acquisition Platform powered by Frequency-Ranked SRS, Active Sentence Production, Graded Immersion, and Gemini AI.**

🔗 **Live App Link**: [https://ais-pre-fcvezsmnsjhdwdw4zeiyuf-666974423825.us-west2.run.app](https://ais-pre-fcvezsmnsjhdwdw4zeiyuf-666974423825.us-west2.run.app)  
🛠️ **Dev Preview**: [https://ais-dev-fcvezsmnsjhdwdw4zeiyuf-666974423825.us-west2.run.app](https://ais-dev-fcvezsmnsjhdwdw4zeiyuf-666974423825.us-west2.run.app)  
🧠 **Architecture Guide**: [Jump to LLM Architecture & Multi-Tier Resilience Engine](#-llm-architecture--multi-tier-resilience-engine)

---

## 🌍 Supported Target Languages & Pronunciation Aids

LanguageTwin provides deep pedagogical support for target languages paired with native reference explanations, customizable script/romanization aids, and international proficiency benchmark mapping:

| Language | Native Name | Code | Flag | Supported Pronunciation & Script Aids | Proficiency Benchmark Mapping | Specialized Linguistic Tools |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **Traditional Chinese** | 繁體中文 | `zh-TW` | 🇹🇼 | • **注音符號 (Zhuyin / Bopomofo)**<br>• **漢語拼音 (Hanyu Pinyin)**<br>• *None (Characters Only)* | **TOCFL** (Band A–C)<br>**HSK** (1–6)<br>**CEFR** (A1–C2) | Dynamic Pinyin-to-Zhuyin converter, authentic stroke & radical breakdown, traditional punctuation palette (`「」`, `《》`, `、`, etc.) |
| **Spanish** | Español | `es` | 🇪🇸 | • **IPA (International Phonetic Alphabet)**<br>• **Syllable Respelling**<br>• *None* | **DELE & SIELE**<br>**CEFR** (A1–C2)<br>**ACTFL** | Interactive verb conjugation matrices (Preterite, Imperfect, Subjunctive, Conditional, Commands), inverted punctuation helpers (`¿`, `¡`, `ñ`, `á`, etc.) |
| **Japanese** | 日本語 | `ja` | 🇯🇵 | • **Furigana / Kana (ふりがな)**<br>• **Romaji (Hepburn)**<br>• *None (Kanji Only)* | **JLPT** (N5, N4, N3, N2, N1)<br>**CEFR** (A1–C2) | Kanji decomposition, particle practice (`は`, `が`, `を`, `に`, `で`), polite vs. plain register awareness |
| **Korean** | 한국어 | `ko` | 🇰🇷 | • **Revised Romanization (RR)**<br>• **IPA (국제 음성 기호)**<br>• *None (Hangul Only)* | **TOPIK** (Level 1–6)<br>**CEFR** (A1–C2) | Hangul syllable decomposition, formal/polite endings (`-습니다`, `-아요/해요`), honorifics and particle tracking |
| **Taiwanese Hokkien** | 臺灣話 (臺語) | `nan` | 🇹🇼 | • **Tâi-lô (台羅拼音)**<br>• **Pe̍h-ōe-jī (POJ 白話字)**<br>• **Taiwanese Zhuyin (方音符號)**<br>• *None (Characters Only)* | **MOE Language Benchmark**<br>**CEFR** (A1–B2) | Tone sandhi indicators, nasalized vowels (`ⁿ`), authentic Taiwanese hanzi, specialized dialect input palette |

---

### 🗣️ Supported Native / Reference Languages

Learners can select their preferred reference language for definitions, grammatical formulas, diagnostic feedback, and AI explanations:
- **English** (`en` 🇺🇸 / 🇬🇧) — Comprehensive definitions, grammar terminology, and cross-linguistic collocations.
- **Traditional Chinese** (`zh-TW` 🇹🇼) — Authentic 繁體中文 translations, grammatical explanations, and cultural nuances.

---

## 🌟 Comprehensive Capability Overview

### 1. 🗂️ In-Tab Deck Management & Frequency Explorer (`Deck` Tab)
- **In-Tab Deck Switcher & Quick Pills**: Seamlessly switch between multiple local and community decks directly within the Deck tab without leaving the workspace. Includes instant search and real-time card count/level indicators.
- **Centralized Cloud Deck Hub**: Browse, search, and 1-click import decks created by other learners from the centralized Firestore cloud database.
- **AI-Powered Deck Generation**: Generate custom frequency decks calibrated by theme, situation, topic, or proficiency level (CEFR A1–C2) with automatic grammatical categorization.
- **Smart Filtering & Status Indicators**:
  - Filter by mastery status (*Mastered*, *Active Review*, *New*, *Due*, *⚠️ Error Remedies*).
  - Filter by concept type (*Vocabulary*, *Particles & Connectors*, *Grammar Concepts & Formulas*, *Phrases*).
  - Sort by frequency rank (#1–#10, #11–#20, etc.), alphabetical order, or retention score.
- **Conjugation Tables & Verb Explorer**: Interactive verb conjugation paradigms for inflected languages (Spanish, etc.) with tense, mood, and person breakdowns.
- **Batch Expansion**: Expand frequency decks with the next 10, 20, or 50 high-frequency words on demand.

---

### 2. ✍️ Active Production Study Session (`Study` Tab)
- **Active Output Testing (SM-2 SRS)**: Rather than passive flashcard flipping, learners are prompted to construct full, authentic sentences applying the target word or grammar formula.
- **Guided Reinforcement & Shadowing Mode**: When a learner indicates *"I don't know this yet"*, the system initiates an active reinforcement workflow:
  - Requires copying or verbally repeating the target item.
  - Requires shadowing and reciting at least one native example sentence.
  - Provides quick audio playback, 1-tap copy/fill assistance, and live speech recognition matching to establish strong neural memory traces before continuing.
- **Sanitized Error Intelligence Tracking**: Strict distinction between true grammatical/lexical errors (misplaced particles, incorrect conjugation) and "I don't know" / self-reported uncertainty, keeping the Error Ledger and slip warnings clean, accurate, and actionable.
- **Streamlined Single-Action Reference Reveal**: Consolidated reveal triggers into a clean single-action unlock that seamlessly presents native audio examples, grammar formulas, mnemonics, and conjugation tables.
- **Multi-Dimensional AI Evaluation**: Real-time scoring across core dimensions:
  - Semantic appropriateness and context usage
  - Grammatical correctness and morphology
  - Natural phrasing and colloquial alternatives
  - Specific diagnostic feedback with tailored grammar remedy flashcards for recurring slips.
- **Integrated Voice Input & Speech Synthesis**: Built-in voice dictation via Web Speech Recognition and native audio playback with adjustable speed and accent variants.
- **On-Screen Character Palette**: One-tap insertion of language-specific symbols, inverted punctuation, accents, and diacritics.
- **Offline Resilient Fallback Engine**: Local fallback grading and heuristics ensure uninterrupted study even with network or API rate constraints.

---

### 3. 📖 Graded Reading & Listening Immersion (`Reading` Tab)
- **Level-Calibrated Articles**: AI-synthesized reading and listening passages matched precisely to the learner's vocabulary level.
- **Interactive Word & Clause Decomposition**: Click any word, phrase, or clause in the article to inspect definitions, part-of-speech breakdowns, conjugation tables, and add new vocabulary directly to active decks.
- **Beginner Guidance Notices**: Provides helpful advisories for A1/introductory learners to master foundational vocabulary before tackling advanced immersion texts.
- **Synchronized Audio Narration**: Sentence-by-sentence text-to-speech narration with highlighted reading progress.

---

### 4. 📝 Writing & Expression Journal (`Journal` Tab)
- **Daily Guided Expression Prompts**: Tailored writing prompts designed to elicit target vocabulary and active sentence production.
- **Comprehensive Line-by-Line Feedback**: Receive detailed linguistic corrections, natural rewrites, and explanations for nuances and stylistic improvements.
- **Automatic Error Extraction & Remediation**: Automatically extracts grammatical and lexical errors into targeted SRS remedy cards to prevent error fossilization.

---

### 5. 🎭 AI Conversation Partner & Roleplay (`Tutor` Tab)
- **Context-Aware Conversational AI**: Practice spontaneous, authentic dialogues while the AI tutor actively tracks deck items and updates your SRS mastery scores in real time.
- **Custom & 1-Click Roleplay Scenarios**: Simulate real-world situations (ordering at a café, asking for directions, negotiating in a market, meeting friends, job interviews).
- **Linguistic Co-Pilot Side Panel**: Ask quick questions mid-conversation (*"How do I say...?"*, *"Lookup word"*, *"Polite vs. Casual register"*) without derailing the roleplay narrative.
- **Real-Time Voice Dictation & Audio Playback**: Hands-free conversation practice with instant transcription and speech output.

---

### 6. 📊 Mastery Analytics & Standardized Proficiency Frameworks (`Stats` Tab)
- **Standardized Equivalency Engine**: Automatically maps cumulative vocabulary mastery, frequency coverage, and production accuracy onto international benchmark scales:
  - **CEFR**: Common European Framework of Reference (A1, A2, B1, B2, C1, C2)
  - **DELE & SIELE**: Spanish language certification benchmarks
  - **JLPT**: Japanese Language Proficiency Test (N5 to N1)
  - **TOPIK**: Test of Proficiency in Korean (Level 1 to 6)
  - **TOCFL & HSK**: Chinese proficiency standards
  - **ACTFL**: American Council on the Teaching of Foreign Languages scale
- **Granular Skill Dimensions**: Visual analytics for lexical breadth, retention stability, grammatical precision, and production fluency.
- **Adaptive Multi-Tier Placement Test**: Take a calibrated diagnostic assessment to benchmark current competence and adjust recommended frequency decks.

---

### 7. ☁️ Cloud Sync, Authentication & Community Sharing
- **Google Account Authentication**: Sign in with Google for seamless cross-device synchronization.
- **Cloud Database (Firebase Firestore)**: Securely stores custom decks, review histories, SRS intervals, journal entries, and error remedies.
- **Community Decks Repository**: Share your custom-generated decks with the LanguageTwin community and discover decks curated by fellow learners.

---

## 🧠 LLM Architecture & Multi-Tier Resilience Engine

LanguageTwin implements a resilient, server-side multi-tier LLM architecture utilizing the `@google/genai` SDK:

```
                                  ┌─────────────────────────────┐
                                  │   Learner Action / Query    │
                                  └──────────────┬──────────────┘
                                                 │
                                                 ▼
                                ┌─────────────────────────────────┐
                                │ Express Server-Side Proxy       │
                                │ (server/geminiResilience.ts)    │
                                └────────────────┬────────────────┘
                                                 │
                                                 ▼
                        ┌─────────────────────────────────────────────────┐
                        │ Primary Model: gemini-3.7-flash                 │
                        │ (High-precision reasoning, evaluation & grammar)│
                        └────────┬────────────────────────────────────────┘
                                 │
                 (Rate limit / 503 Spike / Error)
                                 │
                                 ▼
                        ┌─────────────────────────────────────────────────┐
                        │ Secondary Tier: gemini-3.1-flash-lite / latest  │
                        │ (Fast automatic fallback & load shedding)       │
                        └────────┬────────────────────────────────────────┘
                                 │
                    (All Remote API Calls Exhausted)
                                 │
                                 ▼
                        ┌─────────────────────────────────────────────────┐
                        │ Deterministic Linguistic Fallback Engine        │
                        │ • getFallbackReadingArticle                     │
                        │ • getFallbackSentenceEvaluation                 │
                        │ • getFallbackPlacementEvaluation                │
                        │ • getFallbackTranslateAndExplain                │
                        │ • getFallbackConjugationLookup & JournalCheck   │
                        └─────────────────────────────────────────────────┘
```

### Key LLM Design Principles:
1. **Zero Secret Leakage**: All Gemini API keys are strictly confined to server-side Node execution (`server.ts`, `server/geminiResilience.ts`), proxying evaluated payloads to the browser.
2. **Dynamic Model Cascading (`generateWithFallback`)**: On high demand or rate limits (429/503), the proxy cascades automatically between `gemini-3.7-flash`, `gemini-3.1-flash-lite`, and `gemini-flash-latest` with exponential backoff and jitter.
3. **Graceful Degradation via Heuristic Fallbacks**: If remote network connectivity or API quotas are completely severed, the system executes deterministic offline fallbacks for reading articles, sentence evaluation, placement testing, grammar conjugations, and journal corrections so learning is never interrupted.
4. **Transparent Engine Indicators (`AiEngineBadge`)**: Every AI-powered response clearly visualizes whether it was generated live via Gemini or synthesised via the deterministic fallback engine, maintaining complete learner transparency.

### 🛡️ High-Level Breakdown of Linguistic Fallback Functions:

| Fallback Function | What It Does & What It Checks |
| :--- | :--- |
| **`getFallbackReadingArticle`** | • Inspects the learner's current target language and active vocabulary items.<br>• Selects or generates a level-calibrated reading passage from curated bilingual corpora.<br>• Computes structured paragraph tokens, target vocabulary highlighting, and follow-up comprehension questions with answer keys without requiring an active LLM call. |
| **`getFallbackSentenceEvaluation`** | • Checks whether the learner's submitted sentence contains the mandatory target item.<br>• Validates sentence length, capitalization, and punctuation standards.<br>• Computes heuristic semantic and grammar scores (e.g. 85-90% if word is used accurately in reasonable length; 50-60% if missing or too brief).<br>• Synthesizes actionable grammatical feedback and structured error remedies. |
| **`getFallbackTranslateAndExplain`** | • Performs heuristic translation matching against built-in language dictionaries and frequency corpora.<br>• Extracts grammatical morphology, part-of-speech, and token-by-token aligned translations for instant breakdown. |
| **`getFallbackPlacementEvaluation`** | • Evaluates answer correctness across multi-choice and open-ended diagnostic items against a standardized proficiency matrix.<br>• Calculates CEFR level (A1 to C2), ACTFL equivalent, and recommended frequency deck starting rank based on demonstrated lexical coverage. |
| **`getFallbackConjugationLookup`** | • Checks language-specific inflection paradigms (regular `-ar`/`-er`/`-ir` in Spanish, `五段`/`一段` in Japanese, `하다` patterns in Korean).<br>• Assembles full indicative, subjunctive, and imperative tables with subject-pronoun mappings deterministically. |
| **`getFallbackJournalCorrection`** | • Analyzes journal entry word counts, structural complexity, and target language character sets.<br>• Produces CEFR estimate, fluency ratings, sentence polish recommendations, and suggested hashtags. |

---

## 🛠️ Architecture & Tech Stack

```
LanguageTwin Platform
├── Frontend (React 18 + TypeScript + Tailwind CSS)
│   ├── Active Production SRS Engine (Modified SuperMemo SM-2)
│   ├── Dynamic Pronunciation Aid Transformer (Zhuyin, Pinyin, Furigana, Romaji, RR, IPA, Tâi-lô)
│   ├── Interactive Voice Interface (Web Speech API Synthesis & Recognition)
│   ├── In-Tab Deck Management & Community Cloud Hub
│   └── Graded Immersion & Linguistic Text Decomposition
├── Backend (Express.js + TypeScript)
│   ├── Secure Server-Side Gemini API Proxy
│   ├── AI Evaluation, Roleplay & Graded Passage Generator
│   └── CommonJS Single-Bundle Production Deployment (esbuild)
└── Cloud Infrastructure (Firebase Firestore & Auth)
    ├── User Authentication (Google OAuth)
    ├── Cloud Deck Repository & Community Sharing
    └── Persistent Learning Progress & Error Remediation Logs
```

---

## 💻 Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Ensure `.env` contains your Gemini API credentials:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Build & Validate for Production**:
   ```bash
   npm run build
   ```

---

## 📋 Quality Assurance & Verification TODOs

- [ ] **Verify sentence alignment and mastery tracking behavior with actual usage**:
  - Audit bidirectional token-level alignment highlights across diverse writing/speaking sessions (Traditional Chinese `zh-TW`, Japanese `ja`, Spanish `es`, Korean `ko`, Taiwanese Hokkien `nan`).
  - Track SM-2 interval expansion, consecutive success increments, and error remediation transitions during continuous daily practice runs.
  - Verify that the active study AI Co-Pilot remains cleanly reserved for post-"I Don't Know This Yet" guided reinforcement to foster genuine active recall.

