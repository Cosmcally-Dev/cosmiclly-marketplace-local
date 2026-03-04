import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
} as const;

interface StarRatingProps {
  value: number;
  count?: number;
  size?: keyof typeof sizeMap;
  className?: string;
}

function StarRating({ value, count, size = "sm", className }: StarRatingProps) {
  if (value <= 0) {
    return <span className="text-xs text-muted-foreground font-sans">No reviews yet</span>;
  }

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      aria-label={`Rating: ${value} out of 5 stars`}
    >
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              sizeMap[size],
              i < Math.floor(value)
                ? "text-amber-400 fill-amber-400"
                : "text-muted-foreground",
            )}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-foreground font-sans">{value}</span>
      {count !== undefined && (
        <>
          <span className="text-muted-foreground/60 text-xs">·</span>
          <span className="text-xs text-muted-foreground font-sans">
            {count > 0 ? `${count.toLocaleString()} readings` : "New"}
          </span>
        </>
      )}
    </div>
  );
}

export { StarRating };
