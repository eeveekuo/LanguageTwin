import { tokenizeSentence, buildTokenAlignment, getAlignedSentencePair } from "../src/utils/alignment";

interface TestCase {
  name: string;
  targetLang: string;
  targetLangCode: string;
  targetText: string;
  translationText: string;
  tokenBreakdown?: Array<{ token: string; translatedToken: string }>;
  expectedTargetCompounds?: string[];
  keyChecks: Array<{
    targetWord: string;
    shouldAlignTo: string[]; // At least one or all must match
  }>;
}

const testCases: TestCase[] = [
  {
    name: "Chinese Compound & Alternation (Cell Phone & Or Not)",
    targetLang: "Traditional Chinese",
    targetLangCode: "zh-TW",
    targetText: "這是你的手機是不是？",
    translationText: "Is this your cell phone or not?",
    expectedTargetCompounds: ["這", "是", "你的", "手機", "是不是"],
    keyChecks: [
      { targetWord: "手機", shouldAlignTo: ["cell", "phone"] },
      { targetWord: "是不是", shouldAlignTo: ["or", "not", "is"] },
      { targetWord: "這", shouldAlignTo: ["this"] },
      { targetWord: "你的", shouldAlignTo: ["your"] },
    ],
  },
  {
    name: "Chinese Contrastive Conjunction & Weather",
    targetLang: "Traditional Chinese",
    targetLangCode: "zh-TW",
    targetText: "雖然外面很冷，但是我們還是想出門運動。",
    translationText: "Although it is very cold outside, we still want to go out and exercise.",
    expectedTargetCompounds: ["雖然", "外面", "很", "冷", "但是", "我們", "還是", "想", "出門", "運動"],
    keyChecks: [
      { targetWord: "雖然", shouldAlignTo: ["although"] },
      { targetWord: "外面", shouldAlignTo: ["outside"] },
      { targetWord: "很", shouldAlignTo: ["very"] },
      { targetWord: "冷", shouldAlignTo: ["cold"] },
      { targetWord: "但是", shouldAlignTo: ["but", "still", "although"] },
      { targetWord: "我們", shouldAlignTo: ["we"] },
      { targetWord: "運動", shouldAlignTo: ["exercise"] },
    ],
  },
  {
    name: "Chinese Library & Students",
    targetLang: "Traditional Chinese",
    targetLangCode: "zh-TW",
    targetText: "很多學生在圖書館看書寫作業。",
    translationText: "A lot of students are reading books and doing homework in the library.",
    expectedTargetCompounds: ["很多", "學生", "在", "圖書館", "看書", "寫", "作業"],
    keyChecks: [
      { targetWord: "很多", shouldAlignTo: ["lot", "a", "of"] },
      { targetWord: "學生", shouldAlignTo: ["students"] },
      { targetWord: "圖書館", shouldAlignTo: ["library"] },
      { targetWord: "作業", shouldAlignTo: ["homework"] },
    ],
  },
  {
    name: "Spanish Modal & Restaurant Scenario",
    targetLang: "Spanish",
    targetLangCode: "es",
    targetText: "¿Puede recomendarme un plato típico de este restaurante?",
    translationText: "Can you recommend a typical dish from this restaurant?",
    keyChecks: [
      { targetWord: "este", shouldAlignTo: ["this"] },
      { targetWord: "restaurante", shouldAlignTo: ["restaurant"] },
    ],
  },
  {
    name: "Japanese Cafe Order",
    targetLang: "Japanese",
    targetLangCode: "ja",
    targetText: "京都のカフェで美味しいコーヒーを飲みます。",
    translationText: "I drink delicious coffee at a cafe in Kyoto.",
    keyChecks: [
      { targetWord: "コーヒー", shouldAlignTo: ["coffee"] },
      { targetWord: "カフェ", shouldAlignTo: ["cafe"] },
    ],
  },
  {
    name: "Taiwanese Hokkien Greeting",
    targetLang: "Taiwanese Hokkien",
    targetLangCode: "nan",
    targetText: "逐家好，食飽未？",
    translationText: "Hello everyone, have you eaten yet?",
    expectedTargetCompounds: ["逐家", "好", "食飽未"],
    keyChecks: [
      { targetWord: "逐家", shouldAlignTo: ["everyone"] },
    ],
  },
];

export function runAudit() {
  console.log("==========================================================");
  console.log("🔬 UNIFIED BIDIRECTIONAL ALIGNMENT AUDIT");
  console.log("==========================================================\n");

  let totalTests = 0;
  let passedTests = 0;
  let totalChecks = 0;
  let passedChecks = 0;

  for (const tc of testCases) {
    totalTests++;
    console.log(`▶ Test Case: ${tc.name} [${tc.targetLangCode}]`);
    console.log(`  Target:      "${tc.targetText}"`);
    console.log(`  Translation: "${tc.translationText}"`);

    const result = getAlignedSentencePair(
      tc.targetText,
      tc.translationText,
      tc.targetLangCode,
      `audit-${Date.now()}`,
      tc.tokenBreakdown
    );

    // 1. Check tokenization
    const nonPunctTarget = result.targetTokens.filter((t) => !t.isPunctuation).map((t) => t.text);
    console.log(`  Tokenized Target: [ ${nonPunctTarget.join(" | ")} ]`);

    if (tc.expectedTargetCompounds) {
      for (const comp of tc.expectedTargetCompounds) {
        if (!nonPunctTarget.includes(comp)) {
          console.warn(`  ⚠️ Warning: Expected compound "${comp}" was split or not found in tokens.`);
        }
      }
    }

    // 2. Check bidirectional integrity
    let bidirectionalErrors = 0;
    for (const t of result.targetTokens) {
      if (t.isPunctuation) continue;
      for (const alignedId of t.alignedIds) {
        const matchingTrans = result.translationTokens.find((tr) => tr.id === alignedId);
        if (!matchingTrans) {
          console.error(`  ❌ Broken Link: Target token "${t.text}" points to missing translation ID "${alignedId}"`);
          bidirectionalErrors++;
        } else if (!matchingTrans.alignedIds.includes(t.id)) {
          console.error(`  ❌ Asymmetric Link: Target "${t.text}" points to "${matchingTrans.text}", but translation does not link back.`);
          bidirectionalErrors++;
        }
      }
    }

    // 3. Check for unbounded spillover (No single token should greedily align to > 5 words)
    let spilloverErrors = 0;
    for (const t of result.targetTokens) {
      if (t.alignedIds.length > 5) {
        console.error(`  ❌ Excessive Spillover: Target token "${t.text}" aligned to ${t.alignedIds.length} translation tokens: ${t.alignedIds.join(", ")}`);
        spilloverErrors++;
      }
    }

    // 4. Verify Key Semantic Alignments
    let caseChecksPassed = true;
    for (const check of tc.keyChecks) {
      totalChecks++;
      const targetToken = result.targetTokens.find((t) => t.text.includes(check.targetWord) || check.targetWord.includes(t.text));
      if (!targetToken) {
        console.error(`  ❌ Key Check Failed: Target word "${check.targetWord}" not found in tokens.`);
        caseChecksPassed = false;
        continue;
      }

      const alignedTransWords = targetToken.alignedIds.map((id) => {
        const tr = result.translationTokens.find((t) => t.id === id);
        return tr ? tr.cleanText : "";
      });

      const hasMatch = check.shouldAlignTo.some((expected) =>
        alignedTransWords.some((actual) => actual.includes(expected) || expected.includes(actual))
      );

      if (hasMatch) {
        passedChecks++;
        console.log(`  ✓ "${targetToken.text}" -> [ ${alignedTransWords.join(", ")} ] (Matched expected: ${check.shouldAlignTo.join("/")})`);
      } else {
        console.error(`  ❌ Alignment mismatch for "${targetToken.text}": got [ ${alignedTransWords.join(", ")} ], expected one of [ ${check.shouldAlignTo.join(", ")} ]`);
        caseChecksPassed = false;
      }
    }

    if (caseChecksPassed && bidirectionalErrors === 0 && spilloverErrors === 0) {
      passedTests++;
      console.log(`  ✅ Result: PASS\n`);
    } else {
      console.log(`  ❌ Result: FAIL\n`);
    }
  }

  console.log("==========================================================");
  console.log(`📊 AUDIT SUMMARY:`);
  console.log(`  Test Cases: ${passedTests} / ${totalTests} Passed`);
  console.log(`  Key Alignment Checks: ${passedChecks} / ${totalChecks} Passed`);
  console.log("==========================================================");

  if (passedTests === totalTests && passedChecks === totalChecks) {
    console.log("🎉 ALL ALIGNMENT AUDITS PASSED WITH ZERO REGRESSIONS.");
    process.exit(0);
  } else {
    console.error("⚠️ SOME AUDIT CHECKS FAILED.");
    process.exit(1);
  }
}

runAudit();
