import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Droplets, Plus, Minus, CheckCircle2 } from "lucide-react";

interface HydrationData {
  total_ml: number;
  total_liters: string;
  distribution: { period: string; amount_ml: number }[];
  tip: string;
}

interface HydrationCardProps {
  hydration: HydrationData;
  showTracker?: boolean;
}

export function HydrationCard({ hydration, showTracker = false }: HydrationCardProps) {
  const [consumed, setConsumed] = useState(0);

  // Load from localStorage
  useEffect(() => {
    if (!showTracker) return;
    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(`water_${today}`);
    if (stored) setConsumed(Number(stored));
  }, [showTracker]);

  const addWater = (ml: number) => {
    const newVal = Math.max(0, consumed + ml);
    setConsumed(newVal);
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(`water_${today}`, String(newVal));
  };

  const progress = Math.min(100, (consumed / hydration.total_ml) * 100);
  const completed = consumed >= hydration.total_ml;

  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          <p className="text-sm font-semibold">Hidratação Diária Recomendada</p>
        </div>

        <div className="text-center py-1">
          <div className="text-2xl font-bold text-blue-600">{hydration.total_liters}L</div>
          <p className="text-xs text-muted-foreground">
            ({hydration.total_ml}ml por dia)
          </p>
        </div>

        {showTracker && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {consumed}ml / {hydration.total_ml}ml
              </span>
              {completed && (
                <span className="flex items-center gap-1 text-green-600 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Meta atingida!
                </span>
              )}
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => addWater(-250)}
                disabled={consumed === 0}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                onClick={() => addWater(250)}
              >
                <Plus className="h-3.5 w-3.5" />
                250ml
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => addWater(500)}
              >
                <Plus className="h-3.5 w-3.5" />
                500ml
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          {hydration.distribution.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs bg-blue-500/10 rounded-md px-3 py-1.5">
              <span className="text-muted-foreground">{d.period}</span>
              <span className="font-semibold text-blue-600">{d.amount_ml}ml</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          💧 {hydration.tip}
        </p>
      </CardContent>
    </Card>
  );
}

export function parseHydrationFromDescription(description: string | null): { text: string; hydration: HydrationData | null } {
  if (!description) return { text: "", hydration: null };
  try {
    const parsed = JSON.parse(description);
    if (parsed.hydration) {
      return { text: parsed.text || "", hydration: parsed.hydration };
    }
  } catch {
    // Not JSON, just plain text
  }
  return { text: description, hydration: null };
}
