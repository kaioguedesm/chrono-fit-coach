import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Dumbbell, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WorkoutPlan {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

interface WorkoutStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkoutStartModal({ open, onOpenChange }: WorkoutStartModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleStartWorkout = async (workoutId: string) => {
    if (!user) return;

    try {
      const { data: session, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          workout_plan_id: workoutId,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Treino iniciado!",
        description: "Boa sorte no seu treino! 💪"
      });

      onOpenChange(false);
      navigate('/workout', { state: { sessionId: session.id } });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o treino.",
        variant: "destructive"
      });
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
                  navigate('/workout');
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
                        onClick={() => handleStartWorkout(workout.id)}
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
                navigate('/schedule');
              }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Ver Agenda Completa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
