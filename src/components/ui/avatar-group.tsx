import * as React from "react";

import { cn } from "@/lib/utils";

interface AvatarGroupProps {
  max?: number;
  children: React.ReactNode;
  className?: string;
}

function AvatarGroup({ max = 4, children, className }: AvatarGroupProps) {
  const childArray = React.Children.toArray(children);
  const visible = childArray.slice(0, max);
  const overflow = childArray.length - max;

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {visible.map((child, i) => (
        <div key={i} className="ring-2 ring-card rounded-full">
          {child}
        </div>
      ))}
      {overflow > 0 && (
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-card">
          +{overflow}
        </div>
      )}
    </div>
  );
}

export { AvatarGroup };
