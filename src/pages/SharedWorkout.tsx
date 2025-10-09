import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Dumbbell, Clock, Target, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  rest_time: number | null;
  notes: string | null;
  order_in_workout: number;
}

interface WorkoutPlan {
  id: string;
  name: string;
  type: string;
}

interface SharedWorkout {
  id: string;
  title: string | null;
  description: string | null;
  view_count: number;
  workout_plan: WorkoutPlan & { exercises: Exercise[] };
}

export default function SharedWorkout() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workout, setWorkout] = useState<SharedWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (token) {
      loadSharedWorkout();
    }
  }, [token]);

  const loadSharedWorkout = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_shares')
        .select(`
          id,
          title,
          description,
          view_count,
          workout_plan:workout_plans!workout_plan_id (
            id,
            name,
            type,
            exercises (*)
          )
        `)
        .eq('share_token', token)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error('Treino não encontrado ou link expirado');
        navigate('/');
        return;
      }

      // Increment view count
      await supabase
        .from('workout_shares')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

      setWorkout(data as any);
    } catch (error) {
      console.error('Error loading shared workout:', error);
      toast.error('Erro ao carregar treino compartilhado');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const copyWorkoutToMyLibrary = async () => {
    if (!user) {
      toast.error('Faça login para copiar este treino');
      navigate('/auth');
      return;
    }

    if (!workout) return;

    setCopying(true);
    try {
      // Create new workout plan
      const { data: newPlan, error: planError } = await supabase
        .from('workout_plans')
        .insert([{
          user_id: user.id,
          name: `${workout.title || workout.workout_plan.name} (Cópia)`,
          type: workout.workout_plan.type,
          created_by: 'user',
          is_active: true
        }])
        .select()
        .single();

      if (planError) throw planError;

      // Copy exercises
      const exercises = workout.workout_plan.exercises.map(ex => ({
        workout_plan_id: newPlan.id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        rest_time: ex.rest_time,
        notes: ex.notes,
        order_in_workout: ex.order_in_workout
      }));

      const { error: exercisesError } = await supabase
        .from('exercises')
        .insert(exercises);

      if (exercisesError) throw exercisesError;

      toast.success('Treino copiado para sua biblioteca!');
      navigate('/');
    } catch (error) {
      console.error('Error copying workout:', error);
      toast.error('Erro ao copiar treino');
    } finally {
      setCopying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando treino...</p>
        </div>
      </div>
    );
  }

  if (!workout) {
    return null;
  }

  const sortedExercises = [...workout.workout_plan.exercises].sort(
    (a, b) => a.order_in_workout - b.order_in_workout
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-20">
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Dumbbell className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl">
                      {workout.title || workout.workout_plan.name}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>{workout.workout_plan.type}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {sortedExercises.length} exercícios
                    </span>
                  </div>
                  {workout.description && (
                    <p className="text-muted-foreground">{workout.description}</p>
                  )}
                </div>
                <Button 
                  onClick={copyWorkoutToMyLibrary}
                  disabled={copying}
                  size="lg"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copying ? 'Copiando...' : 'Copiar Treino'}
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Exercises */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Exercícios</h3>
            {sortedExercises.map((exercise, index) => (
              <Card key={exercise.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2">{exercise.name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Séries:</span>
                          <span className="font-medium">{exercise.sets}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Reps:</span>
                          <span className="font-medium">{exercise.reps}</span>
                        </div>
                        {exercise.weight && (
                          <div className="flex items-center gap-2 text-sm">
                            <Dumbbell className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Carga:</span>
                            <span className="font-medium">{exercise.weight}kg</span>
                          </div>
                        )}
                        {exercise.rest_time && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Descanso:</span>
                            <span className="font-medium">{exercise.rest_time}s</span>
                          </div>
                        )}
                      </div>
                      {exercise.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {exercise.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">Gostou deste treino?</h3>
              <p className="text-muted-foreground mb-4">
                {user 
                  ? 'Copie para sua biblioteca e comece a treinar hoje!'
                  : 'Faça login para copiar este treino e começar a treinar!'}
              </p>
              <Button 
                onClick={user ? copyWorkoutToMyLibrary : () => navigate('/auth')}
                disabled={copying}
                size="lg"
              >
                <Copy className="mr-2 h-4 w-4" />
                {user 
                  ? (copying ? 'Copiando...' : 'Copiar para Minha Biblioteca')
                  : 'Fazer Login'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
