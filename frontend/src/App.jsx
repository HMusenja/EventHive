// src/App.jsx
 import { setAxiosDefaults } from "./api/axiosConfig";
import AppRoutes from "./routing/appRoutes";
import { Toaster } from "sonner";

export default function App() {
   setAxiosDefaults();
  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
}