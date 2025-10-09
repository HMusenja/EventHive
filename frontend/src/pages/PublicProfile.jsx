// src/pages/PublicProfile.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Target,
  MessageCircle,
  Calendar,
  UserPlus,
  ArrowLeft,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { getPublicProfile } from "@/api/profileApi";
import { normalizePublicProfile } from "@/utils/profileMappers";


import { fetchGlobalMatches } from "@/api/matchApi";

import SafeAvatar from "@/shared/SafeAvatar";

const TagSection = ({ title, items = [], icon: Icon, color }) => {
  if (!items.length) return null;
  return (
    <Card
      className="border-l-4"
      style={{ borderLeftColor: `hsl(var(--${color}))` }}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" style={{ color: `hsl(var(--${color}))` }} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <Badge key={`${title}-${idx}`} variant="secondary">
              {item}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth();

  const [state, setState] = useState({
    loading: true,
    error: "",
    private: false,
    profile: null,
  });

  const [similar, setSimilar] = useState({
    loading: false,
    items: [],
    error: "",
  });

  const isSelf = useMemo(() => {
    if (!isAuthenticated || !authUser) return false;
    return userId === authUser._id || userId === authUser.username;
  }, [userId, authUser, isAuthenticated]);

  // Load viewed profile (self or public)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: "", private: false }));
      try {
        if (isSelf && authUser) {
          const normalized = normalizePublicProfile(authUser);
          if (!cancelled) {
            setState({
              loading: false,
              error: "",
              private: false,
              profile: normalized,
            });
          }
          return;
        }

        const raw = await getPublicProfile(userId);
        const normalized = normalizePublicProfile(raw);
        if (!cancelled) {
          setState({
            loading: false,
            error: "",
            private: false,
            profile: normalized,
          });
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 403) {
          if (!cancelled)
            setState({ loading: false, error: "", private: true, profile: null });
        } else if (status === 404) {
          if (!cancelled)
            setState({
              loading: false,
              error: "Profile not found.",
              private: false,
              profile: null,
            });
        } else {
          if (!cancelled)
            setState({
              loading: false,
              error:
                err?.response?.data?.message ||
                err?.message ||
                "Failed to load profile.",
              private: false,
              profile: null,
            });
        }
      }
    }

    if (!authLoading) load();
    return () => {
      cancelled = true;
    };
  }, [userId, isSelf, authUser, authLoading]);

  // Load similar profiles (global matches), once profile is known
  useEffect(() => {
    if (!state.profile) return;
    let cancelled = false;

    async function loadSimilar() {
      setSimilar((s) => ({ ...s, loading: true, error: "" }));
      try {
        // Use interests of the viewed profile; API helper will CSV-ify arrays
        const matches = await fetchGlobalMatches({
          interests: state.profile.interests,
          limit: 12,
        });

        // Exclude the viewed user, keep top 8
        const base = (matches || [])
          .filter((m) => m.userId !== state.profile.id)
          .slice(0, 8);

        // Enrich each with public profile (role/company/location/username)
        const enriched = await Promise.all(
          base.map(async (m) => {
            try {
              const p = await getPublicProfile(m.userId);
              return {
                ...m,
                username: p.username,
                fullName: p.fullName || m.fullName,
                avatar: p.avatar || m.avatar,
                role: p.role || "",
                company: p.company || "",
                location: p.location || "",
              };
            } catch {
              return m; // fall back gracefully
            }
          })
        );

        if (!cancelled) setSimilar({ loading: false, items: enriched, error: "" });
      } catch (e) {
        if (!cancelled)
          setSimilar({
            loading: false,
            items: [],
            error: e?.message || "Failed to load similar profiles",
          });
      }
    }

    loadSimilar();
    return () => {
      cancelled = true;
    };
  }, [state.profile]);

  const getConnectionButton = () => {
    if (!state.profile) return null;
    if (state.profile.connectionStatus === "connected") {
      return (
        <Button className="flex-1 bg-gradient-to-r from-purple-500 to-purple-700" disabled>
          <Users className="h-4 w-4 mr-2" />
          Connected
        </Button>
      );
    }
    return (
      <Button
        className="flex-1 bg-gradient-to-r from-primary to-secondary"
        onClick={() => console.log("Connect clicked")}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Connect
      </Button>
    );
  };

  if (state.loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="p-8 animate-pulse">
          <div className="h-6 w-48 bg-muted rounded mb-4" />
          <div className="h-4 w-80 bg-muted rounded mb-2" />
          <div className="h-4 w-64 bg-muted rounded" />
        </Card>
      </div>
    );
  }

  if (state.private) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Profile is private</CardTitle>
            <CardDescription>This profile is only visible to connections.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Couldn’t load profile</CardTitle>
            <CardDescription className="text-destructive">{state.error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profile = state.profile;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Header Banner */}
        <div className="relative h-48 bg-gradient-to-r from-primary via-secondary to-accent rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-20">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="text-center shadow-xl">
              <CardHeader>
                <div className="flex justify-center -mt-20 mb-4">
                  <SafeAvatar
                    src={profile.avatar}
                    name={profile.name}
                    className="h-32 w-32 border-4 border-card shadow-lg"
                  />
                </div>
                <CardTitle className="text-2xl">{profile.name}</CardTitle>
                {profile.location && (
                  <CardDescription className="flex items-center justify-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {(profile.role || profile.company || profile.education) && (
                  <div className="space-y-2">
                    {profile.role && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{profile.role}</span>
                      </div>
                    )}
                    {profile.company && (
                      <div className="text-sm text-muted-foreground">{profile.company}</div>
                    )}
                    {profile.education && (
                      <div className="flex items-center gap-2 text-sm pt-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{profile.education}</span>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {typeof profile.mutualConnections === "number" && (
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{profile.mutualConnections} mutual connections</span>
                  </div>
                )}

                {profile.joinedDate && (
                  <div className="text-xs text-muted-foreground">Member since {profile.joinedDate}</div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-4">
                  {getConnectionButton()}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => console.log("Message clicked")}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/meet?scheduleWith=${profile.id || userId}`)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Meet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bio and Details */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>About</CardTitle>
                <CardDescription>
                  Learn more about {profile.name.split(" ")[0] || "this user"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {profile.bio || "No bio yet."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Interests, Skills, and Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TagSection title="Interests" items={profile.interests} icon={Heart} color="primary" />
          <TagSection title="Skills" items={profile.skills} icon={Briefcase} color="secondary" />
          <TagSection title="Goals" items={profile.goals} icon={Target} color="accent" />
        </div>

        {/* Similar Profiles */}
        <Card className="bg-gradient-to-br from-muted/50 to-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Similar Profiles
            </CardTitle>
            <CardDescription>Other professionals you might want to connect with</CardDescription>
          </CardHeader>
          <CardContent>
            {similar.loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-2" />
                    <div className="h-4 w-24 bg-muted mx-auto mb-1" />
                    <div className="h-3 w-32 bg-muted mx-auto" />
                  </div>
                ))}
              </div>
            ) : similar.error ? (
              <p className="text-sm text-destructive">{similar.error}</p>
            ) : !similar.items.length ? (
              <p className="text-sm text-muted-foreground">No good matches yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {similar.items.map((u) => (
                  <Card
                    key={u.userId || u._id}
                    className="hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => navigate(`/u/${u.username || u.userId}`)}
                  >
                    <CardContent className="p-4 text-center space-y-2">
                      <SafeAvatar name={u.fullName} src={u.avatar} className="h-16 w-16 mx-auto" />
                      <div>
                        <p className="font-semibold text-sm">{u.fullName}</p>
                        {(u.role || u.company) && (
                          <p className="text-xs text-muted-foreground">
                            {u.role}
                            {u.role && u.company ? " · " : ""}
                            {u.company}
                          </p>
                        )}
                      </div>
                      {typeof u.overlap === "number" && (
                        <Badge variant="secondary" className="text-xs">
                          {u.overlap} shared interests
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
