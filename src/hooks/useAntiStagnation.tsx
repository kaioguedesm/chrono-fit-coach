import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ExerciseProgress {
  exerciseName: string;
  sessions: { date: string; weight: number; sets: number; reps: string }[];
  trend: 'progressing' | 'stagnated' | 'declining' | 'insufficient';
  lastWeight: number;
  suggestedWeight: number | null;
  changePercent: number;
}

interface AntiStagnationData {
  overallStatus: 'progressing' | 'stagnated' | 'declining' | 'new';
  message: string;
  exerciseProgress: ExerciseProgress[];
  weeklyVolume: number;
  averageFrequency: number;
  totalSessionsLast30Days: number;
  loading: boolean;
}

function analyzeExerciseTrend(sessions: { weight: number; date: string }[]): {
  trend: ExerciseProgress['trend'];
  changePercent: number;
  suggestedWeight: number | null;
} {
  if (sessions.length < 3) {
    return { trend: 'insufficient', changePercent: 0, suggestedWeight: null };
  }

  const recent = sessions.slice(0, 3);
  const weights = recent.map(s => s.weight);
  
  // Check if weight has been the same for 3+ sessions
  const allSame = weights.every(w => w === weights[0]);
  if (allSame && weights[0] > 0) {
    return {
      trend: 'stagnated',
      changePercent: 0,
      suggestedWeight: Math.round(weights[0] * 1.05 * 10) / 10 // +5%
    };
  }

  // Check trend direction
  const firstWeight = sessions[sessions.length - 1].weight;
  const lastWeight = sessions[0].weight;
  
  if (firstWeight === 0) return { trend: 'insufficient', changePercent: 0, suggestedWeight: null };
  
  const changePercent = ((lastWeight - firstWeight) / firstWeight) * 100;

  if (changePercent > 2) {
    return { trend: 'progressing', changePercent, suggestedWeight: null };
  } else if (changePercent < -5) {
    return { trend: 'declining', changePercent, suggestedWeight: firstWeight };
  } else {
    return {
      trend: 'stagnated',
      changePercent,
      suggestedWeight: Math.round(lastWeight * 1.05 * 10) / 10
    };
  }
}

function generateMessage(
  overallStatus: AntiStagnationData['overallStatus'],
  stagnatedCount: number,
  progressingCount: number,
  frequency: number
): string {
  if (overallStatus === 'new') {
    return 'Complete mais treinos para ativar seu sistema de evolução automática.';
  }

  if (frequency < 2) {
    return 'Sua frequência está baixa. Tente treinar pelo menos 3x por semana para melhores resultados.';
  }

  if (stagnatedCount > progressingCount && stagnatedCount >= 2) {
    return `Detectamos estagnação em ${stagnatedCount} exercícios. Ajustes de carga foram sugeridos para retomar sua evolução.`;
  }

  if (progressingCount > stagnatedCount) {
    return `Excelente! Você está evoluindo em ${progressingCount} exercícios. Continue com essa intensidade.`;
  }

  return 'Seu treino está equilibrado. Foque em aumentar carga progressivamente.';
}

export function useAntiStagnation(): AntiStagnationData {
  const { user } = useAuth();
  const [data, setData] = useState<AntiStagnationData>({
    overallStatus: 'new',
    message: '',
    exerciseProgress: [],
    weeklyVolume: 0,
    averageFrequency: 0,
    totalSessionsLast30Days: 0,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }
    analyze();
  }, [user]);

  const analyze = async () => {
    if (!user) return;

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch completed sessions in last 30 days
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('id, completed_at, workout_plan_id')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .order('completed_at', { ascending: false });

      const totalSessions = sessions?.length || 0;

      if (totalSessions < 3) {
        setData({
          overallStatus: 'new',
          message: generateMessage('new', 0, 0, 0),
          exerciseProgress: [],
          weeklyVolume: 0,
          averageFrequency: totalSessions / 4,
          totalSessionsLast30Days: totalSessions,
          loading: false,
        });
        return;
      }

      // Fetch exercise sessions for these workouts
      const sessionIds = sessions!.map(s => s.id);
      const { data: exerciseSessions } = await supabase
        .from('exercise_sessions')
        .select('exercise_id, weight_used, sets_completed, reps_completed, completed_at')
        .in('workout_session_id', sessionIds)
        .order('completed_at', { ascending: false });

      // Get exercise names
      const exerciseIds = [...new Set(exerciseSessions?.map(es => es.exercise_id) || [])];
      const { data: exercises } = await supabase
        .from('exercises')
        .select('id, name')
        .in('id', exerciseIds);

      const exerciseNameMap = new Map(exercises?.map(e => [e.id, e.name]) || []);

      // Group by exercise
      const exerciseGroups = new Map<string, { weight: number; date: string; sets: number; reps: string }[]>();
      
      for (const es of exerciseSessions || []) {
        const name = exerciseNameMap.get(es.exercise_id) || 'Desconhecido';
        if (!exerciseGroups.has(name)) {
          exerciseGroups.set(name, []);
        }
        exerciseGroups.get(name)!.push({
          weight: es.weight_used || 0,
          date: es.completed_at,
          sets: es.sets_completed,
          reps: es.reps_completed || '',
        });
      }

      // Analyze each exercise
      const exerciseProgress: ExerciseProgress[] = [];
      let stagnatedCount = 0;
      let progressingCount = 0;

      for (const [name, sessions] of exerciseGroups) {
        const { trend, changePercent, suggestedWeight } = analyzeExerciseTrend(
          sessions.map(s => ({ weight: s.weight, date: s.date }))
        );

        if (trend === 'stagnated') stagnatedCount++;
        if (trend === 'progressing') progressingCount++;

        exerciseProgress.push({
          exerciseName: name,
          sessions,
          trend,
          lastWeight: sessions[0]?.weight || 0,
          suggestedWeight,
          changePercent,
        });
      }

      const avgFrequency = totalSessions / 4; // per week over 30 days
      let overallStatus: AntiStagnationData['overallStatus'] = 'progressing';
      
      if (stagnatedCount > progressingCount) {
        overallStatus = 'stagnated';
      } else if (exerciseProgress.some(e => e.trend === 'declining')) {
        overallStatus = 'declining';
      }

      setData({
        overallStatus,
        message: generateMessage(overallStatus, stagnatedCount, progressingCount, avgFrequency),
        exerciseProgress: exerciseProgress.sort((a, b) => {
          const priority = { stagnated: 0, declining: 1, progressing: 2, insufficient: 3 };
          return priority[a.trend] - priority[b.trend];
        }),
        weeklyVolume: Math.round(totalSessions * (exerciseSessions?.length || 0) / totalSessions),
        averageFrequency: Math.round(avgFrequency * 10) / 10,
        totalSessionsLast30Days: totalSessions,
        loading: false,
      });
    } catch (error) {
      console.error('Anti-stagnation analysis error:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  return data;
}
