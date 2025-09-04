import { useState } from "react";
import { Heart, MessageCircle, Calendar, MapPin, Briefcase, Star, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Matches = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");

  const mockMatches = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Product Manager",
      company: "Google",
      location: "Mountain View, CA",
      avatar: "/placeholder-avatar-1.jpg",
      matchScore: 92,
      bio: "Passionate about building products that make a difference. Love hiking and photography in my free time.",
      interests: ["Product Strategy", "UX Design", "Hiking", "Photography"],
      skills: ["Product Management", "Analytics", "Leadership"],
      mutualConnections: 5,
      status: "new"
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Senior Developer",
      company: "Meta",
      location: "Menlo Park, CA",
      avatar: "/placeholder-avatar-2.jpg",
      matchScore: 89,
      bio: "Full-stack developer with a passion for clean code and innovative solutions. Always learning new technologies.",
      interests: ["Machine Learning", "React", "Gaming", "Cooking"],
      skills: ["JavaScript", "Python", "System Design"],
      mutualConnections: 3,
      status: "viewed"
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      role: "UX Designer",
      company: "Airbnb",
      location: "San Francisco, CA",
      avatar: "/placeholder-avatar-3.jpg",
      matchScore: 86,
      bio: "Creative designer focused on user-centered design. Love traveling and experiencing different cultures.",
      interests: ["Design Systems", "Travel", "Art", "Yoga"],
      skills: ["Figma", "User Research", "Prototyping"],
      mutualConnections: 8,
      status: "connected"
    },
    {
      id: 4,
      name: "David Kim",
      role: "Data Scientist",
      company: "Netflix",
      location: "Los Gatos, CA",
      avatar: "/placeholder-avatar-4.jpg",
      matchScore: 84,
      bio: "Data enthusiast who loves turning numbers into insights. Passionate about AI and its applications.",
      interests: ["AI/ML", "Statistics", "Music", "Rock Climbing"],
      skills: ["Python", "R", "Machine Learning"],
      mutualConnections: 2,
      status: "new"
    },
    {
      id: 5,
      name: "Lisa Wang",
      role: "Marketing Director",
      company: "Spotify",
      location: "San Francisco, CA",
      avatar: "/placeholder-avatar-5.jpg",
      matchScore: 81,
      bio: "Creative marketer with a focus on growth and brand building. Love music and discovering new artists.",
      interests: ["Digital Marketing", "Music", "Podcasts", "Running"],
      skills: ["Growth Marketing", "Brand Strategy", "Analytics"],
      mutualConnections: 6,
      status: "viewed"
    },
    {
      id: 6,
      name: "Alex Thompson",
      role: "Engineering Manager",
      company: "Stripe",
      location: "San Francisco, CA",
      avatar: "/placeholder-avatar-6.jpg",
      matchScore: 78,
      bio: "Engineering leader passionate about building great teams and scalable systems. Love mentoring and coffee.",
      interests: ["Leadership", "Mentoring", "Coffee", "Cycling"],
      skills: ["Team Leadership", "System Architecture", "Mentoring"],
      mutualConnections: 4,
      status: "connected"
    }
  ];

  const filteredMatches = mockMatches.filter(match => {
    const matchesSearch = match.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         match.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         match.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterBy === "all" || match.status === filterBy;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "new": return "bg-gradient-to-r from-green-400 to-green-600";
      case "viewed": return "bg-gradient-to-r from-blue-400 to-blue-600";
      case "connected": return "bg-gradient-to-r from-purple-400 to-purple-600";
      default: return "bg-gradient-to-r from-gray-400 to-gray-600";
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            My Matches
          </h1>
          <p className="text-muted-foreground">
            Discover and connect with like-minded professionals
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search matches by name, role, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Matches</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Match Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Total Matches</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{mockMatches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Connected</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {mockMatches.filter(m => m.status === "connected").length}
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
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Avg Match Score</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {Math.round(mockMatches.reduce((sum, m) => sum + m.matchScore, 0) / mockMatches.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMatches.map((match) => (
          <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage src={match.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-lg">
                      {match.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{match.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Briefcase className="h-3 w-3" />
                      {match.role} at {match.company}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {match.location}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={`${getStatusColor(match.status)} text-white border-0`}>
                    {match.status}
                  </Badge>
                  <div className={`text-sm font-semibold ${getMatchScoreColor(match.matchScore)}`}>
                    {match.matchScore}% match
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {match.bio}
              </p>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {match.interests.slice(0, 3).map((interest, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                  {match.interests.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{match.interests.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  {match.mutualConnections} mutual connections
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-primary to-secondary"
                  disabled={match.status === "connected"}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {match.status === "connected" ? "Connected" : "Message"}
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMatches.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No matches found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters to find more matches.
          </p>
        </div>
      )}
    </div>
  );
};

export default Matches;