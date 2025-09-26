import axios from "axios";

// Step 1: Base URL setup
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";
const finalBase = baseURL.endsWith("/api") ? baseURL : `${baseURL}/api`;

// Step 2: Create axios instance with default settings
const api = axios.create({
    baseURL: finalBase,
    withCredentials: true, // Needed if your backend uses cookies
});

// Step 3: Automatically attach Bearer token from localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Step 4: Basic error logger for responses
api.interceptors.response.use(
    (response) => response,
    (err) => {
        const url = `${err?.config?.baseURL || ""}${err?.config?.url || ""}`;
        const msg = err?.response?.data?.message || err.message || "Request failed";
        console.error(`[API error] ${err?.config?.method?.toUpperCase()} ${url} — ${msg}`);
        return Promise.reject(err);
    }
);

// Optional: Set global axios defaults if needed
export const setAxiosDefaults = () => {
    axios.defaults.baseURL = finalBase;
    axios.defaults.withCredentials = true;
};

export default api;
