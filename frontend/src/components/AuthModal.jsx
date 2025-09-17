import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Cloud, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getDashboardPath } from "@/utils/dashboardPath";

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login", // "login" | "register"
}) {
  const { login, register, loading, error } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const nextParam = searchParams.get("next") || null;

  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const identifierRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    emailOrUsername: "",
    email: "",
    password: "",
  });

  const isLogin = mode === "login";

  useEffect(() => setMode(initialMode), [initialMode]);
  useEffect(() => {
    if (isOpen) {
      setShowPassword(false);
      setLocalError("");
      setFormData({
        fullName: "",
        username: "",
        emailOrUsername: "",
        email: "",
        password: "",
      });
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (mode === "login" && isOpen) {
      const t = setTimeout(() => identifierRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [mode, isOpen]);

  const handleInputChange = (field, value) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const switchMode = (newMode) => {
    setMode(newMode);
    setLocalError("");
    setFormData({
      fullName: "",
      username: "",
      emailOrUsername: "",
      email: "",
      password: "",
    });
  };

  const canSubmit = useMemo(() => {
    if (isLogin)
      return formData.emailOrUsername.trim() && formData.password.trim();
    return (
      formData.fullName.trim() &&
      formData.username.trim() &&
      formData.email.trim() &&
      formData.password.trim()
    );
  }, [isLogin, formData]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLocalError("");

    try {
      if (isLogin) {
        const res = await login({
          identifier: formData.emailOrUsername.trim(),
          password: formData.password,
        });
        if (res.ok) {
          toast({
            title: "Welcome back!",
            description: res.message || "Signed in.",
          });

          // Redirect logic
          const target = nextParam ? nextParam : "/account/profile"; // Always go to /profile and let Profile.jsx choose the pane

          navigate(target, { replace: true });
          onClose?.(false);
        } else {
          setLocalError(res?.error?.message || "Invalid credentials.");
        }
      } else {
        const res = await register({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          username: formData.username.trim().toLowerCase(),
          password: formData.password,
        });
        if (res.ok) {
          toast({
            title: "Account created",
            description: "Please sign in to continue.",
          });
          switchMode("login");
          setFormData({
            fullName: "",
            username: "",
            emailOrUsername: formData.username || formData.email,
            email: "",
            password: "",
          });
        } else {
          setLocalError(
            res?.error?.message || "Registration failed. Check your details."
          );
        }
      }
    } catch (err) {
      setLocalError(err?.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
      auth-dialog
      max-w-md p-0 overflow-hidden rounded-2xl
      bg-white/90 supports-[backdrop-filter]:bg-white/75 backdrop-blur-2xl
      border border-white/60 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.25)]
    "
      >
        <div className="p-6 sm:p-8">
          {/* Logo tile */}
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 ring-1 ring-white/40 flex items-center justify-center">
            <Cloud className="h-7 w-7 text-indigo-600" />
          </div>

          {/* Title + tagline */}
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-1 text-center text-sm text-slate-600">
            {isLogin
              ? "Sign in to manage events, tickets, and chats."
              : "Join EventHive to host, attend, and connect."}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      placeholder="Enter your full name"
                      className="pl-10 bg-white/90 border border-white/60 focus:bg-white focus-visible:ring-2 focus-visible:ring-indigo-400/40 placeholder:text-slate-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      placeholder="Choose a username"
                      className="pl-10 bg-white/90 border border-white/60 focus:bg-white focus-visible:ring-2 focus-visible:ring-indigo-400/40 placeholder:text-slate-500"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="identifier"
                  ref={identifierRef}
                  type="email"
                  placeholder="Enter your email"
                  value={isLogin ? formData.emailOrUsername : formData.email}
                  onChange={(e) =>
                    isLogin
                      ? handleInputChange("emailOrUsername", e.target.value)
                      : handleInputChange("email", e.target.value)
                  }
                  className="pl-10 bg-white/90 border border-white/60 focus:bg-white focus-visible:ring-2 focus-visible:ring-indigo-400/40 placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10 pr-10 bg-white/90 border border-white/60 focus:bg-white focus-visible:ring-2 focus-visible:ring-indigo-400/40 placeholder:text-slate-500"
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                </Button>
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end -mt-1">
                <Button type="button" variant="link" className="text-sm p-0 text-indigo-600 hover:text-indigo-600/80">
                  Forgot password?
                </Button>
              </div>
            )}

            {(localError || error?.message) && (
              <p className="text-sm text-destructive">{localError || error.message}</p>
            )}

            <Button
              type="submit"
              disabled={!canSubmit || loading}
              className="
            w-full rounded-xl
            bg-gradient-to-tr from-indigo-600 to-fuchsia-600
            hover:from-indigo-600/90 hover:to-fuchsia-600/90
            text-white font-medium py-2.5
            shadow-md hover:shadow-lg transition-all
            disabled:opacity-60
          "
            >
              {loading ? (isLogin ? "Signing in..." : "Creating account...") : isLogin ? "Sign In" : "Create Account"}
            </Button>

            <div className="relative my-6">
              <Separator className="bg-slate-200/70" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/85 px-2 text-xs text-slate-600 rounded">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-xl text-indigo-700 hover:text-indigo-700/90 hover:bg-indigo-50/60"
              onClick={() => switchMode(isLogin ? "register" : "login")}
            >
              {isLogin ? "Create new account" : "Sign in instead"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
