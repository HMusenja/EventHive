import { DollarSign, TrendingUp, CreditCard, RefreshCw, Calendar, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Sales = () => {
  const salesStats = [
    {
      title: "Total Revenue",
      value: "$34,582",
      change: "+12.5%",
      icon: DollarSign,
      trend: "up"
    },
    {
      title: "This Month",
      value: "$8,240",
      change: "+18.2%",
      icon: TrendingUp,
      trend: "up"
    },
    {
      title: "Transactions",
      value: "1,248",
      change: "+5.1%",
      icon: CreditCard,
      trend: "up"
    },
    {
      title: "Refunds",
      value: "$432",
      change: "-2.3%",
      icon: RefreshCw,
      trend: "down"
    }
  ];

  const topEvents = [
    {
      id: 1,
      title: "AI Innovation Summit",
      revenue: "$15,000",
      tickets: 380,
      avgPrice: "$125",
      growth: "+23%"
    },
    {
      id: 2,
      title: "Tech Conference 2024",
      revenue: "$12,500",
      tickets: 450,
      avgPrice: "$89",
      growth: "+15%"
    },
    {
      id: 3,
      title: "Startup Networking Mixer",
      revenue: "$3,200",
      tickets: 120,
      avgPrice: "$45",
      growth: "+8%"
    },
    {
      id: 4,
      title: "Digital Marketing Workshop",
      revenue: "$2,850",
      tickets: 85,
      avgPrice: "$65",
      growth: "+12%"
    }
  ];

  const recentTransactions = [
    {
      id: "TXN-001",
      customer: "Alex Johnson",
      event: "Tech Conference 2024",
      amount: "$89.00",
      status: "completed",
      date: "2024-03-10",
      avatar: "/api/placeholder/32/32"
    },
    {
      id: "TXN-002",
      customer: "Maria Garcia",
      event: "AI Innovation Summit",
      amount: "$125.00",
      status: "completed",
      date: "2024-03-10",
      avatar: "/api/placeholder/32/32"
    },
    {
      id: "TXN-003",
      customer: "David Chen",
      event: "Startup Networking Mixer",
      amount: "$45.00",
      status: "pending",
      date: "2024-03-09",
      avatar: "/api/placeholder/32/32"
    },
    {
      id: "TXN-004",
      customer: "Sarah Wilson",
      event: "Digital Marketing Workshop",
      amount: "$65.00",
      status: "completed",
      date: "2024-03-09",
      avatar: "/api/placeholder/32/32"
    },
    {
      id: "TXN-005",
      customer: "Mike Brown",
      event: "Tech Conference 2024",
      amount: "$89.00",
      status: "refunded",
      date: "2024-03-08",
      avatar: "/api/placeholder/32/32"
    },
    {
      id: "TXN-006",
      customer: "Emma Davis",
      event: "AI Innovation Summit",
      amount: "$125.00",
      status: "completed",
      date: "2024-03-08",
      avatar: "/api/placeholder/32/32"
    },
    {
      id: "TXN-007",
      customer: "Tom Rodriguez",
      event: "Startup Networking Mixer",
      amount: "$45.00",
      status: "completed",
      date: "2024-03-07",
      avatar: "/api/placeholder/32/32"
    },
    {
      id: "TXN-008",
      customer: "Lisa Anderson",
      event: "Digital Marketing Workshop",
      amount: "$65.00",
      status: "pending",
      date: "2024-03-07",
      avatar: "/api/placeholder/32/32"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'refunded': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'refunded': return 'Refunded';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Sales & Revenue
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your event sales performance and revenue analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Sales Data
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-primary to-secondary">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Sales Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {salesStats.map((stat) => (
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
        {/* Top Performing Events */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Performing Events
            </CardTitle>
            <CardDescription>
              Events generating the highest revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topEvents.map((event, index) => (
                <div key={event.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold text-sm">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{event.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {event.revenue}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.tickets} tickets
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {event.avgPrice} avg
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {event.growth}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart Placeholder */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Monthly Revenue Trend
            </CardTitle>
            <CardDescription>
              Revenue performance over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-primary mb-4" />
                <p className="text-muted-foreground">Revenue Chart</p>
                <p className="text-sm text-muted-foreground">Interactive chart would go here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Recent Transactions
          </CardTitle>
          <CardDescription>
            Latest payment activity and transaction history
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={transaction.avatar} alt={transaction.customer} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs">
                          {transaction.customer.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{transaction.customer}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-48 truncate">{transaction.event}</TableCell>
                  <TableCell className="font-mono font-semibold">{transaction.amount}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${getStatusColor(transaction.status)} text-white px-2 py-1 text-xs`}>
                      {getStatusText(transaction.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{transaction.date}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{transaction.id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;