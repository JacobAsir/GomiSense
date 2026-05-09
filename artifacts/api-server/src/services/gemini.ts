import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export interface AiItemCandidate {
  label: string;
  confidence: number;
}

export interface AiIdentificationResult {
  candidates: AiItemCandidate[];
  summaryEn?: string;
  summaryJa?: string;
}

const DEFAULT_MODEL = "gemini-2.0-flash";

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    candidates: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: {
            type: SchemaType.STRING,
            description: "A concise English item label, material, or common synonym.",
          },
          confidence: {
            type: SchemaType.NUMBER,
            description: "Confidence score from 0.0 to 1.0.",
          },
        },
        required: ["label", "confidence"],
      },
    },
    summaryEn: {
      type: SchemaType.STRING,
      description: "A 1-2 sentence English summary of the identified item and why it belongs to the top candidate category.",
    },
    summaryJa: {
      type: SchemaType.STRING,
      description: "A 1-2 sentence Japanese summary of the identified item and why it belongs to the top candidate category.",
    },
  },
  required: ["candidates"],
};

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenerativeAI(apiKey);
}

function getModel() {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

/**
 * Normalizes the AI result to ensure it fits our interface.
 */
function normalizeResult(data: any): AiIdentificationResult {
  const candidates = Array.isArray(data?.candidates) 
    ? data.candidates.map((c: any) => ({
        label: String(c.label || "unknown"),
        confidence: Number(c.confidence || 0),
      }))
    : [];

  return {
    candidates,
    summaryEn: data.summaryEn,
    summaryJa: data.summaryJa,
  };
}

/**
 * Robust JSON parsing for Gemini responses.
 */
function parseJsonObject(text: string): any {
  try {
    // Remove markdown code blocks if present
    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${text}`);
  }
}

async function generateStructuredIdentification(
  parts: any[]
): Promise<AiIdentificationResult> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: getModel(),
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.1,
    }
  });

  const result = await model.generateContent(parts);
  const response = await result.response;
  const text = response.text();
  
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return normalizeResult(parseJsonObject(text));
}

export async function identifyWasteFromText(
  itemName: string,
  municipalityContext?: string
): Promise<AiIdentificationResult> {
  const prompt = `
    You are an expert in Japanese waste sorting.
    Identify the following item: "${itemName}"
    ${municipalityContext ? `Context for municipality rules: ${municipalityContext}` : ""}
    Categorize it and suggest the most likely classification.
  `;

  return generateStructuredIdentification([prompt]);
}

export async function identifyWasteFromImage(
  imageBase64: string,
  mimeType: string,
  municipalityContext?: string
): Promise<AiIdentificationResult> {
  const prompt = `
    Analyze this image of a waste item.
    ${municipalityContext ? `Context for municipality rules: ${municipalityContext}` : ""}
    Identify the item and categorize it according to Japanese waste sorting standards.
  `;

  return generateStructuredIdentification([
    prompt,
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType
      }
    }
  ]);
}
