import { Routes, Route } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import Home from "@/pages/Home"; // add .jsx if your setup requires
import Tickets from "@/pages/Tickets";

export default function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/builder" element={<Builder />} /> */}
        <Route path="/events/:id/tickets" element={<Tickets />} />
      </Routes>
    </AppShell>
  );
}
