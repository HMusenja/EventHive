import { useState } from "react";
import { Shield, Bell, User, Eye, EyeOff, Smartphone, Mail, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    // Security settings
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactor: true,
    
    // Notification settings
    emailNotifications: {
      newMatches: true,
      meetingReminders: true,
      eventUpdates: true,
      newsletter: false,
      promotions: false
    },
    pushNotifications: {
      enabled: true,
      newMatches: true,
      meetingReminders: true,
      eventAlerts: true
    },
    
    // Privacy settings
    profileVisibility: "public",
    showLocation: true,
    showEmail: false,
    allowMessages: true,
    
    // Account settings
    language: "en",
    timezone: "PST",
    theme: "system"
  });

  const updateSetting = (category, key, value) => {
    if (category) {
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account preferences and security settings
        </p>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPassword ? "text" : "password"}
                      value={settings.currentPassword}
                      onChange={(e) => updateSetting(null, "currentPassword", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={settings.newPassword}
                    onChange={(e) => updateSetting(null, "newPassword", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={settings.confirmPassword}
                    onChange={(e) => updateSetting(null, "confirmPassword", e.target.value)}
                  />
                </div>

                <Button className="bg-gradient-to-r from-primary to-secondary">
                  Update Password
                </Button>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Enable 2FA</p>
                    <p className="text-sm text-muted-foreground">
                      Secure your account with two-factor authentication
                    </p>
                  </div>
                  <Switch
                    checked={settings.twoFactor}
                    onCheckedChange={(checked) => updateSetting(null, "twoFactor", checked)}
                  />
                </div>

                {settings.twoFactor && (
                  <div className="p-4 bg-muted rounded-lg space-y-4">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Authenticator App</p>
                        <p className="text-sm text-muted-foreground">
                          Use Google Authenticator or similar apps
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Setup Authenticator
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Login Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Manage where you're logged in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">
                        Chrome on MacOS • San Francisco, CA
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last active: Now
                      </p>
                    </div>
                    <Badge className="bg-gradient-to-r from-green-400 to-green-600 text-white">
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Mobile App</p>
                      <p className="text-sm text-muted-foreground">
                        iPhone • San Francisco, CA
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last active: 2 hours ago
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="text-destructive">
                      End Session
                    </Button>
                  </div>

                  <Button variant="outline" className="w-full text-destructive">
                    Sign Out All Devices
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="space-y-6">
            {/* Email Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Choose what email notifications you'd like to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries({
                  newMatches: "New matches found",
                  meetingReminders: "Meeting reminders",
                  eventUpdates: "Event updates and announcements",
                  newsletter: "Weekly newsletter",
                  promotions: "Promotional offers"
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about {label.toLowerCase()}
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications[key]}
                      onCheckedChange={(checked) => 
                        updateSetting("emailNotifications", key, checked)
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Push Notifications
                </CardTitle>
                <CardDescription>
                  Configure mobile and browser push notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Enable Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Allow notifications to be sent to your device
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications.enabled}
                    onCheckedChange={(checked) => 
                      updateSetting("pushNotifications", "enabled", checked)
                    }
                  />
                </div>

                {settings.pushNotifications.enabled && (
                  <>
                    <Separator />
                    {Object.entries({
                      newMatches: "New matches",
                      meetingReminders: "Meeting reminders",
                      eventAlerts: "Event alerts"
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <p className="font-medium">{label}</p>
                        <Switch
                          checked={settings.pushNotifications[key]}
                          onCheckedChange={(checked) => 
                            updateSetting("pushNotifications", key, checked)
                          }
                        />
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <div className="space-y-6">
            {/* Profile Visibility */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Visibility
                </CardTitle>
                <CardDescription>
                  Control who can see your profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Visibility</Label>
                  <Select 
                    value={settings.profileVisibility} 
                    onValueChange={(value) => updateSetting(null, "profileVisibility", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can see</SelectItem>
                      <SelectItem value="members">Members only</SelectItem>
                      <SelectItem value="connections">Connections only</SelectItem>
                      <SelectItem value="private">Private - Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Show Location</p>
                      <p className="text-sm text-muted-foreground">
                        Display your city and state on your profile
                      </p>
                    </div>
                    <Switch
                      checked={settings.showLocation}
                      onCheckedChange={(checked) => updateSetting(null, "showLocation", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Show Email</p>
                      <p className="text-sm text-muted-foreground">
                        Allow others to see your email address
                      </p>
                    </div>
                    <Switch
                      checked={settings.showEmail}
                      onCheckedChange={(checked) => updateSetting(null, "showEmail", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Allow Messages</p>
                      <p className="text-sm text-muted-foreground">
                        Let other users send you direct messages
                      </p>
                    </div>
                    <Switch
                      checked={settings.allowMessages}
                      onCheckedChange={(checked) => updateSetting(null, "allowMessages", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Manage your personal data and account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  Download My Data
                </Button>
                <Button variant="outline" className="w-full text-destructive">
                  Delete Account
                </Button>
                <p className="text-sm text-muted-foreground">
                  Note: Account deletion is permanent and cannot be undone.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general">
          <div className="space-y-6">
            {/* Language & Region */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Language & Region
                </CardTitle>
                <CardDescription>
                  Set your preferred language and timezone
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select 
                      value={settings.language} 
                      onValueChange={(value) => updateSetting(null, "language", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select 
                      value={settings.timezone} 
                      onValueChange={(value) => updateSetting(null, "timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PST">Pacific Standard Time</SelectItem>
                        <SelectItem value="MST">Mountain Standard Time</SelectItem>
                        <SelectItem value="CST">Central Standard Time</SelectItem>
                        <SelectItem value="EST">Eastern Standard Time</SelectItem>
                        <SelectItem value="UTC">Coordinated Universal Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the application looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select 
                    value={settings.theme} 
                    onValueChange={(value) => updateSetting(null, "theme", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred theme or follow system settings
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>
                  Manage your account status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  Deactivate Account
                </Button>
                <p className="text-sm text-muted-foreground">
                  Temporarily deactivate your account. You can reactivate it anytime.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;