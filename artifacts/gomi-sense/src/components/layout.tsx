import { useAppStore } from "@/lib/store";
import { Link, useLocation } from "wouter";
import { Leaf, Info, Map, Search } from "lucide-react";
import { LanguageToggle } from "./language-toggle";
import { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { language } = useAppStore();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-md mx-auto items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">GomiSense</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-screen-md mx-auto p-4 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border mt-auto bg-card pb-safe">
        <div className="container max-w-screen-md mx-auto p-4">
          <nav className="flex justify-around items-center">
            <Link 
              href="/" 
              className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
                location === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search className="h-5 w-5" />
              <span>{language === "ja" ? "検索" : "Search"}</span>
            </Link>
            
            <Link 
              href="/municipalities" 
              className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
                location === "/municipalities" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Map className="h-5 w-5" />
              <span>{language === "ja" ? "自治体" : "Cities"}</span>
            </Link>

            <Link 
              href="/how-it-works" 
              className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
                location === "/how-it-works" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Info className="h-5 w-5" />
              <span>{language === "ja" ? "ルール" : "Rules"}</span>
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
