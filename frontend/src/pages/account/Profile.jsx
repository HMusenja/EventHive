import { useState } from "react";
import { Camera, MapPin, Briefcase, GraduationCap, Heart, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const Profile = () => {
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    bio: "Passionate developer and tech enthusiast looking to connect with like-minded professionals.",
    location: "San Francisco, CA",
    company: "TechCorp Inc.",
    role: "Senior Developer",
    education: "Computer Science, Stanford University",
    interests: ["JavaScript", "React", "Node.js", "AI/ML", "Blockchain"],
    skills: ["Full Stack Development", "UI/UX Design", "Project Management", "Public Speaking"],
    goals: ["Career Growth", "Networking", "Learning", "Mentoring"]
  });

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayAdd = (field, value) => {
    if (value.trim() && !profile[field].includes(value.trim())) {
      setProfile(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const handleArrayRemove = (field, index) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const TagSection = ({ title, items, field, placeholder, icon: Icon, color }) => {
    const [newItem, setNewItem] = useState("");
    
    return (
      <Card className="border-l-4" style={{ borderLeftColor: `var(--${color})` }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" style={{ color: `var(--${color})` }} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleArrayRemove(field, index)}
              >
                {item} ×
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={placeholder}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleArrayAdd(field, newItem);
                  setNewItem("");
                }
              }}
            />
            <Button 
              type="button" 
              onClick={() => {
                handleArrayAdd(field, newItem);
                setNewItem("");
              }}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          My Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture & Basic Info */}
        <div className="lg:col-span-1">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-2xl">
                      {profile.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-2xl">{profile.name}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-1">
                <MapPin className="h-4 w-4" />
                {profile.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>{profile.role} at {profile.company}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span>{profile.education}</span>
              </div>
              <Separator />
              <p className="text-sm text-left">{profile.bio}</p>
            </CardContent>
          </Card>
        </div>

        {/* Personal Information Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your basic profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profile.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    value={profile.education}
                    onChange={(e) => handleInputChange('education', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={profile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                />
              </div>

              <Button className="w-full bg-gradient-to-r from-primary to-secondary">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Interests, Skills, and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TagSection
          title="Interests"
          items={profile.interests}
          field="interests"
          placeholder="Add an interest..."
          icon={Heart}
          color="primary"
        />
        
        <TagSection
          title="Skills"
          items={profile.skills}
          field="skills"
          placeholder="Add a skill..."
          icon={Briefcase}
          color="secondary"
        />
        
        <TagSection
          title="Goals"
          items={profile.goals}
          field="goals"
          placeholder="Add a goal..."
          icon={Target}
          color="accent"
        />
      </div>
    </div>
  );
};

export default Profile;