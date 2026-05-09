import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startListening = useCallback(async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // On some mobile browsers, we need to explicitly request microphone permission
    // if the SpeechRecognition API fails to trigger it properly.
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err) {
      console.warn("Microphone permission denied via getUserMedia", err);
      toast({
        title: language === "ja" ? "マイクの許可が必要です" : "Microphone Permission Required",
        description: language === "ja" 
          ? "ブラウザの設定でマイクへのアクセスを許可してください。" 
          : "Please allow microphone access in your browser settings.",
        variant: "destructive",
      });
      return;
    }

    // Create a FRESH instance every time for better mobile compatibility
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === "ja" ? "ja-JP" : "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        onResult(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        toast({
          title: language === "ja" ? "マイクの許可が必要です" : "Microphone Permission Required",
          description: language === "ja" 
            ? "設定でマイクを許可して、ページを更新してください。" 
            : "Please enable microphone in settings and refresh the page.",
          variant: "destructive",
        });
      } else if (event.error === "no-speech") {
        toast({
          title: language === "ja" ? "聞き取れませんでした" : "Could not hear you",
          description: language === "ja" ? "もう少しはっきり話しかけてください。" : "Please try speaking a bit louder or closer to the phone.",
        });
      } else {
        toast({
          title: language === "ja" ? "エラーが発生しました" : "Voice Error",
          description: event.error,
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition", e);
      setIsListening(false);
    }
  }, [language, onResult, toast]);

  const toggleListen = useCallback(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      startListening();
    }
  }, [isListening, startListening]);

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        "shrink-0 transition-all duration-300", 
        isListening && "border-destructive text-destructive bg-destructive/10 ring-2 ring-destructive/20 animate-pulse"
      )}
      onClick={toggleListen}
      disabled={disabled}
      title={language === "ja" ? "音声入力" : "Voice Input"}
    >
      {isListening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}
