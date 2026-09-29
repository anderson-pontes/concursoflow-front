import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "@/stores/authStore";

export const api = axios.create({
  baseURL: "/api/v1",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    const res = await axios.post(
      "/api/v1/auth/refresh",
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );

    const accessToken = res.data?.access_token as string | undefined;
    const nextRefresh = (res.data?.refresh_token as string | undefined) ?? refreshToken;
    if (!accessToken) return null;

    setTokens({ accessToken, refreshToken: nextRefresh });
    return accessToken;
  } catch {
    logout();
    // Fora do contexto React Router; redirecionamento direto é o caminho seguro aqui.
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (!originalConfig || status !== 401 || originalConfig._retry) {
      return Promise.reject(error);
    }

    const requestUrl = originalConfig.url ?? "";
    const isAuthEndpoint = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/refresh");
    if (isAuthEndpoint) return Promise.reject(error);

    originalConfig._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newAccessToken = await refreshPromise;
    if (!newAccessToken) {
      return Promise.reject(error);
    }

    originalConfig.headers = originalConfig.headers ?? {};
    originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(originalConfig);
  },
);

