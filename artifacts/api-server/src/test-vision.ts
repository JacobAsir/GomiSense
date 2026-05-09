
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { identifyImageItem } from "./services/gemini.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.join(__dirname, "../../../.env") });

async function test() {
  console.log("Testing Gemini Vision API...");
  console.log("Model:", process.env.GEMINI_MODEL || "gemini-2.0-flash");
  
  // Simple 1x1 red dot base64
  const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const mimeType = "image/png";

  try {
    const result = await identifyImageItem(base64Image, mimeType);
    console.log("Success!");
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("Failed!");
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

test();
