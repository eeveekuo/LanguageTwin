import { Deck, Flashcard, SupportedLanguage, LearnerError, CEFRLevel, StandardizedEquivalency } from "../types";

export interface ProficiencyAssessment {
  cefrLevel: CEFRLevel;
  cefrTitle: string;
  cefrDescription: string;
  confidenceScore: number; // 0-100% confidence
  estimatedActiveVocabulary: number;
  highestConqueredRank: number;
  masteredCount: number;
  standardizedFrameworks: StandardizedEquivalency[];
  milestoneProgress: {
    currentLevel: CEFRLevel;
    nextLevel: CEFRLevel;
    progressToNextLevel: number; // 0-100%
    remainingMasteryRequired: number;
    recommendedFocus: string;
  };
  skillBreakdown: {
    lexicalBreadth: number; // 0-100
    retentionStability: number; // 0-100
    grammaticalPrecision: number; // 0-100
    productionFluency: number; // 0-100
  };
}

/**
 * Calculates accurate standardized language level estimation based on flashcard SRS mastery data,
 * frequency boundaries reached, active retention rates, and error ratios.
 */
export function estimateStandardizedProficiency(
  deck: Deck,
  targetLang: SupportedLanguage,
  learnerErrors: LearnerError[] = []
): ProficiencyAssessment {
  const cards = deck.cards || [];
  const total = cards.length;
  const mastered = cards.filter((c) => c.srs.status === "mastered" || c.srs.masteryScore >= 85);
  const learning = cards.filter((c) => c.srs.status === "learning" || (c.srs.masteryScore >= 50 && c.srs.masteryScore < 85));

  const masteredCount = mastered.length;
  const learningCount = learning.length;

  // Max frequency rank mastered
  const masteredRanks = mastered.map((c) => c.frequencyRank || 0);
  const maxRankConquered = masteredRanks.length > 0 ? Math.max(...masteredRanks) : 0;

  // Active errors ratio
  const activeDeckErrors = learnerErrors.filter(
    (e) => !e.isResolved && cards.some((c) => c.id === e.cardId || c.targetItem.toLowerCase() === e.targetItem.toLowerCase())
  );
  const resolvedDeckErrors = learnerErrors.filter(
    (e) => e.isResolved && cards.some((c) => c.id === e.cardId || c.targetItem.toLowerCase() === e.targetItem.toLowerCase())
  );

  // Average AI mastery score of reviewed cards
  const reviewedCards = cards.filter((c) => c.srs.history && c.srs.history.length > 0);
  const avgScore =
    reviewedCards.length > 0
      ? Math.round(reviewedCards.reduce((acc, c) => acc + c.srs.masteryScore, 0) / reviewedCards.length)
      : 50;

  // Effective Lexicon Capacity Estimation
  // A formula combining mastered cards, high frequency rank ceiling, and learning state
  const baseLexicon = Math.round(masteredCount * 12 + learningCount * 4 + maxRankConquered * 1.2);
  const estimatedActiveVocabulary = Math.max(80, Math.min(12000, baseLexicon || 150));

  // Determine CEFR Level
  let cefrLevel: CEFRLevel = "A1";
  let cefrTitle = "A1 Breakthrough";
  let cefrDescription = "Beginner: Can understand and construct basic survival sentences, greetings, and high-frequency formulaic expressions.";
  let nextLevel: CEFRLevel = "A2";
  let targetMasteryForNext = 25;
  let recommendedFocus = "Expand core vocabulary in top 200 frequency ranks and master present-tense agreement.";

  if (masteredCount >= 100 || maxRankConquered >= 3000 || estimatedActiveVocabulary >= 4500) {
    cefrLevel = "C1";
    cefrTitle = "C1 Operational Proficiency";
    cefrDescription = "Advanced: Expresses ideas fluently and spontaneously with complex structures, idioms, and high grammatical nuance.";
    nextLevel = "C2";
    targetMasteryForNext = 180;
    recommendedFocus = "Master rare stylistic collocations, literary registers, and culture-specific idioms.";
  } else if (masteredCount >= 60 || maxRankConquered >= 1500 || estimatedActiveVocabulary >= 2500) {
    cefrLevel = "B2";
    cefrTitle = "B2 Vantage";
    cefrDescription = "Upper Intermediate: Can produce clear, detailed sentences on a wide range of subjects, explaining viewpoints with complex subordinate clauses.";
    nextLevel = "C1";
    targetMasteryForNext = 100;
    recommendedFocus = "Conquer high-register frequency tiers (Ranks #1500–#3000) and eliminate subtle false friend slips.";
  } else if (masteredCount >= 30 || maxRankConquered >= 650 || estimatedActiveVocabulary >= 1200) {
    cefrLevel = "B1";
    cefrTitle = "B1 Threshold";
    cefrDescription = "Intermediate: Understands main points of clear standard input. Can produce simple connected text on topics of personal interest or reasonings.";
    nextLevel = "B2";
    targetMasteryForNext = 60;
    recommendedFocus = "Focus on subjunctive / hypothetical moods, contrastive connectors (although, however), and past tense distinction.";
  } else if (masteredCount >= 12 || maxRankConquered >= 200 || estimatedActiveVocabulary >= 500) {
    cefrLevel = "A2";
    cefrTitle = "A2 Waystage";
    cefrDescription = "Elementary: Can communicate in simple routine tasks requiring a direct exchange of information on familiar topics and past events.";
    nextLevel = "B1";
    targetMasteryForNext = 30;
    recommendedFocus = "Conquer past and future tense active production, object pronouns, and frequency tiers #50–#200.";
  }

  // Calculate progress % towards next CEFR milestone
  const prevThreshold = cefrLevel === "A1" ? 0 : cefrLevel === "A2" ? 12 : cefrLevel === "B1" ? 30 : cefrLevel === "B2" ? 60 : 100;
  const span = targetMasteryForNext - prevThreshold;
  const progressInSpan = Math.max(0, masteredCount - prevThreshold);
  const progressToNextLevel = Math.min(99, Math.max(5, Math.round((progressInSpan / span) * 100)));
  const remainingMasteryRequired = Math.max(1, targetMasteryForNext - masteredCount);

  // Confidence Score calculation
  const reviewDensity = Math.min(1, reviewedCards.length / Math.max(10, total));
  const errorPenalty = activeDeckErrors.length * 3;
  const confidenceScore = Math.min(98, Math.max(40, Math.round(reviewDensity * 60 + (avgScore / 100) * 40 - errorPenalty)));

  // Sub-skill breakdown
  const lexicalBreadth = Math.min(100, Math.round((estimatedActiveVocabulary / 3500) * 100));
  const retentionStability = Math.min(100, Math.round((masteredCount / Math.max(1, total)) * 100 + 30));
  const errorResolutionRatio =
    activeDeckErrors.length + resolvedDeckErrors.length > 0
      ? Math.round((resolvedDeckErrors.length / (activeDeckErrors.length + resolvedDeckErrors.length)) * 100)
      : 80;
  const grammaticalPrecision = Math.min(100, Math.max(20, Math.round(avgScore * 0.7 + errorResolutionRatio * 0.3)));
  const productionFluency = Math.min(100, Math.max(25, Math.round((reviewedCards.length / Math.max(5, total)) * 50 + (avgScore * 0.5))));

  // Language-Specific Standardized Framework Mappings
  const standardizedFrameworks = getStandardizedFrameworks(targetLang.code, cefrLevel, confidenceScore, estimatedActiveVocabulary, avgScore);

  return {
    cefrLevel,
    cefrTitle,
    cefrDescription,
    confidenceScore,
    estimatedActiveVocabulary,
    highestConqueredRank: maxRankConquered || (masteredCount * 10),
    masteredCount,
    standardizedFrameworks,
    milestoneProgress: {
      currentLevel: cefrLevel,
      nextLevel,
      progressToNextLevel,
      remainingMasteryRequired,
      recommendedFocus,
    },
    skillBreakdown: {
      lexicalBreadth,
      retentionStability,
      grammaticalPrecision,
      productionFluency,
    },
  };
}

function getStandardizedFrameworks(
  langCode: string,
  cefr: CEFRLevel,
  confidence: number,
  vocab: number,
  avgScore: number
): StandardizedEquivalency[] {
  const code = langCode.toLowerCase();

  // Spanish
  if (code === "es") {
    const deleScore = Math.min(100, Math.max(45, Math.round(avgScore * 0.7 + confidence * 0.3)));
    return [
      {
        frameworkName: "DELE (Instituto Cervantes)",
        estimatedScoreOrGrade: `DELE ${cefr} (Projected Score: ${deleScore}/100)`,
        actflEquivalent: mapCEFRtoACTFL(cefr),
        readinessPercentage: Math.min(100, Math.round((confidence * 0.6) + (avgScore * 0.4))),
        description: `Official Diploma of Spanish as a Foreign Language recognized by Spain's Ministry of Education. Candidate is in strong ${cefr} standing.`,
      },
      {
        frameworkName: "SIELE Global Scale",
        estimatedScoreOrGrade: `SIELE ${Math.round(vocab * 0.2 + deleScore * 6)} / 1000 pts`,
        actflEquivalent: mapCEFRtoACTFL(cefr),
        readinessPercentage: confidence,
        description: "International Service for Spanish Language Evaluation, scored on a continuous 1000-point index.",
      },
      {
        frameworkName: "ACTFL Proficiency Scale",
        estimatedScoreOrGrade: mapCEFRtoACTFL(cefr),
        actflEquivalent: mapCEFRtoACTFL(cefr),
        readinessPercentage: confidence,
        description: "American Council on the Teaching of Foreign Languages scale for professional working proficiency.",
      },
    ];
  }

  // French
  if (code === "fr") {
    const delfGrade = cefr === "C1" || cefr === "C2" ? `DALF ${cefr}` : `DELF ${cefr}`;
    return [
      {
        frameworkName: "DELF / DALF (France Éducation)",
        estimatedScoreOrGrade: `${delfGrade} (Projected Pass)`,
        actflEquivalent: mapCEFRtoACTFL(cefr),
        readinessPercentage: confidence,
        description: "Diplôme d'Études en Langue Française issued by the French Ministry of Education.",
      },
      {
        frameworkName: "TCF (Test de Connaissance du Français)",
        estimatedScoreOrGrade: `TCF Level ${cefr} (Niveau ${cefr === "A1" ? 1 : cefr === "A2" ? 2 : cefr === "B1" ? 3 : cefr === "B2" ? 4 : 5})`,
        actflEquivalent: mapCEFRtoACTFL(cefr),
        readinessPercentage: confidence,
        description: "Standardized French language test used for French and Quebec immigration and university admissions.",
      },
      {
        frameworkName: "ACTFL Scale",
        estimatedScoreOrGrade: mapCEFRtoACTFL(cefr),
        actflEquivalent: mapCEFRtoACTFL(cefr),
        readinessPercentage: confidence,
        description: "ACTFL French proficiency benchmark.",
      },
    ];
  }

  // German
  if (code === "de") {
    return [
      {
        frameworkName: "Goethe-Zertifikat",
        estimatedScoreOrGrade: `Goethe-Zertifikat ${cefr}`,
        actflEquivalent: mapCEFRtoACTFL(cefr),
        readinessPercentage: confidence,
        description: "Official German certificate recognized globally by employers and German academic institutions.",
      },
      {
        frameworkName: "TestDaF (University Entrance)",
        estimatedScoreOrGrade: cefr === "B2" || cefr === "C1" ? "TestDaF Niveaustufe 4 (TDN 4)" : `Pre-TestDaF (${cefr})`,
        actflEquivalent: mapCEFRtoACTFL(cefr),
        readinessPercentage: Math.max(30, confidence - 10),
        description: "Standardized language test for foreign academic applicants to German higher education.",
      },
    ];
  }

  // Japanese
  if (code === "ja") {
    const jlptMap: Record<CEFRLevel, string> = {
      A1: "JLPT N5 (Basic Kanji & Particles)",
      A2: "JLPT N4 (Everyday Conversations)",
      B1: "JLPT N3 (Bridge to Business Japanese)",
      B2: "JLPT N2 (Advanced Comprehension)",
      C1: "JLPT N1 (Native-like Nuances & High Register)",
      C2: "JLPT N1+ Master",
    };
    return [
      {
        frameworkName: "JLPT (Japanese-Language Proficiency Test)",
        estimatedScoreOrGrade: jlptMap[cefr],
        actflEquivalent: mapCEFRtoACTFL(cefr),
        readinessPercentage: confidence,
        description: "Official Japanese proficiency benchmark administered by the Japan Foundation and JEES.",
      },
      {
        frameworkName: "BJT (Business Japanese Test)",
        estimatedScoreOrGrade: `BJT Level ${cefr === "A1" ? "J5" : cefr === "A2" ? "J4" : cefr === "B1" ? "J3" : cefr === "B2" ? "J2" : "J1"}`,
        actflEquivalent: mapCEFRtoACTFL(cefr),
        readinessPercentage: confidence,
        description: "Measures practical communicative skills in professional and corporate Japanese settings.",
      },
    ];
  }

  // Chinese
  if (code === "zh") {
    const hskMap: Record<CEFRLevel, string> = {
      A1: "HSK Level 1–2 (150–300 words)",
      A2: "HSK Level 2–3 (300–600 words)",
      B1: "HSK Level 3–4 (600–1200 words)",
      B2: "HSK Level 4–5 (1200–2500 words)",
      C1: "HSK Level 5–6 (2500–5000+ words)",
      C2: "HSK Level 6+",
    };
    return [
      {
        frameworkName: "HSK (Hànyǔ Shuǐpíng Kǎoshì)",
        estimatedScoreOrGrade: hskMap[cefr],
        actflEquivalent: mapCEFRtoACTFL(cefr),
        readinessPercentage: confidence,
        description: "China's only standardized test of Standard Chinese language proficiency for non-native speakers.",
      },
      {
        frameworkName: "TOCFL (Taiwan Standard)",
        estimatedScoreOrGrade: `TOCFL Band ${cefr === "A1" || cefr === "A2" ? "A" : cefr === "B1" || cefr === "B2" ? "B" : "C"}`,
        actflEquivalent: mapCEFRtoACTFL(cefr),
        readinessPercentage: confidence,
        description: "Test of Chinese as a Foreign Language for Taiwan universities and corporations.",
      },
    ];
  }

  // Italian
  if (code === "it") {
    return [
      {
        frameworkName: "CILS / CELI (Universities of Siena & Perugia)",
        estimatedScoreOrGrade: `CILS ${cefr}`,
        actflEquivalent: mapCEFRtoACTFL(cefr),
        readinessPercentage: confidence,
        description: "Official Italian certificates recognized by the Italian Ministry of Foreign Affairs.",
      },
      {
        frameworkName: "ACTFL Scale",
        estimatedScoreOrGrade: mapCEFRtoACTFL(cefr),
        actflEquivalent: mapCEFRtoACTFL(cefr),
        readinessPercentage: confidence,
        description: "American Council on the Teaching of Foreign Languages scale.",
      },
    ];
  }

  // Korean
  if (code === "ko") {
    const topikMap: Record<CEFRLevel, string> = {
      A1: "TOPIK I (Level 1)",
      A2: "TOPIK I (Level 2)",
      B1: "TOPIK II (Level 3)",
      B2: "TOPIK II (Level 4)",
      C1: "TOPIK II (Level 5)",
      C2: "TOPIK II (Level 6)",
    };
    return [
      {
        frameworkName: "TOPIK (Test of Proficiency in Korean)",
        estimatedScoreOrGrade: topikMap[cefr],
        actflEquivalent: mapCEFRtoACTFL(cefr),
        readinessPercentage: confidence,
        description: "Official Korean government certification test for study and work in South Korea.",
      },
    ];
  }

  // Default / English / Others
  return [
    {
      frameworkName: "CEFR Standard European Framework",
      estimatedScoreOrGrade: `Level ${cefr}`,
      actflEquivalent: mapCEFRtoACTFL(cefr),
      readinessPercentage: confidence,
      description: "Common European Framework of Reference for Languages, recognized globally across 40+ countries.",
    },
    {
      frameworkName: "ACTFL Proficiency Index",
      estimatedScoreOrGrade: mapCEFRtoACTFL(cefr),
      actflEquivalent: mapCEFRtoACTFL(cefr),
      readinessPercentage: confidence,
      description: "Standardized North American guideline for workplace functional language capability.",
    },
  ];
}

function mapCEFRtoACTFL(cefr: CEFRLevel): string {
  switch (cefr) {
    case "A1":
      return "Novice Mid / High";
    case "A2":
      return "Intermediate Low";
    case "B1":
      return "Intermediate Mid / High";
    case "B2":
      return "Advanced Low / Mid";
    case "C1":
      return "Advanced High / Superior";
    case "C2":
      return "Distinguished";
    default:
      return "Novice";
  }
}
