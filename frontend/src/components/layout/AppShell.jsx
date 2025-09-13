import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Toaster } from "@/components/ui/toaster";

export default function AppShell() {
  return (
    <div className="relative min-h-dvh text-foreground flex flex-col">
      {/* Global background gradient: black at bottom -> white at top */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="h-full w-full bg-gradient-to-t from-black/95 via-black/20 to-white
                        dark:from-black/95 dark:via-black/50 dark:to-background" />
      </div>

      <Navbar />
      <main id="content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}