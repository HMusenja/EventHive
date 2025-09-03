// // src/api/authApi.js
// import axios from "axios";

// function extractError(err) {
//   const status = err?.response?.status;
//   const message =
//     err?.response?.data?.message ||
//     err?.message ||
//     "Unexpected error. Please try again.";
//   return { status, message };
// }

// export async function register({ fullName, email, username, password }) {
//   try {
//     const { data } = await axios.post("/api/register", {
//       fullName,
//       email,
//       username,
//       password,
//     });
//     return data; // { message, user }
//   } catch (err) {
//     throw extractError(err);
//   }
// }

// export async function login({ identifier, password }) {
//   try {
//     const { data } = await axios.post("/api/login", { identifier, password });
//     return data; // { message, user }
//   } catch (err) {
//     throw extractError(err);
//   }
// }

// export async function logout() {
//   try {
//     const { data } = await axios.post("/api/logout");
//     return data; // { message }
//   } catch (err) {
//     throw extractError(err);
//   }
// }

// export async function getMe() {
//   try {
//     const { data } = await axios.get("/api/me");
//     return data; // { user }
//   } catch (err) {
//     throw extractError(err);
//   }
// }

import axios from "axios";



export const register = (data) => axios.post("/api/users/register", data);
export const login = (data) => axios.post("/api/users/login", data);
export const getMe = () => axios.get("/api/users/me");
export const logout = () => axios.post("/api/users/logout");