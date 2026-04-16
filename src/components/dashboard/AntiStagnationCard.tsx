import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, ArrowUp, Zap, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseProgress {
  exerciseName: string;
  trend: 'progressing' | 'stagnated' | 'declining' | 'insufficient';
  lastWeight: number;
  suggestedWeight: number | null;
  changePercent: number;
}

interface AntiStagnationCardProps {
  overallStatus: 'progressing' | 'stagnated' | 'declining' | 'new';
  message: string;
  exerciseProgress: ExerciseProgress[];
  averageFrequency: number;
  totalSessions: number;
}

const statusConfig = {
  progressing: {
    icon: TrendingUp,
    label: 'Evoluindo',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  stagnated: {
    icon: AlertTriangle,
    label: 'Ajuste necessário',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  declining: {
    icon: TrendingDown,
    label: 'Atenção',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  new: {
    icon: Zap,
    label: 'Iniciando',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
};

const trendIcon = {
  progressing: <ArrowUp className="w-3.5 h-3.5 text-green-500" />,
  stagnated: <Minus className="w-3.5 h-3.5 text-amber-500" />,
  declining: <TrendingDown className="w-3.5 h-3.5 text-red-500" />,
  insufficient: <Minus className="w-3.5 h-3.5 text-muted-foreground" />,
};

export function AntiStagnationCard({
  overallStatus,
  message,
  exerciseProgress,
  averageFrequency,
  totalSessions,
}: AntiStagnationCardProps) {
  const config = statusConfig[overallStatus];
  const StatusIcon = config.icon;

  // Show only exercises with actionable insights (max 4)
  const actionableExercises = exerciseProgress
    .filter(e => e.trend === 'stagnated' || e.trend === 'progressing' || e.trend === 'declining')
    .slice(0, 4);

  return (
    <Card className={cn("border", config.border)}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", config.bg)}>
            <StatusIcon className={cn("w-5 h-5", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm text-foreground">Sistema Anti-Estagnação</h3>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.color)}>
                {config.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{totalSessions}</p>
            <p className="text-[10px] text-muted-foreground">treinos/30d</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{averageFrequency}x</p>
            <p className="text-[10px] text-muted-foreground">por semana</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              {exerciseProgress.filter(e => e.trend === 'progressing').length}
            </p>
            <p className="text-[10px] text-muted-foreground">evoluindo</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              {exerciseProgress.filter(e => e.trend === 'stagnated').length}
            </p>
            <p className="text-[10px] text-muted-foreground">estagnados</p>
          </div>
        </div>

        {/* Exercise insights */}
        {actionableExercises.length > 0 && (
          <div className="space-y-2">
            {actionableExercises.map((ex) => (
              <div
                key={ex.exerciseName}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {trendIcon[ex.trend]}
                  <span className="text-xs font-medium text-foreground truncate">
                    {ex.exerciseName}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{ex.lastWeight}kg</span>
                  {ex.suggestedWeight && (
                    <span className="text-xs font-semibold text-primary">
                      → {ex.suggestedWeight}kg
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
