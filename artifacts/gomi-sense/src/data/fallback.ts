/**
 * FALLBACK DATA
 * These are used to populate the UI instantly while the backend is waking up.
 * This prevents the "No municipalities found" error during Render cold starts.
 */

export const FALLBACK_MUNICIPALITIES = [
  { id: "tokyo-shibuya", name: "Shibuya", nameJa: "渋谷区", prefecture: "Tokyo", prefectureJa: "東京都" },
  { id: "osaka-city", name: "Osaka City", nameJa: "大阪市", prefecture: "Osaka", prefectureJa: "大阪府" },
  { id: "kyoto-city", name: "Kyoto City", nameJa: "京都市", prefecture: "Kyoto", prefectureJa: "京都府" },
  { id: "yokohama-city", name: "Yokohama City", nameJa: "横浜市", prefecture: "Kanagawa", prefectureJa: "神奈川県" },
  { id: "fukuoka-city", name: "Fukuoka City", nameJa: "福岡市", prefecture: "Fukuoka", prefectureJa: "福岡県" },
  { id: "sapporo-city", name: "Sapporo City", nameJa: "札幌市", prefecture: "Hokkaido", prefectureJa: "北海道" },
  { id: "nagoya-city", name: "Nagoya City", nameJa: "名古屋市", prefecture: "Aichi", prefectureJa: "愛知県" },
];

export const FALLBACK_COMMON_ITEMS = [
  { itemName: "PET bottle", itemNameJa: "ペットボトル", disposalCategory: "PET Bottles", categoryJa: "ペットボトル" },
  { itemName: "Cardboard", itemNameJa: "段ボール", disposalCategory: "Paper / Cardboard", categoryJa: "古紙・段ボール" },
  { itemName: "Aluminum Can", itemNameJa: "アルミ缶", disposalCategory: "Cans / Metals", categoryJa: "かん・金属" },
  { itemName: "Battery", itemNameJa: "電池", disposalCategory: "Hazardous", categoryJa: "有害ゴミ" },
  { itemName: "Newspaper", itemNameJa: "新聞紙", disposalCategory: "Paper / Cardboard", categoryJa: "古紙" },
  { itemName: "Glass Bottle", itemNameJa: "ガラス瓶", disposalCategory: "Glass Bottles", categoryJa: "びん" },
  { itemName: "Smartphone", itemNameJa: "スマートフォン", disposalCategory: "Electronics", categoryJa: "小型家電" },
  { itemName: "Sofa", itemNameJa: "ソファ", disposalCategory: "Oversized Waste", categoryJa: "粗大ゴミ" },
];

