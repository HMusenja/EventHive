import { useState } from "react";
import { Calendar, Clock, Video, MapPin, Plus, Users, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Meetings = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("upcoming");

  const mockMeetings = [
    {
      id: 1,
      title: "Product Strategy Discussion",
      attendees: [
        { name: "Sarah Johnson", avatar: "/placeholder-avatar-1.jpg", role: "Product Manager" },
        { name: "Michael Chen", avatar: "/placeholder-avatar-2.jpg", role: "Developer" }
      ],
      date: "2024-01-15",
      time: "10:00 AM",
      duration: "60 min",
      type: "video",
      location: "Zoom Meeting",
      status: "confirmed",
      description: "Discuss upcoming product features and roadmap priorities.",
      meetingLink: "https://zoom.us/j/123456789"
    },
    {
      id: 2,
      title: "Coffee Chat - Networking",
      attendees: [
        { name: "Emily Rodriguez", avatar: "/placeholder-avatar-3.jpg", role: "UX Designer" }
      ],
      date: "2024-01-16",
      time: "2:00 PM",
      duration: "30 min",
      type: "in-person",
      location: "Blue Bottle Coffee, Mission St",
      status: "pending",
      description: "Casual coffee meetup to discuss design trends and career growth."
    },
    {
      id: 3,
      title: "Tech Talk - AI in Product Development",
      attendees: [
        { name: "David Kim", avatar: "/placeholder-avatar-4.jpg", role: "Data Scientist" },
        { name: "Lisa Wang", avatar: "/placeholder-avatar-5.jpg", role: "Marketing Director" },
        { name: "Alex Thompson", avatar: "/placeholder-avatar-6.jpg", role: "Engineering Manager" }
      ],
      date: "2024-01-17",
      time: "4:00 PM",
      duration: "90 min",
      type: "video",
      location: "Google Meet",
      status: "confirmed",
      description: "Deep dive into AI applications in product development and future trends."
    },
    {
      id: 4,
      title: "Startup Pitch Review",
      attendees: [
        { name: "Sarah Johnson", avatar: "/placeholder-avatar-1.jpg", role: "Product Manager" }
      ],
      date: "2024-01-18",
      time: "11:00 AM",
      duration: "45 min",
      type: "video",
      location: "Microsoft Teams",
      status: "confirmed",
      description: "Review and provide feedback on startup pitch presentation."
    },
    {
      id: 5,
      title: "Workshop - React Best Practices",
      attendees: [
        { name: "Michael Chen", avatar: "/placeholder-avatar-2.jpg", role: "Developer" },
        { name: "Alex Thompson", avatar: "/placeholder-avatar-6.jpg", role: "Engineering Manager" }
      ],
      date: "2024-01-12",
      time: "3:00 PM",
      duration: "120 min",
      type: "in-person",
      location: "TechHub SF, 2nd Floor",
      status: "completed",
      description: "Hands-on workshop covering React best practices and advanced patterns."
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed": return "bg-gradient-to-r from-green-400 to-green-600";
      case "pending": return "bg-gradient-to-r from-yellow-400 to-yellow-600";
      case "completed": return "bg-gradient-to-r from-blue-400 to-blue-600";
      case "cancelled": return "bg-gradient-to-r from-red-400 to-red-600";
      default: return "bg-gradient-to-r from-gray-400 to-gray-600";
    }
  };

  const getTypeIcon = (type) => {
    return type === "video" ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />;
  };

  const filteredMeetings = mockMeetings.filter(meeting => {
    const meetingDate = new Date(meeting.date);
    const now = new Date();
    
    switch (viewMode) {
      case "upcoming":
        return meetingDate >= now;
      case "past":
        return meetingDate < now;
      case "today":
        return meetingDate.toDateString() === now.toDateString();
      default:
        return true;
    }
  });

  // Calendar component (simplified)
  const CalendarView = () => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = firstDay.getDay();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const days = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < startDate; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const hasMeetings = mockMeetings.some(meeting => meeting.date === dateStr);
      
      days.push(
        <div
          key={day}
          className={`h-12 p-1 border rounded cursor-pointer hover:bg-muted/50 ${
            hasMeetings ? 'bg-primary/10 border-primary/20' : 'border-border'
          }`}
        >
          <div className="text-sm font-medium">{day}</div>
          {hasMeetings && (
            <div className="w-2 h-2 bg-primary rounded-full mt-1"></div>
          )}
        </div>
      );
    }

    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {monthNames[currentMonth]} {currentYear}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            My Meetings
          </h1>
          <p className="text-muted-foreground">
            Manage your upcoming meetings and schedule new ones
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past Meetings</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="all">All Meetings</SelectItem>
            </SelectContent>
          </Select>
          
          <Button className="bg-gradient-to-r from-primary to-secondary">
            <Plus className="h-4 w-4 mr-2" />
            Schedule New Meeting
          </Button>
        </div>
      </div>

      {/* Meeting Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{mockMeetings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Upcoming</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {mockMeetings.filter(m => new Date(m.date) >= new Date()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Virtual</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {mockMeetings.filter(m => m.type === "video").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-500 rounded-lg">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">In-Person</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {mockMeetings.filter(m => m.type === "in-person").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <Card key={meeting.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{meeting.title}</h3>
                        <p className="text-sm text-muted-foreground">{meeting.description}</p>
                      </div>
                      <Badge className={`${getStatusColor(meeting.status)} text-white border-0`}>
                        {meeting.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(meeting.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {meeting.time} ({meeting.duration})
                      </div>
                      <div className="flex items-center gap-1">
                        {getTypeIcon(meeting.type)}
                        {meeting.location}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Attendees:
                      </div>
                      <div className="flex -space-x-2">
                        {meeting.attendees.map((attendee, index) => (
                          <Avatar key={index} className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={attendee.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs">
                              {attendee.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {meeting.attendees.map(a => a.name).join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-32">
                    {meeting.status === "confirmed" && meeting.meetingLink && (
                      <Button className="bg-gradient-to-r from-primary to-secondary" size="sm">
                        Join Meeting
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredMeetings.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No meetings found</h3>
              <p className="text-muted-foreground mb-4">
                {viewMode === "upcoming" ? "You don't have any upcoming meetings." : "No meetings match your current filter."}
              </p>
              <Button className="bg-gradient-to-r from-primary to-secondary">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Your First Meeting
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Meetings;