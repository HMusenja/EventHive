import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TagSection({ title, items, field, placeholder, icon: Icon, color, onAdd, onRemoveAt, helperText }) {
  const [val, setVal] = useState("");
  return (
    <Card className="border-l-4" style={{ borderLeftColor: `var(--${color})` }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon ? <Icon className="h-5 w-5" style={{ color: `var(--${color})` }} /> : null}
          {title}
        </CardTitle>
        {helperText ? <CardDescription>{helperText}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge
              key={`${item}-${index}`}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onRemoveAt(field, index)}
            >
              {item} ×
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onAdd(field, val);
                setVal("");
              }
            }}
          />
          <Button
            type="button"
            className="bg-gradient-to-r from-primary to-secondary"
            onClick={() => { onAdd(field, val); setVal(""); }}
          >
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
