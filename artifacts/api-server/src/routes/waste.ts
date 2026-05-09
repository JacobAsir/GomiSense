import { Router, type IRouter } from "express";
import {
  ClassifyImageBody,
  ClassifyItemBody,
  GetDemoSamplesQueryParams,
  SearchItemsQueryParams,
} from "@workspace/api-zod";
import {
  classifyItemFromCandidates,
  classifyItemText,
  searchItems,
  getMunicipalityDirectory,
  type ClassificationResult,
} from "../rules/engine";
import { MUNICIPALITIES } from "../rules/municipalities";
import { identifyImageItem, identifyTextItem, type AiIdentificationResult } from "../services/gemini";

const router: IRouter = Router();

const DEMO_SAMPLES = [
  { itemName: "PET bottle", itemNameJa: "PET bottle", category: "PET Bottles", categoryJa: "PET Bottles", emoji: "PET" },
  { itemName: "Aluminum can", itemNameJa: "Aluminum can", category: "Cans / Metals", categoryJa: "Cans / Metals", emoji: "CAN" },
  { itemName: "Newspaper", itemNameJa: "Newspaper", category: "Paper / Cardboard", categoryJa: "Paper / Cardboard", emoji: "PAPER" },
  { itemName: "Battery", itemNameJa: "Battery", category: "Hazardous / Special Disposal", categoryJa: "Hazardous / Special Disposal", emoji: "BAT" },
  { itemName: "Spray can", itemNameJa: "Spray can", category: "Hazardous / Special Disposal", categoryJa: "Hazardous / Special Disposal", emoji: "SPRAY" },
  { itemName: "Cardboard", itemNameJa: "Cardboard", category: "Paper / Cardboard", categoryJa: "Paper / Cardboard", emoji: "BOX" },
  { itemName: "Plastic packaging", itemNameJa: "Plastic packaging", category: "Plastic Packaging", categoryJa: "Plastic Packaging", emoji: "PLASTIC" },
  { itemName: "Glass bottle", itemNameJa: "Glass bottle", category: "Glass", categoryJa: "Glass", emoji: "GLASS" },
  { itemName: "Ceramic cup", itemNameJa: "Ceramic cup", category: "Non-Burnable Waste", categoryJa: "Non-Burnable Waste", emoji: "CUP" },
  { itemName: "Sofa", itemNameJa: "Sofa", category: "Oversized Waste", categoryJa: "Oversized Waste", emoji: "SOFA" },
  { itemName: "Food waste", itemNameJa: "Food waste", category: "Burnable Waste", categoryJa: "Burnable Waste", emoji: "FOOD" },
  { itemName: "Smartphone", itemNameJa: "Smartphone", category: "Hazardous / Special Disposal", categoryJa: "Hazardous / Special Disposal", emoji: "PHONE" },
];

function applyAiNotes(
  result: ClassificationResult,
  identification: AiIdentificationResult,
): ClassificationResult {
  const useAiSummary = result.processingMode === "fallback" || result.confidenceScore < 0.7;
  
  return {
    ...result,
    summaryEn: (useAiSummary && identification.summaryEn) ? identification.summaryEn : result.summaryEn,
    summaryJa: (useAiSummary && identification.summaryJa) ? identification.summaryJa : result.summaryJa,
    processingMode: result.processingMode === "fallback" ? "fallback" : "live",
  };
}

router.post("/classify-item", async (req, res) => {
  const parsed = ClassifyItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.message });
    return;
  }

  const { municipalityId, itemName } = parsed.data;
  const municipality = MUNICIPALITIES.find(m => m.id === municipalityId);

  try {
    // 1. Try local database first
    const localResult = classifyItemText(itemName, municipalityId);
    
    // If we have a very high confidence local match (100% or close), return it immediately
    // This saves AI costs and provides a cleaner UX for known items like "Newspaper"
    if (localResult.confidenceScore >= 0.9) {
      res.json({
        ...localResult,
        processingMode: "live", // Mark as live so AI UI is hidden
      });
      return;
    }

    // 2. Fallback to Gemini if local knowledge is insufficient
    const categoryNames = municipality?.categories.map(c => c.name);
    const identification = await identifyTextItem(itemName, municipality?.name, categoryNames);
    const result = classifyItemFromCandidates(
      identification.candidates,
      municipalityId,
      "Gemini text",
    );
    res.json(applyAiNotes(result, identification));
  } catch (err: unknown) {
    try {
      const fallbackResult = classifyItemText(itemName, municipalityId);
      res.json(fallbackResult);
    } catch (fallbackErr: unknown) {
      const message =
        fallbackErr instanceof Error
          ? fallbackErr.message
          : err instanceof Error
            ? err.message
            : "Classification failed";
      res.status(400).json({ error: message });
    }
  }
});

router.post("/classify-image", async (req, res) => {
  const parsed = ClassifyImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.message });
    return;
  }

  const { municipalityId, imageBase64, mimeType } = parsed.data;
  const municipality = MUNICIPALITIES.find(m => m.id === municipalityId);

  try {
    const categoryNames = municipality?.categories.map(c => c.name);
    const identification = await identifyImageItem(imageBase64, mimeType, municipality?.name, categoryNames);
    const result = classifyItemFromCandidates(
      identification.candidates,
      municipalityId,
      "Gemini vision",
    );
    res.json(applyAiNotes(result, identification));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Image classification failed";
    res.status(503).json({
      error: "Gemini image classification unavailable",
      details: message,
    });
  }
});

router.get("/demo-samples", (req, res) => {
  const parsed = GetDemoSamplesQueryParams.safeParse(req.query);
  const municipalityId = parsed.success ? parsed.data.municipalityId : undefined;

  if (municipalityId) {
    const exists = MUNICIPALITIES.some((municipality) => municipality.id === municipalityId);
    if (!exists) {
      res.status(404).json({ error: "Municipality not found" });
      return;
    }
  }

  res.json({
    samples: DEMO_SAMPLES,
    municipalityId: municipalityId ?? "tokyo-shibuya",
  });
});

router.get("/directory", (req, res) => {
  const municipalityId = req.query.municipalityId as string;
  if (!municipalityId) {
    res.status(400).json({ error: "municipalityId is required" });
    return;
  }

  const items = getMunicipalityDirectory(municipalityId);
  res.json({ items });
});

router.get("/search-items", (req, res) => {
  const parsed = SearchItemsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters", details: parsed.error.message });
    return;
  }

  const { q, municipalityId } = parsed.data;
  const results = searchItems(q, municipalityId);

  res.json({
    results,
    query: q,
    municipalityId,
    totalResults: results.length,
  });
});

export default router;
