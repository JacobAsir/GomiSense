import { GoogleGenAI, Type } from "@google/genai";

export interface AiItemCandidate {
  label: string;
  confidence: number;
}

export interface AiIdentificationResult {
  candidates: AiItemCandidate[];
  summaryEn?: string;
  summaryJa?: string;
}

const DEFAULT_MODEL = "gemini-1.5-flash";

const candidateSchema = {
  type: Type.OBJECT,
  properties: {
    candidates: {
      type: Type.ARRAY,
      minItems: 1,
      maxItems: 5,
      items: {
        type: Type.OBJECT,
        properties: {
          label: {
            type: Type.STRING,
            description: "A concise English item label, material, or common synonym.",
          },
          confidence: {
            type: Type.NUMBER,
            description: "Confidence from 0 to 1.",
          },
        },
        required: ["label", "confidence"],
        propertyOrdering: ["label", "confidence"],
      },
    },
    summaryEn: {
      type: Type.STRING,
      description: "One short English note about the identified item.",
    },
    summaryJa: {
      type: Type.STRING,
      description: "One short Japanese note about the identified item.",
    },
  },
  required: ["candidates"],
  propertyOrdering: ["candidates", "summaryEn", "summaryJa"],
};

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required for live Gemini classification.");
  }

  return new GoogleGenAI({ apiKey });
}

function getModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

function clampConfidence(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

function parseJsonObject(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("Gemini did not return JSON.");
    return JSON.parse(text.slice(start, end + 1));
  }
}

function normalizeResult(raw: unknown): AiIdentificationResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("Gemini returned an invalid response shape.");
  }

  const data = raw as Record<string, unknown>;
  const rawCandidates = Array.isArray(data.candidates) ? data.candidates : [];

  const candidates = rawCandidates
    .map((candidate): AiItemCandidate | null => {
      if (!candidate || typeof candidate !== "object") return null;
      const record = candidate as Record<string, unknown>;
      const label = typeof record.label === "string" ? record.label.trim() : "";
      if (!label) return null;

      return {
        label,
        confidence: clampConfidence(record.confidence),
      };
    })
    .filter((candidate): candidate is AiItemCandidate => candidate !== null);

  if (candidates.length === 0) {
    throw new Error("Gemini did not identify any item candidates.");
  }

  return {
    candidates,
    summaryEn: typeof data.summaryEn === "string" ? data.summaryEn : undefined,
    summaryJa: typeof data.summaryJa === "string" ? data.summaryJa : undefined,
  };
}

async function generateStructuredIdentification(
  contents: Parameters<GoogleGenAI["models"]["generateContent"]>[0]["contents"],
): Promise<AiIdentificationResult> {
  const response = await getClient().models.generateContent({
    model: getModel(),
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: candidateSchema,
      temperature: 0.1,
    },
    tools: [
      {
        google_search_retrieval: {}, // Enables live web search
      },
    ],
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return normalizeResult(parseJsonObject(text));
}

export async function identifyTextItem(
  itemName: string,
  municipalityName?: string,
  categories?: string[],
): Promise<AiIdentificationResult> {
  const cityContext = municipalityName ? ` specifically for ${municipalityName}, Japan` : " in Japan";
  const categoryContext = categories?.length 
    ? `\n\nMap the item to one of these local disposal categories if applicable: ${categories.join(", ")}.` 
    : "";

  const prompt = [
    `You are an expert waste sorting assistant${cityContext}.${categoryContext}`,
    "Identify the household waste item provided by the user.",
    "Return likely item labels only; do not decide municipality disposal rules.",
    "Prefer concrete labels and materials that a rules engine can match, for example: PET bottle, plastic packaging, aluminum can, glass bottle, cardboard, battery.",
    `User input: ${itemName}`,
  ].join("\n");

  return generateStructuredIdentification(prompt);
}

export async function identifyImageItem(
  imageBase64: string,
  mimeType: string,
  municipalityName?: string,
  categories?: string[],
): Promise<AiIdentificationResult> {
  const cityContext = municipalityName ? ` in ${municipalityName}, Japan` : " in Japan";
  const categoryContext = categories?.length 
    ? `\n\nMap the item to one of these local disposal categories if applicable: ${categories.join(", ")}.` 
    : "";

  const prompt = [
    `Identify the main household waste item in this image for a waste sorting app${cityContext}.${categoryContext}`,
    "Return likely item labels only; do not decide municipality disposal rules.",
    "Prefer concise English labels and material/container terms that a rules engine can match.",
  ].join("\n");

  return generateStructuredIdentification([
    {
      role: "user",
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
      ],
    },
  ]);
}
