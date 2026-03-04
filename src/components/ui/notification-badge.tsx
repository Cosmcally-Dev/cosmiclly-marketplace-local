import * as React from "react";

import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  children: React.ReactNode;
  className?: string;
}

function NotificationBadge({ count, children, className }: NotificationBadgeProps) {
  return (
    <div className={cn("relative inline-flex", className)}>
      {children}
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}

export { NotificationBadge };
