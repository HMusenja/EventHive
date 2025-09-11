import { Card, CardContent } from "@/components/ui/card";

export default function PeopleCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 flex gap-4">
        <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 bg-muted rounded animate-pulse" />
          <div className="h-3 w-full bg-muted rounded animate-pulse" />
          <div className="h-3 w-3/5 bg-muted rounded animate-pulse" />
          <div className="flex gap-2 pt-1">
            <div className="h-5 w-16 bg-muted rounded animate-pulse" />
            <div className="h-5 w-14 bg-muted rounded animate-pulse" />
            <div className="h-5 w-12 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
