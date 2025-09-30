
import axios from "axios";



export const publicApi = axios.create({
  baseURL: "http://localhost:5050/api",
  withCredentials: false,  // 🌍 for guest/public calls
});
