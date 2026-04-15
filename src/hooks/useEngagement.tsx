import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DailyCheckin {
  id: string;
  check_date: string;
  workout_done: boolean;
  diet_followed: string;
  water_ml: number;
  energy_level: number | null;
  motivation_level: number | null;
  pain_level: number;
  notes: string | null;
}

interface UserLevel {
  current_level: string;
  total_xp: number;
  current_streak: number;
  best_streak: number;
  last_checkin_date: string | null;
}

interface WeeklyMission {
  id: string;
  mission_type: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  completed: boolean;
  reward_badge: string | null;
}

const LEVEL_THRESHOLDS = {
  iniciante: 0,
  intermediario: 500,
  avancado: 2000,
  elite: 5000,
};

const LEVEL_LABELS: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
  elite: 'Elite',
};

export function useEngagement() {
  const { user } = useAuth();
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null);
  const [checkinHistory, setCheckinHistory] = useState<DailyCheckin[]>([]);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [weeklyMissions, setWeeklyMissions] = useState<WeeklyMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalAchievements, setTotalAchievements] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  };

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    try {
      const [checkinRes, historyRes, levelRes, missionsRes, workoutsRes, achievementsRes] = await Promise.all([
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('check_date', today).maybeSingle(),
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('check_date', { ascending: false }).limit(30),
        supabase.from('user_levels').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('weekly_missions').select('*').eq('user_id', user.id).eq('week_start', getWeekStart()).order('created_at'),
        supabase.from('workout_sessions').select('id').eq('user_id', user.id).not('completed_at', 'is', null),
        supabase.from('user_achievements').select('id').eq('user_id', user.id),
      ]);

      if (checkinRes.data) setTodayCheckin(checkinRes.data as any);
      if (historyRes.data) setCheckinHistory(historyRes.data as any[]);
      if (levelRes.data) setUserLevel(levelRes.data as any);
      if (missionsRes.data) setWeeklyMissions(missionsRes.data as any[]);
      setTotalWorkouts(workoutsRes.data?.length || 0);
      setTotalAchievements(achievementsRes.data?.length || 0);

      // Auto-create level if not exists
      if (!levelRes.data) {
        const { data: newLevel } = await supabase.from('user_levels').insert({
          user_id: user.id,
          current_level: 'iniciante',
          total_xp: 0,
          current_streak: 0,
          best_streak: 0,
        }).select().single();
        if (newLevel) setUserLevel(newLevel as any);
      }

      // Auto-create weekly missions if empty
      if (!missionsRes.data?.length) {
        await generateWeeklyMissions();
      }
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const generateWeeklyMissions = async () => {
    if (!user) return;
    const weekStart = getWeekStart();
    const missions = [
      { mission_type: 'workouts', title: 'Treinar 4x esta semana', description: 'Complete 4 treinos nesta semana', target_value: 4, reward_badge: '💪' },
      { mission_type: 'checkins', title: 'Check-in diário 5 dias', description: 'Faça check-in por 5 dias consecutivos', target_value: 5, reward_badge: '✅' },
      { mission_type: 'water', title: 'Meta de hidratação 3 dias', description: 'Atinja a meta de água por 3 dias', target_value: 3, reward_badge: '💧' },
    ];

    for (const m of missions) {
      await supabase.from('weekly_missions').insert({
        user_id: user.id,
        week_start: weekStart,
        ...m,
      }).select();
    }
    
    const { data } = await supabase.from('weekly_missions').select('*').eq('user_id', user.id).eq('week_start', weekStart);
    if (data) setWeeklyMissions(data as any[]);
  };

  const submitCheckin = async (data: Partial<DailyCheckin>) => {
    if (!user) return;

    const checkinData = {
      user_id: user.id,
      check_date: today,
      workout_done: data.workout_done || false,
      diet_followed: data.diet_followed || 'no',
      water_ml: data.water_ml || 0,
      energy_level: data.energy_level,
      motivation_level: data.motivation_level,
      pain_level: data.pain_level || 0,
      notes: data.notes,
    };

    if (todayCheckin) {
      const { data: updated } = await supabase.from('daily_checkins')
        .update(checkinData).eq('id', todayCheckin.id).select().single();
      if (updated) setTodayCheckin(updated as any);
    } else {
      const { data: inserted } = await supabase.from('daily_checkins')
        .insert(checkinData).select().single();
      if (inserted) setTodayCheckin(inserted as any);
    }

    // Update XP and streak
    await updateLevelAndStreak();
    // Update mission progress
    await updateMissionProgress();
    await fetchAll();
  };

  const updateLevelAndStreak = async () => {
    if (!user || !userLevel) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = userLevel.current_streak;
    if (userLevel.last_checkin_date === yesterdayStr) {
      newStreak += 1;
    } else if (userLevel.last_checkin_date !== today) {
      newStreak = 1;
    }

    const xpGain = 10 + (newStreak >= 7 ? 5 : 0) + (newStreak >= 30 ? 10 : 0);
    const newXp = userLevel.total_xp + xpGain;
    
    let newLevel = 'iniciante';
    if (newXp >= LEVEL_THRESHOLDS.elite) newLevel = 'elite';
    else if (newXp >= LEVEL_THRESHOLDS.avancado) newLevel = 'avancado';
    else if (newXp >= LEVEL_THRESHOLDS.intermediario) newLevel = 'intermediario';

    await supabase.from('user_levels').update({
      current_streak: newStreak,
      best_streak: Math.max(newStreak, userLevel.best_streak),
      total_xp: newXp,
      current_level: newLevel,
      last_checkin_date: today,
    }).eq('user_id', user.id);
  };

  const updateMissionProgress = async () => {
    if (!user) return;
    const weekStart = getWeekStart();

    // Count this week's checkins
    const { data: weekCheckins } = await supabase.from('daily_checkins')
      .select('id, workout_done, water_ml').eq('user_id', user.id)
      .gte('check_date', weekStart);

    if (!weekCheckins) return;

    const workoutCount = weekCheckins.filter(c => (c as any).workout_done).length;
    const checkinCount = weekCheckins.length;
    const waterDays = weekCheckins.filter(c => (c as any).water_ml >= 2000).length;

    const updates: Record<string, number> = {
      workouts: workoutCount,
      checkins: checkinCount,
      water: waterDays,
    };

    for (const mission of weeklyMissions) {
      const val = updates[mission.mission_type] ?? 0;
      const completed = val >= mission.target_value;
      await supabase.from('weekly_missions').update({
        current_value: val,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      }).eq('id', mission.id);
    }
  };

  const getNextLevelXp = () => {
    if (!userLevel) return 500;
    const levels = Object.entries(LEVEL_THRESHOLDS).sort((a, b) => a[1] - b[1]);
    const currentIdx = levels.findIndex(([k]) => k === userLevel.current_level);
    if (currentIdx < levels.length - 1) return levels[currentIdx + 1][1];
    return levels[levels.length - 1][1];
  };

  const getLevelProgress = () => {
    if (!userLevel) return 0;
    const levels = Object.entries(LEVEL_THRESHOLDS).sort((a, b) => a[1] - b[1]);
    const currentIdx = levels.findIndex(([k]) => k === userLevel.current_level);
    const currentMin = levels[currentIdx]?.[1] || 0;
    const nextMin = currentIdx < levels.length - 1 ? levels[currentIdx + 1][1] : levels[currentIdx][1];
    if (nextMin === currentMin) return 100;
    return Math.min(100, ((userLevel.total_xp - currentMin) / (nextMin - currentMin)) * 100);
  };

  return {
    todayCheckin,
    checkinHistory,
    userLevel,
    weeklyMissions,
    loading,
    submitCheckin,
    totalWorkouts,
    totalAchievements,
    getLevelProgress,
    getNextLevelXp,
    levelLabel: userLevel ? LEVEL_LABELS[userLevel.current_level] || userLevel.current_level : 'Iniciante',
    refresh: fetchAll,
  };
}
