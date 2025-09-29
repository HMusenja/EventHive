import axios from "axios";



export const registerUser = (data) => axios.post("/api/users/register", data);
export const loginUser = (data) =>
  axios.post("/api/users/login", data, { withCredentials: true });
export const getCurrentUser = () => axios.get("/api/users/me");
export const logoutUser = () => axios.post("/api/users/logout");
