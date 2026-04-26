import axios from "axios";

const AUTH_STORAGE_KEY = "hm_auth";
const UNAUTHORIZED_EVENT = "hm:unauthorized";

const readAuthState = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
});

axiosInstance.interceptors.request.use(
  (config) => {
    const authState = readAuthState();

    if (authState?.token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${authState.token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || "";
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") || requestUrl.includes("/auth/refresh");

    if (status === 401 && !isAuthEndpoint && typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
