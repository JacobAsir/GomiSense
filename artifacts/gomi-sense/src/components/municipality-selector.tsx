import { useAppStore } from "@/lib/store";
import { useGetMunicipalities } from "@workspace/api-client-react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

export function MunicipalitySelector({ className }: { className?: string }) {
  const { municipalityId, setMunicipalityId, language } = useAppStore();
  const { data, isLoading } = useGetMunicipalities();
  const [open, setOpen] = useState(false);

  const municipalities = data?.municipalities || [];
  const selected = municipalities.find((m) => m.id === municipalityId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-card text-card-foreground border-input", className)}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">
              {selected
                ? language === "ja"
                  ? selected.nameJa
                  : selected.name
                : language === "ja"
                ? "自治体を選択"
                : "Select municipality"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={language === "ja" ? "自治体を検索..." : "Search municipality..."} 
          />
          <CommandList>
            <CommandEmpty>
              {language === "ja" ? "見つかりませんでした" : "No municipality found."}
            </CommandEmpty>
            <CommandGroup>
              {municipalities.map((municipality) => (
                <CommandItem
                  key={municipality.id}
                  value={municipality.name + municipality.nameJa}
                  onSelect={() => {
                    setMunicipalityId(municipality.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      municipalityId === municipality.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{language === "ja" ? municipality.nameJa : municipality.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {language === "ja" ? municipality.prefectureJa : municipality.prefecture}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
