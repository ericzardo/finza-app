import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { twMerge } from "tailwind-merge";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	...props
}: CalendarProps) {
	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={twMerge("py-3 px-6", className)}
			classNames={{
				months: "flex flex-col sm:flex-row gap-4",
				month: "flex flex-col gap-4",
				month_caption: "flex justify-center pt-1 relative items-center",
				caption_label: "text-sm font-medium",
				nav: "flex items-center gap-1",
				button_previous: twMerge(
					"cursor-pointer absolute left-2 h-9 w-9 md:h-7 md:w-7 flex items-center justify-center rounded-md border border-input bg-transparent",
					"hover:bg-muted hover:text-foreground",
					"disabled:pointer-events-none disabled:opacity-50",
				),
				button_next: twMerge(
					"cursor-pointer absolute right-2 h-9 w-9 md:h-7 md:w-7 flex items-center justify-center rounded-md border border-input bg-transparent",
					"hover:bg-muted hover:text-foreground",
					"disabled:pointer-events-none disabled:opacity-50",
				),
				month_grid: "w-full border-collapse space-x-1",
				weekdays: "flex",
				weekday:
					"text-muted-foreground rounded-md w-9 md:w-8 font-normal text-[0.8rem] text-center",
				week: "flex w-full mt-2",
				day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-primary/10 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
				day_button: twMerge(
					"cursor-pointer h-9 w-9 md:h-8 md:w-8 p-0 font-normal rounded-md",
					"hover:bg-muted hover:text-foreground",
					"focus:bg-muted focus:text-foreground focus:outline-none",
					"aria-selected:opacity-100",
				),
				range_start: "day-range-start",
				range_end: "day-range-end",
				selected:
					"[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground [&>button]:focus:bg-primary [&>button]:focus:text-primary-foreground",
				today: "[&>button]:bg-muted [&>button]:text-foreground",
				outside:
					"day-outside text-muted-foreground opacity-50 aria-selected:bg-primary/5 aria-selected:text-muted-foreground aria-selected:opacity-30",
				disabled: "text-muted-foreground opacity-50",
				range_middle:
					"aria-selected:bg-primary/10 aria-selected:text-foreground",
				hidden: "invisible",
				...classNames,
			}}
			components={{
				Chevron: ({ orientation }) =>
					orientation === "left" ? (
						<ChevronLeft className="h-4 w-4" />
					) : (
						<ChevronRight className="h-4 w-4" />
					),
			}}
			{...props}
		/>
	);
}
