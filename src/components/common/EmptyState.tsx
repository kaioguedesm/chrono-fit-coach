import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  motivation?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  motivation
}: EmptyStateProps) {
  return (
    <Card className="border-dashed animate-fade-in">
      <CardContent className="flex flex-col items-center justify-center text-center py-12 px-4">
        <div className="rounded-full bg-primary/10 p-4 mb-4 animate-scale-in">
          <Icon className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
        
        {motivation && (
          <p className="text-xs text-primary font-medium mb-6 italic">💪 {motivation}</p>
        )}
        
        {actionLabel && onAction && (
          <Button onClick={onAction} className="animate-slide-up">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
