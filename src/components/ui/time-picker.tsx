import { useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string; // "HH:MM" 24-hour format
  onChange: (value: string) => void;
  className?: string;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function parse24(v: string): { hour: number; minute: number; ampm: "AM" | "PM" } {
  const [h, m] = v.split(":").map(Number);
  const ampm: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  // Snap to nearest 5-min increment
  const minute = MINUTES.reduce((prev, curr) =>
    Math.abs(curr - m) < Math.abs(prev - m) ? curr : prev
  );
  return { hour, minute, ampm };
}

function to24(hour: number, minute: number, ampm: "AM" | "PM"): string {
  let h = hour;
  if (ampm === "AM" && hour === 12) h = 0;
  else if (ampm === "PM" && hour !== 12) h = hour + 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export const TimePicker = ({ value, onChange, className }: TimePickerProps) => {
  const { hour, minute, ampm } = parse24(value);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const scrollToSelected = () => {
    hourRef.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
    minuteRef.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  };

  const displayTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm.toLowerCase()}`;

  return (
    <Popover onOpenChange={(open) => { if (open) setTimeout(scrollToSelected, 60); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-input bg-input",
            "text-xs font-sans text-foreground min-w-[7.5rem]",
            "hover:border-primary/60 focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer",
            className
          )}
        >
          <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
          {displayTime}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-3 bg-popover border-border shadow-2xl rounded-xl"
        align="start"
        sideOffset={6}
      >
        {/* Live time preview */}
        <div className="text-center mb-3 pb-2.5 border-b border-border/50">
          <span className="text-2xl font-bold font-sans text-foreground tabular-nums tracking-tight">
            {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
          </span>
          <span className="text-sm text-primary ml-2 font-sans font-semibold">{ampm}</span>
        </div>

        <div className="flex items-start gap-1.5">
          {/* Hours column */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground font-sans mb-1 uppercase tracking-wide">Hr</span>
            <div
              ref={hourRef}
              className="flex flex-col gap-0.5 h-36 overflow-y-auto scrollbar-styled"
            >
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  data-selected={h === hour}
                  onClick={() => onChange(to24(h, minute, ampm))}
                  className={cn(
                    "w-9 h-8 rounded-lg text-sm font-sans font-medium transition-colors shrink-0",
                    h === hour
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {String(h).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          <div className="self-center text-muted-foreground font-bold mt-5">:</div>

          {/* Minutes column */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground font-sans mb-1 uppercase tracking-wide">Min</span>
            <div
              ref={minuteRef}
              className="flex flex-col gap-0.5 h-36 overflow-y-auto scrollbar-styled"
            >
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  data-selected={m === minute}
                  onClick={() => onChange(to24(hour, m, ampm))}
                  className={cn(
                    "w-9 h-8 rounded-lg text-sm font-sans font-medium transition-colors shrink-0",
                    m === minute
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          {/* AM / PM */}
          <div className="flex flex-col gap-1.5 self-center ml-1 mt-5">
            {(["AM", "PM"] as const).map((ap) => (
              <button
                key={ap}
                type="button"
                onClick={() => onChange(to24(hour, minute, ap))}
                className={cn(
                  "w-10 h-8 rounded-lg text-xs font-sans font-bold transition-colors",
                  ap === ampm
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                )}
              >
                {ap}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
