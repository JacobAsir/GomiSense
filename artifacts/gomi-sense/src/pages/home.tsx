import { useAppStore } from "@/lib/store";
import { Link, useLocation } from "wouter";
import { MunicipalitySelector } from "@/components/municipality-selector";
import { useGetDemoSamples, useClassifyItem, type ClassifyItemRequestLanguage } from "@workspace/api-client-react";
import { Search, Camera, ArrowRight, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VoiceInput } from "@/components/voice-input";
import { FALLBACK_COMMON_ITEMS } from "@/data/fallback";
import { useState } from "react";

export default function Home() {
  const { municipalityId, language, setLastResult } = useAppStore();
  const [, setLocation] = useLocation();
  const [searchValue, setSearchValue] = useState("");

  const { data: demoData, isLoading: demoLoading } = useGetDemoSamples({
    municipalityId: municipalityId || undefined,
  });

  const classifyMutation = useClassifyItem();
  const isClassifying = classifyMutation.isPending;

  const handleSearch = (value: string) => {
    if (!municipalityId || !value.trim() || isClassifying) return;
    
    classifyMutation.mutate(
      {
        data: {
          municipalityId,
          itemName: value.trim(),
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

  return (
    <div className="flex flex-col gap-8 pb-8 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <section className="text-center pt-8 pb-4">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-3">
          {language === "ja" ? "迷わない、ゴミ出し。" : "Sort Waste with Confidence."}
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          {language === "ja" 
            ? "アイテムを入力するか写真を撮るだけで、お住まいの地域の分別ルールをすぐにお答えします。" 
            : "Scan or search any item to instantly see local disposal rules for your municipality."}
        </p>
      </section>

      {/* Municipality Setup */}
      <section className="bg-card border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-primary">
          <MapPin className="h-4 w-4" />
          <h2>{language === "ja" ? "お住まいの自治体" : "Your Municipality"}</h2>
        </div>
        <MunicipalitySelector />
        
        {!municipalityId && (
          <p className="text-sm text-destructive mt-3 flex items-center gap-1">
            {language === "ja" ? "検索する前に自治体を選択してください。" : "Please select a municipality before searching."}
          </p>
        )}
      </section>

      {/* Unified Search & Actions */}
      <section className="flex flex-col gap-4">
        <div className="flex gap-2 relative">
          <div className="relative flex-1">
            {isClassifying ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            )}
            <input
              type="text"
              placeholder={isClassifying ? (language === "ja" ? "分析中..." : "Analyzing...") : (language === "ja" ? "何を捨てますか？" : "What do you want to dispose of?")}
              className="w-full pl-10 pr-12 h-14 text-lg rounded-2xl border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all disabled:opacity-50"
              disabled={!municipalityId || isClassifying}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(searchValue);
                }
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <VoiceInput 
                onResult={(text) => {
                  setSearchValue(text);
                  handleSearch(text);
                }}
                disabled={!municipalityId || isClassifying}
              />
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="h-16 text-lg rounded-2xl shadow-sm gap-3 border-primary/20 hover:border-primary/50 hover:bg-secondary/50 transition-all w-full"
          disabled={!municipalityId || isClassifying}
          onClick={() => setLocation("/scan")}
        >
          <Camera className="h-6 w-6 text-primary" />
          <span className="font-bold">{language === "ja" ? "カメラで判定" : "Scan with Camera"}</span>
        </Button>
      </section>

      {/* Demo Samples */}
      <section className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            {language === "ja" ? "よく調べられるアイテム" : "Commonly Searched"}
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary/80 h-auto py-1 px-2"
            disabled={!municipalityId}
            onClick={() => setLocation("/directory")}
          >
            {language === "ja" ? "すべて見る" : "View All"}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {(() => {
            const samples = (demoData?.samples && demoData.samples.length > 0) 
              ? demoData.samples.slice(0, 4)
              : FALLBACK_COMMON_ITEMS.slice(0, 4).map(item => ({
                  ...item,
                  category: item.disposalCategory,
                  categoryJa: item.disposalCategory // Map to what the card expects
                }));

            return samples.map((sample, i) => (
              <Card 
                key={i} 
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/40 hover:shadow-md",
                  (!municipalityId || isClassifying) && "opacity-50 pointer-events-none"
                )}
                onClick={() => {
                  if (municipalityId) {
                    setSearchValue(sample.itemName);
                    handleSearch(sample.itemName);
                  }
                }}
              >
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="font-medium text-base mb-2">
                    {language === "ja" ? (sample as any).itemNameJa : sample.itemName}
                  </div>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-xs text-muted-foreground truncate mr-2">
                      {language === "ja" ? (sample as any).categoryJa || (sample as any).category : sample.category}
                    </span>
                    <ArrowRight className="h-4 w-4 text-primary shrink-0 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            ));
          })()}
        </div>
      </section>

    </div>
  );
}
