import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Calendar,
  MapPin,
  Briefcase,
  Star,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import RequestMeetingModal from "@/components/meetings/RequestMeetingModal";
import { fetchEventAttendees } from "@/api/meetingsApi";
import { fetchGlobalMatches as getMatchSuggestions } from "@/api/matchApi";

// ✅ new utils for server-side viewed + connected from meetings
import {
  fetchViewedIdsServer,
  recordViewedServer,
  connectedIdsFromMeetings,
  deriveStatusFor,
} from "@/utils/matchActivity";

const HEX24 = /^[0-9a-fA-F]{24}$/;

export default function Matches() {
  const { eventId } = useParams(); // optional: /events/:eventId/matches
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");

  // unified list to render (from event attendees or global matches)
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  // activity state (server viewed + meetings-connected)
  const [viewedIds, setViewedIds] = useState(new Set());
  const [connectedIds, setConnectedIds] = useState(new Set());

  // modal state
  const [isScheduleOpen, setScheduleOpen] = useState(false);
  const [presetInviteeId, setPresetInviteeId] = useState(null);

  // counts of requests you've sent this session, keyed by inviteeId
  const [sentCounts, setSentCounts] = useState({});

  // --- helpers
  const getStatusColor = (status) => {
    switch (status) {
      case "new":
        return "bg-gradient-to-r from-green-400 to-green-600";
      case "viewed":
        return "bg-gradient-to-r from-blue-400 to-blue-600";
      case "connected":
        return "bg-gradient-to-r from-purple-400 to-purple-600";
      case "requested":
        return "bg-gradient-to-r from-amber-400 to-amber-600";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-600";
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getInviteeId = (p) => String(p.id || "").trim();

  const statusOf = useCallback(
    (p) => deriveStatusFor(p, { viewedIds, connectedIds }),
    [viewedIds, connectedIds]
  );

  // navigate to public profiles + record 'viewed' (server-side)
  const openPublicProfile = async (m) => {
    const idOrUsername = m?.username || m?.id;
    if (!idOrUsername) return;
    const id = String(m?.id || "");
    if (id) {
      try {
        await recordViewedServer(id);
        // reflect locally
        setViewedIds((prev) => {
          if (prev.has(id)) return prev;
          const next = new Set(prev);
          next.add(id);
          return next;
        });
      } catch {
        // ignore network errors for best-effort logging
      }
    }
    navigate(`/u/${idOrUsername}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // when a meeting request is created successfully
  function handleMeetingRequested(inviteeId) {
    setSentCounts((prev) => ({
      ...prev,
      [inviteeId]: (prev[inviteeId] || 0) + 1,
    }));
    // optimistic: treat as connected
    setConnectedIds((prev) => {
      const next = new Set(prev);
      next.add(String(inviteeId));
      return next;
    });
  }

  // ---- Load data (event attendees OR global matches) ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        if (eventId) {
          // Event mode
          const res = await fetchEventAttendees(eventId, { limit: 100 });
          const list = (res?.attendees || []).map((a) => ({
            id: String(a.userId || a.user?._id || a._id || ""),
            name: a.user?.fullName || a.user?.username || "",
            role: a.user?.title || a.user?.role || "Attendee",
            company: a.user?.company || a.user?.organization || "",
            location: a.user?.location || "",
            avatar: a.user?.avatarUrl || "",
            matchScore: a.score ?? 80,
            bio: a.user?.bio || "",
            interests: a.user?.interests || [],
            mutualConnections: a.user?.mutualConnections || 0,
            status: "new",
          }));
          if (mounted) setPeople(list);
        } else {
          // Global mode (interests-based matches)
          const matches = await getMatchSuggestions();
          const list = (matches || []).map((m) => ({
            id: String(m.userId || m._id || m.user?._id || m.id || ""),
            name:
              m.name ||
              m.fullName ||
              m.user?.fullName ||
              m.user?.username ||
              "Unknown",
            role: m.user?.title || m.role || "Member",
            company: m.user?.company || m.company || "",
            location: m.user?.location || m.location || "",
            avatar: m.user?.avatarUrl || m.avatar || "",
            matchScore: m.matchScore ?? 80,
            bio: m.user?.bio || m.bio || "",
            interests: m.user?.interests || m.interests || [],
            mutualConnections:
              m.user?.mutualConnections || m.mutualConnections || 0,
            status: m.status || "new",
          }));
          if (mounted) setPeople(list);
        }
      } catch (e) {
        toast({
          title: "Could not load matches",
          description: e?.response?.data?.message || e?.message,
          variant: "destructive",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [eventId, toast]);

  // ---- hydrate viewed from server ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const set = await fetchViewedIdsServer({ limit: 500 });
        if (mounted) setViewedIds(set);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ---- hydrate connected from meetings ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      const set = await connectedIdsFromMeetings(user?._id);
      if (mounted) setConnectedIds(set);
    })();
    return () => {
      mounted = false;
    };
  }, [user?._id]);

  // ---- Filter UI list ----
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return (people || []).filter((p) => {
      const matchesSearch =
        (p.name || "").toLowerCase().includes(term) ||
        (p.role || "").toLowerCase().includes(term) ||
        (p.company || "").toLowerCase().includes(term);

      const s = statusOf(p);
      const matchesFilter =
        filterBy === "all"
          ? true
          : filterBy === "new"
          ? s === "new"
          : filterBy === "viewed"
          ? s === "viewed"
          : filterBy === "connected"
          ? s === "connected"
          : true;

      return matchesSearch && matchesFilter;
    });
  }, [people, searchTerm, filterBy, statusOf]);

  // ---- Modal open ----
  function openSchedule(id) {
    if (!id) {
      toast({
        title: "Unavailable for scheduling",
        description: "This profile isn’t linked to a user yet.",
        variant: "destructive",
      });
      return;
    }
    setPresetInviteeId(String(id));
    setScheduleOpen(true);
  }

  // computed metric: total connected using derived status
  const connectedCount = useMemo(
    () => people.filter((m) => statusOf(m) === "connected").length,
    [people, statusOf]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            My Matches
          </h1>
          <p className="text-muted-foreground">
            Discover and connect with like-minded professionals
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search matches by name, role, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Matches</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Match Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Total Matches
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {people.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Connected
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {connectedCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Avg Match Score
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {people.length
                    ? Math.round(
                        people.reduce(
                          (sum, m) => sum + (m.matchScore || 0),
                          0
                        ) / people.length
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((match) => {
            const inviteeId = getInviteeId(match);
            const status = statusOf(match);
            const sent = sentCounts[inviteeId] || 0;

            // allow schedule if we have an id and (in event mode the id looks like ObjectId)
            const idLooksOk = inviteeId && (!eventId || HEX24.test(inviteeId));
            // also prevent self-invite
            const notSelf = !user?._id || String(user._id) !== inviteeId;
            const canSchedule = Boolean(idLooksOk && notSelf);

            return (
              <Card
                key={match.id || inviteeId}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="h-16 w-16 border-2 border-primary/20 cursor-pointer"
                        onClick={() => openPublicProfile(match)}
                      >
                        <AvatarImage src={match.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-lg">
                          {match.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle
                          className="text-lg hover:underline cursor-pointer"
                          onClick={() => openPublicProfile(match)}
                          title="View public profile"
                        >
                          {match.name}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Briefcase className="h-3 w-3" />
                          {match.role}
                          {match.company ? ` at ${match.company}` : ""}
                        </div>
                        {match.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {match.location}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        className={`${getStatusColor(status)} text-white border-0`}
                      >
                        {status}
                      </Badge>
                      {sent > 0 && (
                        <Badge variant="outline" className="text-xs">
                          requested{sent > 1 ? ` ×${sent}` : ""}
                        </Badge>
                      )}
                      <div
                        className={`text-sm font-semibold ${getMatchScoreColor(match.matchScore)}`}
                      >
                        {match.matchScore}% match
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {match.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {match.bio}
                    </p>
                  )}

                  {match.interests?.length ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {match.interests.slice(0, 3).map((interest, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {interest}
                          </Badge>
                        ))}
                        {match.interests.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{match.interests.length - 3} more
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {match.mutualConnections} mutual connections
                      </div>
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-primary to-secondary"
                      disabled={status === "connected"}
                      onClick={() => {
                        // TODO: open chat UI here
                        // optimistic: mark connected on first message action
                        setConnectedIds((prev) => {
                          const next = new Set(prev);
                          next.add(inviteeId);
                          return next;
                        });
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {status === "connected" ? "Connected" : "Message"}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        canSchedule
                          ? openSchedule(inviteeId)
                          : toast({
                              title: "Unavailable for scheduling",
                              description:
                                "This profile can’t be scheduled right now.",
                              variant: "destructive",
                            })
                      }
                      disabled={!canSchedule}
                      title={
                        canSchedule
                          ? sent > 0
                            ? `Requested${sent > 1 ? ` ×${sent}` : ""}`
                            : "Schedule a meeting"
                          : "Unavailable for scheduling"
                      }
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {sent > 0 ? (
                        <>Requested{sent > 1 ? ` (${sent})` : ""}</>
                      ) : (
                        <>Schedule</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No matches found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters to find more matches.
          </p>
        </div>
      )}

      <RequestMeetingModal
        open={isScheduleOpen}
        onClose={() => setScheduleOpen(false)}
        hostId={presetInviteeId}
        eventId={eventId}
        presetInviteeId={presetInviteeId}
        sentCount={sentCounts[presetInviteeId] || 0}
        onCreated={(_meeting, idFromModal) => {
          handleMeetingRequested(String(idFromModal || presetInviteeId));
        }}
      />
    </div>
  );
}

