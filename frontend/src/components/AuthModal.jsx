// src/components/auth/AuthModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
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

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login", // "login" | "register"
  onSuccess,            // optional: (user) => void
}) {
  const { login, register, loading, error } = useAuth();
  const { toast } = useToast();

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
      if (initialMode === "login") {
        setFormData({
          fullName: "",
          username: "",
          emailOrUsername: "",
          email: "",
          password: "",
        });
      }
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
    if (isLogin) return formData.emailOrUsername.trim() && formData.password.trim();
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
          toast({ title: "Welcome back!", description: res.message || "Signed in." });
          onSuccess?.(res.user);
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
          toast({ title: "Account created", description: "Please sign in to continue." });
          // switch to login and prefill identifier
          setMode("login");
          setFormData({
            fullName: "",
            username: "",
            emailOrUsername: formData.username || formData.email,
            email: "",
            password: "",
          });
        } else {
          setLocalError(res?.error?.message || "Registration failed. Check your details.");
        }
      }
    } catch (err) {
      setLocalError(
        err?.message || "Something went wrong. Please try again."
      );
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
          {/* Register-only block (fixed height to avoid jump) */}
          <div className="transition-all duration-200">
            <div className={isLogin ? "min-h-[0px]" : "min-h-[176px]"}>
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        placeholder="Enter your full name"
                        className="pl-10 glass-input"
                        required={!isLogin}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="username" className="text-sm font-medium text-foreground">
                      Username
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        placeholder="Choose a username"
                        className="pl-10 glass-input"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="identifier" className="text-sm font-medium text-foreground">
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
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
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
              <Button type="button" variant="link" className="text-sm text-primary hover:text-primary/80 p-0">
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

          {/* Social stub */}
          <div className="space-y-3 pt-4">
            <Separator className="bg-white/20" />
            <Button type="button" variant="outline" className="w-full glass-effect border-white/20 hover:bg-white/5">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
