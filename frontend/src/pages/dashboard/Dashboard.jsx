import { CalendarDays, DollarSign, Users, TrendingUp, Plus, Download, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Revenue",
      value: "$24,582",
      change: "+12.5%",
      icon: DollarSign,
      trend: "up"
    },
    {
      title: "Events This Month",
      value: "18",
      change: "+3",
      icon: CalendarDays,
      trend: "up"
    },
    {
      title: "Total Attendees",
      value: "2,847",
      change: "+18.2%",
      icon: Users,
      trend: "up"
    },
    {
      title: "Engagement Rate",
      value: "87.3%",
      change: "+5.1%",
      icon: TrendingUp,
      trend: "up"
    }
  ];

  const recentEvents = [
    {
      id: 1,
      title: "Tech Conference 2024",
      date: "March 15, 2024",
      attendees: 450,
      revenue: "$12,500",
      status: "live",
      image: "/api/placeholder/60/60"
    },
    {
      id: 2,
      title: "Startup Networking Mixer",
      date: "March 20, 2024",
      attendees: 120,
      revenue: "$3,200",
      status: "upcoming",
      image: "/api/placeholder/60/60"
    },
    {
      id: 3,
      title: "Digital Marketing Workshop",
      date: "March 8, 2024",
      attendees: 85,
      revenue: "$2,850",
      status: "completed",
      image: "/api/placeholder/60/60"
    },
    {
      id: 4,
      title: "AI Innovation Summit",
      date: "March 25, 2024",
      attendees: 380,
      revenue: "$15,000",
      status: "upcoming",
      image: "/api/placeholder/60/60"
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: "New registration for Tech Conference 2024",
      user: "Alex Johnson",
      time: "5 minutes ago",
      avatar: "/api/placeholder/32/32"
    },
    {
      id: 2,
      action: "Payment received for Startup Networking Mixer",
      user: "Maria Garcia",
      time: "12 minutes ago",
      avatar: "/api/placeholder/32/32"
    },
    {
      id: 3,
      action: "Event published: AI Innovation Summit",
      user: "You",
      time: "1 hour ago",
      avatar: "/api/placeholder/32/32"
    },
    {
      id: 4,
      action: "Refund processed for Digital Marketing Workshop",
      user: "System",
      time: "2 hours ago",
      avatar: "/api/placeholder/32/32"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'live': return 'Live';
      case 'upcoming': return 'Upcoming';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Organizer Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, Sara! Here's what's happening with your events.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-primary to-secondary">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className={`text-xs flex items-center gap-1 ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-3 w-3" />
                {stat.change} from last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Events */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Recent Events
            </CardTitle>
            <CardDescription>
              Your latest event activity and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={event.image} alt={event.title} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                      {event.title.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{event.title}</h4>
                      <Badge variant="secondary" className={`${getStatusColor(event.status)} text-white px-2 py-1 text-xs`}>
                        {getStatusText(event.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.attendees} attendees
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {event.revenue}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.avatar} alt={activity.user} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs">
                      {activity.user.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{activity.user}</span>
                      <span>•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-2 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="text-center">Quick Actions</CardTitle>
          <CardDescription className="text-center">
            Common tasks to manage your events efficiently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-primary/10">
              <Plus className="h-6 w-6" />
              <span>Create Event</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-primary/10">
              <Download className="h-6 w-6" />
              <span>Export Reports</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-primary/10">
              <Users className="h-6 w-6" />
              <span>Manage Attendees</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-primary/10">
              <TrendingUp className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;