import { Card, CardContent } from "@/components/ui/card";
import { Flame, Trophy, Target } from "lucide-react";

export function StreakCounter() {
  return (
    <div className="grid grid-cols-3 gap-3 animate-fade-in">
      <Card className="hover-scale glow-on-hover">
        <CardContent className="p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/10 mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">7</p>
          <p className="text-xs text-muted-foreground">dias</p>
        </CardContent>
      </Card>

      <Card className="hover-scale glow-on-hover">
        <CardContent className="p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">12</p>
          <p className="text-xs text-muted-foreground">treinos</p>
        </CardContent>
      </Card>

      <Card className="hover-scale glow-on-hover">
        <CardContent className="p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/10 mb-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">5</p>
          <p className="text-xs text-muted-foreground">badges</p>
        </CardContent>
      </Card>
    </div>
  );
}
