import { Button } from "@components/ui/button"
import { Calendar } from "@components/ui/calendar"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@components/ui/popover"
import { cn } from "@lib/utils"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"
import type { DateRange } from "react-day-picker"

interface DatePickerWithRangeProps {
	from: string
	to: string
	onRangeChange: (from: string, to: string) => void
	className?: string
}

function toISO(date: Date): string {
	return date.toISOString().split("T")[0]
}

function toDate(dateStr: string): Date {
	return new Date(`${dateStr}T12:00:00`)
}

function formatDisplay(dateStr: string): string {
	if (!dateStr) return ""
	const [year, month, day] = dateStr.split("-")
	return `${day}/${month}/${year}`
}

function getPresets() {
	const now = new Date()
	const y = now.getFullYear()
	const m = now.getMonth()

	return [
		{
			label: "Este mês",
			from: new Date(y, m, 1),
			to: new Date(y, m + 1, 0),
		},
		{
			label: "Mês passado",
			from: new Date(y, m - 1, 1),
			to: new Date(y, m, 0),
		},
		{
			label: "Últimos 3 meses",
			from: new Date(y, m - 2, 1),
			to: new Date(y, m + 1, 0),
		},
		{
			label: "Este ano",
			from: new Date(y, 0, 1),
			to: new Date(y, 11, 31),
		},
	]
}

export function DatePickerWithRange({
	from,
	to,
	onRangeChange,
	className,
}: DatePickerWithRangeProps) {
	const [open, setOpen] = useState(false)

	const selected: DateRange = {
		from: from ? toDate(from) : undefined,
		to: to ? toDate(to) : undefined,
	}

	function handleSelect(range: DateRange | undefined) {
		if (!range) return

		if (range.from && range.to) {
			onRangeChange(toISO(range.from), toISO(range.to))
		} else if (range.from) {
			onRangeChange(toISO(range.from), to)
		}
	}

	function handlePreset(preset: { from: Date; to: Date }) {
		onRangeChange(toISO(preset.from), toISO(preset.to))
		setOpen(false)
	}

	const presets = getPresets()

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"h-8 w-full justify-start gap-2 px-3 text-sm font-normal md:w-auto",
						!from && "text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
					{from && to ? (
						<span>
							{formatDisplay(from)} — {formatDisplay(to)}
						</span>
					) : (
						<span>Selecionar período</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="end">
				<div className="flex flex-col sm:flex-row">
					<div className="border-b border-border p-3 sm:border-r sm:border-b-0">
						<p className="mb-2 text-xs font-medium text-muted-foreground">
							Atalhos
						</p>
						<div className="flex flex-row flex-wrap gap-1 sm:flex-col">
							{presets.map((preset) => (
								<Button
									key={preset.label}
									variant="ghost"
									size="sm"
									className="justify-start text-xs"
									onClick={() => handlePreset(preset)}
								>
									{preset.label}
								</Button>
							))}
						</div>
					</div>
					<div className="p-0">
						<Calendar
							mode="range"
							selected={selected}
							onSelect={handleSelect}
							numberOfMonths={2}
							defaultMonth={from ? toDate(from) : undefined}
						/>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}
