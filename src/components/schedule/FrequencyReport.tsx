import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, AlertCircle, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { subscribeToScheduleUpdates } from '@/services/scheduleService';

interface FrequencyStats {
  weeklyCount: number;
  monthlyCount: number;
  totalScheduled: number;
  lastWorkout: string | null;
}

export function FrequencyReport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<FrequencyStats>({
    weeklyCount: 0,
    monthlyCount: 0,
    totalScheduled: 0,
    lastWorkout: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  // Subscribe to schedule updates
  useEffect(() => {
    const unsubscribe = subscribeToScheduleUpdates(() => {
      if (user) {
        fetchStats();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const weekStart = startOfWeek(now, { locale: ptBR });
      const weekEnd = endOfWeek(now, { locale: ptBR });
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Fetch completed workout sessions (real completed workouts)
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('completed_at')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      const allSessions = sessions || [];

      // Weekly completed sessions
      const weeklySessions = allSessions.filter(s => {
        const d = new Date(s.completed_at!);
        return d >= weekStart && d <= weekEnd;
      });

      // Monthly completed sessions
      const monthlySessions = allSessions.filter(s => {
        const d = new Date(s.completed_at!);
        return d >= monthStart && d <= monthEnd;
      });

      // Total scheduled this month (from workout_schedule)
      const { data: scheduledData } = await supabase
        .from('workout_schedule')
        .select('id')
        .eq('user_id', user.id)
        .gte('scheduled_date', monthStart.toISOString().split('T')[0])
        .lte('scheduled_date', monthEnd.toISOString().split('T')[0]);

      setStats({
        weeklyCount: weeklySessions.length,
        monthlyCount: monthlySessions.length,
        totalScheduled: scheduledData?.length || 0,
        lastWorkout: allSessions.length > 0 ? allSessions[0].completed_at : null
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyStatus = () => {
    if (stats.weeklyCount >= 4) {
      return { icon: Award, label: 'Excelente!', color: 'text-green-600' };
    } else if (stats.weeklyCount >= 2) {
      return { icon: TrendingUp, label: 'Bom ritmo', color: 'text-blue-600' };
    } else {
      return { icon: AlertCircle, label: 'Atenção', color: 'text-orange-600' };
    }
  };

  const status = getFrequencyStatus();
  const StatusIcon = status.icon;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground">Carregando relatório...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Relatório de Frequência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Status Semanal</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusIcon className={`w-5 h-5 ${status.color}`} />
              <span className="font-semibold">{status.label}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-lg">
            {stats.weeklyCount}/7
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg text-center">
            <p className="text-2xl font-bold">{stats.weeklyCount}</p>
            <p className="text-sm text-muted-foreground">Esta semana</p>
          </div>

          <div className="p-4 border rounded-lg text-center">
            <p className="text-2xl font-bold">{stats.monthlyCount}</p>
            <p className="text-sm text-muted-foreground">Este mês</p>
          </div>

          <div className="p-4 border rounded-lg text-center col-span-2">
            <p className="text-lg font-semibold">
              {stats.monthlyCount}/{stats.totalScheduled}
            </p>
            <p className="text-sm text-muted-foreground">
              Treinos concluídos do total agendado
            </p>
          </div>
        </div>

        {stats.lastWorkout && (
          <div className="p-3 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Último treino</p>
            <p className="font-medium">
              {format(new Date(stats.lastWorkout), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        )}

        {stats.weeklyCount < 2 && (
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Atenção à frequência</p>
              <p className="text-xs text-muted-foreground mt-1">
                Você treinou menos de 2x esta semana. Mantenha a consistência!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
