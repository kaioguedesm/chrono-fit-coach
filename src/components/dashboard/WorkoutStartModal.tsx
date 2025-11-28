import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Dumbbell, Calendar, AlertCircle } from 'lucide-react';
import { WorkoutRefreshAlert } from '@/components/workout/WorkoutRefreshAlert';
import { WorkoutRefreshDialog } from '@/components/workout/WorkoutRefreshDialog';

interface WorkoutPlan {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  workouts_completed_count: number;
  max_workouts_before_refresh: number;
  needs_refresh: boolean;
}

interface WorkoutStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkoutStarted?: (session: { sessionId: string; planName: string; exercises: any[] }) => void;
  onNavigateToSchedule?: () => void;
  onNavigateToWorkout?: () => void;
}

export function WorkoutStartModal({ open, onOpenChange, onWorkoutStarted, onNavigateToSchedule, onNavigateToWorkout }: WorkoutStartModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingWorkout, setStartingWorkout] = useState(false);
  const [refreshDialogOpen, setRefreshDialogOpen] = useState(false);
  const [selectedWorkoutToRefresh, setSelectedWorkoutToRefresh] = useState<WorkoutPlan | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchWorkouts();
    }
  }, [open, user]);

  const fetchWorkouts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('id, name, type, is_active, workouts_completed_count, max_workouts_before_refresh, needs_refresh')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWorkouts(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus treinos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutSelect = async (workout: WorkoutPlan) => {
    if (!user) return;

    // Check if workout needs refresh
    if (workout.needs_refresh) {
      setSelectedWorkoutToRefresh(workout);
      setRefreshDialogOpen(true);
      return;
    }

    setStartingWorkout(true);

    try {
      // Criar sessão de treino
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          workout_plan_id: workout.id,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Buscar exercícios do treino
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('workout_plan_id', workout.id)
        .order('order_in_workout', { ascending: true });

      if (exercisesError) throw exercisesError;

      toast({
        title: "Treino iniciado! 💪",
        description: `Bora treinar: ${workout.name}`,
      });

      onOpenChange(false);
      
      // Passar dados da sessão para o Dashboard
      if (onWorkoutStarted) {
        onWorkoutStarted({
          sessionId: sessionData.id,
          planName: workout.name,
          exercises: exercisesData || []
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o treino.",
        variant: "destructive"
      });
    } finally {
      setStartingWorkout(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Iniciar Treino
          </DialogTitle>
          <DialogDescription>
            Selecione um treino para começar sua sessão
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando treinos...
                </div>
              ) : workouts.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground mb-4">
                      Você ainda não tem treinos cadastrados.
                    </p>
                    <Button onClick={() => {
                      onOpenChange(false);
                      if (onNavigateToWorkout) {
                        onNavigateToWorkout();
                      }
                    }}>
                      Criar Meu Primeiro Treino
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {workouts.map((workout) => (
                    <Card key={workout.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Dumbbell className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold flex items-center gap-2">
                                {workout.name}
                                {workout.needs_refresh && (
                                  <AlertCircle className="w-4 h-4 text-destructive" />
                                )}
                              </h3>
                              <p className="text-sm text-muted-foreground capitalize">
                                {workout.type}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleWorkoutSelect(workout)}
                            size="sm"
                            disabled={startingWorkout}
                            variant={workout.needs_refresh ? "outline" : "default"}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {startingWorkout ? 'Iniciando...' : 'Iniciar'}
                          </Button>
                        </div>
                        
                        {/* Progress indicator */}
                        {workout.workouts_completed_count > 0 && (
                          <WorkoutRefreshAlert
                            workoutName={workout.name}
                            completedWorkouts={workout.workouts_completed_count}
                            maxWorkouts={workout.max_workouts_before_refresh}
                            needsRefresh={workout.needs_refresh}
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false);
                    if (onNavigateToSchedule) {
                      onNavigateToSchedule();
                    }
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Ver Agenda Completa
                </Button>
              </div>
        </div>
      </DialogContent>

      {selectedWorkoutToRefresh && (
        <WorkoutRefreshDialog
          open={refreshDialogOpen}
          onOpenChange={(open) => {
            setRefreshDialogOpen(open);
            if (!open) {
              setSelectedWorkoutToRefresh(null);
            }
          }}
          workoutPlanId={selectedWorkoutToRefresh.id}
          workoutName={selectedWorkoutToRefresh.name}
          completedWorkouts={selectedWorkoutToRefresh.workouts_completed_count}
        />
      )}
    </Dialog>
  );
}
