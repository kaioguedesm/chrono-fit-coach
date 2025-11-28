import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface WorkoutRefreshAlertProps {
  workoutName: string;
  completedWorkouts: number;
  maxWorkouts: number;
  needsRefresh: boolean;
  onRefresh?: () => void;
}

export const WorkoutRefreshAlert = ({
  workoutName,
  completedWorkouts,
  maxWorkouts,
  needsRefresh,
  onRefresh,
}: WorkoutRefreshAlertProps) => {
  const progressPercentage = (completedWorkouts / maxWorkouts) * 100;
  const workoutsRemaining = Math.max(0, maxWorkouts - completedWorkouts);

  if (needsRefresh) {
    return (
      <Alert variant="destructive" className="border-2">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">
          Treino Precisa ser Atualizado!
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p>
            Você completou <strong>{completedWorkouts} treinos</strong> com o plano{" "}
            <strong>"{workoutName}"</strong>. Para continuar progredindo, é
            recomendado atualizar seu treino.
          </p>
          <p className="text-sm text-muted-foreground">
            Seu corpo já se adaptou a este treino. Criar um novo plano ajudará
            você a continuar evoluindo e evitar platôs.
          </p>
          {onRefresh && (
            <Button
              onClick={onRefresh}
              className="w-full mt-2"
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Renovar Treino Agora
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Warning when getting close to limit
  if (progressPercentage >= 80) {
    return (
      <Alert className="border-warning bg-warning/10">
        <AlertCircle className="h-5 w-5 text-warning" />
        <AlertTitle className="text-warning">
          Quase na hora de renovar!
        </AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            Faltam apenas <strong>{workoutsRemaining} treinos</strong> para
            completar o ciclo do plano "{workoutName}".
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso do Ciclo</span>
              <span className="font-bold">
                {completedWorkouts}/{maxWorkouts}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Regular progress indicator
  return (
    <div className="space-y-2 p-4 rounded-lg bg-muted/50">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Progresso do Ciclo de Treino</span>
        <span className="font-semibold">
          {completedWorkouts}/{maxWorkouts}
        </span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {workoutsRemaining} treinos restantes até a renovação recomendada
      </p>
    </div>
  );
};
