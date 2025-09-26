import axios from "@/services/axiosConfig";

export const registerUser = (data) => axios.post("/users/register", data);

export const loginUser = (data) =>
    axios.post("/users/login", data, { withCredentials: true });

export const getCurrentUser = () => axios.get("/users/me");

export const logoutUser = () => axios.post("/users/logout");
