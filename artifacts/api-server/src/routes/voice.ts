
import { Router } from "express";
import { transcribeAudio } from "../services/groq";

const router = Router();

/**
 * Endpoint for transcribing audio clips.
 * Expects { audioBase64: string, mimeType: string, language?: string }
 */
router.post("/transcribe", async (req, res) => {
  const { audioBase64, mimeType, language } = req.body;

  if (!audioBase64) {
    res.status(400).json({ error: "audioBase64 is required" });
    return;
  }

  try {
    const audioBuffer = Buffer.from(audioBase64, "base64");
    
    // Determine extension from mimeType
    let extension = "webm";
    if (mimeType?.includes("mp4") || mimeType?.includes("m4a")) extension = "m4a";
    if (mimeType?.includes("wav")) extension = "wav";
    if (mimeType?.includes("mpeg") || mimeType?.includes("mp3")) extension = "mp3";

    const fileName = `audio.${extension}`;
    const result = await transcribeAudio(audioBuffer, fileName, language);
    
    res.json({ text: result.text });
  } catch (err: any) {
    console.error("Transcription error:", err);
    res.status(500).json({ 
      error: "Transcription failed", 
      details: err.message 
    });
  }
});

export default router;
