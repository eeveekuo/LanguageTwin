/**
 * Speech synthesis (Text-to-Speech) & Speech recognition (Speech-to-Text) utilities
 */

// Voice cache
let availableVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const updateVoices = () => {
    availableVoices = window.speechSynthesis.getVoices();
  };
  updateVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }
}

/**
 * Play text aloud using Web Speech API TTS
 */
export function playTextAloud(
  text: string,
  langCode: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported in this environment.");
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const cleanText = text.replace(/\[.*?\]/g, "").trim();
    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Normalize langCode e.g. "es" -> "es-ES", "ja" -> "ja-JP"
    let targetLocale = langCode;
    if (langCode === "es") targetLocale = "es-ES";
    else if (langCode === "ja") targetLocale = "ja-JP";
    else if (langCode === "fr") targetLocale = "fr-FR";
    else if (langCode === "de") targetLocale = "de-DE";
    else if (langCode === "it") targetLocale = "it-IT";
    else if (langCode === "zh") targetLocale = "zh-CN";
    else if (langCode === "ko") targetLocale = "ko-KR";
    else if (langCode === "pt") targetLocale = "pt-PT";
    else if (langCode === "ru") targetLocale = "ru-RU";
    else if (langCode === "ar") targetLocale = "ar-SA";
    else if (langCode === "en") targetLocale = "en-US";

    utterance.lang = targetLocale;
    utterance.rate = 0.95; // slightly slower for language learners for optimal clarity
    utterance.pitch = 1.0;

    // Pick best matching native voice
    if (availableVoices.length === 0) {
      availableVoices = window.speechSynthesis.getVoices();
    }

    const matchedVoice = availableVoices.find(
      (v) => v.lang.toLowerCase() === targetLocale.toLowerCase() || v.lang.toLowerCase().startsWith(langCode.toLowerCase())
    );

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn("TTS utterance error:", e);
      onError?.(e);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (error) {
    console.error("Failed to speak text:", error);
    onError?.(error);
    return false;
  }
}

export function stopSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Speech Recognition (Microphone voice-to-text)
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

export function createSpeechRecognizer(
  langCode: string,
  callbacks: {
    onResult: (transcript: string, isFinal: boolean) => void;
    onError: (error: string) => void;
    onStart: () => void;
    onEnd: () => void;
  }
) {
  if (!isSpeechRecognitionSupported()) {
    callbacks.onError("Speech recognition is not supported in this browser. Please type your sentence.");
    return null;
  }

  const SpeechRecognitionAPI =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognitionAPI();

  // Normalize language code for STT
  let targetLocale = "en-US";
  if (langCode === "es" || langCode.startsWith("es")) targetLocale = "es-ES";
  else if (langCode === "ja" || langCode.startsWith("ja")) targetLocale = "ja-JP";
  else if (langCode === "fr" || langCode.startsWith("fr")) targetLocale = "fr-FR";
  else if (langCode === "de" || langCode.startsWith("de")) targetLocale = "de-DE";
  else if (langCode === "it" || langCode.startsWith("it")) targetLocale = "it-IT";
  else if (langCode === "zh" || langCode.startsWith("zh")) targetLocale = "zh-CN";
  else if (langCode === "ko" || langCode.startsWith("ko")) targetLocale = "ko-KR";
  else if (langCode === "pt" || langCode.startsWith("pt")) targetLocale = "pt-PT";
  else if (langCode === "ru" || langCode.startsWith("ru")) targetLocale = "ru-RU";
  else if (langCode === "ar" || langCode.startsWith("ar")) targetLocale = "ar-SA";
  else if (langCode === "en" || langCode.startsWith("en")) targetLocale = "en-US";

  recognition.lang = targetLocale;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let finalTranscript = "";

  recognition.onstart = () => {
    callbacks.onStart();
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcriptPiece = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcriptPiece + " ";
      } else {
        interimTranscript += transcriptPiece;
      }
    }
    const currentCombined = (finalTranscript + interimTranscript).trim();
    callbacks.onResult(currentCombined, false);
  };

  recognition.onerror = (event: any) => {
    console.warn("Speech recognition error:", event.error);
    if (event.error === "not-allowed" || event.error === "permission-denied") {
      callbacks.onError("Microphone permission denied. Please allow microphone access or type your sentence.");
    } else if (event.error === "no-speech") {
      // benign
    } else {
      callbacks.onError(`Speech recognition notice: ${event.error}`);
    }
  };

  recognition.onend = () => {
    callbacks.onResult(finalTranscript.trim(), true);
    callbacks.onEnd();
  };

  return recognition;
}
