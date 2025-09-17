import { useState, useMemo, useEffect, useContext } from "react";
import TicketCard from "@/components/events/TicketCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Search, Filter, QrCode, CalendarDays, Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TicketContext } from "@/context/TicketContext";
import { useAuth } from "@/context/AuthContext";

export default function MyTickets() {
  const { tickets = [], loadTickets, setSearch, setFilter } = useContext(TicketContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [view, setView] = useState("grid");
  const { user } = useAuth();

  useEffect(() => {
    if (typeof loadTickets === "function") loadTickets();
  }, [loadTickets]);

  // keep provider search/filter in sync (if provider exposes setters)
  useEffect(() => {
    if (typeof setSearch === "function") setSearch(searchTerm);
  }, [searchTerm, setSearch]);

  useEffect(() => {
    if (typeof setFilter === "function") setFilter(filterBy);
  }, [filterBy, setFilter]);

  // stable key generation & dedupe
  function makeKey(ticket, idx) {
    if (!ticket) return `ticket-${idx}`;
    if (ticket._id) return String(ticket._id);
    if (ticket.ref && ticket.orderId) return `${ticket.orderId}:${ticket.ref}`;
    if (ticket.ref && ticket.ticketId) return `${ticket.ticketId}:${ticket.ref}`;
    if (ticket.ticketId && ticket.createdAt) return `${ticket.ticketId}:${new Date(ticket.createdAt).getTime()}`;
    if (ticket.ticketId) return String(ticket.ticketId);
    return `ticket-${idx}-${String(ticket?.ref || ticket?.name || "noid")}`;
  }

  // filter tickets using eventMeta (primary) with safe fallbacks
  const filteredTickets = useMemo(() => {
    if (!Array.isArray(tickets)) return [];
    const q = (searchTerm || "").toLowerCase();

    const mapped = tickets.map((t, i) => {
      const title = String(t.eventMeta?.title ?? t.eventName ?? "").trim();
      const venue = String(t.eventMeta?.venue?.name ?? t.venue ?? "").trim();
      const category = String(t.category ?? "").trim();
      return { ...t, _safeTitle: title, _safeVenue: venue, _safeCategory: category, _origIndex: i };
    });

    const filtered = mapped.filter((ticket) => {
      const matchesSearch =
        !q ||
        (ticket._safeTitle || "").toLowerCase().includes(q) ||
        (ticket._safeVenue || "").toLowerCase().includes(q) ||
        (ticket._safeCategory || "").toLowerCase().includes(q);

      const matchesFilter = filterBy === "all" || ticket.status === filterBy;
      return matchesSearch && matchesFilter;
    });

    filtered.forEach((t) => {
      if (!t._id && !t.ref && !t.ticketId) {
        // eslint-disable-next-line no-console
        console.warn("[MyTickets] ticket missing id/ref/ticketId — check backend mapping:", t);
      }
    });

    return filtered;
  }, [tickets, searchTerm, filterBy]);

  const stats = useMemo(() => {
    if (!Array.isArray(tickets)) return { total: 0, active: 0, attended: 0, spent: 0 };
    return {
      total: tickets.length,
      active: tickets.filter((t) => t.status === "confirmed").length,
      attended: tickets.filter((t) => t.status === "used").length,
      spent: tickets.reduce((sum, t) => sum + ((t.amountTotal ?? 0) / 100), 0),
    };
  }, [tickets]);

  // dedupe + compute final key
  const keyedTickets = useMemo(() => {
    const seen = new Set();
    return filteredTickets.filter((t, i) => {
      const k = makeKey(t, i);
      if (seen.has(k)) return false;
      seen.add(k);
      t.__key = k;
      return true;
    });
  }, [filteredTickets]);

  // quick guards
  if (!user) {
    return <p className="p-6 text-center text-muted-foreground">Please log in to view your tickets.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          My Tickets
        </h1>
        <p className="text-muted-foreground">View and manage your tickets and QR codes</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets by event, venue, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="confirmed">Active</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ticket Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <CardContent className="flex items-center gap-2">
            <QrCode className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="flex items-center gap-2">
            <Star className="w-6 h-6 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Events Attended</p>
              <p className="text-xl font-bold">{stats.attended}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-xl font-bold">${stats.spent.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Grid / List */}
      <Tabs defaultValue={view} onValueChange={(v) => setView(v)}>
        <TabsList className="grid grid-cols-2 max-w-md">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {keyedTickets.map((ticket, idx) => (
              <TicketCard
                key={ticket.__key || makeKey(ticket, idx)}
                ticket={ticket}
                eventMeta={ticket.eventMeta}
                owned={true} // these are issued tickets from /tickets/mine
                qrDataUrl={ticket.qrDataUrl}
                ticketRef={ticket.ref || ticket.ticketRef}
                 amount={ticket.amountTotal / 100} 
                tags={[ticket.category]}
                rating={ticket.rating}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <div className="space-y-6">
            {keyedTickets.map((ticket, idx) => (
              <TicketCard
                key={ticket.__key || makeKey(ticket, idx)}
                ticket={ticket}
                eventMeta={ticket.eventMeta}
                owned={true}
                qrDataUrl={ticket.qrDataUrl}
                ticketRef={ticket.ref || ticket.ticketRef}
                tags={[ticket.category]}
                rating={ticket.rating}
                view="list"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* No Tickets */}
      {keyedTickets.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <QrCode className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterBy !== "all"
              ? "Try adjusting your search or filters to find tickets."
              : "You haven't purchased any tickets yet. Browse events to get started!"}
          </p>
        </div>
      )}
    </div>
  );
}

