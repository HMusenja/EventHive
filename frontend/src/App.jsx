import { setAxiosDefaults } from "./services/axiosConfig";
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