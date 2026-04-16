import { Card, CardContent } from "@/components/ui/card";
import { Flame, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
  currentStreak: number;
  totalWorkouts: number;
  totalAchievements: number;
}

export function StreakCounter({ currentStreak, totalWorkouts, totalAchievements }: StreakCounterProps) {
  const streakLevel = currentStreak >= 14 ? 'fire' : currentStreak >= 7 ? 'warm' : 'cool';
  
  return (
    <div className="grid grid-cols-3 gap-3 animate-fade-in">
      <Card className={cn(
        "transition-all duration-300",
        streakLevel === 'fire' && "border-orange-500/30 bg-orange-500/5",
        streakLevel === 'warm' && "border-amber-500/20 bg-amber-500/5",
      )}>
        <CardContent className="p-3 text-center">
          <Flame className={cn(
            "w-5 h-5 mx-auto mb-1.5 transition-all",
            streakLevel === 'fire' ? "text-orange-500 animate-pulse" : 
            streakLevel === 'warm' ? "text-amber-500" : "text-muted-foreground"
          )} />
          <p className={cn(
            "text-2xl font-bold tabular-nums transition-all",
            streakLevel === 'fire' ? "text-orange-500" : 
            streakLevel === 'warm' ? "text-amber-500" : "text-foreground"
          )}>
            {currentStreak}
          </p>
          <p className="text-[10px] text-muted-foreground">dias seguidos</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 text-center">
          <Target className="w-5 h-5 mx-auto mb-1.5 text-primary" />
          <p className="text-2xl font-bold text-foreground tabular-nums">{totalWorkouts}</p>
          <p className="text-[10px] text-muted-foreground">treinos</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1.5 text-primary" />
          <p className="text-2xl font-bold text-foreground tabular-nums">{totalAchievements}</p>
          <p className="text-[10px] text-muted-foreground">conquistas</p>
        </CardContent>
      </Card>
    </div>
  );
}
