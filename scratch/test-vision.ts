import { GoogleGenAI, SchemaType } from "@google/generai";
import * as fs from "fs";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.0-flash";
const IMAGE_PATH = "C:\\Users\\Jacob\\.gemini\\antigravity\\brain\\7ea5b071-0be9-4d02-a2c2-60d3d9799a1a\\.tempmediaStorage\\media_7ea5b071-0be9-4d02-a2c2-60d3d9799a1a_1778325006170.png";

async function runTest() {
  if (!API_KEY) {
    console.error("❌ Error: GEMINI_API_KEY not found in .env");
    return;
  }

  console.log(`\n🔍 Testing Gemini 2.0 Flash Vision...`);
  console.log(`📂 Image: ${IMAGE_PATH}`);
  
  const genAI = new GoogleGenAI(API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const imageData = fs.readFileSync(IMAGE_PATH);
  const base64Image = imageData.toString("base64");

  const prompt = "Identify this household item and suggest how to dispose of it in a Japanese municipality (e.g., PET bottle, burnable, etc.). Return a JSON with 'label' and 'confidence'.";

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/png"
        }
      }
    ]);

    const response = await result.response;
    console.log("\n✅ API Response Received!");
    console.log("----------------------------");
    console.log(response.text());
    console.log("----------------------------\n");
  } catch (error: any) {
    console.error("\n❌ API Test Failed!");
    console.error(error.message);
  }
}

runTest();
