// src/pages/dashboard/organizer/Events.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  Plus,
  Search,
  Filter,
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

import {
  getEventAttendeeCountById,
  // getEventAttendeeCountBySlug,
} from "@/api/attendeeApi";
import EventCard from "@/components/event/EventCard";
import { useEvents } from "@/context/EventContext";
import EditEventModal from "@/components/event/EditEventModal";

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
  const {
    state: { events, loading, error },
    fetchMyEvents,
  } = useEvents();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // per-event metrics from attendee/ticket API
  // shape: { [eventId]: { attendeeCount, capacityTotal, minTicketPrice, totalRevenue, currency, checkedInCount, memberCount } }
  const [countsMap, setCountsMap] = useState({});

  // load only current user's events
  useEffect(() => {
    fetchMyEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // after events load, fetch metrics in parallel and store
  useEffect(() => {
    if (!events?.length) {
      setCountsMap({});
      return;
    }
    let cancelled = false;

    (async () => {
      const ids = Array.from(
        new Set(events.map((e) => String(e?._id)).filter(Boolean))
      );
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

  // merge metrics into each event — EventCard reads attendeeCount & capacityTotal for progress bar
  const normalized = useMemo(
    () =>
      (events || []).map((ev) => {
        const id = String(ev?._id || "");
        const m = countsMap[id] || {};
        return {
          ...ev,
          // live metrics from API (fall back to 0/undefined)
          attendeeCount: m.attendeeCount ?? 0,
          capacityTotal: m.capacityTotal ?? 0,
          price: Number.isFinite(m.minTicketPrice)
            ? m.minTicketPrice
            : undefined, // undefined → "Free" in card
          revenue: Number.isFinite(m.totalRevenue) ? m.totalRevenue : 0,
          currency: (m.currency || "EUR").toUpperCase(),
          status: pickStatus(ev),
          // keep older fields for any other UI that still uses them
          attendees: m.attendeeCount ?? ev.attendees ?? 0,
          capacity: m.capacityTotal ?? ev.capacity ?? 0,
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
    () =>
      filteredEvents.reduce(
        (sum, ev) => sum + (ev.attendeeCount || ev.attendees || 0),
        0
      ),
    [filteredEvents]
  );
  const totalRevenue = useMemo(
    () =>
      filteredEvents.reduce((sum, ev) => sum + (Number(ev.revenue) || 0), 0),
    [filteredEvents]
  );

  // actions
  const [editing, setEditing] = useState(null);

  const handleView = (ev) => navigate(`/events/${ev.slug || ev._id}`);
  const handleEdit = (ev) => setEditing(ev);
  const handleCloseEdit = () => setEditing(null);
  const handleDelete = async (ev) => {
    // TODO: delete then await fetchMyEvents();
    console.log("[delete] not wired yet →", ev?._id);
  };

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
            onClick={() => navigate("/dashboard/organizer/events/new")}
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
      ) : error ? (
        <div className="py-16 text-center">
          <p className="text-destructive mb-3">
            Failed to load events: {error}
          </p>
          <Button onClick={fetchMyEvents}>Try again</Button>
        </div>
      ) : filteredEvents.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => (
            <EventCard
              key={ev._id || ev.slug}
              variant="organizer"
              event={ev}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
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
            onClick={() => navigate("/dashboard/organizer/events/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Event
          </Button>
        </div>
      )}
      <EditEventModal
        open={!!editing}
        event={editing}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCloseEdit();
        }}
      />
    </div>
  );
}
