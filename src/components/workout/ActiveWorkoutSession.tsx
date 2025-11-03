import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, Weight, X, Save, SkipForward } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Exercise3DViewer } from './Exercise3DViewer';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  rest_time: number | null;
  notes: string | null;
  group_muscle?: string; // Grupo muscular (peito, costas, pernas, etc)
}

interface SkippedExercise {
  exercise: Exercise;
  originalIndex: number;
  timestamp: number;
  skipCount: number; // Quantas vezes foi pulado
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
  exercises: initialExercises,
  onComplete,
  onCancel 
}: ActiveWorkoutSessionProps) {
  const { toast } = useToast();
  const [exercises, setExercises] = useState(initialExercises);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [progress, setProgress] = useState<Record<string, ExerciseProgress>>({});
  const [skippedByGroup, setSkippedByGroup] = useState<Record<string, SkippedExercise[]>>({});
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [startTime] = useState(new Date());
  const [processedGroups, setProcessedGroups] = useState<Set<string>>(new Set());

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

  const skipExercise = () => {
    const groupId = currentExercise.group_muscle || 'default';
    const existingSkipped = skippedByGroup[groupId] || [];
    
    // Verificar se já foi pulado antes (máximo 1 vez)
    const alreadySkipped = existingSkipped.find(s => s.exercise.id === currentExercise.id);
    
    if (alreadySkipped && alreadySkipped.skipCount >= 1) {
      // Já foi pulado uma vez, perguntar se quer ignorar definitivamente
      const confirmIgnore = window.confirm(
        `Você já pulou "${currentExercise.name}" antes. Deseja ignorá-lo definitivamente?`
      );
      
      if (confirmIgnore) {
        toast({
          title: "Exercício ignorado",
          description: `${currentExercise.name} foi removido desta sessão.`,
        });
        
        // Remover do array de pulados
        setSkippedByGroup({
          ...skippedByGroup,
          [groupId]: existingSkipped.filter(s => s.exercise.id !== currentExercise.id)
        });
      }
      
      // Avançar para próximo de qualquer forma
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      }
      setIsResting(false);
      return;
    }
    
    // Adicionar aos pulados do grupo
    const skippedExercise: SkippedExercise = {
      exercise: currentExercise,
      originalIndex: currentExerciseIndex,
      timestamp: Date.now(),
      skipCount: alreadySkipped ? alreadySkipped.skipCount + 1 : 1
    };
    
    const updatedSkipped = alreadySkipped
      ? existingSkipped.map(s => s.exercise.id === currentExercise.id ? skippedExercise : s)
      : [...existingSkipped, skippedExercise];
    
    setSkippedByGroup({
      ...skippedByGroup,
      [groupId]: updatedSkipped
    });
    
    toast({
      title: "Exercício pulado",
      description: "Será reapresentado ao final do grupo muscular.",
    });
    
    // Verificar se é o último exercício do grupo atual
    const nextExercise = exercises[currentExerciseIndex + 1];
    const isLastOfGroup = !nextExercise || nextExercise.group_muscle !== groupId;
    
    if (isLastOfGroup && updatedSkipped.length > 0 && !processedGroups.has(groupId)) {
      // Fim do grupo e há exercícios pulados - reapresentar
      const incompleteSkipped = updatedSkipped.filter(s => {
        const prog = progress[s.exercise.id];
        return !prog || prog.completedSets < s.exercise.sets;
      });
      
      if (incompleteSkipped.length > 0) {
        // Inserir exercícios pulados após o atual
        const before = exercises.slice(0, currentExerciseIndex + 1);
        const after = exercises.slice(currentExerciseIndex + 1);
        const reinsertedExercises = incompleteSkipped.map(s => s.exercise);
        
        setExercises([...before, ...reinsertedExercises, ...after]);
        setProcessedGroups(new Set([...processedGroups, groupId]));
        
        toast({
          title: "Exercícios pendentes",
          description: `${incompleteSkipped.length} exercício(s) do grupo reapresentado(s).`,
          duration: 4000,
        });
      }
    }
    
    // Avançar para próximo exercício
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
    
    setIsResting(false);
  };

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

    // Remove from skipped list if completing
    const groupId = currentExercise.group_muscle || 'default';
    const groupSkipped = skippedByGroup[groupId] || [];
    const wasSkipped = groupSkipped.find(s => s.exercise.id === currentExercise.id);
    
    if (wasSkipped) {
      setSkippedByGroup({
        ...skippedByGroup,
        [groupId]: groupSkipped.filter(s => s.exercise.id !== currentExercise.id)
      });
    }

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
        .maybeSingle();

      // Buscar nome do treino
      const { data: workoutPlan } = await supabase
        .from('workout_plans')
        .select('name, user_id')
        .eq('id', sessionData?.workout_plan_id)
        .maybeSingle();

      // Buscar nome do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', workoutPlan?.user_id)
        .maybeSingle();

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

      // Atualizar Dashboard automaticamente
      const { dashboardService } = await import('@/services/dashboardService');
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      let updatedDashboard;
      if (currentUser && sessionData?.workout_plan_id) {
        await dashboardService.handleWorkoutCompleted({
          userId: currentUser.id,
          workoutId: sessionData.workout_plan_id,
          sessionId,
          duration: durationMinutes
        });
        
        // Buscar dados atualizados para exibir no toast
        updatedDashboard = await dashboardService.fetchDashboardData(currentUser.id);

        // Marcar treino agendado de hoje como concluído
        const today = new Date().toISOString().split('T')[0];
        await supabase
          .from('workout_schedule')
          .update({ 
            completed: true, 
            completed_at: new Date().toISOString() 
          })
          .eq('user_id', currentUser.id)
          .eq('scheduled_date', today)
          .eq('completed', false)
          .limit(1);

        // Notificar listeners do schedule para atualizar FrequencyReport
        const { triggerScheduleUpdate } = await import('@/services/scheduleService');
        triggerScheduleUpdate();
      }

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
        const weekText = updatedDashboard?.weeklyCount 
          ? ` Você fez ${updatedDashboard.weeklyCount} treinos esta semana!`
          : '';
        toast({
          title: "Treino concluído! 🎉",
          description: `Você treinou por ${durationMinutes} minutos.${weekText}`
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
  
  // Contar exercícios pulados no grupo atual
  const currentGroupId = currentExercise?.group_muscle || 'default';
  const currentGroupSkipped = skippedByGroup[currentGroupId]?.length || 0;

  return (
    <div className="space-y-4">
      <Card className="border-primary bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-xl">{planName}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">
                  Exercício {currentExerciseIndex + 1} de {totalExercises}
                </p>
                {currentGroupSkipped > 0 && (
                  <Badge variant="secondary" className="text-xs animate-pulse">
                    {currentGroupSkipped} pendente{currentGroupSkipped > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
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
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle>{currentExercise.name}</CardTitle>
                  {currentExercise.group_muscle && (
                    <Badge variant="outline" className="text-xs">
                      {currentExercise.group_muscle}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
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

            {/* Visualização 3D do exercício */}
            <Exercise3DViewer 
              exerciseName={currentExercise.name}
              exerciseDescription="Veja como executar este exercício corretamente na máquina"
              compact
            />

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

            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="w-full col-span-2" 
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

              {currentProgress.completedSets < currentExercise.sets && (
                <Button 
                  variant="outline"
                  className="w-full col-span-2" 
                  size="lg"
                  onClick={skipExercise}
                >
                  <SkipForward className="w-5 h-5 mr-2" />
                  Pular Exercício
                </Button>
              )}
            </div>

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
