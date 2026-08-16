# LanguageTwin 🌐

> **Intelligent Language Acquisition Platform powered by Frequency-Ranked SRS, Active Sentence Production, and Gemini AI.**

🔗 **Live App Link**: [https://ais-pre-fcvezsmnsjhdwdw4zeiyuf-666974423825.us-west2.run.app](https://ais-pre-fcvezsmnsjhdwdw4zeiyuf-666974423825.us-west2.run.app)  
🛠️ **Dev Preview**: [https://ais-dev-fcvezsmnsjhdwdw4zeiyuf-666974423825.us-west2.run.app](https://ais-dev-fcvezsmnsjhdwdw4zeiyuf-666974423825.us-west2.run.app)

---

## 🌟 Key Features

### 1. 🗂️ Deck Explorer & Dynamic Frequency Catalog
- **Target & Known Language Pairs**: Learn Spanish, French, German, Japanese, Korean, Mandarin Chinese, and Italian with customized native language pairings.
- **Real-Time Deck Statistics**: Track total deck items, mastered vocabulary, cards in active review, and items due for practice.
- **Smart Filtering & Sorting**:
  - Filter by mastery status (*Mastered*, *Active Review*, *New*, *Due*, *⚠️ Error Remedies*).
  - Filter by item type (*Vocabulary*, *Particles & Connectors*, *Grammar Concepts & Formulas*, *Phrases*).
  - Sort by frequency rank (#1–#10, #11–#20, #21–#50, etc.), alphabetical order, or mastery level.
- **Generate More Items**: Expand decks dynamically on demand using Gemini 2.5 Flash.
- **Conjugation Tables & Explorer**: Interactive verb conjugation paradigms for inflected languages (Spanish, French, German, Italian, etc.).

### 2. ✍️ Active Production Study Session (SM-2 Spaced Repetition)
- **Active Output Testing**: Prompt the learner to construct full, authentic sentences applying the target word or grammar formula rather than passive flashcard flipping.
- **AI Sentence Evaluation**: Instant multi-dimensional scoring for semantic accuracy, grammatical precision, natural word choice, and tailored remedy flashcards for any grammar slips.
- **Voice Recognition & Speech Audio**: Built-in microphone dictation and native audio playback via speech synthesis.

### 3. 📖 Reading & Listening Immersion
- **Graded Real-World Articles**: AI-synthesized reading and listening passages matched to the learner's vocabulary level.
- **Interactive Linguistic Decomposition**: Click any word, phrase, or clause in the article to inspect definitions, part-of-speech breakdowns, conjugation tables, and add new vocabulary directly to active decks.
- **Level Advisory Notice**: Automatically alerts beginner learners (CEFR A1) to build foundational vocabulary before undertaking complex immersion tasks.
- **Sentence-by-Sentence Audio Player**: Synchronized paragraph playback with adjustable speed.

### 4. 🎭 AI Conversation Partner & Roleplay
- **Context-Aware Tutor**: Practice natural dialogue while the AI cross-evaluates deck items and updates your SRS mastery scores in real time.
- **Roleplay Scenario Engine**: Specify custom roleplay settings or click the one-click generator to simulate ordering at a cafe, asking for directions, shopping at a local market, or meeting new friends.
- **Linguistic Co-Pilot Side Tab**: Ask quick questions mid-conversation (*"How do I say...?"*, *"Lookup word"*, *"Polite vs. Casual register"*) without interrupting the main conversational flow.

### 5. 📊 Mastery & Level Analytics (Standardized Frameworks)
- **Standardized Equivalency Engine**: Maps vocabulary mastery and frequency progression onto official international frameworks:
  - **CEFR**: Common European Framework (A1, A2, B1, B2, C1, C2)
  - **DELE & SIELE**: Spanish language certification benchmarks
  - **DELF / DALF & TCF**: French language proficiency standards
  - **JLPT**: Japanese Language Proficiency Test (N5 to N1)
  - **TOPIK**: Test of Proficiency in Korean (Level 1 to 6)
  - **HSK & TOCFL**: Chinese proficiency standards
  - **ACTFL**: American Council on the Teaching of Foreign Languages scale
- **Granular Skill Breakdown**: Lexical breadth, retention stability, grammatical precision, and production fluency.
- **Target Calibration & Multi-Tier Placement Test**: Adaptive diagnostic tests to evaluate and calibrate decks to the student's exact level.

---

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Web Speech API (Synthesis & Recognition).
- **Backend**: Express.js, TypeScript (`tsx` dev / `esbuild` prod bundle).
- **AI Engine**: `@google/genai` with Gemini 2.5 Flash model for structured evaluation, roleplay, and linguistic decomposition.
- **Spaced Repetition**: Modified SuperMemo SM-2 algorithm with continuous mastery scoring.

---

## 💻 Getting Started Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Build for production**:
   ```bash
   npm run build
   ```
