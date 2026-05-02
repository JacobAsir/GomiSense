import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { language, setLanguage } = useAppStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "ja" : "en")}
      className="font-medium px-2 py-1 h-8"
    >
      {language === "en" ? "EN/日本語" : "日本語/EN"}
    </Button>
  );
}
