import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { Button } from "./ui/button";
import { useAppStore } from "@/lib/store";

interface CameraCaptureProps {
  onCapture: (base64: string, mimeType: string) => void;
  disabled?: boolean;
}

export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const { language } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreview(result);
      
      // result is "data:image/jpeg;base64,..."
      const [header, base64Data] = result.split(",");
      const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
      
      onCapture(base64Data, mimeType);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {!preview ? (
        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-24 flex flex-col gap-2 bg-card hover:bg-accent"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Camera className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium">
              {language === "ja" ? "カメラで撮影" : "Take Photo"}
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-24 flex flex-col gap-2 bg-card hover:bg-accent"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute("capture");
                fileInputRef.current.click();
              }
            }}
            disabled={disabled}
          >
            <ImageIcon className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium">
              {language === "ja" ? "ライブラリから" : "Choose Image"}
            </span>
          </Button>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border bg-black/5 aspect-video flex items-center justify-center">
          <img src={preview} alt="Preview" className="max-h-full object-contain" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
