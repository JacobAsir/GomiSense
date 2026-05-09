import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAppStore } from "@/lib/store";
import { useDebounce } from "@/hooks/use-debounce";
import { 
  useSearchItems, 
  getSearchItemsQueryKey, 
  useClassifyItem, 
  useClassifyImage,
  type ClassifyItemRequestLanguage,
  type ClassifyImageRequestLanguage
} from "@workspace/api-client-react";
import { Search, Loader2, ArrowLeft, Trash2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/camera-capture";
import { VoiceInput } from "@/components/voice-input";
import { CategoryBadge } from "@/components/category-badge";

export default function Scan() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const initialMode = searchParams.get("mode") === "camera" ? "camera" : "text";
  const initialQ = searchParams.get("q") || "";
  
  const { municipalityId, language, setLastResult } = useAppStore();
  
  const [mode, setMode] = useState<"text" | "camera">(initialMode);
  const [query, setQuery] = useState(initialQ);
  const debouncedQuery = useDebounce(query, 300);

  // Redirect to home if no municipality selected
  useEffect(() => {
    if (!municipalityId) {
      setLocation("/");
    }
  }, [municipalityId, setLocation]);

  const { data: searchResults, isFetching: isSearching } = useSearchItems(
    { q: debouncedQuery, municipalityId: municipalityId! },
    { query: { enabled: !!municipalityId && debouncedQuery.length > 1, queryKey: getSearchItemsQueryKey({ q: debouncedQuery, municipalityId: municipalityId! }) } }
  );

  const classifyTextMutation = useClassifyItem();
  const classifyImageMutation = useClassifyImage();

  const isClassifying = classifyTextMutation.isPending || classifyImageMutation.isPending;

  // Handle immediate classification if q param was passed
  useEffect(() => {
    if (initialQ && municipalityId && !isClassifying && !classifyTextMutation.isSuccess) {
      handleClassifyText(initialQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClassifyText = (itemName: string) => {
    if (!municipalityId) return;
    
    classifyTextMutation.mutate(
      {
        data: {
          municipalityId,
          itemName,
          language: language as ClassifyItemRequestLanguage
        }
      },
      {
        onSuccess: (result) => {
          setLastResult(result);
          setLocation("/result");
        }
      }
    );
  };

  const handleClassifyImage = (base64: string, mimeType: string) => {
    if (!municipalityId) return;

    classifyImageMutation.mutate(
      {
        data: {
          municipalityId,
          imageBase64: base64,
          mimeType,
          language: language as ClassifyImageRequestLanguage
        }
      },
      {
        onSuccess: (result) => {
          setLastResult(result);
          setLocation("/result");
        }
      }
    );
  };

  if (!municipalityId) return null;

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="px-0 hover:bg-transparent">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === "ja" ? "戻る" : "Back"}
        </Button>
        <div className="bg-secondary text-secondary-foreground text-xs px-3 py-1 rounded-full font-medium">
          {mode === "text" ? (language === "ja" ? "テキスト検索" : "Text Search") : (language === "ja" ? "画像判定" : "Image Classification")}
        </div>
      </div>

      {mode === "text" ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 relative">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                autoFocus
                placeholder={language === "ja" ? "何を捨てますか？" : "What do you want to dispose of?"}
                className="pl-10 h-12 text-lg rounded-xl border-primary/20 focus-visible:ring-primary shadow-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) {
                    handleClassifyText(query.trim());
                  }
                }}
                disabled={isClassifying}
              />
            </div>
            <VoiceInput 
              onResult={(text) => {
                setQuery(text);
                handleClassifyText(text);
              }} 
              disabled={isClassifying}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {isSearching && (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                {language === "ja" ? "検索中..." : "Searching..."}
              </div>
            )}
            
            {!isSearching && searchResults?.results && searchResults.results.length > 0 && (
              <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                {searchResults.results.map((result, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleClassifyText(result.itemName)}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-base">
                        {language === "ja" ? result.itemNameJa : result.itemName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CategoryBadge 
                        categoryEn={result.disposalCategory}
                        categoryJa={result.disposalCategoryJa}
                        color={result.categoryColor}
                        language={language}
                      />
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && query.length > 1 && searchResults?.results?.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card border-dashed">
                <Trash2 className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">
                  {language === "ja" ? "見つかりませんでした" : "No exact matches found"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === "ja" ? "AIに判定させますか？" : "Would you like AI to classify it?"}
                </p>
                <Button 
                  className="mt-6 w-full max-w-xs" 
                  onClick={() => handleClassifyText(query)}
                  disabled={isClassifying}
                >
                  {isClassifying ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {language === "ja" ? "判定中..." : "Classifying..."}</>
                  ) : (
                    language === "ja" ? "AIで判定する" : "Ask AI"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <CameraCapture onCapture={handleClassifyImage} disabled={isClassifying} />
          
          {isClassifying && (
            <div className="flex flex-col items-center justify-center p-8 bg-card rounded-xl border">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="font-medium">
                {language === "ja" ? "画像を分析中..." : "Analyzing image..."}
              </p>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {language === "ja" ? "自治体のルールと照らし合わせています" : "Checking against municipality rules"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mode toggle at bottom */}
      {!isClassifying && (
        <div className="mt-auto pt-8 flex justify-center">
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setMode(mode === "text" ? "camera" : "text")}
          >
            {mode === "text" 
              ? (language === "ja" ? "カメラで判定する" : "Switch to Camera") 
              : (language === "ja" ? "テキストで検索する" : "Switch to Text Search")}
          </Button>
        </div>
      )}
    </div>
  );
}
