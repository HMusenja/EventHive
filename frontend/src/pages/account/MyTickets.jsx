import { useState } from "react";
import { QrCode, Calendar, MapPin, Clock, Download, Share2, Star, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MyTickets = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");

  const mockTickets = [
    {
      id: 1,
      eventName: "Tech Summit 2024",
      eventType: "Conference",
      date: "2024-02-15",
      time: "9:00 AM - 6:00 PM",
      venue: "Moscone Center, San Francisco",
      ticketType: "VIP Pass",
      price: 299,
      status: "confirmed",
      qrCode: "TS2024-VIP-001234",
      description: "Premier technology conference featuring industry leaders and innovative startups.",
      organizer: "TechEvents Inc.",
      purchaseDate: "2024-01-10",
      category: "Technology",
      rating: 4.8,
      capacity: 2000
    },
    {
      id: 2,
      eventName: "Product Management Workshop",
      eventType: "Workshop",
      date: "2024-01-20",
      time: "10:00 AM - 4:00 PM",
      venue: "Innovation Hub, Palo Alto",
      ticketType: "Standard",
      price: 149,
      status: "used",
      qrCode: "PMW2024-STD-005678",
      description: "Hands-on workshop covering modern product management techniques and tools.",
      organizer: "PM Learning Academy",
      purchaseDate: "2024-01-05",
      category: "Education",
      rating: 4.9,
      capacity: 50
    },
    {
      id: 3,
      eventName: "Startup Networking Night",
      eventType: "Networking",
      date: "2024-02-08",
      time: "6:00 PM - 10:00 PM",
      venue: "Rooftop Lounge, SOMA District",
      ticketType: "General Admission",
      price: 75,
      status: "confirmed",
      qrCode: "SNN2024-GA-009876",
      description: "Connect with fellow entrepreneurs and investors in a relaxed atmosphere.",
      organizer: "Startup Community SF",
      purchaseDate: "2024-01-25",
      category: "Networking",
      rating: 4.6,
      capacity: 150
    },
    {
      id: 4,
      eventName: "AI & Machine Learning Expo",
      eventType: "Expo",
      date: "2024-03-10",
      time: "9:00 AM - 8:00 PM",
      venue: "Convention Center, San Jose",
      ticketType: "Professional",
      price: 199,
      status: "confirmed",
      qrCode: "AIML2024-PRO-012345",
      description: "Explore the latest in AI and machine learning with demos, talks, and networking.",
      organizer: "AI Expo Group",
      purchaseDate: "2024-01-30",
      category: "Technology",
      rating: 4.7,
      capacity: 1500
    },
    {
      id: 5,
      eventName: "Design Thinking Bootcamp",
      eventType: "Bootcamp",
      date: "2024-01-15",
      time: "9:00 AM - 5:00 PM",
      venue: "Creative Space, Mission District",
      ticketType: "Early Bird",
      price: 89,
      status: "expired",
      qrCode: "DTB2024-EB-067890",
      description: "Intensive bootcamp on design thinking methodologies and practical applications.",
      organizer: "Design Academy",
      purchaseDate: "2023-12-20",
      category: "Design",
      rating: 4.5,
      capacity: 30
    },
    {
      id: 6,
      eventName: "Blockchain Developer Meetup",
      eventType: "Meetup",
      date: "2024-02-22",
      time: "7:00 PM - 9:00 PM",
      venue: "Tech Hub, Financial District",
      ticketType: "Free",
      price: 0,
      status: "confirmed",
      qrCode: "BDM2024-FREE-054321",
      description: "Monthly meetup for blockchain developers to share knowledge and network.",
      organizer: "Blockchain SF",
      purchaseDate: "2024-02-01",
      category: "Technology",
      rating: 4.4,
      capacity: 80
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed": return "bg-gradient-to-r from-green-400 to-green-600";
      case "used": return "bg-gradient-to-r from-blue-400 to-blue-600";
      case "expired": return "bg-gradient-to-r from-gray-400 to-gray-600";
      case "cancelled": return "bg-gradient-to-r from-red-400 to-red-600";
      default: return "bg-gradient-to-r from-gray-400 to-gray-600";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "confirmed": return "Active";
      case "used": return "Used";
      case "expired": return "Expired";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  const filteredTickets = mockTickets.filter(ticket => {
    const matchesSearch = ticket.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterBy === "all" || ticket.status === filterBy;
    
    return matchesSearch && matchesFilter;
  });

  const QRCodeDisplay = ({ qrCode }) => (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200">
      <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2">
        <QrCode className="h-16 w-16 text-gray-400" />
      </div>
      <p className="text-xs font-mono text-gray-600 text-center break-all">{qrCode}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            My Tickets
          </h1>
          <p className="text-muted-foreground">
            View and manage your event tickets and QR codes
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets by event name, venue, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
      </div>

      {/* Ticket Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <QrCode className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Total Tickets</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{mockTickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Active</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {mockTickets.filter(t => t.status === "confirmed").length}
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
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Events Attended</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {mockTickets.filter(t => t.status === "used").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Total Spent</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  ${mockTickets.reduce((sum, t) => sum + t.price, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Grid */}
      <Tabs defaultValue="grid" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{ticket.eventName}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {ticket.eventType}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {ticket.category}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(ticket.status)} text-white border-0`}>
                      {getStatusText(ticket.status)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(ticket.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{ticket.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{ticket.venue}</span>
                      </div>
                    </div>

                    <QRCodeDisplay qrCode={ticket.qrCode} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Ticket Type:</span>
                      <span className="text-sm">{ticket.ticketType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Price:</span>
                      <span className="text-sm font-semibold">
                        {ticket.price === 0 ? "Free" : `$${ticket.price}`}
                      </span>
                    </div>
                    {ticket.rating && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Rating:</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{ticket.rating}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">{ticket.eventName}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{ticket.eventType}</Badge>
                            <Badge variant="outline">{ticket.category}</Badge>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(ticket.status)} text-white border-0`}>
                          {getStatusText(ticket.status)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(ticket.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{ticket.time}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{ticket.venue}</span>
                          </div>
                          <div className="text-muted-foreground">
                            Organizer: {ticket.organizer}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-muted-foreground">
                            Type: {ticket.ticketType}
                          </div>
                          <div className="font-semibold">
                            {ticket.price === 0 ? "Free" : `$${ticket.price}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:w-48 flex flex-col gap-4">
                      <QRCodeDisplay qrCode={ticket.qrCode} />
                      <div className="flex flex-col gap-2">
                        <Button size="sm" className="bg-gradient-to-r from-primary to-secondary">
                          <Download className="h-4 w-4 mr-2" />
                          Download Ticket
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredTickets.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <QrCode className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterBy !== "all" 
              ? "Try adjusting your search or filters to find tickets." 
              : "You haven't purchased any tickets yet. Browse events to get started!"
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default MyTickets;