import { useState, useEffect, useCallback } from "react";
import { Mic, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// Add global types for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceInputProps {
  onResult: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onResult, disabled }: VoiceInputProps) {
  const { language } = useAppStore();
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        setRecognition(recog);
      } else {
        setIsSupported(false);
      }
    }
  }, []);

  const toggleListen = useCallback(() => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.lang = language === "ja" ? "ja-JP" : "en-US";
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };

      try {
        recognition.start();
      } catch (e) {
        console.error(e);
        setIsListening(false);
      }
    }
  }, [recognition, isListening, language, onResult]);

  if (!isSupported) {
    return null; // Gracefully degrade by hiding the button
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("shrink-0", isListening && "border-destructive text-destructive bg-destructive/10 animate-pulse")}
      onClick={toggleListen}
      disabled={disabled}
      title={language === "ja" ? "音声入力" : "Voice Input"}
    >
      {isListening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}
