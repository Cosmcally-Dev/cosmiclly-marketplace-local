import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" format
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  fromYear?: number;
  toYear?: number;
}

export const DatePicker = ({
  value,
  onChange,
  className,
  placeholder = "Select date",
  fromYear = 1920,
  toYear = new Date().getFullYear(),
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);

  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const isValidDate = selectedDate && isValid(selectedDate);

  const displayValue = isValidDate
    ? format(selectedDate, "MMM d, yyyy")
    : placeholder;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md border border-input bg-input",
            "text-sm font-sans w-full text-left",
            "hover:border-primary/60 focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer",
            isValidDate ? "text-foreground" : "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="flex-1 truncate">{displayValue}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-3 bg-popover border-border shadow-2xl rounded-xl"
        align="start"
        sideOffset={6}
      >
        <DayPicker
          mode="single"
          selected={isValidDate ? selectedDate : undefined}
          onSelect={handleSelect}
          captionLayout="dropdown"
          fromYear={fromYear}
          toYear={toYear}
          defaultMonth={isValidDate ? selectedDate : new Date(1995, 0)}
          showOutsideDays={false}
          classNames={{
            months: "flex flex-col",
            month: "space-y-3",
            caption: "flex justify-center items-center gap-1.5 relative px-8",
            caption_dropdowns: "flex gap-1.5",
            dropdown_month: "relative",
            dropdown_year: "relative",
            dropdown:
              "appearance-none bg-muted border border-border rounded-md px-2 pr-6 py-1 text-xs font-sans text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/60 transition-colors",
            vhidden: "hidden",
            nav: "flex items-center",
            nav_button: cn(
              buttonVariants({ variant: "ghost" }),
              "h-7 w-7 p-0 opacity-60 hover:opacity-100 absolute"
            ),
            nav_button_previous: "left-0",
            nav_button_next: "right-0",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell:
              "text-muted-foreground w-9 font-normal text-[0.75rem] font-sans text-center",
            row: "flex w-full mt-1",
            cell: cn(
              "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
              "[&:has([aria-selected])]:bg-primary/10 first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg"
            ),
            day: cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 w-9 p-0 font-normal font-sans text-sm aria-selected:opacity-100 rounded-lg"
            ),
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "border border-primary/40 text-primary font-semibold",
            day_outside: "hidden",
            day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
            day_hidden: "invisible",
          }}
          components={{
            IconLeft: () => <ChevronLeft className="h-4 w-4" />,
            IconRight: () => <ChevronRight className="h-4 w-4" />,
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
