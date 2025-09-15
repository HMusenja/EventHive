// src/pages/Analytics.jsx
import { BarChart3, Users, Eye, Clock, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

function Analytics() {
  const keyMetrics = [
    { title: "Total Page Views", value: "125,847", change: "+15.3%", icon: Eye, trend: "up" },
    { title: "Event Engagement", value: "87.3%", change: "+5.1%", icon: TrendingUp, trend: "up" },
    { title: "Avg. Session Time", value: "4m 32s", change: "+12.8%", icon: Clock, trend: "up" },
    { title: "Conversion Rate", value: "3.2%", change: "+0.8%", icon: BarChart3, trend: "up" },
  ];

  const eventPerformance = [
    { id: 1, title: "Tech Conference 2024", views: 15420, registrations: 450, conversionRate: 2.9, engagement: 89, revenue: "$12,500" },
    { id: 2, title: "AI Innovation Summit", views: 18650, registrations: 380, conversionRate: 2.0, engagement: 92, revenue: "$15,000" },
    { id: 3, title: "Startup Networking Mixer", views: 8940, registrations: 120, conversionRate: 1.3, engagement: 85, revenue: "$3,200" },
    { id: 4, title: "Digital Marketing Workshop", views: 6280, registrations: 85, conversionRate: 1.4, engagement: 78, revenue: "$2,850" },
  ];

  const audienceInsights = [
    {
      category: "Age Groups",
      data: [
        { label: "18-24", value: 15, color: "bg-blue-500" },
        { label: "25-34", value: 35, color: "bg-green-500" },
        { label: "35-44", value: 28, color: "bg-yellow-500" },
        { label: "45-54", value: 18, color: "bg-orange-500" },
        { label: "55+", value: 4, color: "bg-red-500" },
      ],
    },
    {
      category: "Interests",
      data: [
        { label: "Technology", value: 42, color: "bg-purple-500" },
        { label: "Business", value: 28, color: "bg-indigo-500" },
        { label: "Marketing", value: 18, color: "bg-pink-500" },
        { label: "Design", value: 12, color: "bg-teal-500" },
      ],
    },
  ];

  const topPerformers = [
    { id: 1, title: "AI Innovation Summit", metric: "Highest Engagement", value: "92%", avatar: "/api/placeholder/40/40" },
    { id: 2, title: "Tech Conference 2024", metric: "Most Registrations", value: "450", avatar: "/api/placeholder/40/40" },
    { id: 3, title: "AI Innovation Summit", metric: "Highest Revenue", value: "$15,000", avatar: "/api/placeholder/40/40" },
    { id: 4, title: "Tech Conference 2024", metric: "Most Page Views", value: "15.4K", avatar: "/api/placeholder/40/40" },
  ];

  const recentActivity = [
    { id: 1, action: "New registration peak detected", event: "AI Innovation Summit", time: "2 hours ago", type: "spike" },
    { id: 2, action: "Engagement rate increased", event: "Tech Conference 2024", time: "4 hours ago", type: "improvement" },
    { id: 3, action: "Traffic source changed", event: "Startup Networking Mixer", time: "6 hours ago", type: "change" },
    { id: 4, action: "Conversion rate optimized", event: "Digital Marketing Workshop", time: "8 hours ago", type: "improvement" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Analytics & Insights
          </h1>
          <p className="text-muted-foreground mt-2">
            Deep dive into your event performance and audience behavior
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-primary to-secondary">
            <BarChart3 className="h-4 w-4 mr-2" />
            Custom Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric) => (
          <Card key={metric.title} className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div
                className={`text-xs flex items-center gap-1 ${
                  metric.trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                <TrendingUp className="h-3 w-3" />
                {metric.change} from last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Event Performance */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Event Performance
            </CardTitle>
            <CardDescription>Detailed metrics for each event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {eventPerformance.map((event) => (
                <div key={event.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{event.title}</h4>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {event.revenue}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Page Views</p>
                      <p className="font-semibold">{event.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Registrations</p>
                      <p className="font-semibold">{event.registrations}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Conversion Rate</p>
                      <p className="font-semibold">{event.conversionRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Engagement</p>
                      <p className="font-semibold">{event.engagement}%</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Engagement Score</span>
                      <span>{event.engagement}%</span>
                    </div>
                    <Progress value={event.engagement} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audience Insights */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Audience Insights
            </CardTitle>
            <CardDescription>Demographics and interest breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {audienceInsights.map((insight) => (
                <div key={insight.category} className="space-y-3">
                  <h4 className="font-semibold">{insight.category}</h4>
                  <div className="space-y-2">
                    {insight.data.map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="flex-1 text-sm">{item.label}</span>
                        <span className="text-sm font-semibold">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performers */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Performers
            </CardTitle>
            <CardDescription>Events leading in key metrics</CardDescription>
          </CardHeader>
        <CardContent>
            <div className="space-y-4">
              {topPerformers.map((performer) => (
                <div
                  key={performer.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={performer.avatar} alt={performer.title} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                      {performer.title.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{performer.title}</h4>
                    <p className="text-sm text-muted-foreground">{performer.metric}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-primary">{performer.value}</p>
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
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest analytics insights and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === "spike"
                        ? "bg-red-500"
                        : activity.type === "improvement"
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.event}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Analytics;
