import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { ClassifyItemResponse } from "@workspace/api-client-react";

type Language = "en" | "ja";

interface AppState {
  municipalityId: string | null;
  setMunicipalityId: (id: string | null) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  lastResult: ClassifyItemResponse | null;
  setLastResult: (result: ClassifyItemResponse | null) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [municipalityId, setMunicipalityId] = useState<string | null>(() => {
    return localStorage.getItem("gomi_municipality_id") || null;
  });
  
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("gomi_language") as Language) || "en";
  });

  const [lastResult, setLastResult] = useState<ClassifyItemResponse | null>(null);

  useEffect(() => {
    if (municipalityId) {
      localStorage.setItem("gomi_municipality_id", municipalityId);
    } else {
      localStorage.removeItem("gomi_municipality_id");
    }
  }, [municipalityId]);

  useEffect(() => {
    localStorage.setItem("gomi_language", language);
  }, [language]);

  return (
    <AppContext.Provider
      value={{
        municipalityId,
        setMunicipalityId,
        language,
        setLanguage,
        lastResult,
        setLastResult,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppStore must be used within an AppProvider");
  }
  return context;
}
