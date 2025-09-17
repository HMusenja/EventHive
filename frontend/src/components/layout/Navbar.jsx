import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Search,
  User,
  LogOut,
  Clock,
  ChevronDown,
  UserRound,
  Sun,
  Moon,
  MessageSquareText,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "./ThemeToggle";
import AuthModal from "../AuthModal";
import GlobalChatButton from "@/components/nav/GlobalChatButton";
import { useToast } from "@/hooks/use-toast";

function relativeTime(ts) {
  if (!ts) return "Just now";
  const d =
    typeof ts === "string" || typeof ts === "number" ? new Date(ts) : ts;
  const diff = Math.max(0, Date.now() - d.getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export default function Navbar() {
  const { user, logout, refreshMe, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  async function handleAuthSuccess() {
    await refreshMe();
    navigate("/account");
  }

  async function handleLogout() {
    try {
      await logout();
      toast({
        title: "You’re logged out",
        description: "We hope to see you again soon ✨",
        duration: 9000,
      });
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }

  const isAuthed = !!user;
  const displayName = useMemo(() => {
    if (!initialized || loading) return "…";
    if (!isAuthed) return "Guest";
    const name = user.fullName || user.username || user.email || "User";
    return String(name).split(" ")[0];
  }, [user, loading, initialized, isAuthed]);

  const lastActive = useMemo(() => {
    const ts = user?.lastActive || user?.updatedAt || user?.createdAt;
    return relativeTime(ts);
  }, [user]);

  const avatarLetter = useMemo(() => {
    const src = user?.fullName || user?.username || user?.email || "U";
    return src.trim().charAt(0).toUpperCase();
  }, [user]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <button
            onClick={() => {
              if (window.location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                window.location.href = "/";
              }
            }}
            className="flex items-center gap-2"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-vibrant shadow-vibrant" />
            <span className="text-xl font-bold">EventHive</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#events" className="text-muted-foreground hover:text-foreground">
              Events
            </a>
            <a href="#features" className="text-muted-foreground hover:text-foreground">
              Features
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground">
              About
            </a>
            <a href="#blog" className="text-muted-foreground hover:text-foreground">
              Blog
            </a>
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Theme toggle direct */}
            <ThemeToggle withMenu={false} />

            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>

            {/* ⬇️ Global Chat */}
            <GlobalChatButton />

            <div className="hidden md:flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-2 rounded-xl border border-border px-2.5 py-1.5 hover:bg-muted transition">
                    <Avatar className="h-7 w-7">
                      {user?.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={displayName} />
                      ) : (
                        <AvatarFallback className="text-sm">
                          {avatarLetter}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-sm font-medium">{displayName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Last active • {lastActive}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAuthed ? (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/account")}>
                        <UserRound className="mr-2 h-4 w-4" /> Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => {
                        setAuthMode("login");
                        setAuthOpen(true);
                      }}>
                        <User className="mr-2 h-4 w-4" /> Sign in
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setAuthMode("register");
                        setAuthOpen(true);
                      }}>
                        <User className="mr-2 h-4 w-4" /> Register
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] sm:w-[360px]">
                <SheetHeader>
                  <SheetTitle>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-gradient-vibrant shadow-vibrant" />
                      <span className="font-bold">EventHive</span>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  {/* User header */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      {user?.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={displayName} />
                      ) : (
                        <AvatarFallback>{avatarLetter}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="text-sm">
                      <div className="font-semibold">{displayName}</div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Last active • {lastActive}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Mobile links */}
                  <div className="grid gap-2">
                    <a href="#events" className="text-sm text-foreground">Events</a>
                    <a href="#features" className="text-sm text-foreground">Features</a>
                    <a href="#about" className="text-sm text-foreground">About</a>
                    <a href="#blog" className="text-sm text-foreground">Blog</a>

                    {/* ⬇️ Global Chat */}
                    <SheetClose asChild>
                      <Link
                        to="/chat/global"
                        className="text-sm text-foreground inline-flex items-center gap-2"
                      >
                        <MessageSquareText className="h-4 w-4" />
                        Global chat
                      </Link>
                    </SheetClose>
                  </div>

                  <Separator />

                  {/* User actions */}
                  {isAuthed ? (
                    <div className="grid gap-3">
                      <SheetClose asChild>
                        <Button variant="outline" onClick={() => navigate("/account")}>
                          <UserRound className="mr-2 h-4 w-4" /> Profile
                        </Button>
                      </SheetClose>
                      <Button variant="ghost" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <SheetClose asChild>
                        <Button variant="outline" onClick={() => {
                          setAuthMode("login");
                          setAuthOpen(true);
                        }}>
                          <User className="mr-2 h-4 w-4" /> Sign in
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button className="border-0 bg-gradient-electric text-electric-foreground hover:shadow-electric" onClick={() => {
                          setAuthMode("register");
                          setAuthOpen(true);
                        }}>
                          Register
                        </Button>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Auth modal */}
        <AuthModal
          isOpen={authOpen}
          onClose={setAuthOpen}
          initialMode={authMode}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </header>
  );
}