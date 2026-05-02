import { getMunicipalityById, type ItemRule, type MunicipalityProfile } from "./municipalities";

export interface CandidateResult {
  itemName: string;
  itemNameJa: string;
  confidence: number;
  disposalCategory: string;
  disposalCategoryJa: string;
  matchReason: string;
}

export interface ClassificationResult {
  municipality: string;
  itemName: string;
  normalizedItem: string;
  topCandidates: CandidateResult[];
  disposalCategory: string;
  disposalCategoryJa: string;
  disposalCategoryId: string;
  categoryColor: string;
  preparationSteps: string[];
  preparationStepsJa: string[];
  specialNotes: string[];
  specialNotesJa: string[];
  confidenceScore: number;
  summaryEn: string;
  summaryJa: string;
  fallbackGuidance: string;
  processingMode: "mock" | "live" | "fallback";
  collectionDay?: string;
  collectionDayJa?: string;
}

/**
 * Normalize text for matching: lowercase, trim, remove punctuation.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compute synonym match confidence between a query and a list of synonyms.
 * Uses multiple strategies:
 * 1. Exact match → 1.0
 * 2. Contains match → 0.85
 * 3. Partial token overlap → 0.5-0.7
 */
function computeSynonymConfidence(
  query: string,
  itemName: string,
  synonyms: string[],
  synonymsJa: string[],
): { score: number; reason: string } {
  const q = normalize(query);
  const allTerms = [normalize(itemName), ...synonyms.map(normalize), ...synonymsJa.map(normalize)];

  // Strategy 1: Exact match
  for (const term of allTerms) {
    if (q === term) {
      return { score: 1.0, reason: `Exact match: "${term}"` };
    }
  }

  // Strategy 2: Query exactly contains the term or term exactly contains query
  for (const term of allTerms) {
    if (term.length > 2 && q === term) {
      return { score: 1.0, reason: `Full match: "${term}"` };
    }
    if (term.length > 3 && q.includes(term)) {
      return { score: 0.9, reason: `Query contains synonym: "${term}"` };
    }
    if (term.length > 3 && term.includes(q)) {
      return { score: 0.85, reason: `Synonym contains query: "${term}"` };
    }
  }

  // Strategy 3: Token overlap scoring
  const queryTokens = q.split(" ").filter((t) => t.length > 1);
  let bestScore = 0;
  let bestReason = "";

  for (const term of allTerms) {
    const termTokens = term.split(" ").filter((t) => t.length > 1);
    if (termTokens.length === 0 || queryTokens.length === 0) continue;

    const matchingTokens = queryTokens.filter((qt) =>
      termTokens.some((tt) => tt === qt || tt.startsWith(qt) || qt.startsWith(tt)),
    );

    if (matchingTokens.length > 0) {
      const precision = matchingTokens.length / queryTokens.length;
      const recall = matchingTokens.length / termTokens.length;
      const f1 = (2 * precision * recall) / (precision + recall);
      const score = Math.min(0.75, f1 * 0.8);

      if (score > bestScore) {
        bestScore = score;
        bestReason = `Token overlap (${matchingTokens.join(", ")}) with "${term}"`;
      }
    }
  }

  return { score: bestScore, reason: bestReason };
}

/**
 * Classify a text item against a municipality's rule set.
 * This is fully deterministic — no LLM involved.
 */
export function classifyItemText(
  itemName: string,
  municipalityId: string,
): ClassificationResult {
  const municipality = getMunicipalityById(municipalityId);

  if (!municipality) {
    throw new Error(`Municipality not found: ${municipalityId}`);
  }

  const candidates: Array<CandidateResult & { rule: ItemRule }> = [];

  for (const rule of municipality.items) {
    const { score, reason } = computeSynonymConfidence(
      itemName,
      rule.itemName,
      rule.synonyms,
      rule.synonymsJa,
    );

    if (score > 0.2) {
      const category = municipality.categories.find((c) => c.id === rule.categoryId);
      candidates.push({
        itemName: rule.itemName,
        itemNameJa: rule.itemNameJa,
        confidence: score,
        disposalCategory: category?.name ?? rule.categoryId,
        disposalCategoryJa: category?.nameJa ?? rule.categoryId,
        matchReason: reason,
        rule,
      });
    }
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);

  const topCandidates = candidates.slice(0, 3);

  if (topCandidates.length === 0 || topCandidates[0].confidence < 0.3) {
    // No confident match — return fallback
    return buildFallbackResult(itemName, municipality);
  }

  const best = topCandidates[0];
  const category = municipality.categories.find((c) => c.id === best.rule.categoryId);
  const collectionDay = municipality.collectionDays[best.rule.categoryId];

  const summaryEn = buildSummaryEn(best.rule, category?.name ?? best.rule.categoryId, municipality.name);
  const summaryJa = buildSummaryJa(best.rule, category?.nameJa ?? best.rule.categoryId, municipality.nameJa);

  return {
    municipality: municipality.name,
    itemName,
    normalizedItem: normalize(itemName),
    topCandidates: topCandidates.map(({ rule: _rule, ...c }) => c),
    disposalCategory: category?.name ?? best.rule.categoryId,
    disposalCategoryJa: category?.nameJa ?? best.rule.categoryId,
    disposalCategoryId: best.rule.categoryId,
    categoryColor: category?.color ?? "#6b7280",
    preparationSteps: best.rule.preparationSteps,
    preparationStepsJa: best.rule.preparationStepsJa,
    specialNotes: best.rule.specialNotes,
    specialNotesJa: best.rule.specialNotesJa,
    confidenceScore: best.confidence,
    summaryEn,
    summaryJa,
    fallbackGuidance: municipality.fallbackGuidance,
    processingMode: "mock",
    collectionDay,
    collectionDayJa: collectionDay,
  };
}

/**
 * Image-based classification using confidence-scored candidate matching.
 * Takes a set of candidate labels (from image analysis or mock) and
 * runs them through the deterministic rules engine.
 */
export function classifyItemFromImageCandidates(
  imageCandidates: Array<{ label: string; confidence: number }>,
  municipalityId: string,
): ClassificationResult {
  const municipality = getMunicipalityById(municipalityId);
  if (!municipality) {
    throw new Error(`Municipality not found: ${municipalityId}`);
  }

  // Score each image candidate against the rules engine
  const allMatches: Array<CandidateResult & { rule: ItemRule; imageConfidence: number }> = [];

  for (const imgCandidate of imageCandidates) {
    for (const rule of municipality.items) {
      const { score: synonymScore, reason } = computeSynonymConfidence(
        imgCandidate.label,
        rule.itemName,
        rule.synonyms,
        rule.synonymsJa,
      );

      if (synonymScore > 0.2) {
        const combinedScore = synonymScore * imgCandidate.confidence;
        const category = municipality.categories.find((c) => c.id === rule.categoryId);
        allMatches.push({
          itemName: rule.itemName,
          itemNameJa: rule.itemNameJa,
          confidence: combinedScore,
          disposalCategory: category?.name ?? rule.categoryId,
          disposalCategoryJa: category?.nameJa ?? rule.categoryId,
          matchReason: `Image: "${imgCandidate.label}" (${Math.round(imgCandidate.confidence * 100)}%) → ${reason}`,
          rule,
          imageConfidence: imgCandidate.confidence,
        });
      }
    }
  }

  allMatches.sort((a, b) => b.confidence - a.confidence);

  // Deduplicate by rule itemName (keep best score)
  const seen = new Set<string>();
  const topCandidates: typeof allMatches = [];
  for (const m of allMatches) {
    if (!seen.has(m.rule.itemName)) {
      seen.add(m.rule.itemName);
      topCandidates.push(m);
      if (topCandidates.length >= 3) break;
    }
  }

  if (topCandidates.length === 0 || topCandidates[0].confidence < 0.15) {
    const primaryLabel = imageCandidates[0]?.label ?? "unknown item";
    return buildFallbackResult(primaryLabel, municipality);
  }

  const best = topCandidates[0];
  const category = municipality.categories.find((c) => c.id === best.rule.categoryId);
  const collectionDay = municipality.collectionDays[best.rule.categoryId];

  const primaryLabel = imageCandidates[0]?.label ?? best.rule.itemName;

  return {
    municipality: municipality.name,
    itemName: primaryLabel,
    normalizedItem: normalize(primaryLabel),
    topCandidates: topCandidates.map(({ rule: _rule, imageConfidence: _ic, ...c }) => c),
    disposalCategory: category?.name ?? best.rule.categoryId,
    disposalCategoryJa: category?.nameJa ?? best.rule.categoryId,
    disposalCategoryId: best.rule.categoryId,
    categoryColor: category?.color ?? "#6b7280",
    preparationSteps: best.rule.preparationSteps,
    preparationStepsJa: best.rule.preparationStepsJa,
    specialNotes: best.rule.specialNotes,
    specialNotesJa: best.rule.specialNotesJa,
    confidenceScore: best.confidence,
    summaryEn: buildSummaryEn(best.rule, category?.name ?? best.rule.categoryId, municipality.name),
    summaryJa: buildSummaryJa(best.rule, category?.nameJa ?? best.rule.categoryId, municipality.nameJa),
    fallbackGuidance: municipality.fallbackGuidance,
    processingMode: "mock",
    collectionDay,
    collectionDayJa: collectionDay,
  };
}

function buildFallbackResult(
  itemName: string,
  municipality: MunicipalityProfile,
): ClassificationResult {
  return {
    municipality: municipality.name,
    itemName,
    normalizedItem: normalize(itemName),
    topCandidates: [],
    disposalCategory: "Unknown",
    disposalCategoryJa: "不明",
    disposalCategoryId: "unknown",
    categoryColor: "#9ca3af",
    preparationSteps: [],
    preparationStepsJa: [],
    specialNotes: [`Could not identify "${itemName}" in the ${municipality.name} rules database.`],
    specialNotesJa: [`「${itemName}」を${municipality.nameJa}のルールデータベースで特定できませんでした。`],
    confidenceScore: 0,
    summaryEn: `We couldn't confidently classify "${itemName}" for ${municipality.name}. Please check the municipality website or call the hotline: ${municipality.hotline}.`,
    summaryJa: `「${itemName}」を${municipality.nameJa}で分類できませんでした。自治体のウェブサイトを確認するか、${municipality.hotline}にお電話ください。`,
    fallbackGuidance: municipality.fallbackGuidance,
    processingMode: "fallback",
  };
}

function buildSummaryEn(
  rule: ItemRule,
  categoryName: string,
  municipalityName: string,
): string {
  const steps =
    rule.preparationSteps.length > 0
      ? ` Before disposal: ${rule.preparationSteps.slice(0, 2).join("; ")}.`
      : "";
  return `"${rule.itemName}" should be disposed as ${categoryName} in ${municipalityName}.${steps}`;
}

function buildSummaryJa(
  rule: ItemRule,
  categoryNameJa: string,
  municipalityNameJa: string,
): string {
  const steps =
    rule.preparationStepsJa.length > 0
      ? `捨てる前に：${rule.preparationStepsJa.slice(0, 2).join("、")}。`
      : "";
  return `「${rule.itemNameJa}」は${municipalityNameJa}では${categoryNameJa}として処分します。${steps}`;
}

/**
 * Mock image candidate generation for items when no vision API is available.
 * Returns plausible image candidates based on visual cues (mock).
 */
export function generateMockImageCandidates(
  _imageBase64: string,
): Array<{ label: string; confidence: number }> {
  // In mock mode, we return a plausible set of generic household item candidates.
  // A real implementation would call Gemini Vision or another image classification API here.
  // The rules engine then matches these candidates deterministically.
  return [
    { label: "plastic bottle", confidence: 0.72 },
    { label: "beverage container", confidence: 0.65 },
    { label: "PET bottle", confidence: 0.61 },
  ];
}

/**
 * Search items by name within a municipality's rules.
 */
export function searchItems(
  query: string,
  municipalityId: string,
  limit = 10,
): Array<{
  itemName: string;
  itemNameJa: string;
  disposalCategory: string;
  disposalCategoryJa: string;
  disposalCategoryId: string;
  categoryColor: string;
  confidenceScore: number;
}> {
  const municipality = getMunicipalityById(municipalityId);
  if (!municipality) return [];

  const results: Array<{
    itemName: string;
    itemNameJa: string;
    disposalCategory: string;
    disposalCategoryJa: string;
    disposalCategoryId: string;
    categoryColor: string;
    confidenceScore: number;
  }> = [];

  for (const rule of municipality.items) {
    const { score } = computeSynonymConfidence(query, rule.itemName, rule.synonyms, rule.synonymsJa);
    if (score >= 0.25) {
      const category = municipality.categories.find((c) => c.id === rule.categoryId);
      results.push({
        itemName: rule.itemName,
        itemNameJa: rule.itemNameJa,
        disposalCategory: category?.name ?? rule.categoryId,
        disposalCategoryJa: category?.nameJa ?? rule.categoryId,
        disposalCategoryId: rule.categoryId,
        categoryColor: category?.color ?? "#6b7280",
        confidenceScore: score,
      });
    }
  }

  results.sort((a, b) => b.confidenceScore - a.confidenceScore);
  return results.slice(0, limit);
}
