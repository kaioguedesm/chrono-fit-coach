import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Goal {
  id: string;
  goal_type: string;
  target_value: number;
  current_value: number | null;
  deadline: string | null;
  is_active: boolean;
  achieved_at: string | null;
  created_at: string;
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data) {
        setGoals(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: {
    goal_type: string;
    target_value: number;
    current_value?: number;
    deadline?: string;
  }) => {
    if (!user) return;

    const { error } = await supabase.from('user_goals').insert({
      user_id: user.id,
      ...goalData,
    });

    if (!error) {
      fetchGoals();
    }
    return { error };
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const { error } = await supabase
      .from('user_goals')
      .update(updates)
      .eq('id', id);

    if (!error) {
      fetchGoals();
    }
    return { error };
  };

  const checkGoalProgress = async (goalId: string, currentValue: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const achieved = goal.goal_type === 'weight'
      ? currentValue <= goal.target_value
      : currentValue >= goal.target_value;

    if (achieved && !goal.achieved_at) {
      await updateGoal(goalId, {
        achieved_at: new Date().toISOString(),
        current_value: currentValue,
      });
    } else {
      await updateGoal(goalId, { current_value: currentValue });
    }
  };

  return {
    goals,
    loading,
    createGoal,
    updateGoal,
    checkGoalProgress,
    refreshGoals: fetchGoals,
  };
}
