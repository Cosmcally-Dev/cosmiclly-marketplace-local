import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down";
  onClick?: () => void;
  className?: string;
}

function StatCard({ icon, label, value, change, trend, onClick, className }: StatCardProps) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      className={cn(
        "bg-card rounded-xl p-5 border border-border text-left",
        onClick && "cursor-pointer hover:border-primary/50 transition-colors",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="bg-primary/10 rounded-lg p-2">{icon}</div>
        {change && (
          <span
            className={cn(
              "text-xs font-medium flex items-center gap-0.5",
              trend === "up" && "text-emerald-400",
              trend === "down" && "text-destructive",
              !trend && "text-muted-foreground",
            )}
          >
            {trend === "up" && <TrendingUp className="w-3 h-3" />}
            {trend === "down" && <TrendingDown className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Comp>
  );
}

export { StatCard };
