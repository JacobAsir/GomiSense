import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import { ArrowLeft, Search, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryBadge } from "@/components/category-badge";
import { useGetDirectory, useClassifyItem, type ClassifyItemRequestLanguage } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Directory() {
  const [, setLocation] = useLocation();
  const { language, municipalityId, setLastResult } = useAppStore();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [classifyingItem, setClassifyingItem] = useState<string | null>(null);

  const classifyMutation = useClassifyItem();

  const handleItemClick = (itemName: string) => {
    if (!municipalityId || classifyMutation.isPending) return;
    setClassifyingItem(itemName);
    classifyMutation.mutate(
      {
        data: {
          municipalityId,
          itemName,
          language: language as ClassifyItemRequestLanguage,
        },
      },
      {
        onSuccess: (result) => {
          setLastResult(result);
          setLocation("/result");
        },
        onSettled: () => {
          setClassifyingItem(null);
        },
      }
    );
  };

  const { data, isLoading } = useGetDirectory({
    municipalityId: municipalityId || "",
  }, {
    query: { enabled: !!municipalityId }
  });

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    
    return data.items.filter(item => {
      const matchesSearch = 
        item.itemName.toLowerCase().includes(search.toLowerCase()) ||
        item.itemNameJa.includes(search);
      
      const matchesCategory = !selectedCategory || item.disposalCategoryId === selectedCategory;
      
      return matchesSearch && matchesCategory;
    }).sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [data, search, selectedCategory]);

  const categories = useMemo(() => {
    if (!data?.items) return [];
    const unique = new Map();
    data.items.forEach(item => {
      unique.set(item.disposalCategoryId, {
        id: item.disposalCategoryId,
        name: item.disposalCategory,
        nameJa: item.disposalCategoryJa,
        color: item.categoryColor
      });
    });
    return Array.from(unique.values());
  }, [data]);

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md py-4 z-10 -mx-4 px-4 border-b">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="px-0 hover:bg-transparent">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === "ja" ? "ホームに戻る" : "Back to Home"}
        </Button>
        <h1 className="text-lg font-bold">
          {language === "ja" ? "品目別一覧" : "Item Directory"}
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={language === "ja" ? "アイテム名で検索..." : "Search items..."}
            className="pl-10 h-12 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
          <Button 
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            className="rounded-full whitespace-nowrap"
            onClick={() => setSelectedCategory(null)}
          >
            {language === "ja" ? "すべて" : "All"}
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              className="rounded-full whitespace-nowrap"
              onClick={() => setSelectedCategory(cat.id)}
              style={selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}
            >
              {language === "ja" ? cat.nameJa : cat.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          Array(10).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item, i) => {
            const isThisClassifying = classifyingItem === item.itemName;
            return (
              <div 
                key={i}
                className="flex items-center justify-between p-4 bg-card border rounded-xl hover:border-primary/40 transition-colors cursor-pointer group shadow-sm disabled:opacity-50"
                onClick={() => handleItemClick(item.itemName)}
                aria-disabled={classifyMutation.isPending}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-base group-hover:text-primary transition-colors">
                    {language === "ja" ? item.itemNameJa : item.itemName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {language === "ja" ? item.itemName : item.itemNameJa}
                  </span>
                </div>
                {isThisClassifying ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                ) : (
                  <CategoryBadge 
                    categoryEn={item.disposalCategory}
                    categoryJa={item.disposalCategoryJa}
                    color={item.categoryColor}
                    language={language}
                    className="text-[10px] uppercase font-bold"
                  />
                )}
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="bg-muted rounded-full p-6 text-muted-foreground">
              <Filter className="h-12 w-12" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-lg">{language === "ja" ? "見つかりませんでした" : "No items found"}</h3>
              <p className="text-sm text-muted-foreground max-w-[240px]">
                {language === "ja" 
                  ? "検索条件を変えて試すか、カメラ検索をご利用ください。" 
                  : "Try a different search term or use the Camera Scan feature."}
              </p>
            </div>
            <Button onClick={() => setLocation("/scan?mode=camera")} className="mt-2 rounded-full">
              {language === "ja" ? "カメラで検索" : "Use Camera Scan"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
