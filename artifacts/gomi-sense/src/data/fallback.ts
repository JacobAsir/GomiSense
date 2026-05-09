/**
 * FALLBACK DATA
 * These are used to populate the UI instantly while the backend is waking up.
 * This prevents the "No municipalities found" error during Render cold starts.
 */

export const FALLBACK_MUNICIPALITIES = [
  { id: "shibuya", name: "Shibuya", nameJa: "渋谷区", prefecture: "Tokyo" },
  { id: "osaka", name: "Osaka City", nameJa: "大阪市", prefecture: "Osaka" },
  { id: "kyoto", name: "Kyoto City", nameJa: "京都市", prefecture: "Kyoto" },
  { id: "yokohama", name: "Yokohama City", nameJa: "横浜市", prefecture: "Kanagawa" },
  { id: "fukuoka", name: "Fukuoka City", nameJa: "福岡市", prefecture: "Fukuoka" },
];

export const FALLBACK_COMMON_ITEMS = [
  { itemName: "Newspaper", itemNameJa: "新聞紙", disposalCategory: "Paper / Cardboard" },
  { itemName: "PET bottle", itemNameJa: "ペットボトル", disposalCategory: "PET Bottles" },
  { itemName: "Battery", itemNameJa: "電池", disposalCategory: "Hazardous / Small Electronics" },
  { itemName: "Cardboard", itemNameJa: "段ボール", disposalCategory: "Paper / Cardboard" },
  { itemName: "Aluminum Can", itemNameJa: "アルミ缶", disposalCategory: "Cans / Metals" },
  { itemName: "Glass Bottle", itemNameJa: "ガラス瓶", disposalCategory: "Glass Bottles" },
];
