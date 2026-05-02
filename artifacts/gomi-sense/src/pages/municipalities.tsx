import { useAppStore } from "@/lib/store";
import { useGetMunicipalities } from "@workspace/api-client-react";
import { MapPin, ExternalLink, Phone, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Municipalities() {
  const { language, municipalityId, setMunicipalityId } = useAppStore();
  const { data, isLoading } = useGetMunicipalities();

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-500">
      <section className="pt-6 pb-2">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {language === "ja" ? "対応エリア" : "Supported Cities"}
        </h1>
        <p className="text-muted-foreground">
          {language === "ja" 
            ? "現在GomiSenseが対応している自治体の一覧です。順次追加予定です。" 
            : "Currently supported municipalities. We are constantly adding more cities to our database."}
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))
        ) : (
          data?.municipalities?.map((municipality) => {
            const isSelected = municipalityId === municipality.id;
            
            return (
              <Card 
                key={municipality.id} 
                className={`overflow-hidden transition-all ${isSelected ? 'border-primary shadow-md ring-1 ring-primary/20' : 'hover:border-primary/40'}`}
              >
                <div className={`h-1 w-full ${isSelected ? 'bg-primary' : 'bg-muted'}`} />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Building2 className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      {language === "ja" ? municipality.nameJa : municipality.name}
                    </CardTitle>
                    {isSelected && (
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md">
                        {language === "ja" ? "選択中" : "Selected"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === "ja" ? municipality.prefectureJa : municipality.prefecture}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  
                  <div className="flex flex-wrap gap-2">
                    {municipality.website && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                        <a href={municipality.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1.5 h-3 w-3" />
                          {language === "ja" ? "公式サイト" : "Website"}
                        </a>
                      </Button>
                    )}
                    {municipality.hotline && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                        <a href={`tel:${municipality.hotline}`}>
                          <Phone className="mr-1.5 h-3 w-3" />
                          {municipality.hotline}
                        </a>
                      </Button>
                    )}
                  </div>

                  {!isSelected && (
                    <Button 
                      variant="secondary" 
                      className="w-full mt-2" 
                      onClick={() => setMunicipalityId(municipality.id)}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      {language === "ja" ? "この自治体を選択" : "Select this city"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {!isLoading && data?.municipalities?.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-dashed">
          <p className="text-muted-foreground">
            {language === "ja" ? "自治体データが見つかりませんでした。" : "No municipality data found."}
          </p>
        </div>
      )}
    </div>
  );
}
