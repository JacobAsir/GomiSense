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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition && !navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
    }
  }, []);

  const handleTranscription = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert Blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(",")[1];
          resolve(base64String);
        };
      });
      reader.readAsDataURL(blob);
      const audioBase64 = await base64Promise;

      // Call our backend transcription endpoint
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64,
          mimeType: blob.type,
          language: language === "ja" ? "ja" : "en",
        }),
      });

      if (!response.ok) throw new Error("Backend transcription failed");

      const data = await response.json();
      if (data.text) {
        onResult(data.text);
      } else {
        throw new Error("No text returned from transcription");
      }
    } catch (err) {
      console.error("Groq Whisper failed, trying Web Speech fallback...", err);
      // If Groq fails, we don't do much here because Web Speech is a different interaction mode
      // But we can show a toast
      toast({
        title: language === "ja" ? "音声処理に失敗しました" : "Voice Processing Failed",
        description: language === "ja" ? "通常の音声入力を試みます。" : "Falling back to standard voice input.",
      });
      // Trigger standard fallback
      startWebSpeech();
    } finally {
      setIsProcessing(false);
    }
  };

  const startWebSpeech = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === "ja" ? "ja-JP" : "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) onResult(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  }, [language, onResult]);

  const startListening = useCallback(async () => {
    // 1. Try to use MediaRecorder + Groq Whisper first
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          handleTranscription(audioBlob);
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsListening(true);
      } catch (err) {
        console.error("MediaRecorder start failed, using Web Speech...", err);
        startWebSpeech();
      }
    } else {
      startWebSpeech();
    }
  }, [language, onResult, toast, startWebSpeech]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const toggleListen = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  if (!isSupported) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        "shrink-0 transition-all duration-300", 
        isListening && "border-destructive text-destructive bg-destructive/10 ring-2 ring-destructive/20 animate-pulse",
        isProcessing && "opacity-50 cursor-not-allowed"
      )}
      onClick={toggleListen}
      disabled={disabled || isProcessing}
      title={language === "ja" ? "音声入力" : "Voice Input"}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isListening ? (
        <Mic className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
