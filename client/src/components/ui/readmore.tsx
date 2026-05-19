import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ReadMoreProps {
  text: string;
  wordLimit?: number;
}

export function ReadMore({ text, wordLimit = 100 }: ReadMoreProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const words = text.split(/\s+/);
  const isLong = words.length > wordLimit;

  const visibleText = expanded
    ? text
    : words.slice(0, wordLimit).join(" ");

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">
        {visibleText}
        {!expanded && isLong && "..."}
      </p>

      {isLong && (
        <Button Style={{ border: "1px solid", padding: "0px 6px"}}
          variant="link"
          size="sm"
          className="p-0 h-auto"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Read more"}
        </Button>
      )}
    </div>
  );
}
