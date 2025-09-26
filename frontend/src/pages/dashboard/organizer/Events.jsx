// src/pages/dashboard/organizer/Events.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  Plus,
  Search,
  Filter,
  TicketPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getEventAttendeeCountById } from "@/api/attendeeApi";
import EventCard from "@/components/event/EventCard";
import { useEvents } from "@/context/EventContext";
import CreateTicketModal from "@/components/tickets/CreateTicketModal";

function pickStatus(ev) {
  return (
    ev?.status ??
    ev?.state ??
    (new Date(ev?.endAt) < new Date() ? "ended" : "live")
  );
}

function money(n, currency = "EUR") {
  return (Number(n) || 0).toLocaleString(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

export default function OrganizerEventsPane() {
  const navigate = useNavigate();
  const location = useLocation();
  const createdId = location.state?.createdId; // optional highlight

  const {
    state: { events, loading, error },
    fetchMyEvents,
    deleteEvent,
  } = useEvents();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const itemRefs = useRef({});
  const [countsMap, setCountsMap] = useState({});

  const [createForEvent, setCreateForEvent] = useState(null);

  // Load events
  useEffect(() => {
    fetchMyEvents();
  }, []);

  // Fetch metrics
  useEffect(() => {
    if (!events?.length) return setCountsMap({});
    let cancelled = false;

    (async () => {
      const ids = events.map((e) => String(e._id)).filter(Boolean);
      const results = await Promise.allSettled(
        ids.map((id) => getEventAttendeeCountById(id))
      );
      if (cancelled) return;
      const next = {};
      for (const r of results) {
        if (r.status === "fulfilled" && r.value?.eventId) {
          next[r.value.eventId] = r.value;
        }
      }
      setCountsMap(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [events]);

  const normalized = useMemo(
    () =>
      (events || []).map((ev) => {
        const id = String(ev?._id || "");
        const m = countsMap[id] || {};
        return {
          ...ev,
          attendeeCount: m.attendeeCount ?? 0,
          capacityTotal: m.capacityTotal ?? 0,
          price: Number.isFinite(m.minTicketPrice)
            ? m.minTicketPrice
            : undefined,
          revenue: Number.isFinite(m.totalRevenue) ? m.totalRevenue : 0,
          currency: (m.currency || "EUR").toUpperCase(),
          status: pickStatus(ev),
        };
      }),
    [events, countsMap]
  );

  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return normalized.filter((ev) => {
      const matchesSearch =
        !term ||
        ev?.title?.toLowerCase().includes(term) ||
        ev?.subtitle?.toLowerCase().includes(term) ||
        ev?.description?.toLowerCase().includes(term) ||
        ev?.venue?.city?.toLowerCase().includes(term) ||
        ev?.venue?.country?.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" ||
        String(ev?.status).toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [normalized, searchTerm, statusFilter]);

  const totalAttendees = useMemo(
    () => filteredEvents.reduce((sum, ev) => sum + (ev.attendeeCount || 0), 0),
    [filteredEvents]
  );
  const totalRevenue = useMemo(
    () =>
      filteredEvents.reduce((sum, ev) => sum + (Number(ev.revenue) || 0), 0),
    [filteredEvents]
  );

  const handleView = (ev) => navigate(`/events/${ev.slug || ev._id}`);
  const handleDelete = async (ev) => {
    try {
      await deleteEvent(ev._id);
    } catch {}
  };

  // Highlight newly created event if any
  useEffect(() => {
    if (!createdId || !filteredEvents.length) return;
    const el = itemRefs.current[String(createdId)];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("flash-highlight");
      const t = setTimeout(() => el.classList.remove("flash-highlight"), 2000);
      window.history.replaceState({}, document.title, window.location.pathname);
      return () => clearTimeout(t);
    }
  }, [createdId, filteredEvents]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Events Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create, manage, and track all your events in one place
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMyEvents} disabled={loading}>
            Refresh
          </Button>
          <Button
            className="bg-gradient-to-r from-primary to-secondary"
            onClick={() => navigate("/account/event/create")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Event
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{filteredEvents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Attendees</p>
                <p className="text-2xl font-bold">{totalAttendees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{money(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">
                  {
                    filteredEvents.filter((ev) => {
                      const d = new Date(ev?.startAt);
                      const now = new Date();
                      return (
                        d.getMonth() === now.getMonth() &&
                        d.getFullYear() === now.getFullYear()
                      );
                    }).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
            <SelectItem value="soldout">Sold out</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          Loading events…
        </div>
      ) : filteredEvents.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => {
            const id = String(ev?._id || "");
            return (
              <div
                key={id || ev.slug}
                ref={(node) => (itemRefs.current[id] = node)}
                className="rounded-2xl transition-shadow"
              >
                <EventCard
                  variant="organizer"
                  event={ev}
                  onView={handleView}
                  onDelete={handleDelete}
                  footerSlot={
                    <Button
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setCreateForEvent(ev)}
                      title="Create ticket for this event"
                    >
                      <TicketPlus className="h-4 w-4 mr-1" />
                      Ticket
                    </Button>
                  }
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search criteria"
              : "Create your first event to get started"}
          </p>
          <Button
            className="bg-gradient-to-r from-primary to-secondary"
            onClick={() => navigate("/account/event/create")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Event
          </Button>
        </div>
      )}
      {/* Multi-create Tickets Modal */}
      <CreateTicketModal
        open={!!createForEvent}
        onOpenChange={(v) => !v && setCreateForEvent(null)}
        eventId={createForEvent?._id}
        eventEndAt={createForEvent?.endAt}
        onDone={() => {
          setCreateForEvent(null);
          fetchMyEvents(); // refresh metrics after creation
        }}
      />
    </div>
  );
}
