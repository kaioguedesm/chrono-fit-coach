import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Dumbbell, Loader2 } from "lucide-react";

interface TodayWorkoutCardProps {
  planName: string | null;
  exerciseCount: number;
  isStarting: boolean;
  onStart: () => void;
  hasPlans: boolean;
  onCreatePlan?: () => void;
}

export function TodayWorkoutCard({
  planName,
  exerciseCount,
  isStarting,
  onStart,
  hasPlans,
  onCreatePlan,
}: TodayWorkoutCardProps) {
  if (!hasPlans) {
    return (
      <Card className="border-dashed border-2 border-primary/30">
        <CardContent className="p-6 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Dumbbell className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Nenhum treino ainda</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Crie seu primeiro treino para começar sua evolução
            </p>
          </div>
          {onCreatePlan && (
            <Button onClick={onCreatePlan} className="w-full" size="lg">
              Criar Treino
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Treino de hoje
              </p>
              <h3 className="font-bold text-lg text-foreground truncate">
                {planName || 'Próximo treino'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {exerciseCount} exercícios
              </p>
            </div>
          </div>

          <Button
            onClick={onStart}
            disabled={isStarting}
            className="w-full h-14 text-base font-semibold rounded-xl shadow-lg shadow-primary/20"
            size="lg"
          >
            {isStarting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Play className="w-5 h-5 mr-2" fill="currentColor" />
            )}
            {isStarting ? 'Preparando...' : 'Iniciar Treino'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
