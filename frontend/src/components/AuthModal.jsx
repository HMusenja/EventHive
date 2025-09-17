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
  const { login, register, loading, error,fetchUser } = useAuth();
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
          // ✅ wait for context to update before navigating
          await fetchUser();
          navigate(nextParam || "/account/profile", { replace: true });
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
      <DialogContent className="glass-effect border border-white/20 bg-gradient-to-br from-primary/5 to-secondary/5 backdrop-blur-xl max-w-md">
        <DialogHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
              <Cloud className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-foreground">
            {isLogin ? "Welcome Back" : "Create Account"}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground text-sm">
            {isLogin
              ? "Sign in to access your builder & saved resumes."
              : "Join ResumeHub to build and manage your CVs."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="text-sm font-medium text-foreground"
                >
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    placeholder="Enter your full name"
                    className="pl-10 glass-input"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-foreground"
                >
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    placeholder="Choose a username"
                    className="pl-10 glass-input"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="identifier"
              className="text-sm font-medium text-foreground"
            >
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                className="pl-10 glass-input"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="pl-10 pr-10 glass-input"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="link"
                className="text-sm text-primary hover:text-primary/80 p-0"
              >
                Forgot password?
              </Button>
            </div>
          )}

          {(localError || error?.message) && (
            <p className="text-sm text-destructive">
              {localError || error.message}
            </p>
          )}

          <Button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-medium py-2.5 transition-all duration-200 disabled:opacity-60"
          >
            {loading
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
                ? "Sign In"
                : "Create Account"}
          </Button>

          <div className="relative my-6">
            <Separator className="bg-white/20" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-primary hover:text-primary/80 hover:bg-primary/5"
            onClick={() => switchMode(isLogin ? "register" : "login")}
          >
            {isLogin ? "Create new account" : "Sign in instead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
