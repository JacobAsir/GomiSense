import { useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import { 
  useClassifyImage,
  type ClassifyImageRequestLanguage
} from "@workspace/api-client-react";
import { Loader2, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/camera-capture";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Scan() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { municipalityId, language, setLastResult } = useAppStore();
  
  // Redirect to home if no municipality selected
  useEffect(() => {
    if (!municipalityId) {
      setLocation("/");
    }
  }, [municipalityId, setLocation]);

  const classifyImageMutation = useClassifyImage();
  const isClassifying = classifyImageMutation.isPending;

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
        },
        onError: (err: any) => {
          console.error("Classification error:", err);
          toast({
            title: language === "ja" ? "判定に失敗しました" : "Classification failed",
            description: err?.body?.error || err?.message || (language === "ja" ? "もう一度お試しください" : "Please try again"),
            variant: "destructive",
          });
        }
      }
    );
  };

  if (!municipalityId) return null;

  return (
    <div className="flex flex-col gap-6 pb-8 h-full min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="px-0 hover:bg-transparent">
          <ArrowLeft className="h-5 w-5 mr-2" />
          {language === "ja" ? "戻る" : "Back"}
        </Button>
        <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          {language === "ja" ? "カメラ判定" : "Camera Vision"}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        {/* Camera Component */}
        <CameraCapture onCapture={handleClassifyImage} disabled={isClassifying} />
        
        {/* Loading State */}
        {isClassifying && (
          <div className="flex flex-col items-center justify-center p-8 bg-card rounded-2xl border border-primary/10 shadow-sm animate-pulse">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="font-bold text-lg">
              {language === "ja" ? "画像を分析中..." : "Analyzing image..."}
            </p>
            <p className="text-sm text-muted-foreground mt-2 text-center max-w-[200px]">
              {language === "ja" ? "自治体のルールと照らし合わせています" : "Checking against municipality rules"}
            </p>
          </div>
        )}

        {/* Fallback to Text */}
        {!isClassifying && (
          <div className="mt-auto py-8 text-center">
            <Button 
              variant="link" 
              className="text-muted-foreground hover:text-primary transition-colors gap-2"
              onClick={() => setLocation("/")}
            >
              <Search className="h-4 w-4" />
              {language === "ja" ? "テキストで検索する" : "Search with text instead"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
