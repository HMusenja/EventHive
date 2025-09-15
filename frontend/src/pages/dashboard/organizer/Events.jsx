import { useState } from "react";
import { Calendar, MapPin, Users, DollarSign, Plus, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Events = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const events = [
    {
      id: 1,
      title: "Tech Conference 2024",
      description: "Annual technology conference featuring the latest innovations",
      date: "March 15, 2024",
      time: "9:00 AM - 6:00 PM",
      location: "Convention Center, Downtown",
      attendees: 450,
      capacity: 500,
      revenue: "$12,500",
      ticketPrice: "$89",
      status: "live",
      image: "/api/placeholder/300/200"
    },
    {
      id: 2,
      title: "Startup Networking Mixer",
      description: "Connect with entrepreneurs, investors, and innovators",
      date: "March 20, 2024",
      time: "6:00 PM - 10:00 PM",
      location: "Rooftop Bar, Tech District",
      attendees: 120,
      capacity: 150,
      revenue: "$3,200",
      ticketPrice: "$45",
      status: "upcoming",
      image: "/api/placeholder/300/200"
    },
    {
      id: 3,
      title: "Digital Marketing Workshop",
      description: "Hands-on workshop covering modern digital marketing strategies",
      date: "March 8, 2024",
      time: "2:00 PM - 5:00 PM",
      location: "Business Center, Suite 400",
      attendees: 85,
      capacity: 100,
      revenue: "$2,850",
      ticketPrice: "$65",
      status: "completed",
      image: "/api/placeholder/300/200"
    },
    {
      id: 4,
      title: "AI Innovation Summit",
      description: "Exploring the future of artificial intelligence and machine learning",
      date: "March 25, 2024",
      time: "8:00 AM - 7:00 PM",
      location: "Tech Campus, Building A",
      attendees: 380,
      capacity: 400,
      revenue: "$15,000",
      ticketPrice: "$125",
      status: "upcoming",
      image: "/api/placeholder/300/200"
    },
    {
      id: 5,
      title: "Creative Design Masterclass",
      description: "Learn from industry experts about modern design principles",
      date: "April 2, 2024",
      time: "10:00 AM - 4:00 PM",
      location: "Design Studio, Creative Quarter",
      attendees: 45,
      capacity: 60,
      revenue: "$1,800",
      ticketPrice: "$95",
      status: "draft",
      image: "/api/placeholder/300/200"
    },
    {
      id: 6,
      title: "Healthcare Innovation Forum",
      description: "Discussing breakthrough technologies in healthcare",
      date: "April 10, 2024",
      time: "9:00 AM - 5:00 PM",
      location: "Medical Center Auditorium",
      attendees: 0,
      capacity: 300,
      revenue: "$0",
      ticketPrice: "$75",
      status: "draft",
      image: "/api/placeholder/300/200"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'draft': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'live': return 'Live';
      case 'upcoming': return 'Upcoming';
      case 'completed': return 'Completed';
      case 'draft': return 'Draft';
      default: return status;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <Button className="bg-gradient-to-r from-primary to-secondary">
          <Plus className="h-4 w-4 mr-2" />
          Create New Event
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
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
                <p className="text-2xl font-bold">{events.reduce((sum, event) => sum + event.attendees, 0)}</p>
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
                <p className="text-2xl font-bold">$34,350</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="border-2 hover:shadow-lg transition-all duration-200 overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={event.image} alt={event.title} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-2xl">
                  {event.title.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                <Badge variant="secondary" className={`${getStatusColor(event.status)} text-white px-2 py-1 text-xs shrink-0`}>
                  {getStatusText(event.status)}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {event.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-3">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{event.date} • {event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{event.attendees}/{event.capacity} attendees</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{event.revenue} • {event.ticketPrice}/ticket</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mx-3">
                  <div 
                    className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full" 
                    style={{ width: `${(event.attendees / event.capacity) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round((event.attendees / event.capacity) * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search criteria"
              : "Create your first event to get started"
            }
          </p>
          <Button className="bg-gradient-to-r from-primary to-secondary">
            <Plus className="h-4 w-4 mr-2" />
            Create New Event
          </Button>
        </div>
      )}
    </div>
  );
};

export default Events;