import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Camera } from "lucide-react";

export default function AvatarCard({ name, location, avatarUrl, initials, extras, onChangeAvatar }) {
  return (
    <Card className="text-center">
      <CardHeader>
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-primary/20">
              <AvatarImage src={avatarUrl || "/placeholder-avatar.jpg"} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-2xl">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg"
              title="Change avatar"
              onClick={onChangeAvatar}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardTitle className="text-2xl">{name || "Your name"}</CardTitle>
        <CardDescription className="flex items-center justify-center gap-1">
          <MapPin className="h-4 w-4" />
          {location || "Add your location"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">{extras}</CardContent>
    </Card>
  );
}
