
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { identifyImageItem } from "./services/gemini.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../../.env") });

async function test() {
  console.log("Testing Gemini Vision API with a bottle image...");
  
  // A public image of a PET bottle
  const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Bottle_of_water.jpg/640px-Bottle_of_water.jpg";
  
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");
    const mimeType = "image/jpeg";

    const result = await identifyImageItem(base64Image, mimeType);
    console.log("Success!");
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("Failed!");
    console.error("Error:", error.message);
  }
}

test();
