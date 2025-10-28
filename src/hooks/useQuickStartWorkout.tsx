import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  rest_time: number | null;
  order_in_workout: number;
  notes: string | null;
  group_muscle?: string;
}

interface WorkoutPlan {
  id: string;
  name: string;
  type: string;
  exercises: Exercise[];
}

interface ActiveSession {
  sessionId: string;
  planName: string;
  exercises: Exercise[];
}

export function useQuickStartWorkout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);

  const quickStartWorkout = async (): Promise<ActiveSession | null> => {
    if (!user) {
      toast({
        title: "Autenticação necessária",
        description: "Faça login para iniciar um treino.",
        variant: "destructive"
      });
      return null;
    }

    setIsStarting(true);

    try {
      // Buscar o treino ativo mais recente
      const { data: plans, error: plansError } = await supabase
        .from('workout_plans')
        .select(`
          id,
          name,
          type,
          exercises (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (plansError) throw plansError;

      if (!plans || plans.length === 0) {
        // Sem treinos disponíveis
        return null;
      }

      const plan = plans[0] as unknown as WorkoutPlan;

      // Criar sessão de treino
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          workout_plan_id: plan.id,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      toast({
        title: "Treino iniciado! 💪",
        description: `Bora treinar: ${plan.name}`,
      });

      // Ordenar exercícios
      const sortedExercises = [...plan.exercises].sort(
        (a, b) => a.order_in_workout - b.order_in_workout
      );

      return {
        sessionId: session.id,
        planName: plan.name,
        exercises: sortedExercises
      };
    } catch (error: any) {
      console.error('Erro ao iniciar treino rápido:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o treino.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsStarting(false);
    }
  };

  return {
    quickStartWorkout,
    isStarting
  };
}
