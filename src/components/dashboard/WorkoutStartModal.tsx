import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Dumbbell, Calendar, Sparkles } from 'lucide-react';
import { MoodSelector } from '@/components/workout/MoodSelector';
import { useProfile } from '@/hooks/useProfile';

interface WorkoutPlan {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

interface WorkoutStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToSchedule?: () => void;
  onNavigateToWorkout?: () => void;
}

export function WorkoutStartModal({ open, onOpenChange, onNavigateToSchedule, onNavigateToWorkout }: WorkoutStartModalProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutPlan | null>(null);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [generatingMotivation, setGeneratingMotivation] = useState(false);

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
        .select('id, name, type, is_active')
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

  const handleWorkoutSelect = (workout: WorkoutPlan) => {
    setSelectedWorkout(workout);
    setShowMoodSelector(true);
  };

  const handleMoodSelect = async (mood: string, moodIntensity: number) => {
    if (!user || !selectedWorkout) return;

    setGeneratingMotivation(true);

    try {
      // Buscar detalhes do treino
      const { data: exercises } = await supabase
        .from('exercises')
        .select('*')
        .eq('workout_plan_id', selectedWorkout.id)
        .order('order_in_workout');

      // Gerar mensagem motivacional com IA
      const { data: motivationData, error: motivationError } = await supabase.functions.invoke(
        'generate-workout-motivation',
        {
          body: {
            mood,
            moodIntensity,
            workoutName: selectedWorkout.name,
            exerciseCount: exercises?.length || 0,
            type: 'pre-workout',
            userName: profile?.name
          }
        }
      );

      if (motivationError) {
        console.error('Erro ao gerar motivação:', motivationError);
      }

      const aiMessage = motivationData?.message || null;

      // Criar sessão com humor e mensagem
      const { data: session, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          workout_plan_id: selectedWorkout.id,
          started_at: new Date().toISOString(),
          mood,
          mood_intensity: moodIntensity,
          ai_pre_workout_message: aiMessage
        })
        .select()
        .single();

      if (error) throw error;

      // Mostrar mensagem motivacional
      if (aiMessage) {
        toast({
          title: "💬 Mensagem do seu Personal",
          description: aiMessage,
          duration: 6000,
        });
      }

      onOpenChange(false);
      setShowMoodSelector(false);
      setSelectedWorkout(null);
      
      // Navigate to workout tab if callback provided
      if (onNavigateToWorkout) {
        onNavigateToWorkout();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o treino.",
        variant: "destructive"
      });
    } finally {
      setGeneratingMotivation(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        setShowMoodSelector(false);
        setSelectedWorkout(null);
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showMoodSelector ? (
              <>
                <Sparkles className="w-5 h-5 text-primary" />
                Check-in de Humor
              </>
            ) : (
              <>
                <Play className="w-5 h-5 text-primary" />
                Iniciar Treino
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {showMoodSelector 
              ? "Me conte como você está se sentindo para eu adaptar seu treino"
              : "Selecione um treino para começar sua sessão"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {showMoodSelector && selectedWorkout ? (
            <>
              {generatingMotivation ? (
                <div className="text-center py-8 space-y-4">
                  <Sparkles className="w-12 h-12 mx-auto text-primary animate-pulse" />
                  <p className="text-muted-foreground">
                    Preparando uma mensagem especial para você...
                  </p>
                </div>
              ) : (
                <MoodSelector 
                  onMoodSelect={handleMoodSelect}
                  workoutName={selectedWorkout.name}
                />
              )}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setShowMoodSelector(false);
                  setSelectedWorkout(null);
                }}
                disabled={generatingMotivation}
              >
                Voltar
              </Button>
            </>
          ) : (
            <>
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
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Dumbbell className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{workout.name}</h3>
                              <p className="text-sm text-muted-foreground capitalize">
                                {workout.type}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleWorkoutSelect(workout)}
                            size="sm"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Iniciar
                          </Button>
                        </div>
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
