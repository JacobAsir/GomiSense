import { useAppStore } from "@/lib/store";
import { Link, useLocation } from "wouter";
import { MunicipalitySelector } from "@/components/municipality-selector";
import { useGetDemoSamples } from "@workspace/api-client-react";
import { Search, Camera, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { municipalityId, language } = useAppStore();
  const [, setLocation] = useLocation();

  const { data: demoData, isLoading: demoLoading } = useGetDemoSamples({
    municipalityId: municipalityId || undefined,
  });

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

      {/* Actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          className="h-20 text-lg rounded-xl shadow-sm gap-3 justify-start px-6 bg-primary hover:bg-primary/90 hover:-translate-y-1 transition-all"
          disabled={!municipalityId}
          onClick={() => setLocation("/scan")}
        >
          <Search className="h-6 w-6" />
          <div className="flex flex-col items-start">
            <span className="font-bold">{language === "ja" ? "テキスト検索" : "Text Search"}</span>
            <span className="text-xs font-normal opacity-80">
              {language === "ja" ? "名前で調べる" : "Type item name"}
            </span>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-20 text-lg rounded-xl shadow-sm gap-3 justify-start px-6 border-primary/20 hover:border-primary/50 hover:bg-secondary/50 hover:-translate-y-1 transition-all"
          disabled={!municipalityId}
          onClick={() => setLocation("/scan?mode=camera")}
        >
          <Camera className="h-6 w-6 text-primary" />
          <div className="flex flex-col items-start text-foreground">
            <span className="font-bold">{language === "ja" ? "カメラで検索" : "Camera Scan"}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {language === "ja" ? "写真を撮って判定" : "Take a photo"}
            </span>
          </div>
        </Button>
      </section>

      {/* Demo Samples */}
      <section className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            {language === "ja" ? "よく調べられるアイテム" : "Commonly Searched"}
          </h2>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {demoLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl w-full" />
            ))
          ) : demoData?.samples?.slice(0, 4).map((sample, i) => (
            <Card 
              key={i} 
              className={`cursor-pointer transition-all hover:border-primary/40 hover:shadow-md ${!municipalityId ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => {
                if (municipalityId) {
                  setLocation(`/scan?q=${encodeURIComponent(sample.itemName)}`);
                }
              }}
            >
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="font-medium text-base mb-2">
                  {language === "ja" ? sample.itemNameJa : sample.itemName}
                </div>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-xs text-muted-foreground truncate mr-2">
                    {language === "ja" ? sample.categoryJa : sample.category}
                  </span>
                  <ArrowRight className="h-4 w-4 text-primary shrink-0 opacity-50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

    </div>
  );
}
