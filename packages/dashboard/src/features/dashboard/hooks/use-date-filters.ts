import { getMonthRange } from "@lib/date";
import { getRouteApi, useNavigate } from "@tanstack/react-router";

const routeApi = getRouteApi("/_authenticated/$workspaceId/");

export function useDateFilters() {
	const { start, end } = routeApi.useSearch();
	const navigate = useNavigate({ from: "/$workspaceId" });

	const defaults = getMonthRange();
	const startDate = start ?? defaults.startDate;
	const endDate = end ?? defaults.endDate;

	function setDateRange(newStart: string, newEnd: string) {
		navigate({
			search: { start: newStart, end: newEnd },
			replace: true,
		});
	}

	return { startDate, endDate, setDateRange } as const;
}
