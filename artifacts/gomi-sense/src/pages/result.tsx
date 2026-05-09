import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import { ArrowLeft, CheckCircle2, AlertTriangle, CalendarDays, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/category-badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGetMunicipalityById, getGetMunicipalityByIdQueryKey } from "@workspace/api-client-react";

export default function Result() {
  const [, setLocation] = useLocation();
  const { lastResult, language, municipalityId } = useAppStore();

  const { data: municipality } = useGetMunicipalityById(municipalityId || "", {
    query: { enabled: !!municipalityId, queryKey: getGetMunicipalityByIdQueryKey(municipalityId || "") }
  });

  useEffect(() => {
    if (!lastResult) {
      setLocation("/");
    }
  }, [lastResult, setLocation]);

  if (!lastResult) return null;

  const confidenceScore = lastResult.confidenceScore * 100;
  const isLowConfidence = lastResult.confidenceScore < 0.3;
  const steps = language === "ja" ? lastResult.preparationStepsJa : lastResult.preparationSteps;
  const notes = language === "ja" ? lastResult.specialNotesJa : lastResult.specialNotes;

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/scan")} className="px-0 hover:bg-transparent">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === "ja" ? "別のアイテムを調べる" : "Search another item"}
        </Button>
        {(lastResult.processingMode === "live" && confidenceScore < 100) && (
          <div className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">
            AI Analysis
          </div>
        )}
      </div>

      {isLowConfidence && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive-foreground">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-base font-bold">
            {language === "ja" ? "確信度が低いです" : "Low Confidence"}
          </AlertTitle>
          <AlertDescription className="mt-2 text-sm leading-relaxed">
            {language === "ja" 
              ? (lastResult.fallbackGuidance || "詳細については自治体の公式サイトをご確認ください。") 
              : (lastResult.fallbackGuidance || "Please check the official municipality website for more information.")}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Result Card */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden relative">
        <div 
          className="h-3 w-full absolute top-0 left-0" 
          style={{ backgroundColor: lastResult.categoryColor }} 
        />
        
        <div className="p-6 pt-8 flex flex-col items-center text-center gap-4">
          <div className="text-muted-foreground text-sm font-medium">
            {language === "ja" ? "アイテム" : "Item"}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {lastResult.itemName}
          </h1>
          
          <div className="mt-2">
            <CategoryBadge 
              categoryEn={lastResult.disposalCategory}
              categoryJa={lastResult.disposalCategoryJa}
              color={lastResult.categoryColor}
              language={language}
              className="text-lg px-6 py-2"
            />
          </div>

          <p className="mt-4 text-base leading-relaxed max-w-sm">
            {language === "ja" ? lastResult.summaryJa : lastResult.summaryEn}
          </p>
        </div>

        {/* Confidence Meter - Only show if not 100% (to hide for perfect/known matches) */}
        {confidenceScore < 100 && (
          <div className="px-6 py-4 bg-muted/30 border-t flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
              <span>{language === "ja" ? "AI判定の自信度" : "AI Confidence"}</span>
              <span>{Math.round(confidenceScore)}%</span>
            </div>
            <Progress 
              value={confidenceScore} 
              className="h-2" 
              indicatorColor={
                confidenceScore > 80 ? "bg-green-500" : 
                confidenceScore > 40 ? "bg-yellow-500" : "bg-red-500"
              } 
            />
          </div>
        )}
      </div>

      {/* Collection Day Info */}
      {(lastResult.collectionDay || lastResult.collectionDayJa) && (
        <div className="bg-secondary/50 rounded-xl p-4 flex items-center gap-4 border border-secondary">
          <div className="bg-background rounded-full p-3 shadow-sm text-primary">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground font-medium">
              {language === "ja" ? "収集日" : "Collection Day"}
            </span>
            <span className="font-bold text-lg">
              {language === "ja" ? (lastResult.collectionDayJa || lastResult.collectionDay) : lastResult.collectionDay}
            </span>
          </div>
        </div>
      )}

      {/* Preparation Steps */}
      {steps && steps.length > 0 && (
        <div className="flex flex-col gap-3 mt-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            {language === "ja" ? "捨て方の手順" : "How to prepare"}
          </h2>
          <ul className="flex flex-col gap-3">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 bg-card border rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-center bg-primary/10 text-primary font-bold rounded-full w-6 h-6 shrink-0 text-sm mt-0.5">
                  {i + 1}
                </div>
                <span className="text-base leading-snug">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Special Notes */}
      {notes && notes.length > 0 && (
        <div className="flex flex-col gap-3 mt-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Info className="h-5 w-5 text-accent-foreground" />
            {language === "ja" ? "注意事項" : "Special Notes"}
          </h2>
          <div className="bg-accent/20 border border-accent/30 rounded-xl p-5 flex flex-col gap-3">
            {notes.map((note, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground/90">
                • {note}
              </p>
            ))}
          </div>
        </div>
      )}

      {municipality?.website && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <a href={municipality.website} target="_blank" rel="noopener noreferrer">
              {language === "ja" ? "自治体の公式サイトを確認" : "Official Municipality Website"}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
