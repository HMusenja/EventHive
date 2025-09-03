import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, Cloud } from "lucide-react";

import authBg from "@/assets/images/hero-background.jpg";

export default function Login() {
  const { login, loading, error, user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Prefill + redirect target
  const search = new URLSearchParams(location.search);
  const next = search.get("next") || "/";
  const prefill = search.get("prefill") || location.state?.identifier || "";

  const [identifier, setIdentifier] = useState(prefill);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, bounce to next
  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, next, navigate]);

  const formValid = useMemo(
    () => identifier.trim().length > 0 && password.length >= 4,
    [identifier, password]
  );

  async function onSubmit(e) {
    e.preventDefault();
    if (!formValid) return;

    const res = await login({ identifier: identifier.trim(), password });
    if (res.ok) {
      toast({ title: "Welcome back!", description: res.message || "Login successful." });
      navigate(next, { replace: true });
    } else {
      toast({
        title: "Login failed",
        description: res?.error?.message || "Invalid credentials.",
        variant: "destructive",
      });
    }
  }

  // Inline field validation helpers
  const idError = identifier && identifier.trim().length === 0;
  const pwError = password && password.length < 4;

  return (
    <section className="auth-form relative min-h-screen overflow-hidden">
          {/* Background (gradient + optional image overlay) */}
          <div className="absolute inset-0 bg-gradient-hero" />
      <div
        className="absolute inset-0 opacity-40"
        style={authBg ? { backgroundImage: `url(${authBg})`,backgroundSize: "cover",
          backgroundPosition: "center" } : undefined}
      />
     <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_60%_at_50%_10%,hsl(0_0%_100%/.08),transparent)]" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md glass-effect border border-white/20">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 backdrop-blur flex items-center justify-center">
              <Cloud className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Sign in</CardTitle>
            <p className="text-xs text-muted-foreground">
              Access your account to manage events & tickets.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email or Username</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="identifier"
                    placeholder="you@example.com or username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoFocus
                    className={`pl-10 glass-input placeholder:text-white/70 ${idError ? "border-destructive" : ""}`}
                  />
                </div>
                {idError && (
                  <p className="text-xs text-destructive mt-1">Please enter your email or username.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 pr-10 glass-input placeholder:text-white/70 ${pwError ? "border-destructive" : ""}`}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
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
                {pwError && (
                  <p className="text-xs text-destructive mt-1">Password must be at least 4 characters.</p>
                )}
              </div>

              {error?.message ? (
                <p className="text-sm text-destructive">{error.message}</p>
              ) : null}

              <Button type="submit" className="w-full" disabled={!formValid || loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Don’t have an account?{" "}
                <Link className="underline" to={`/register?next=${encodeURIComponent(next)}`}>
                  Create one
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
