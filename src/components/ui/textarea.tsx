import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, showCount, maxLength, value, defaultValue, onChange, ...props }, ref) => {
    const [length, setLength] = React.useState(() => {
      const initial = (value ?? defaultValue ?? "") as string;
      return initial.length;
    });

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLength(e.target.value.length);
      onChange?.(e);
    };

    // Keep length in sync with controlled value
    React.useEffect(() => {
      if (value !== undefined) {
        setLength((value as string).length);
      }
    }, [value]);

    return (
      <div className="w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          ref={ref}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          {...props}
        />
        {showCount && maxLength && (
          <p className="mt-1 text-xs text-muted-foreground text-right">
            {length} / {maxLength}
          </p>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
