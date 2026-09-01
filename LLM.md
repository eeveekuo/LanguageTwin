# LLM Architecture & Deterministic Fallback Mechanisms

This document outlines the Gemini AI integration, cascading resilience system, visual engine distinction (`AiEngineBadge`), and a high-level explanation of the fallback mechanisms across all core features of the language learning platform.

---

## 1. High-Level Overview of Fallback Mechanisms

The application employs a **Tiered Resilience Pattern** ensuring uninterrupted learning regardless of upstream API quota limits, network outages, or offline conditions. When an AI feature cannot reach Gemini or receives a rate limit/error, it automatically switches to a deterministic linguistic fallback engine.

```
                                  +---------------------------------------+
                                  |         User Interaction / Input      |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |    Tier 1: Gemini 3.7 Flash           |
                                  +-------------------+-------------------+
                                                      | (on 429 / 503 / timeout)
                                                      v
                                  +---------------------------------------+
                                  |    Tier 2: Gemini 3.1 Flash-Lite      |
                                  +-------------------+-------------------+
                                                      | (on fail)
                                                      v
                                  +---------------------------------------+
                                  |    Tier 3: Gemini Flash Latest        |
                                  +-------------------+-------------------+
                                                      | (on all tiers fail or offline)
                                                      v
                                  +---------------------------------------+
                                  | Deterministic Linguistic Fallback     |
                                  | (Grammar rules, corpora, phonetics)   |
                                  +---------------------------------------+
```

---

## 2. High-Level Explanation of Key Fallback Functions

Below is the detailed breakdown of what each fallback function does, what linguistic rules it checks, and how it synthesizes responses:

| Feature & Fallback Function | What It Checks & Evaluates | Deterministic Output Synthesized |
| :--- | :--- | :--- |
| **Active Sentence Evaluation**<br>`getFallbackSentenceEvaluation` | • Checks presence of target word or root stem.<br>• Validates minimum length and capitalization/punctuation.<br>• Identifies grammatical slips (particles, tense endings, word order). | • Calculated score (e.g. 85-90% if word used cleanly; 50-60% if short/partial; 20-30% if omitted).<br>• Corrected sentence and natural alternatives.<br>• Granular grammar breakdown tokens and remedy cards. |
| **Placement Diagnostic Evaluation**<br>`evaluatePlacementTestLocally` / `evaluateDiagnosticAnswer` | • Exact & normalized string matching.<br>• Morphosyntactic rules per language (e.g. Korean `-았습니다/었습니다` past tense, Spanish subjunctive triggers, Japanese `-て` forms).<br>• Real vs. counterfactual conditional mood checks. | • CEFR level determination (A1 to C2).<br>• Estimated active vocabulary count and starting rank.<br>• Error inventory for automated remedy deck construction. |
| **Reading & Listening Immersion**<br>`getFallbackReadingArticle` | • Target language code and CEFR level.<br>• Active focus words from user deck.<br>• Cultural context and thematic corpus matching. | • Multilingual leveled reading story.<br>• Token-aligned bilingual sentence pairs.<br>• 3 comprehension questions with answer keys and phonetic annotations. |
| **AI Tutor Socratic Chat**<br>`getFallbackTutorResponse` | • Intent classifier (greeting, grammar question, translation query, practice attempt).<br>• Learner level and conversation history context. | • Level-appropriate Socratic reply in target language with English grammar hints.<br>• Encouraging pedagogical follow-up prompts. |
| **Translate & Syntactic Breakdown**<br>`getFallbackTranslation` | • Dictionary corpus lookup and frequency rank indexing.<br>• Word boundary tokenization and phonetic generation (IPA, Pinyin, Zhuyin, Romaji, Hangul). | • Aligned word-by-word token mappings.<br>• Lemma and part-of-speech annotations.<br>• Usage notes and formal vs. informal register indicators. |
| **Verb Conjugation Lookup**<br>`getFallbackConjugationLookup` | • Language inflection classes (Spanish `-ar`/`-er`/`-ir`, Korean `하다`/regular/irregular, Japanese Godan/Ichidan).<br>• Stem change rules (e.g. `e->ie`, `o->ue`). | • Complete conjugation tables across Indicative, Subjunctive, Imperative, and Conditional moods.<br>• Pronoun-aligned example sentences. |
| **Language Journal Prose Checker**<br>`getFallbackJournalCorrection` | • Word count, sentence boundaries, and punctuation.<br>• Script validity and linguistic character sets.<br>• Paragraph structure and fluency metrics. | • CEFR level score and readability metric.<br>• Line-by-line polished corrections.<br>• Contextual hashtags and sentiment tags. |
| **Card & Concept Deep Dive**<br>`getFallbackExplainCard` | • Part of speech and lexical category.<br>• Target vs known language grammar typology (e.g. SOV vs SVO). | • Grammatical formula / sentence template.<br>• 3 authentic example sentences with phonetics.<br>• Common pitfalls, false friends, and mnemonic hooks. |

---

## 3. Visual Engine Distinction (`AiEngineBadge`)

To ensure complete transparency, every AI-powered feature in the application displays an **`AiEngineBadge`**:

- 🟢 **Gemini AI Active Badge**:
  - Rendered with an emerald/indigo background and sparkle icon.
  - Displays the specific Gemini model used (e.g. `Gemini 3.7 Flash`, `Gemini 3.1 Flash-Lite`).
  - Tooltip: *"Live Generative AI active: Response generated using Google Gemini."*

- 🟡 **Deterministic Fallback Badge**:
  - Rendered with a warm amber background and CPU / shield icon.
  - Displays `Deterministic Fallback Engine` / `Rules`.
  - Tooltip: *"Offline resilience engine: Generated instantly via deterministic linguistic rules and frequency tables (zero API latency or downtime)."*

### Visual Distinction Locations in UI:
1. **Sentence Production Scorecards**: Displayed in the evaluation header alongside mastery grade.
2. **AI Tutor Messages**: Rendered next to the AI Tutor avatar on every assistant message.
3. **Smart Translation Bar**: Shown on the interactive aligned translation card.
4. **Linguistic Co-Pilot Drawer**: Rendered on recommended expressions and conjugated forms.
5. **Graded Reading Articles**: Displayed on article story header and question evaluation cards.
6. **Writing Journal**: Rendered in the prose evaluation score card.
7. **Conjugation Explorer**: Rendered in the verb regularity and paradigm header.
8. **Placement Test Diagnostic**: Rendered in the CEFR result banner.

---

## 4. Brainstorming: Strategies to Make Sentence Evaluation Faster

To achieve sub-second sentence evaluation and minimize user wait times during high-velocity spaced-repetition drills, we have evaluated and designed the following architectural optimizations:

### 1. Dedicated Ultra-Low Latency Model (`gemini-3.1-flash-lite`)
- **Current Baseline**: `gemini-3.7-flash` provides deep pedagogical feedback but averages ~700–1200ms roundtrip latency.
- **Optimization**: Route lightweight single-sentence evaluations to `gemini-3.1-flash-lite` or `gemini-2.5-flash-lite`.
- **Expected Speedup**: ~50–65% reduction in Time to First Token (TTFT) and lower server processing times (typically 250–450ms).

### 2. Strict JSON Schema Trimming (Token Generation Minimization)
- **Insight**: Generation latency is directly proportional to the number of output tokens.
- **Optimization**: Trim redundant commentary fields. For routine correct sentences, compress response schema:
  - Return `{ "score": 95, "grade": 4, "isSuccess": true }` immediately.
  - Defer deep grammar error breakdown tokens and remedy cards to an on-demand expandable UI ("Explain in depth" button).
- **Expected Speedup**: Reduces output tokens from ~180 tokens down to ~35 tokens, cutting transfer and generation time by ~40%.

### 3. Temperature 0.0 & Greedy Decoding
- **Optimization**: Set `temperature: 0.0` and disable top_p sampling for grammar evaluation.
- **Benefit**: Eliminates sampling overhead and maximizes cache hits on prefix prompt tokens.

### 4. Speculative Client-Side Pre-Validation (0ms Feedback)
- **Optimization**: Run an instant client-side heuristic check immediately upon pressing Enter:
  - Verify target word presence and morphosyntactic root match in <5ms.
  - Show an instant tentative status indicator (e.g. "Target word found, checking grammar...") while the LLM request is in flight.

### 5. Direct Self-Reporting SRS Mode (0ms Latency)
- **User Agency**: Learners who prefer fast-paced flashcard drilling without waiting for AI evaluation can toggle to **Quick Self-Assessment** mode with one-touch keyboard shortcuts (1: Again, 2: Hard, 3: Good, 4: Easy, Space: Flip).
- **Result**: Instantaneous 0ms spaced-repetition scheduling with no network dependency.

---

## 5. Live AI Feature Latency Benchmarking Suite

The application includes a built-in **AI Latency Benchmark Suite** accessible via the `⚡ AI Benchmark` button in the top navigation bar:

- **Real-Time Measurement**: Executes live API roundtrips across all 6 core AI capabilities:
  1. *Sentence Production Evaluation* (`/api/evaluate-sentence`)
  2. *AI Socratic Tutor Chat* (`/api/tutor-chat`)
  3. *Sentence & Context Translation* (`/api/translate-explain`)
  4. *Verb Conjugation Explorer* (`/api/conjugation-lookup`)
  5. *Graded Reading Article Generation* (`/api/generate-reading`)
  6. *Language Journal Prose Correction* (`/api/journal-correct`)
- **Metadata Returned**:
  - `latencyMs`: Accurate millisecond roundtrip time.
  - `modelUsed`: Specific Gemini model or Deterministic Rule Engine used.
  - `isFallback`: Indicator showing whether the cloud LLM or the local fallback was invoked.
- **Visual Analytics**: Interactive bar charts comparing relative feature speeds and status indicators.

---

## 6. Verification & Testing

- Run `npm run build` to verify full compilation.
- Run `npm run lint` (`tsc --noEmit`) to verify zero TypeScript errors.
- Both online LLM pathways and offline deterministic pathways share identical TypeScript interfaces, ensuring seamless UI transitions.
