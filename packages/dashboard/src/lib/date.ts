const MONTH_NAMES_LONG = [
	"Janeiro",
	"Fevereiro",
	"Março",
	"Abril",
	"Maio",
	"Junho",
	"Julho",
	"Agosto",
	"Setembro",
	"Outubro",
	"Novembro",
	"Dezembro",
];

const MONTH_NAMES_SHORT = [
	"Jan",
	"Fev",
	"Mar",
	"Abr",
	"Mai",
	"Jun",
	"Jul",
	"Ago",
	"Set",
	"Out",
	"Nov",
	"Dez",
];

export function toISO(date: Date): string {
	return date.toISOString().split("T")[0];
}

export function toDate(dateStr: string): Date {
	return new Date(`${dateStr}T12:00:00`);
}

export function formatDisplay(dateStr: string): string {
	if (!dateStr) return "";
	const [year, month, day] = dateStr.split("-");
	return `${day}/${month}/${year}`;
}

export function formatMonthYear(date: Date): string {
	const month = MONTH_NAMES_LONG[date.getMonth()];
	return `${month} ${date.getFullYear()}`;
}

export function getShortMonthName(monthIndex: number): string {
	return MONTH_NAMES_SHORT[monthIndex];
}

export function getMonthBounds(year: number, month: number) {
	const start = new Date(year, month, 1);
	const end = new Date(year, month + 1, 0);
	return {
		startDate: toISO(start),
		endDate: toISO(end),
	};
}

export function getMonthRange(date?: Date) {
	const d = date ?? new Date();
	return getMonthBounds(d.getFullYear(), d.getMonth());
}

export function addMonths(date: Date, n: number): Date {
	return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

export function isSameMonth(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
