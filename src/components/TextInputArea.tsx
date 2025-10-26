import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TextInputArea({ value, onChange, disabled }: TextInputAreaProps) {
  const charCount = value.length;
  const isValid = charCount >= 1000 && charCount <= 10000;
  const showError = charCount > 0 && !isValid;

  return (
    <div className="space-y-2">
      <Label htmlFor="source-text">Source Text</Label>

      <Textarea
        id="source-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste your text here (1000-10000 characters)"
        className={cn("min-h-[200px] max-h-[200px] resize-y", showError && "border-red-500 focus-visible:ring-red-500")}
      />

      <div className={cn("text-sm", showError ? "text-red-500" : "text-muted-foreground")}>
        {charCount} / 10000 characters
        {showError && (
          <span className="ml-2">
            {charCount < 1000 ? "(Minimum 1000 characters required)" : "(Maximum 10000 characters exceeded)"}
          </span>
        )}
      </div>
    </div>
  );
}
