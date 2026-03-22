import { axiosInstance } from "@client";

let currentWorkspaceId: string | null = null;

export function setWorkspaceId(id: string | null): void {
	currentWorkspaceId = id;
}

axiosInstance.interceptors.request.use((config) => {
	if (currentWorkspaceId) {
		config.headers["x-workspace-id"] = currentWorkspaceId;
	}
	return config;
});
