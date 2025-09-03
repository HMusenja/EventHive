import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Search, User, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import AuthModal from "../AuthModal";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Auth modal controls
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"

  function handleAuthSuccess() {
    navigate("/dashboard");
  }

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-vibrant shadow-vibrant" />
            <span className="text-xl font-bold">EventHub</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a
              href="#events"
              className="text-muted-foreground hover:text-foreground"
            >
              Events
            </a>
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-muted-foreground hover:text-foreground"
            >
              About
            </a>
            <a
              href="#blog"
              className="text-muted-foreground hover:text-foreground"
            >
              Blog
            </a>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>

            {/* Desktop auth actions */}
            {!user ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={() => navigate("/login")}
                >
                  <User className="mr-2 h-4 w-4" /> Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/register")}
                  className="hidden sm:inline-flex border-0 bg-gradient-electric text-electric-foreground hover:shadow-electric"
                >
                  Join Now
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={() => navigate("/dashboard")}
                >
                  <User className="mr-2 h-4 w-4" />{" "}
                  {user.fullName?.split(" ")[0] || "Profile"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden sm:inline-flex"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </>
            )}

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] sm:w-[360px]">
                <SheetHeader>
                  <SheetTitle>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-gradient-vibrant shadow-vibrant" />
                      <span className="font-bold">EventHub</span>
                    </div>
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Mobile navigation menu
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  {/* Nav links */}
                  <div className="grid gap-2">
                    <a href="#events" className="text-sm text-foreground">
                      Events
                    </a>
                    <a href="#features" className="text-sm text-foreground">
                      Features
                    </a>
                    <a href="#about" className="text-sm text-foreground">
                      About
                    </a>
                    <a href="#blog" className="text-sm text-foreground">
                      Blog
                    </a>
                  </div>

                  <Separator />

                  {/* Auth actions (mobile) */}
                  {!user ? (
                    <div className="grid gap-3">
                      <SheetClose asChild>
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => {
                            setAuthMode("login");
                            setAuthOpen(true);
                          }}
                        >
                          <User className="mr-2 h-4 w-4" /> Sign In
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          className="justify-start border-0 bg-gradient-electric text-electric-foreground hover:shadow-electric"
                          onClick={() => {
                            setAuthMode("register");
                            setAuthOpen(true);
                          }}
                        >
                          Join Now
                        </Button>
                      </SheetClose>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <SheetClose asChild>
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => navigate("/dashboard")}
                        >
                          <User className="mr-2 h-4 w-4" /> Dashboard
                        </Button>
                      </SheetClose>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Auth modal (controlled) */}
        <AuthModal
          isOpen={authOpen} // ✅ match AuthModal API
          onClose={setAuthOpen} // ✅ shadcn Dialog passes boolean
          initialMode={authMode}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </header>
  );
}
