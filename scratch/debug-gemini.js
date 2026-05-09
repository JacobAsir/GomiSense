const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.0-flash";
const IMAGE_PATH = "C:\\Users\\Jacob\\.gemini\\antigravity\\brain\\7ea5b071-0be9-4d02-a2c2-60d3d9799a1a\\.tempmediaStorage\\media_7ea5b071-0be9-4d02-a2c2-60d3d9799a1a_1778325006170.png";

async function runTest() {
  if (!API_KEY) {
    console.error("❌ Error: GEMINI_API_KEY is missing from .env");
    return;
  }

  console.log(`\n🔍 TESTING GEMINI API...`);
  console.log(`🤖 Model: ${MODEL}`);
  
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL });

  try {
    const imageData = fs.readFileSync(IMAGE_PATH);
    const base64Image = imageData.toString("base64");

    const result = await model.generateContent([
      "Identify this item for waste sorting.",
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/png"
        }
      }
    ]);

    const response = await result.response;
    console.log("\n✅ SUCCESS! Gemini is working!");
    console.log("----------------------------");
    console.log(response.text());
    console.log("----------------------------\n");
  } catch (error) {
    console.error("\n❌ GOOGLE API ERROR:");
    console.error("Status Code:", error.status);
    console.error("Message:", error.message);
    if (error.response) {
      console.error("Details:", JSON.stringify(error.response, null, 2));
    }
    console.log("\n----------------------------\n");
  }
}

runTest();
