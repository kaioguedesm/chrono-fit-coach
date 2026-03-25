import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface TransformationProject {
  id: string;
  user_id: string;
  duration_days: number;
  started_at: string;
  status: 'active' | 'completed' | 'abandoned';
  current_streak: number;
  max_streak: number;
  completed_at: string | null;
  created_at: string;
}

export interface TransformationCheckin {
  id: string;
  project_id: string;
  user_id: string;
  day_number: number;
  checked_at: string;
}

const MOTIVATIONAL_MESSAGES = [
  "Boa! Mais um dia concluído 💪",
  "Você está arrasando! Continue assim 🔥",
  "Consistência é a chave! Parabéns 🏆",
  "Mais um passo na sua transformação! 🚀",
  "Incrível! Sua disciplina inspira! ⭐",
  "Dia marcado! Você é imparável! 💥",
  "Excelente trabalho! Continue firme! 🎯",
  "Orgulhe-se de cada dia concluído! 🙌",
];

export function useTransformationProject() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeProject, setActiveProject] = useState<TransformationProject | null>(null);
  const [checkins, setCheckins] = useState<TransformationCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchActiveProject = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transformation_projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveProject(data as TransformationProject | null);

      if (data) {
        const { data: checkinsData, error: checkinsError } = await supabase
          .from('transformation_checkins')
          .select('*')
          .eq('project_id', data.id)
          .eq('user_id', user.id)
          .order('day_number', { ascending: true });

        if (checkinsError) throw checkinsError;
        setCheckins((checkinsData || []) as TransformationCheckin[]);
      }
    } catch (error: any) {
      console.error('Erro ao buscar projeto:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActiveProject();
  }, [fetchActiveProject]);

  const startProject = async (durationDays: number) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('transformation_projects')
        .insert({
          user_id: user.id,
          duration_days: durationDays,
          started_at: new Date().toISOString().split('T')[0],
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      setActiveProject(data as TransformationProject);
      setCheckins([]);
      toast({
        title: "🚀 Projeto iniciado!",
        description: `Seu projeto de ${durationDays} dias começou. Vamos nessa!`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao iniciar projeto",
        description: "Não foi possível criar o projeto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const checkIn = async () => {
    if (!user || !activeProject || checkingIn) return;
    setCheckingIn(true);

    try {
      const nextDay = checkins.length + 1;

      // Verificar se já fez check-in hoje
      const today = new Date().toISOString().split('T')[0];
      const lastCheckin = checkins[checkins.length - 1];
      if (lastCheckin) {
        const lastDate = new Date(lastCheckin.checked_at).toISOString().split('T')[0];
        if (lastDate === today) {
          toast({
            title: "Já registrado!",
            description: "Você já fez o check-in de hoje. Volte amanhã! 😊",
          });
          setCheckingIn(false);
          return;
        }
      }

      if (nextDay > activeProject.duration_days) {
        setCheckingIn(false);
        return;
      }

      const { data, error } = await supabase
        .from('transformation_checkins')
        .insert({
          project_id: activeProject.id,
          user_id: user.id,
          day_number: nextDay,
        })
        .select()
        .single();

      if (error) throw error;

      const newCheckins = [...checkins, data as TransformationCheckin];
      setCheckins(newCheckins);

      // Calculate streak
      const newStreak = activeProject.current_streak + 1;
      const newMaxStreak = Math.max(activeProject.max_streak, newStreak);

      // Check if project is completed
      const isCompleted = nextDay >= activeProject.duration_days;

      const updateData: any = {
        current_streak: newStreak,
        max_streak: newMaxStreak,
      };

      if (isCompleted) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('transformation_projects')
        .update(updateData)
        .eq('id', activeProject.id);

      if (updateError) throw updateError;

      setActiveProject((prev) =>
        prev ? { ...prev, ...updateData } : prev
      );

      if (isCompleted) {
        toast({
          title: "🎉 Parabéns! Projeto concluído!",
          description: `Você completou todos os ${activeProject.duration_days} dias! Incrível!`,
        });
      } else {
        const msg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
        toast({
          title: `Dia ${nextDay}/${activeProject.duration_days} ✅`,
          description: msg,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no check-in",
        description: "Não foi possível registrar o check-in. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const abandonProject = async () => {
    if (!user || !activeProject) return;
    try {
      const { error } = await supabase
        .from('transformation_projects')
        .update({ status: 'abandoned' })
        .eq('id', activeProject.id);

      if (error) throw error;
      setActiveProject(null);
      setCheckins([]);
      toast({
        title: "Projeto encerrado",
        description: "Você pode iniciar um novo projeto quando quiser.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível encerrar o projeto.",
        variant: "destructive",
      });
    }
  };

  const completedDays = checkins.length;
  const totalDays = activeProject?.duration_days || 0;
  const progressPercent = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
  const remainingDays = totalDays - completedDays;

  return {
    activeProject,
    checkins,
    loading,
    checkingIn,
    completedDays,
    totalDays,
    progressPercent,
    remainingDays,
    startProject,
    checkIn,
    abandonProject,
    refetch: fetchActiveProject,
  };
}
