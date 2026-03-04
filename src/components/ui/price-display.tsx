import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  discountedPrice?: number | null;
  unit?: string;
  className?: string;
}

function PriceDisplay({ price, discountedPrice, unit = "/min", className }: PriceDisplayProps) {
  return (
    <div className={cn("flex items-baseline gap-2 font-sans", className)}>
      {discountedPrice ? (
        <>
          <span className="text-sm text-muted-foreground line-through">${price}</span>
          <span className="text-xl font-bold text-primary">
            ${discountedPrice}
            <span className="text-sm font-normal text-muted-foreground">{unit}</span>
          </span>
        </>
      ) : (
        <span className="text-xl font-bold text-primary">
          ${price}
          <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </span>
      )}
    </div>
  );
}

export { PriceDisplay };
