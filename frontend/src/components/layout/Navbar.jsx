import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Search, User } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-vibrant shadow-vibrant" />
            {/* make EventHub clickable */}
            <a href="/" className="text-xl font-bold hover:opacity-80">EventHub</a>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#events" className="text-muted-foreground hover:text-foreground">Events</a>
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground">About</a>
            <a href="#blog" className="text-muted-foreground hover:text-foreground">Blog</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <User className="mr-2 h-4 w-4" /> Sign In
            </Button>
            <Button size="sm" className="border-0 bg-gradient-electric text-electric-foreground hover:shadow-electric">
              Join Now
            </Button>
            <Button variant="ghost" size="sm" className="md:hidden"><Menu className="h-5 w-5" /></Button>
          </div>
        </div>
      </div>
    </header>
  );
}
