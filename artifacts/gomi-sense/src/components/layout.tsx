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
      {/* Fixed Top Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-md mx-auto items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80 shrink-0">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:inline-block">GomiSense</span>
          </Link>

          {/* Navigation Links (Icon + Text) */}
          <nav className="flex items-center gap-6">
            <Link 
              href="/directory" 
              className={`flex flex-col items-center gap-0.5 transition-colors ${
                location === "/directory" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{language === "ja" ? "検索" : "Directory"}</span>
            </Link>
            
            <Link 
              href="/municipalities" 
              className={`flex flex-col items-center gap-0.5 transition-colors ${
                location === "/municipalities" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Map className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{language === "ja" ? "自治体" : "Cities"}</span>
            </Link>

            <Link 
              href="/how-it-works" 
              className={`flex flex-col items-center gap-0.5 transition-colors ${
                location === "/how-it-works" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Info className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{language === "ja" ? "ルール" : "Rules"}</span>
            </Link>
          </nav>

          {/* Settings */}
          <div className="flex items-center gap-2 shrink-0">
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-screen-md mx-auto p-4 flex flex-col">
        {children}
      </main>

      {/* Simple Footer without Nav */}
      <footer className="border-t border-border mt-auto bg-muted/30 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} GomiSense. Japan Waste Sorting Assistant.
        </p>
      </footer>
    </div>
  );
}
