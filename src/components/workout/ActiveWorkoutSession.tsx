import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, Weight, X, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  rest_time: number | null;
  notes: string | null;
}

interface ActiveWorkoutSessionProps {
  sessionId: string;
  planName: string;
  exercises: Exercise[];
  onComplete: () => void;
  onCancel: () => void;
}

interface ExerciseProgress {
  exerciseId: string;
  completedSets: number;
  weights: number[];
  reps: number[];
  notes: string;
}

export function ActiveWorkoutSession({ 
  sessionId, 
  planName, 
  exercises,
  onComplete,
  onCancel 
}: ActiveWorkoutSessionProps) {
  const { toast } = useToast();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [progress, setProgress] = useState<Record<string, ExerciseProgress>>({});
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [startTime] = useState(new Date());

  const currentExercise = exercises[currentExerciseIndex];
  const currentProgress = progress[currentExercise?.id] || {
    exerciseId: currentExercise?.id,
    completedSets: 0,
    weights: [],
    reps: [],
    notes: ''
  };

  useEffect(() => {
    if (isResting && restTimeLeft > 0) {
      const timer = setTimeout(() => setRestTimeLeft(restTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (restTimeLeft === 0) {
      setIsResting(false);
    }
  }, [isResting, restTimeLeft]);

  const completeSet = (weight: number, reps: number) => {
    const newProgress = {
      ...currentProgress,
      completedSets: currentProgress.completedSets + 1,
      weights: [...currentProgress.weights, weight],
      reps: [...currentProgress.reps, reps]
    };

    setProgress({
      ...progress,
      [currentExercise.id]: newProgress
    });

    // Start rest timer
    if (currentExercise.rest_time && newProgress.completedSets < currentExercise.sets) {
      setRestTimeLeft(currentExercise.rest_time);
      setIsResting(true);
    }

    // Move to next exercise if all sets completed
    if (newProgress.completedSets >= currentExercise.sets) {
      if (currentExerciseIndex < exercises.length - 1) {
        setTimeout(() => setCurrentExerciseIndex(currentExerciseIndex + 1), 1000);
      }
    }
  };

  const finishWorkout = async () => {
    try {
      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      // Buscar informações da sessão
      const { data: sessionData } = await supabase
        .from('workout_sessions')
        .select('mood, mood_intensity, workout_plan_id')
        .eq('id', sessionId)
        .single();

      // Buscar nome do treino
      const { data: workoutPlan } = await supabase
        .from('workout_plans')
        .select('name, user_id')
        .eq('id', sessionData?.workout_plan_id)
        .single();

      // Buscar nome do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', workoutPlan?.user_id)
        .single();

      // Gerar dica pós-treino com IA
      let aiPostMessage = null;
      if (sessionData?.mood) {
        try {
          const { data: motivationData } = await supabase.functions.invoke(
            'generate-workout-motivation',
            {
              body: {
                mood: sessionData.mood,
                moodIntensity: sessionData.mood_intensity,
                workoutName: workoutPlan?.name || planName,
                exerciseCount: exercises.length,
                type: 'post-workout',
                userName: profile?.name
              }
            }
          );
          aiPostMessage = motivationData?.message;
        } catch (error) {
          console.error('Erro ao gerar dica pós-treino:', error);
        }
      }

      // Update workout session
      await supabase
        .from('workout_sessions')
        .update({
          completed_at: endTime.toISOString(),
          duration_minutes: durationMinutes,
          ai_post_workout_message: aiPostMessage
        })
        .eq('id', sessionId);

      // Save exercise sessions
      for (const [exerciseId, exerciseProgress] of Object.entries(progress)) {
        if (exerciseProgress.completedSets > 0) {
          await supabase
            .from('exercise_sessions')
            .insert({
              workout_session_id: sessionId,
              exercise_id: exerciseId,
              sets_completed: exerciseProgress.completedSets,
              reps_completed: exerciseProgress.reps.join(','),
              weight_used: exerciseProgress.weights.length > 0 
                ? exerciseProgress.weights.reduce((a, b) => a + b) / exerciseProgress.weights.length 
                : null
            });
        }
      }

      // Mostrar mensagem de conclusão com dica de IA
      if (aiPostMessage) {
        toast({
          title: "🎉 Treino Concluído!",
          description: aiPostMessage,
          duration: 7000,
        });
      } else {
        toast({
          title: "Treino concluído! 🎉",
          description: `Você treinou por ${durationMinutes} minutos. Parabéns!`
        });
      }

      onComplete();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o treino.",
        variant: "destructive"
      });
    }
  };

  const totalExercises = exercises.length;
  const completedExercises = Object.values(progress).filter(
    (p, idx) => p.completedSets >= exercises[idx]?.sets
  ).length;
  const overallProgress = (completedExercises / totalExercises) * 100;

  return (
    <div className="space-y-4">
      <Card className="border-primary bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{planName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Exercício {currentExerciseIndex + 1} de {totalExercises}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <Progress value={overallProgress} className="mt-4" />
        </CardHeader>
      </Card>

      {isResting && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-2 text-primary animate-pulse" />
              <p className="text-2xl font-bold">{restTimeLeft}s</p>
              <p className="text-sm text-muted-foreground">Tempo de descanso</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setIsResting(false)}
              >
                Pular descanso
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentExercise && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{currentExercise.name}</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">
                    Série {currentProgress.completedSets + 1}/{currentExercise.sets}
                  </Badge>
                  <Badge variant="secondary">{currentExercise.reps} reps</Badge>
                  {currentExercise.weight && (
                    <Badge variant="secondary">
                      <Weight className="w-3 h-3 mr-1" />
                      {currentExercise.weight}kg
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentExercise.notes && (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                💡 {currentExercise.notes}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Peso (kg)</label>
                <Input 
                  type="number" 
                  placeholder={currentExercise.weight?.toString() || "0"}
                  id={`weight-${currentExercise.id}`}
                  defaultValue={currentExercise.weight || ''}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Repetições</label>
                <Input 
                  type="number" 
                  placeholder={currentExercise.reps}
                  id={`reps-${currentExercise.id}`}
                />
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={() => {
                const weightInput = document.getElementById(`weight-${currentExercise.id}`) as HTMLInputElement;
                const repsInput = document.getElementById(`reps-${currentExercise.id}`) as HTMLInputElement;
                const weight = parseFloat(weightInput?.value || currentExercise.weight?.toString() || '0');
                const reps = parseInt(repsInput?.value || '10');
                completeSet(weight, reps);
              }}
              disabled={currentProgress.completedSets >= currentExercise.sets}
            >
              {currentProgress.completedSets >= currentExercise.sets ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Exercício Concluído
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Concluir Série {currentProgress.completedSets + 1}
                </>
              )}
            </Button>

            {currentProgress.completedSets > 0 && (
              <div className="bg-muted p-3 rounded-lg space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Séries anteriores:</p>
                {currentProgress.weights.map((weight, idx) => (
                  <p key={idx} className="text-sm">
                    Série {idx + 1}: {weight}kg × {currentProgress.reps[idx]} reps
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {completedExercises === totalExercises && (
        <Button 
          className="w-full" 
          size="lg"
          onClick={finishWorkout}
        >
          <Save className="w-5 h-5 mr-2" />
          Finalizar Treino
        </Button>
      )}
    </div>
  );
}
