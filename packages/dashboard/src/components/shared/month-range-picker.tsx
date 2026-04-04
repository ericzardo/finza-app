import { Button } from "@components/ui/button";
import { Calendar } from "@components/ui/calendar";
import {
	addMonths,
	formatDisplay,
	formatMonthYear,
	getMonthBounds,
	getShortMonthName,
	toDate,
	toISO,
} from "@lib/date";
import { cn } from "@lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";

type Mode = "month" | "month-selector" | "custom-range";

export interface MonthRangePickerProps {
	startDate: string;
	endDate: string;
	onChange: (startDate: string, endDate: string) => void;
	className?: string;
}

function parseMonthFromDate(dateStr: string) {
	const d = toDate(dateStr);
	return { year: d.getFullYear(), month: d.getMonth() };
}

export function MonthRangePicker({
	startDate,
	endDate,
	onChange,
	className,
}: MonthRangePickerProps) {
	const [mode, setMode] = useState<Mode>("month");
	const [selectorYear, setSelectorYear] = useState(
		() => parseMonthFromDate(startDate).year,
	);

	const current = parseMonthFromDate(startDate);
	const currentDate = new Date(current.year, current.month, 1);

	function navigateMonth(direction: -1 | 1) {
		const next = addMonths(currentDate, direction);
		const bounds = getMonthBounds(next.getFullYear(), next.getMonth());
		onChange(bounds.startDate, bounds.endDate);
	}

	function selectMonth(month: number) {
		const bounds = getMonthBounds(selectorYear, month);
		onChange(bounds.startDate, bounds.endDate);
		setMode("month");
	}

	function openMonthSelector() {
		setSelectorYear(current.year);
		setMode("month-selector");
	}

	function openCustomRange() {
		setMode("custom-range");
	}

	function closeCustomRange() {
		const bounds = getMonthBounds(current.year, current.month);
		onChange(bounds.startDate, bounds.endDate);
		setMode("month");
	}

	function handleRangeSelect(range: DateRange | undefined) {
		if (!range) return;
		if (range.from && range.to) {
			onChange(toISO(range.from), toISO(range.to));
		} else if (range.from) {
			onChange(toISO(range.from), endDate);
		}
	}

	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (mode === "month") return;

		function handleMouseDown(e: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setMode("month");
			}
		}

		document.addEventListener("mousedown", handleMouseDown);
		return () => document.removeEventListener("mousedown", handleMouseDown);
	}, [mode]);

	return (
		<div ref={containerRef} className={cn("relative", className)}>
			{/* Header row */}
			{mode === "custom-range" ? (
				<CustomRangeHeader
					startDate={startDate}
					endDate={endDate}
					onClose={closeCustomRange}
				/>
			) : (
				<MonthNavigationHeader
					label={formatMonthYear(currentDate)}
					onPrev={() => navigateMonth(-1)}
					onNext={() => navigateMonth(1)}
					onLabelClick={openMonthSelector}
					onCustomRange={openCustomRange}
					isSelectorOpen={mode === "month-selector"}
				/>
			)}

			{/* Floating panels */}
			{mode === "month-selector" && (
				<div className="absolute left-0 top-[calc(100%+8px)] z-50">
					<MonthSelectorGrid
						year={selectorYear}
						selectedMonth={current.month}
						selectedYear={current.year}
						onYearChange={setSelectorYear}
						onSelectMonth={selectMonth}
					/>
				</div>
			)}

			{mode === "custom-range" && (
				<div className="absolute right-0 top-[calc(100%+8px)] z-50">
					<div className="w-fit rounded-lg border border-border bg-card p-1 shadow-lg">
						<Calendar
							mode="range"
							selected={{
								from: toDate(startDate),
								to: toDate(endDate),
							}}
							onSelect={handleRangeSelect}
							numberOfMonths={2}
							defaultMonth={toDate(startDate)}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

/* ─── Sub-components ─── */

function MonthNavigationHeader({
	label,
	onPrev,
	onNext,
	onLabelClick,
	onCustomRange,
	isSelectorOpen,
}: {
	label: string;
	onPrev: () => void;
	onNext: () => void;
	onLabelClick: () => void;
	onCustomRange: () => void;
	isSelectorOpen: boolean;
}) {
	return (
		<div className="flex flex-row items-center gap-1">
			<div className="flex items-center">
				<Button
					variant="ghost"
					size="icon"
					className="size-8"
					onClick={onPrev}
					aria-label="Mês anterior"
				>
					<ChevronLeft className="size-4" />
				</Button>

				<button
					type="button"
					onClick={onLabelClick}
					className={cn(
						"min-w-[140px] rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors",
						"hover:bg-muted",
						isSelectorOpen && "bg-muted",
					)}
				>
					{label}
				</button>

				<Button
					variant="ghost"
					size="icon"
					className="size-8"
					onClick={onNext}
					aria-label="Próximo mês"
				>
					<ChevronRight className="size-4" />
				</Button>
			</div>

			<button
				type="button"
				onClick={onCustomRange}
				title="Período personalizado"
				aria-label="Período personalizado"
				className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
			>
				<CalendarDays className="size-4" />
			</button>
		</div>
	);
}

function CustomRangeHeader({
	startDate,
	endDate,
	onClose,
}: {
	startDate: string;
	endDate: string;
	onClose: () => void;
}) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-sm font-medium text-foreground">
				{formatDisplay(startDate)} — {formatDisplay(endDate)}
			</span>
			<Button
				variant="ghost"
				size="icon"
				className="size-7"
				onClick={onClose}
				aria-label="Voltar para navegação por mês"
			>
				<X className="size-3.5" />
			</Button>
		</div>
	);
}

function MonthSelectorGrid({
	year,
	selectedMonth,
	selectedYear,
	onYearChange,
	onSelectMonth,
}: {
	year: number;
	selectedMonth: number;
	selectedYear: number;
	onYearChange: (year: number) => void;
	onSelectMonth: (month: number) => void;
}) {
	const isSelectedYear = year === selectedYear;

	return (
		<div className="mt-3 w-fit rounded-lg border border-border bg-card p-3">
			{/* Year navigation */}
			<div className="mb-3 flex items-center justify-center gap-1">
				<Button
					variant="ghost"
					size="icon"
					className="size-7"
					onClick={() => onYearChange(year - 1)}
					aria-label="Ano anterior"
				>
					<ChevronLeft className="size-3.5" />
				</Button>
				<span className="min-w-12 text-center text-sm font-medium text-foreground">
					{year}
				</span>
				<Button
					variant="ghost"
					size="icon"
					className="size-7"
					onClick={() => onYearChange(year + 1)}
					aria-label="Próximo ano"
				>
					<ChevronRight className="size-3.5" />
				</Button>
			</div>

			{/* Month grid 4×3 */}
			<div className="grid grid-cols-4 gap-1">
				{Array.from({ length: 12 }, (_, i) => {
					const isSelected = isSelectedYear && i === selectedMonth;
					return (
						<button
							key={getShortMonthName(i)}
							type="button"
							onClick={() => onSelectMonth(i)}
							className={cn(
								"cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
								isSelected
									? "bg-primary text-primary-foreground"
									: "text-foreground hover:bg-muted",
							)}
						>
							{getShortMonthName(i)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
