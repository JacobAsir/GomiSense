import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export interface AiItemCandidate {
  label: string;
  confidence: number;
}

export interface AiIdentificationResult {
  candidates: AiItemCandidate[];
  summaryEn?: string;
  summaryJa?: string;
  disposalCategory?: string;
  disposalCategoryJa?: string;
  preparationSteps?: string[];
  preparationStepsJa?: string[];
  specialNotes?: string[];
  specialNotesJa?: string[];
}

const DEFAULT_MODEL = "gemini-2.5-flash";

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
    disposalCategory: {
      type: SchemaType.STRING,
      description: "The most likely English disposal category.",
    },
    disposalCategoryJa: {
      type: SchemaType.STRING,
      description: "The most likely Japanese disposal category (e.g., 燃えるゴミ, 粗大ゴミ).",
    },
    preparationSteps: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Specific preparation steps in English.",
    },
    preparationStepsJa: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Specific preparation steps in Japanese.",
    },
    specialNotes: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Safety warnings in English.",
    },
    specialNotesJa: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Safety warnings in Japanese.",
    },
  },
  required: ["candidates", "disposalCategory", "disposalCategoryJa", "preparationSteps", "preparationStepsJa"],
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
    disposalCategory: data.disposalCategory,
    disposalCategoryJa: data.disposalCategoryJa,
    preparationSteps: data.preparationSteps,
    preparationStepsJa: data.preparationStepsJa,
    specialNotes: data.specialNotes,
    specialNotesJa: data.specialNotesJa,
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
    throw new Error("AI returned an empty response.");
  }

  return normalizeResult(parseJsonObject(text));
}

export async function identifyTextItem(
  itemName: string,
  municipalityName?: string,
  categoryNames?: string[]
): Promise<AiIdentificationResult> {
  const municipalityContext = municipalityName ? `Municipality: ${municipalityName}. Available categories: ${categoryNames?.join(", ")}` : "";
  const prompt = `
    You are an expert in Japanese waste sorting.
    Identify the following item: "${itemName}"
    ${municipalityContext ? `Context for municipality rules: ${municipalityContext}` : ""}
    Categorize it and suggest the most likely classification.
    Provide realistic preparation steps (e.g. for oversized items like furniture, mention booking and stickers; for recyclables, mention rinsing; for dangerous items, mention safety).
    If you are unsure of the specific rules for the municipality, provide general Japanese standard guidance.
    IMPORTANT: Do NOT suggest irrelevant steps (like 'drain water' for a bed). Be logical.
  `;

  return generateStructuredIdentification([prompt]);
}

export async function identifyImageItem(
  imageBase64: string,
  mimeType: string,
  municipalityName?: string,
  categoryNames?: string[]
): Promise<AiIdentificationResult> {
  const municipalityContext = municipalityName ? `Municipality: ${municipalityName}. Available categories: ${categoryNames?.join(", ")}` : "";
  const prompt = `
    Analyze this image of a waste item.
    ${municipalityContext ? `Context for municipality rules: ${municipalityContext}` : ""}
    Identify the item and categorize it according to Japanese waste sorting standards.
    Provide realistic preparation steps and special notes. 
    IMPORTANT: Do NOT suggest irrelevant steps. Be logical and grounded in common sense.
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
