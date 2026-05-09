
/**
 * Service for interacting with Groq Whisper API for speech-to-text.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export interface TranscriptionResult {
  text: string;
}

/**
 * Transcribes audio using Groq Whisper.
 * @param audioBuffer The audio data as a Buffer.
 * @param fileName The filename (with extension like .webm or .m4a).
 * @param language Optional language code (e.g., 'ja', 'en').
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  fileName: string,
  language?: string
): Promise<TranscriptionResult> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey === "gsk_your_key_here") {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  // Node 20+ has built-in FormData and Blob
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: "audio/webm" }); // Default to webm as most browsers record in this
  
  formData.append("file", blob, fileName);
  formData.append("model", "whisper-large-v3-turbo");
  
  if (language) {
    formData.append("language", language);
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Groq transcription failed: ${response.statusText}. ${JSON.stringify(errorData)}`);
  }

  const result = await response.json() as TranscriptionResult;
  return result;
}
