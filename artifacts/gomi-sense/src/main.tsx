import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Configure API base URL for production (Render)
if (import.meta.env.VITE_API_URL) {
  let apiUrl = import.meta.env.VITE_API_URL;
  // If Render gives us just the host, add the protocol
  if (!apiUrl.startsWith("http")) {
    apiUrl = `https://${apiUrl}`;
  }
  setBaseUrl(apiUrl);
}

createRoot(document.getElementById("root")!).render(<App />);
