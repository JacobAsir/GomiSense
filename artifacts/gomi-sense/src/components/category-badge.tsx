import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  categoryEn: string;
  categoryJa: string;
  color: string;
  className?: string;
  language: "en" | "ja";
}

export function CategoryBadge({ categoryEn, categoryJa, color, className, language }: CategoryBadgeProps) {
  // Parse the hex or CSS color variable
  const badgeStyle = {
    backgroundColor: color,
    color: "#ffffff", // Assuming white text on colored badges, or adjust based on color lightness
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-3 py-1 text-sm font-semibold rounded-full shadow-sm",
        className
      )}
      style={badgeStyle}
    >
      {language === "ja" ? categoryJa : categoryEn}
    </span>
  );
}
