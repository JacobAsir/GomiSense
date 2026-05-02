import { Router, type IRouter } from "express";
import {
  ClassifyItemBody,
  ClassifyImageBody,
  GetDemoSamplesQueryParams,
  SearchItemsQueryParams,
} from "@workspace/api-zod";
import { classifyItemText, classifyItemFromImageCandidates, generateMockImageCandidates, searchItems } from "../rules/engine";
import { MUNICIPALITIES } from "../rules/municipalities";

const router: IRouter = Router();

// Demo samples — representative items per municipality
const DEMO_SAMPLES = [
  { itemName: "PET bottle", itemNameJa: "ペットボトル", category: "PET Bottles", categoryJa: "ペットボトル", emoji: "🥤" },
  { itemName: "Aluminum can", itemNameJa: "アルミ缶", category: "Cans / Metals", categoryJa: "缶・金属類", emoji: "🥫" },
  { itemName: "Newspaper", itemNameJa: "新聞紙", category: "Paper / Cardboard", categoryJa: "紙類・段ボール", emoji: "📰" },
  { itemName: "Battery", itemNameJa: "電池", category: "Hazardous / Special Disposal", categoryJa: "危険・特別ゴミ", emoji: "🔋" },
  { itemName: "Spray can", itemNameJa: "スプレー缶", category: "Hazardous / Special Disposal", categoryJa: "危険・特別ゴミ", emoji: "🪣" },
  { itemName: "Cardboard", itemNameJa: "段ボール", category: "Paper / Cardboard", categoryJa: "紙類・段ボール", emoji: "📦" },
  { itemName: "Plastic packaging", itemNameJa: "プラスチック包装", category: "Plastic Packaging", categoryJa: "プラスチックゴミ", emoji: "🛍️" },
  { itemName: "Glass bottle", itemNameJa: "ガラス瓶", category: "Glass", categoryJa: "ガラス類", emoji: "🍾" },
  { itemName: "Ceramic cup", itemNameJa: "陶器のカップ", category: "Non-Burnable Waste", categoryJa: "燃えないゴミ", emoji: "☕" },
  { itemName: "Sofa", itemNameJa: "ソファ", category: "Oversized Waste", categoryJa: "粗大ゴミ", emoji: "🛋️" },
  { itemName: "Food waste", itemNameJa: "生ゴミ", category: "Burnable Waste", categoryJa: "燃えるゴミ", emoji: "🗑️" },
  { itemName: "Smartphone", itemNameJa: "スマートフォン", category: "Hazardous / Special Disposal", categoryJa: "危険・特別ゴミ", emoji: "📱" },
];

router.post("/classify-item", (req, res) => {
  const parsed = ClassifyItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.message });
    return;
  }

  const { municipalityId, itemName } = parsed.data;

  try {
    const result = classifyItemText(itemName, municipalityId);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Classification failed";
    res.status(400).json({ error: message });
  }
});

router.post("/classify-image", (req, res) => {
  const parsed = ClassifyImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.message });
    return;
  }

  const { municipalityId, imageBase64 } = parsed.data;

  try {
    // Generate image candidates (mock mode — no vision API required)
    const imageCandidates = generateMockImageCandidates(imageBase64);

    // Run through deterministic rules engine
    const result = classifyItemFromImageCandidates(imageCandidates, municipalityId);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Image classification failed";
    res.status(400).json({ error: message });
  }
});

router.get("/demo-samples", (req, res) => {
  const parsed = GetDemoSamplesQueryParams.safeParse(req.query);
  const municipalityId = parsed.success ? parsed.data.municipalityId : undefined;

  // Validate municipality exists if provided
  if (municipalityId) {
    const exists = MUNICIPALITIES.some((m) => m.id === municipalityId);
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
