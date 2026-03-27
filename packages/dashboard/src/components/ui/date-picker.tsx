import { Button } from "@components/ui/button";
import { Calendar } from "@components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

interface DatePickerProps {
	value: string;
	onChange: (date: string) => void;
	placeholder?: string;
	min?: string;
	max?: string;
	className?: string;
}

function formatDisplay(dateStr: string): string {
	if (!dateStr) return "";
	const [year, month, day] = dateStr.split("-");
	return `${day}/${month}/${year}`;
}

export function DatePicker({
	value,
	onChange,
	placeholder = "Selecionar data",
	min,
	max,
	className,
}: DatePickerProps) {
	const [open, setOpen] = useState(false);

	const selected = value ? new Date(`${value}T12:00:00`) : undefined;
	const fromDate = min ? new Date(`${min}T12:00:00`) : undefined;
	const toDate = max ? new Date(`${max}T12:00:00`) : undefined;

	function handleSelect(date: Date | undefined) {
		if (!date) return;
		const iso = date.toISOString().split("T")[0];
		onChange(iso);
		setOpen(false);
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={twMerge(
						"h-8 justify-start gap-2 px-3 text-sm font-normal",
						!value && "text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
					{value ? formatDisplay(value) : placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={selected}
					onSelect={handleSelect}
					disabled={(date) => {
						if (fromDate && date < fromDate) return true;
						if (toDate && date > toDate) return true;
						return false;
					}}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
