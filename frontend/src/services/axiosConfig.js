import axios from "axios";

// create an axios instance with default settings
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api", // adjust port if backend runs elsewhere
    withCredentials: true, // ensures cookies (JWT/session) are sent if your backend sets them
});

// optional: attach interceptors (for auth / errors later)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API error:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default api;
