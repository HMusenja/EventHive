import Navbar from "./Navbar";
import Footer from "./Footer";
import { Toaster } from "@/components/ui/toaster";

export default function AppShell({ children }) {
  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <Navbar />
      <main id="content" className="flex-1">{children}</main>
      <Footer />
     <Toaster/>
    </div>
  );
}