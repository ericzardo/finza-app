import env from "@env";
import axios, {
	type AxiosInstance,
	type AxiosRequestConfig,
	type AxiosResponse,
	type AxiosError,
} from "axios";

export const axiosInstance: AxiosInstance = axios.create({
	baseURL: env.API_URL || "http://localhost:9999",
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

interface ApiErrorResponse {
	message?: string;
	statusCode?: number;
}

axiosInstance.interceptors.response.use(
	(response) => response,
	(error: AxiosError<ApiErrorResponse>) => {
		if (!error.response) {
			error.message =
				"Não foi possível conectar aos servidores da Finza. Tente novamente mais tarde!";
		}
		// 2. Erro mapeado pela Error Handler da API
		else if (error.response.data && error.response.data.message) {
			error.message = error.response.data.message;
		}

		if (error.response?.status === 401) {
			const publicPaths = ["/", "/login", "/sign-up"];
			const isPublicPage =
				typeof window !== "undefined" &&
				publicPaths.some((p) => window.location.pathname === p);

			const requestUrl = error.config?.url ?? "";
			const isChangePassword = requestUrl.includes("/auth/change-password");

			if (typeof window !== "undefined" && !isPublicPage && !isChangePassword) {
				window.location.href = "/login";
			}
		}

		return Promise.reject(error);
	},
);

// --- TIPAGENS PARA O KUBB (O SEGREDO ESTÁ AQUI) ---

export type RequestConfig<TVariables = unknown> =
	AxiosRequestConfig<TVariables>;

export type ResponseErrorConfig<TError = unknown> = AxiosError<TError>;

export type Client = <TData, TError = unknown, TVariables = unknown>(
	config: RequestConfig<TVariables>,
) => Promise<AxiosResponse<TData>>;

export const client: Client = async <
	TData,
	TError = unknown,
	TVariables = unknown,
>(
	config: RequestConfig<TVariables>,
): Promise<AxiosResponse<TData>> => {
	const response = await axiosInstance.request<
		TData,
		AxiosResponse<TData>,
		TVariables
	>(config);
	return response;
};

export default client;
