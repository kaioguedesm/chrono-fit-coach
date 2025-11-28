import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface WorkoutRefreshDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutPlanId: string;
  workoutName: string;
  completedWorkouts: number;
}

export const WorkoutRefreshDialog = ({
  open,
  onOpenChange,
  workoutPlanId,
  workoutName,
  completedWorkouts,
}: WorkoutRefreshDialogProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  const handleResetAndKeep = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("workout_plans")
        .update({
          workouts_completed_count: 0,
          needs_refresh: false,
          last_refresh_date: new Date().toISOString(),
        })
        .eq("id", workoutPlanId);

      if (error) throw error;

      toast.success("Ciclo renovado!", {
        description: `O contador do treino "${workoutName}" foi resetado. Você pode continuar usando este plano.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error resetting workout cycle:", error);
      toast.error("Erro ao renovar ciclo", {
        description: "Não foi possível renovar o ciclo do treino.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateNew = () => {
    onOpenChange(false);
    navigate("/workout");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <RefreshCw className="h-6 w-6 text-primary" />
            Renovar Plano de Treino
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Você completou <strong>{completedWorkouts} treinos</strong> com o
            plano "{workoutName}". O que deseja fazer?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Por que renovar?</h4>
                <p className="text-sm text-muted-foreground">
                  Seu corpo se adapta aos exercícios após várias repetições. Mudar
                  ou progredir nos treinos é essencial para continuar ganhando
                  força e massa muscular.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <Button
              onClick={handleCreateNew}
              size="lg"
              className="w-full justify-start h-auto py-4"
            >
              <TrendingUp className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Criar Novo Treino</div>
                <div className="text-xs opacity-90">
                  Recomendado: Gere um novo plano para continuar evoluindo
                </div>
              </div>
            </Button>

            <Button
              onClick={handleResetAndKeep}
              disabled={isUpdating}
              variant="outline"
              size="lg"
              className="w-full justify-start h-auto py-4"
            >
              <RefreshCw className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Continuar com Este Treino</div>
                <div className="text-xs opacity-70">
                  Reseta o contador e mantém o mesmo plano
                </div>
              </div>
            </Button>
          </div>
        </div>

        <DialogFooter className="text-xs text-muted-foreground">
          Dica: Mudar os exercícios regularmente ajuda a evitar lesões por
          esforço repetitivo.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
