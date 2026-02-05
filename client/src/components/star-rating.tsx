import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  label?: string;
  showValue?: boolean;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  label,
  showValue = false,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      )}
      <div className="flex items-center gap-1">
        {Array.from({ length: maxRating }, (_, i) => i + 1).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleClick(value)}
            disabled={!interactive}
            className={cn(
              "transition-colors",
              interactive && "cursor-pointer hover:scale-110",
              !interactive && "cursor-default"
            )}
            data-testid={`star-${value}`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                value <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-muted-foreground/40"
              )}
            />
          </button>
        ))}
        {showValue && (
          <span className="ml-2 text-sm text-muted-foreground">
            {rating}/{maxRating}
          </span>
        )}
      </div>
    </div>
  );
}
