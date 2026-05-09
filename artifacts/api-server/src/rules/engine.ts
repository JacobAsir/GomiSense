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
  processingMode: "live" | "fallback";
  collectionDay?: string;
  collectionDayJa?: string;
}

export interface ItemLabelCandidate {
  label: string;
  confidence: number;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeSynonymConfidence(
  query: string,
  itemName: string,
  synonyms: string[],
  synonymsJa: string[],
): { score: number; reason: string } {
  const q = normalize(query);
  const allTerms = [normalize(itemName), ...synonyms.map(normalize), ...synonymsJa.map(normalize)];

  for (const term of allTerms) {
    if (q === term) {
      return { score: 1.0, reason: `Exact match: "${term}"` };
    }
  }

  for (const term of allTerms) {
    if (term.length > 3 && q.includes(term)) {
      return { score: 0.9, reason: `Query contains synonym: "${term}"` };
    }
    if (term.length > 3 && term.includes(q)) {
      return { score: 0.85, reason: `Synonym contains query: "${term}"` };
    }
  }

  const queryTokens = q.split(" ").filter((token) => token.length > 1);
  let bestScore = 0;
  let bestReason = "";

  for (const term of allTerms) {
    const termTokens = term.split(" ").filter((token) => token.length > 1);
    if (termTokens.length === 0 || queryTokens.length === 0) continue;

    const matchingTokens = queryTokens.filter((queryToken) =>
      termTokens.some(
        (termToken) =>
          termToken === queryToken ||
          termToken.startsWith(queryToken) ||
          queryToken.startsWith(termToken),
      ),
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

function findCandidates(
  labels: ItemLabelCandidate[],
  municipality: MunicipalityProfile,
  source: string,
): Array<CandidateResult & { rule: ItemRule; aiConfidence: number }> {
  const matches: Array<CandidateResult & { rule: ItemRule; aiConfidence: number }> = [];

  for (const labelCandidate of labels) {
    for (const rule of municipality.items) {
      const { score, reason } = computeSynonymConfidence(
        labelCandidate.label,
        rule.itemName,
        rule.synonyms,
        rule.synonymsJa,
      );

      if (score > 0.2) {
        const category = municipality.categories.find((item) => item.id === rule.categoryId);
        matches.push({
          itemName: rule.itemName,
          itemNameJa: rule.itemNameJa,
          confidence: score * labelCandidate.confidence,
          disposalCategory: category?.name ?? rule.categoryId,
          disposalCategoryJa: category?.nameJa ?? rule.categoryId,
          matchReason: `${source}: "${labelCandidate.label}" (${Math.round(labelCandidate.confidence * 100)}%) -> ${reason}`,
          rule,
          aiConfidence: labelCandidate.confidence,
        });
      }
    }
  }

  matches.sort((a, b) => b.confidence - a.confidence);
  return matches;
}

function dedupeTopCandidates(
  matches: Array<CandidateResult & { rule: ItemRule; aiConfidence: number }>,
): Array<CandidateResult & { rule: ItemRule; aiConfidence: number }> {
  const seen = new Set<string>();
  const topCandidates: Array<CandidateResult & { rule: ItemRule; aiConfidence: number }> = [];

  for (const match of matches) {
    if (seen.has(match.rule.itemName)) continue;
    seen.add(match.rule.itemName);
    topCandidates.push(match);
    if (topCandidates.length >= 3) break;
  }

  return topCandidates;
}

function buildResult(
  inputName: string,
  normalizedItem: string,
  municipality: MunicipalityProfile,
  topCandidates: Array<CandidateResult & { rule: ItemRule; aiConfidence?: number }>,
  processingMode: "live" | "fallback",
): ClassificationResult {
  const best = topCandidates[0];
  const category = municipality.categories.find((item) => item.id === best.rule.categoryId);
  const collectionDay = municipality.collectionDays[best.rule.categoryId];

  return {
    municipality: municipality.name,
    itemName: inputName,
    normalizedItem,
    topCandidates: topCandidates.map(({ rule: _rule, aiConfidence: _aiConfidence, ...candidate }) => candidate),
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
    processingMode,
    collectionDay,
    collectionDayJa: collectionDay,
  };
}

export function classifyItemText(
  itemName: string,
  municipalityId: string,
): ClassificationResult {
  const municipality = getMunicipalityById(municipalityId);

  if (!municipality) {
    throw new Error(`Municipality not found: ${municipalityId}`);
  }

  const matches = findCandidates([{ label: itemName, confidence: 1 }], municipality, "Local rules");
  const topCandidates = dedupeTopCandidates(matches);

  if (topCandidates.length === 0 || topCandidates[0].confidence < 0.3) {
    return buildFallbackResult(itemName, municipality);
  }

  return buildResult(itemName, normalize(itemName), municipality, topCandidates, "fallback");
}

export function classifyItemFromCandidates(
  itemCandidates: ItemLabelCandidate[],
  municipalityId: string,
  source = "AI",
): ClassificationResult {
  const municipality = getMunicipalityById(municipalityId);

  if (!municipality) {
    throw new Error(`Municipality not found: ${municipalityId}`);
  }

  const matches = findCandidates(itemCandidates, municipality, source);
  const topCandidates = dedupeTopCandidates(matches);

  if (topCandidates.length === 0 || topCandidates[0].confidence < 0.15) {
    const primaryLabel = itemCandidates[0]?.label ?? "unknown item";
    return buildFallbackResult(primaryLabel, municipality);
  }

  const primaryLabel = itemCandidates[0]?.label ?? topCandidates[0].rule.itemName;
  return buildResult(primaryLabel, normalize(primaryLabel), municipality, topCandidates, "live");
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
    disposalCategoryJa: "Unknown",
    disposalCategoryId: "unknown",
    categoryColor: "#9ca3af",
    preparationSteps: [],
    preparationStepsJa: [],
    specialNotes: [`Could not identify "${itemName}" in the ${municipality.name} rules data.`],
    specialNotesJa: [`Could not identify "${itemName}" in the ${municipality.name} rules data.`],
    confidenceScore: 0,
    summaryEn: `We could not confidently classify "${itemName}" for ${municipality.name}. Please check the municipality website for more information.`,
    summaryJa: `We could not confidently classify "${itemName}" for ${municipality.name}. 詳細については自治体の公式サイトをご確認ください。`,
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
      ? ` Before disposal: ${rule.preparationStepsJa.slice(0, 2).join("; ")}.`
      : "";
  return `"${rule.itemNameJa}" should be disposed as ${categoryNameJa} in ${municipalityNameJa}.${steps}`;
}

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
      const category = municipality.categories.find((item) => item.id === rule.categoryId);
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
export function getMunicipalityDirectory(
  municipalityId: string,
): Array<{
  itemName: string;
  itemNameJa: string;
  disposalCategory: string;
  disposalCategoryJa: string;
  disposalCategoryId: string;
  categoryColor: string;
}> {
  const municipality = getMunicipalityById(municipalityId);
  if (!municipality) return [];

  return municipality.items.map((rule) => {
    const category = municipality.categories.find((item) => item.id === rule.categoryId);
    return {
      itemName: rule.itemName,
      itemNameJa: rule.itemNameJa,
      disposalCategory: category?.name ?? rule.categoryId,
      disposalCategoryJa: category?.nameJa ?? rule.categoryId,
      disposalCategoryId: rule.categoryId,
      categoryColor: category?.color ?? "#6b7280",
    };
  });
}
