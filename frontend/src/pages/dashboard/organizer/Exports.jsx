import { Download, FileText, Users, BarChart3, Calendar, Filter, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const Exports = () => {
  const quickExports = [
    {
      id: 1,
      title: "Attendee List",
      description: "Complete list of all registered attendees",
      icon: Users,
      format: "CSV, Excel",
      estimatedSize: "2.4 MB",
      lastExported: "2 days ago"
    },
    {
      id: 2,
      title: "Sales Report",
      description: "Revenue and transaction data",
      icon: BarChart3,
      format: "PDF, Excel",
      estimatedSize: "890 KB",
      lastExported: "1 week ago"
    },
    {
      id: 3,
      title: "Event Analytics",
      description: "Performance metrics and engagement data",
      icon: FileText,
      format: "PDF, CSV",
      estimatedSize: "1.2 MB",
      lastExported: "3 days ago"
    },
    {
      id: 4,
      title: "Schedule Export",
      description: "Event calendar and scheduling information",
      icon: Calendar,
      format: "ICS, PDF",
      estimatedSize: "450 KB",
      lastExported: "1 day ago"
    }
  ];

  const customExports = [
    {
      id: 1,
      name: "Tech Conference Attendees",
      type: "Attendee Data",
      events: ["Tech Conference 2024"],
      format: "Excel",
      status: "completed",
      createdDate: "2024-03-10",
      downloadUrl: "#"
    },
    {
      id: 2,
      name: "Q1 Sales Summary",
      type: "Sales Report",
      events: ["All Events"],
      format: "PDF",
      status: "processing",
      createdDate: "2024-03-09",
      downloadUrl: null
    },
    {
      id: 3,
      name: "Networking Events Analytics",
      type: "Analytics",
      events: ["Startup Networking Mixer", "AI Innovation Summit"],
      format: "CSV",
      status: "completed",
      createdDate: "2024-03-08",
      downloadUrl: "#"
    },
    {
      id: 4,
      name: "March Events Schedule",
      type: "Schedule",
      events: ["All March Events"],
      format: "ICS",
      status: "failed",
      createdDate: "2024-03-07",
      downloadUrl: null
    }
  ];

  const exportTemplates = [
    {
      id: 1,
      name: "Standard Attendee Report",
      description: "Name, email, registration date, ticket type",
      fields: ["Name", "Email", "Registration Date", "Ticket Type", "Payment Status"]
    },
    {
      id: 2,
      name: "Detailed Sales Report",
      description: "Complete transaction history with customer details",
      fields: ["Transaction ID", "Customer", "Amount", "Date", "Event", "Status"]
    },
    {
      id: 3,
      name: "Event Performance Summary",
      description: "Key metrics and analytics for each event",
      fields: ["Event Name", "Attendees", "Revenue", "Engagement", "Conversion Rate"]
    },
    {
      id: 4,
      name: "Marketing Insights",
      description: "Traffic sources, conversion data, and demographics",
      fields: ["Traffic Source", "Conversions", "Demographics", "Engagement Time"]
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'processing': return 'Processing';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Data Exports
          </h1>
          <p className="text-muted-foreground mt-2">
            Export your event data in various formats for analysis and reporting
          </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-secondary">
          <Download className="h-4 w-4 mr-2" />
          Create Custom Export
        </Button>
      </div>

      {/* Quick Export Options */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Exports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickExports.map((exportOption) => (
            <Card key={exportOption.id} className="border-2 hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <exportOption.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{exportOption.title}</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  {exportOption.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <span>{exportOption.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{exportOption.estimatedSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last export:</span>
                    <span>{exportOption.lastExported}</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Export Builder */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Custom Export Builder
          </CardTitle>
          <CardDescription>
            Create a personalized export with specific data fields and filters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Export Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendees">Attendee Data</SelectItem>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Events</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="tech-conf">Tech Conference 2024</SelectItem>
                  <SelectItem value="ai-summit">AI Innovation Summit</SelectItem>
                  <SelectItem value="networking">Startup Networking Mixer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Format</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button className="bg-gradient-to-r from-primary to-secondary">
              Generate Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Exports */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Exports
            </CardTitle>
            <CardDescription>
              Your recently generated export files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customExports.map((exportItem) => (
                <div key={exportItem.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <FileText className="h-8 w-8 text-primary" />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{exportItem.name}</h4>
                    <p className="text-sm text-muted-foreground">{exportItem.type}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{exportItem.format}</span>
                      <span>•</span>
                      <span>{exportItem.createdDate}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`${getStatusColor(exportItem.status)} text-white px-2 py-1 text-xs`}>
                      {getStatusText(exportItem.status)}
                    </Badge>
                    {exportItem.status === 'completed' && (
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export Templates */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Export Templates
            </CardTitle>
            <CardDescription>
              Pre-configured export templates for common use cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exportTemplates.map((template) => (
                <div key={template.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{template.name}</h4>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Included Fields:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.fields.map((field, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Guidelines */}
      <Card className="border-2 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Export Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">File Formats</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• CSV: Best for data analysis and spreadsheets</li>
                <li>• Excel: Formatted reports with charts</li>
                <li>• PDF: Professional reports and presentations</li>
                <li>• JSON: API integration and development</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Export Limits</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Maximum 50,000 records per export</li>
                <li>• Files expire after 30 days</li>
                <li>• Premium accounts get priority processing</li>
                <li>• Large exports are processed in the background</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Exports;