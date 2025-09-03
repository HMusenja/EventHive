import { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, Cloud, Eye, EyeOff } from "lucide-react";

import authBg from "@/assets/images/hero-background.jpg";

export default function Register() {
  const { register, loading, error } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const search = new URLSearchParams(location.search);
  const next = search.get("next") || "/dashboard";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const usernameValid = !username || username.trim().length >= 3;
  const nameValid = !fullName || fullName.trim().length >= 2;
  const pwValid = !password || password.length >= 6;

  const formValid = useMemo(() => {
    return (
      fullName.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
      username.trim().length >= 3 &&
      password.length >= 6
    );
  }, [fullName, email, username, password]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!formValid) return;

    const res = await register({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      password,
    });

    if (res.ok) {
      toast({
        title: "Account created",
        description: "Please sign in to continue.",
      });
      // Do NOT auto-login → go to Login with prefill
      const prefill = encodeURIComponent(username || email);
      navigate(`/login?next=${encodeURIComponent(next)}&prefill=${prefill}`, { replace: true });
    } else {
      toast({
        title: "Registration failed",
        description: res?.error?.message || "Please check your details.",
        variant: "destructive",
      });
    }
  }

  return (
    <section className=" auth-form relative min-h-screen overflow-hidden">
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
            <CardTitle className="text-xl">Create account</CardTitle>
            <p className="text-xs text-muted-foreground">
              Join EventHub to discover events & manage tickets.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoFocus
                    className={`pl-10 glass-input placeholder:text-white/70 ${!nameValid ? "border-destructive" : ""}`}
                  />
                </div>
                {!nameValid && (
                  <p className="text-xs text-destructive mt-1">Please enter at least 2 characters.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 glass-input placeholder:text-white/70 ${!emailValid ? "border-destructive" : ""}`}
                  />
                </div>
                {!emailValid && (
                  <p className="text-xs text-destructive mt-1">Please enter a valid email address.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="yourhandle"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`pl-10 glass-input placeholder:text-white/70 ${!usernameValid ? "border-destructive" : ""}`}
                  />
                </div>
                {!usernameValid && (
                  <p className="text-xs text-destructive mt-1">
                    Username should be at least 3 characters.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 pr-10 glass-input placeholder:text-white/70 ${!pwValid ? "border-destructive" : ""}`}
                    autoComplete="new-password"
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
                {!pwValid && (
                  <p className="text-xs text-destructive mt-1">
                    Password should be at least 6 characters.
                  </p>
                )}
              </div>

              {error?.message ? (
                <p className="text-sm text-destructive">{error.message}</p>
              ) : null}

              <Button type="submit" className="w-full" disabled={!formValid || loading}>
                {loading ? "Creating…" : "Create account"}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link className="underline" to={`/login?next=${encodeURIComponent(next)}`}>
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

