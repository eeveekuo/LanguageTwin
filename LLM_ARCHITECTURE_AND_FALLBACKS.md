# LLM Architecture, Evaluation Fallbacks & Prompt Specifications

This document provides a complete, authoritative reference on the Gemini LLM integration, invocation endpoints, cascading resilience architecture, rule-based fallback mechanisms, and diagnostic grading rules across the application.

---

## 1. Conditions Leading to Fallback Evaluation Being Invoked

Fallback mechanisms are automatically triggered under the following conditions:

| Trigger Condition | Description | Fallback Response |
| :--- | :--- | :--- |
| **Missing API Key** | `GEMINI_API_KEY` is not provided in the environment. | System seamlessly falls back to local deterministic rule-based engines. |
| **API Rate Limits (HTTP 429)** | Gemini request rate or quota limit reached. | Cascades across model tiers (`gemini-3.7-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest`), then switches to local fallback if all retries fail. |
| **Network Failures / Timeouts (HTTP 500/503/504)** | Upstream Google GenAI outages, network disconnection, or client timeout. | Triggers exponential backoff retry logic, then graceful local fallback with zero UI interruption. |
| **Offline Mode** | Client browser detects offline status (`navigator.onLine === false`). | Client-side rule engine evaluates answers, renders pre-compiled 300-word frequency decks, and queues reviews in IndexedDB. |
| **JSON Parse / Validation Failure** | LLM output does not match expected JSON schema. | Schema repair parser runs; if malformed, returns structured linguistic fallback object. |

---

## 2. Fallback Evaluation Rules & Linguistic Logic

### The Previous Bug vs. Current State

#### Previous Naive Fallback Check
Previously, offline/fallback evaluation used an oversimplified string-length heuristic:
```ts
// ❌ PREVIOUS BUGGY HEURISTIC:
const isLengthSatisfactory = cleanAnswer.length >= 8;
```
This heuristic caused two critical failure modes:
1. **False Negative on Short Answers (e.g. Q2: "먹었습니다")**:
   - Input: `"먹었습니다"` (5 characters < 8)
   - Result: Marked as **✗ Needs Review**, even though it was 100% correct past-tense formal polite conjugation.
2. **False Positive on Complex Incorrect Answers (e.g. Q5 / Q6)**:
   - Input: `"시간이 더 있으면, 재주도애 갈 거에요."` (length > 8)
   - Result: Marked as **✓ Mastered**, despite containing spelling errors (*"재주도애"* instead of *"제주도로"*) and wrong grammatical mood (*"-으면 ... -ㄹ 거에요"* real future conditional instead of hypothetical counterfactual *"-다면 ... -(으)ㄹ 텐데"*).

#### Current Linguistic Rule Engine (`evaluateDiagnosticAnswer`)
The system now runs full morphosyntactic and grammatical validation before and during fallback evaluation:

```
                  ┌─────────────────────────────────────────────────┐
                  │            User Diagnostic Input                │
                  └──────────────────────┬──────────────────────────┘
                                         ▼
                  ┌─────────────────────────────────────────────────┐
                  │      Exact & Normalized String Match            │
                  │   (Punctuation, whitespace, case normalization) │
                  └──────┬───────────────────────────────────┬──────┘
                         │ Match                             │ No Exact Match
                         ▼                                   ▼
             ┌──────────────────────┐            ┌──────────────────────┐
             │ Status: "mastered"   │            │ Language Rule Engine │
             │ Score: 100           │            │ (Korean / Spanish /  │
             │ Feedback: Perfect!   │            │  Japanese / Chinese) │
             └──────────────────────┘            └───────────┬──────────┘
                                                             │
                  ┌──────────────────────────────────────────┴──────────┐
                  ▼                                                     ▼
    ┌───────────────────────────┐                         ┌───────────────────────────┐
    │   Linguistic Criteria     │                         │   Linguistic Criteria     │
    │   Passed (Conjugation,    │                         │   Failed (Spelling slip,  │
    │   Mood, Particles, Stem)  │                         │   Wrong mood, Bad suffix) │
    ├───────────────────────────┤                         ├───────────────────────────┤
    │ Status: "mastered" /      │                         │ Status: "needs_review"    │
    │         "partially_correct│                         │ Score: 0 - 40             │
    │ Score: 70 - 95            │                         │ Error logged for remedy   │
    └───────────────────────────┘                         └───────────────────────────┘
```

### Korean Linguistic Grading Rules (`evaluateKoreanDiagnostic`)

1. **Past Tense Formal Polite Form (`-았습니다/었습니다`)**:
   - Decomposes verb stem (`먹-` + `었` + `습니다` = `먹었습니다`).
   - Accepts polite variations (`먹었어요`, `먹었지요`) with high credit (`85%`), noting register.
   - Rejects uninflected stems (`먹다`), present tense (`먹습니다`), or incorrect vowels (`*먹았어요`).

2. **Counterfactual & Hypothetical Conditional (`-다면 ... -(으)ㄹ 텐데`)**:
   - Verifies hypothetical conditional suffix `-다면` (or `-았/었더라면`).
   - Verifies hypothetical irrealis modal ending `-(으)ㄹ 텐데` / `-(으)ㄹ 텐데요`.
   - Detects real condition slips: flags `-으면 ... -ㄹ 거예요` as a real future condition, awarding partial credit (`50%`) while identifying the mood discrepancy.
   - Validates proper spelling and particles: detects misspelled proper nouns (e.g. `재주도` → `제주도`) and particle slips (`애` → `로` or `에`).

3. **Indirect Quotations & Complex Grammar (`-(으)ㄴ/는다고 하다`)**:
   - Checks verb vs adjective declarative citation forms (`-는다고` for action verbs, `-다고` for descriptive adjectives).

### Spanish Linguistic Grading Rules (`evaluateSpanishDiagnostic`)

1. **Subjunctive vs. Indicative Mood & Conditional Counterfactuals**:
   - Checks for past subjunctive (`tuviera` / `tuviese`) paired with conditional (`viajaría`).
   - Penalizes indicative replacements (`tengo` + `viajaré`) in counterfactual contexts.
2. **Preterite vs. Imperfect Aspect**:
   - Distinguishes punctual completed actions (`comí`, `llegó`) from habitual/continuous background states (`comía`, `llegaba`).
3. **Clitic Pronoun Placement**:
   - Enclitic attachment to infinitives, gerunds, and affirmative imperatives (`hacerlo`, `haciéndolo`, `hazlo`).
   - Proclitic placement before conjugated verbs (`me lo dijo`).

---

## 3. Comprehensive Catalog of LLM Invocations & Fallbacks

Below is the complete architectural map of all 9 LLM-invoked capabilities across the app, including endpoints, models, prompt structures, and fallback behaviors.

```
+---------------------------------------------------------------------------------------------------------+
|                                    GEMINI MULTI-TIER RESILIENCE PIPELINE                               |
|                                                                                                         |
|   Client Request ----> Tier 1: gemini-3.7-flash ----(on 429/503/fail)----> Tier 2: gemini-3.1-flash-lite|
|                                                                                         |               |
|                                                                                         v (on fail)     |
|   Rule-Based Deterministic Fallback <------------------------------------- Tier 3: gemini-flash-latest   |
+---------------------------------------------------------------------------------------------------------+
```

---

### Feature 1: Placement Test Evaluation
- **Endpoint**: `POST /api/evaluate-placement-test`
- **Primary Model**: `gemini-3.7-flash` (Fallback: `gemini-3.1-flash-lite` → `gemini-flash-latest`)
- **System Prompt**:
  ```
  You are an expert CEFR / ACTFL diagnostic language examiner.
  Assess the user's answers against the target questions strictly according to CEFR criteria (A1, A2, B1, B2, C1, C2).
  Check grammatical accuracy, verb conjugation, particle placement, mood/aspect, and spelling.
  Return a structured JSON with overallCEFR, percentageScore, estimatedActiveVocabularySize, recommendedStartingRank, identifiedErrors, and perQuestionReview.
  ```
- **Fallback Architecture**:
  - If LLM is unreachable or disabled, invokes `evaluatePlacementTestLocally` powered by `evaluateDiagnosticAnswer`.
  - Performs morphosyntactic grading for Korean, Spanish, Japanese, Chinese, and European languages.
  - Automatically identifies learner error slips and formats them for the **Error Remedy Deck Engine**.

---

### Feature 2: 300-Word Frequency Deck Generation & Calibration
- **Endpoints**:
  - `POST /api/generate-deck`
  - `POST /api/regenerate-level-deck`
- **Default Card Count**: `300 Flashcards`
- **Primary Model**: `gemini-3.7-flash` (Fallback: `gemini-3.1-flash-lite` → `gemini-flash-latest`)
- **System Prompt**:
  ```
  You are an elite language curriculum architect.
  Generate 300 frequency-ranked flashcards for learning ${targetLanguage} from ${knownLanguage}.
  Diagnosed Level: ${assessedLevel}
  Starting Frequency Rank: #${recommendedStartingRank}
  Learner Test Slips to Remedy: ${identifiedErrors}
  Requirements:
  1. Generate frequency-ranked cards starting from #${recommendedStartingRank}.
  2. For each identified error, generate a dedicated 'common_error' flashcard with originalMistake, correctedForm, targetItem, and usageNotes.
  3. Include rich examples, phonetic pronunciation, and partOfSpeech tags.
  ```
- **Fallback Architecture**:
  - Invokes `build300Catalog(targetLangCode, targetLanguage, knownLanguage)` from `src/data/vocabularyCatalog.ts`.
  - Provides a curated 300-word catalog with linguistic frequency ranks (1–300), phonetics, grammatical formulas, and example sentences.
  - Prepends personalized remediation cards for each placement test slip.

---

### Feature 3: Active Production Sentence Evaluation
- **Endpoint**: `POST /api/evaluate-sentence`
- **Primary Model**: `gemini-3.7-flash` (Fallback: `gemini-3.1-flash-lite` → `gemini-flash-latest`)
- **System Prompt**:
  ```
  You are an expert bilingual linguist and language pedagogue.
  Evaluate the user's sentence attempting to use the target item '${targetItem}' in '${targetLanguage}'.
  Check whether the target item was used correctly, whether the sentence is grammatically sound, identify any errors (grammar, spelling, word choice, particles), and provide natural usage alternatives.
  ```
- **Fallback Architecture**:
  - Invokes `getFallbackSentenceEvaluation`.
  - Checks if `targetItem` or its morphological stem is contained in `sentence`.
  - Splits tokens into a grammatical breakdown.
  - Flags missing target words or basic syntax issues.

---

### Feature 4: Socratic AI Language Tutor Chat
- **Endpoint**: `POST /api/tutor-chat`
- **Primary Model**: `gemini-3.7-flash` (Fallback: `gemini-3.1-flash-lite` → `gemini-flash-latest`)
- **System Prompt**:
  ```
  You are a warm, encouraging, and pedagogically rigorous Socratic language tutor teaching ${targetLanguage} to a speaker of ${knownLanguage}.
  Learner Level: ${level || "Intermediate"}
  Today's Active Focus Words / Grammar: ${activeCardsList}
  Recent Learner Slips: ${recentMistakesList}
  Pedagogical Directives:
  - Converse primarily in ${targetLanguage} appropriate for their level, using ${knownLanguage} for clarifying complex grammar explanations.
  - Encourage active sentence production. When the learner makes a mistake, guide them Socratically to recognize the error.
  ```
- **Fallback Architecture**:
  - Invokes `getFallbackTutorResponse`.
  - Uses contextual template matching based on user query (e.g. grammar question, greeting, translation request, error explanation).

---

### Feature 5: Smart Translation, Syntactic Tree Breakdown & IPA
- **Endpoint**: `POST /api/translate-and-explain`
- **Primary Model**: `gemini-3.7-flash` (Fallback: `gemini-3.1-flash-lite` → `gemini-flash-latest`)
- **System Prompt**:
  ```
  You are an elite bilingual lexicographer and computational linguist.
  Analyze the text from ${sourceLanguage} to ${targetLanguage}.
  Provide:
  1. Natural, idiomatic translation.
  2. Accurate phonetic transcription (IPA or standard romanization).
  3. Token-by-token syntactic analysis (lemma, part of speech, grammatical function).
  4. Cultural nuance notes and alternative phrasings (formal vs colloquial).
  ```
- **Fallback Architecture**:
  - Invokes `getFallbackTranslation`.
  - Provides direct translation fallback, token segmentation, and morphological annotations.

---

### Feature 6: Reading & Listening Immersion Article Generator
- **Endpoint**: `POST /api/generate-reading-article`
- **Primary Model**: `gemini-3.7-flash` (Fallback: `gemini-3.1-flash-lite` → `gemini-flash-latest`)
- **System Prompt**:
  ```
  You are an authentic native author and language educator in ${targetLanguage}.
  Create an engaging, culturally authentic reading passage suitable for CEFR ${cefrLevel}.
  Topic: ${topic}
  Target Words to Weave in Naturally: ${targetWords}
  Provide paragraph-by-paragraph translations, inline vocabulary glossaries, and 3 reading comprehension questions.
  ```
- **Fallback Architecture**:
  - Invokes `getFallbackReadingArticle`.
  - Returns a curated, level-appropriate cultural immersion story for the target language with glosses and comprehension questions.

---

### Feature 7: Multilingual Speech Generation & Audio Synthesis
- **Endpoint**: `POST /api/synthesize-speech`
- **Primary Model**: `gemini-2.5-flash` with audio modality output
- **Voice Configurations**:
  - Spanish: `Puck` / `Charon`
  - Korean: `Kore` / `Fenrir`
  - Japanese: `Aoede`
  - Chinese: `Fenrir`
  - French/German/Italian: `Puck`
- **Fallback Architecture**:
  - If server audio synthesis is unavailable, seamlessly triggers browser Web Speech API (`window.speechSynthesis.speak()`) using language-matched native browser voices.

---

### Feature 8: Grammar & Word Deep-Dive Explainer
- **Endpoint**: `POST /api/explain-card`
- **Primary Model**: `gemini-3.7-flash` (Fallback: `gemini-3.1-flash-lite` → `gemini-flash-latest`)
- **System Prompt**:
  ```
  You are a master grammarian and etymologist.
  Provide a deep dive into '${targetItem}' (${partOfSpeech}) in ${targetLanguage} for ${knownLanguage} learners.
  Include: exact usage formulas, common pitfalls, false friends, register nuances, and 3 contrasting example sentences.
  ```
- **Fallback Architecture**:
  - Invokes `getFallbackExplainCard`.
  - Returns structured morphosyntactic patterns (e.g. Korean SOV particle attachments, Spanish subjunctive triggers).

---

### Feature 9: Adaptive CEFR Placement Test Generator
- **Endpoint**: `POST /api/generate-placement-test`
- **Primary Model**: `gemini-3.7-flash` (Fallback: `gemini-3.1-flash-lite` → `gemini-flash-latest`)
- **System Prompt**:
  ```
  Generate a 6-question diagnostic placement test for ${targetLanguage} spanning CEFR levels A1, A2, B1, B2, C1, C2.
  Q1 (A1): High-frequency core vocabulary & simple present sentence.
  Q2 (A2): Regular & irregular past tense conjugation / basic connective.
  Q3 (B1): Subordinate causal or temporal connector.
  Q4 (B1): Passive, causative, or relative clause construction.
  Q5 (B2): Counterfactual or hypothetical conditional construction.
  Q6 (C1): Nuanced register, indirect discourse, or complex idiomatic syntax.
  ```
- **Fallback Architecture**:
  - Invokes `getFallbackDiagnosticQuestions` from `src/utils/placementFallback.ts`.
  - Returns hand-crafted, linguistically calibrated 6-question diagnostic benchmarks for Spanish, Korean, Japanese, Chinese, French, German, and Italian.

---

## 4. High-Level Explanation of Fallback Mechanisms

Below is the comprehensive matrix detailing each fallback mechanism, its inspection criteria, and the deterministic linguistic output generated:

| Feature & Fallback Function | What It Checks & Evaluates | Deterministic Output Synthesized |
| :--- | :--- | :--- |
| **Active Sentence Evaluation**<br>`getFallbackSentenceEvaluation` | • Checks presence of target word or root stem.<br>• Validates sentence length and capitalization/punctuation.<br>• Detects syntax errors, missing particles, and conjugation mistakes. | • Accurate heuristic score (85-90% for clean usage; 50-60% for partial; 20-30% for omitted).<br>• Corrected sentence and natural alternatives.<br>• Granular grammar breakdown tokens and error remedy flashcards. |
| **Placement Diagnostic Evaluation**<br>`evaluatePlacementTestLocally` / `evaluateDiagnosticAnswer` | • Exact & normalized string matching.<br>• Language-specific morphosyntactic rules (e.g. Korean `-았습니다/었습니다`, Spanish subjunctive triggers, Japanese `-て` forms).<br>• Real vs. counterfactual conditional mood checks. | • Standardized CEFR level determination (A1 to C2).<br>• Estimated active vocabulary count and recommended starting frequency rank.<br>• Error inventory for automated remedy deck construction. |
| **Reading & Listening Immersion**<br>`getFallbackReadingArticle` | • Target language code and CEFR level.<br>• Active focus words from user deck.<br>• Cultural context and thematic corpus matching. | • Leveled bilingual reading story.<br>• Token-aligned sentence pairs.<br>• 3 comprehension questions with answer keys and phonetic annotations. |
| **AI Tutor Socratic Chat**<br>`getFallbackTutorResponse` | • User intent classification (greeting, grammar inquiry, translation request, practice turn).<br>• Learner level and conversation history context. | • Socratic target-language reply with English grammar hints.<br>• Pedagogical follow-up questions to prompt production. |
| **Translate & Syntactic Breakdown**<br>`getFallbackTranslation` | • Dictionary corpus lookup and frequency rank indexing.<br>• Word boundary tokenization and phonetic generation. | • Aligned word-by-word token mappings.<br>• Lemma and part-of-speech annotations.<br>• Usage notes and formal vs. informal register indicators. |
| **Verb Conjugation Lookup**<br>`getFallbackConjugationLookup` | • Language inflection classes (Spanish `-ar`/`-er`/`-ir`, Korean `하다`/regular/irregular, Japanese Godan/Ichidan).<br>• Stem change patterns. | • Complete conjugation tables across Indicative, Subjunctive, Imperative, and Conditional moods.<br>• Pronoun-aligned example sentences. |
| **Language Journal Prose Checker**<br>`getFallbackJournalCorrection` | • Word count, sentence boundaries, and punctuation.<br>• Script validity and linguistic character sets.<br>• Paragraph structure and fluency metrics. | • CEFR level score and readability metric.<br>• Line-by-line polished corrections.<br>• Contextual hashtags and sentiment tags. |
| **Card & Concept Deep Dive**<br>`getFallbackExplainCard` | • Part of speech and lexical category.<br>• Target vs known language grammar typology. | • Grammatical formula / sentence template.<br>• 3 authentic example sentences with phonetics.<br>• Common pitfalls, false friends, and mnemonic hooks. |

---

## 5. Visual Distinction: LLM vs. Fallback Indicator (`AiEngineBadge`)

Every AI-powered surface in the application renders an **`AiEngineBadge`** giving learners real-time visibility into the generation source:

- 🟢 **Gemini AI Active**:
  - Emerald / Indigo styled pill with sparkle icon.
  - Displays the active model name (e.g. `Gemini 3.7 Flash`, `Gemini 3.1 Flash-Lite`).
  - Tooltip: *"Live Generative AI active: Response generated using Google Gemini."*

- 🟡 **Deterministic Fallback Engine**:
  - Warm amber styled pill with CPU / shield icon.
  - Displays `Deterministic Fallback Engine` / `Rules`.
  - Tooltip: *"Offline resilience engine: Generated instantly via deterministic linguistic rules and frequency tables (zero API latency or downtime)."*

### Visual Badge Placement Locations:
1. **Sentence Production Scorecards**: Displayed in the evaluation header alongside mastery grade.
2. **AI Tutor Messages**: Rendered next to the AI Tutor name and timestamp on every assistant reply.
3. **Smart Translation Bar**: Shown on the interactive aligned translation card header.
4. **Linguistic Co-Pilot Drawer**: Rendered on recommended expressions and conjugated forms.
5. **Graded Reading Articles**: Displayed on article story header and question evaluation scorecards.
6. **Writing Journal**: Rendered in the prose evaluation score card.
7. **Conjugation Explorer**: Rendered in the verb regularity and paradigm header.
8. **Placement Test Diagnostic**: Rendered in the CEFR result banner.

---

## 6. Summary of Verification & Guarantees

1. **300-Word Deck Initialization**: All default decks and newly calibrated/generated decks default to 300 words with sequential frequency rankings (1 to 300).
2. **Placement Test Grading Accuracy**: Exact matches (e.g. `"먹었습니다"`) and valid grammatical variations score 100%, while genuine errors (e.g. `"재주도애"` and real-conditional slips in counterfactual questions) are properly flagged with detailed feedback and converted into targeted error-remedy flashcards.
3. **Cascading Resilience**: The application operates continuously even in fully offline environments or under API quota constraints without crashing or degrading user progress.
4. **Zero Silent Failures**: All LLM and Fallback pathways provide transparent UI indicators (`AiEngineBadge`).

