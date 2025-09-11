import { memo } from "react";
import { Button } from "@/components/ui/button";

function TagChips({ tags = [], selected, onSelect }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={selected ? "outline" : "default"}
        onClick={() => onSelect(null)}
        aria-pressed={!selected}
      >
        All
      </Button>
      {tags.map(([tag, count]) => (
        <Button
          key={tag}
          size="sm"
          variant={selected === tag ? "default" : "outline"}
          onClick={() => onSelect(tag)}
          aria-pressed={selected === tag}
          title={`${count} suggestion${count === 1 ? "" : "s"} include ${tag}`}
        >
          {tag}
          <span className="ml-1 text-xs text-muted-foreground">({count})</span>
        </Button>
      ))}
    </div>
  );
}

export default memo(TagChips);
