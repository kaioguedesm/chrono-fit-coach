import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Flame, Dumbbell, Camera, Scale } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeeklyStat {
  workouts: number;
  photos: number;
  measurements: number;
  weightChange: number | null;
}

export function WeeklySummary() {
  const { user } = useAuth();
  const [thisWeek, setThisWeek] = useState<WeeklyStat>({
    workouts: 0,
    photos: 0,
    measurements: 0,
    weightChange: null,
  });
  const [lastWeek, setLastWeek] = useState<WeeklyStat>({
    workouts: 0,
    photos: 0,
    measurements: 0,
    weightChange: null,
  });

  useEffect(() => {
    if (user) {
      fetchWeeklySummary();
    }
  }, [user]);

  const fetchWeeklySummary = async () => {
    if (!user) return;

    const now = new Date();
    const thisWeekStart = startOfWeek(now, { locale: ptBR });
    const thisWeekEnd = endOfWeek(now, { locale: ptBR });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: ptBR });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { locale: ptBR });

    // Fetch this week's data
    const [workoutsThis, photosThis, measurementsThis] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', user.id)
        .gte('completed_at', thisWeekStart.toISOString())
        .lte('completed_at', thisWeekEnd.toISOString())
        .not('completed_at', 'is', null),
      supabase
        .from('progress_photos')
        .select('id')
        .eq('user_id', user.id)
        .gte('taken_at', thisWeekStart.toISOString())
        .lte('taken_at', thisWeekEnd.toISOString()),
      supabase
        .from('body_measurements')
        .select('weight')
        .eq('user_id', user.id)
        .gte('measured_at', thisWeekStart.toISOString())
        .lte('measured_at', thisWeekEnd.toISOString())
        .order('measured_at', { ascending: false }),
    ]);

    // Fetch last week's data
    const [workoutsLast, photosLast, measurementsLast] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', user.id)
        .gte('completed_at', lastWeekStart.toISOString())
        .lte('completed_at', lastWeekEnd.toISOString())
        .not('completed_at', 'is', null),
      supabase
        .from('progress_photos')
        .select('id')
        .eq('user_id', user.id)
        .gte('taken_at', lastWeekStart.toISOString())
        .lte('taken_at', lastWeekEnd.toISOString()),
      supabase
        .from('body_measurements')
        .select('weight')
        .eq('user_id', user.id)
        .gte('measured_at', lastWeekStart.toISOString())
        .lte('measured_at', lastWeekEnd.toISOString())
        .order('measured_at', { ascending: false }),
    ]);

    // Calculate weight change
    const thisWeekWeight = measurementsThis.data?.[0]?.weight;
    const lastWeekWeight = measurementsLast.data?.[0]?.weight;
    const weightChange = thisWeekWeight && lastWeekWeight ? thisWeekWeight - lastWeekWeight : null;

    setThisWeek({
      workouts: workoutsThis.data?.length || 0,
      photos: photosThis.data?.length || 0,
      measurements: measurementsThis.data?.length || 0,
      weightChange,
    });

    setLastWeek({
      workouts: workoutsLast.data?.length || 0,
      photos: photosLast.data?.length || 0,
      measurements: measurementsLast.data?.length || 0,
      weightChange: null,
    });
  };

  const getComparison = (current: number, previous: number) => {
    if (current > previous) return { icon: TrendingUp, color: 'text-green-600', text: 'Melhor!' };
    if (current < previous) return { icon: TrendingDown, color: 'text-red-600', text: 'Menor' };
    return { icon: Minus, color: 'text-muted-foreground', text: 'Igual' };
  };

  const workoutComp = getComparison(thisWeek.workouts, lastWeek.workouts);
  const photoComp = getComparison(thisWeek.photos, lastWeek.photos);

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary animate-pulse" />
              Resumo da Semana
            </CardTitle>
            <CardDescription>
              {format(startOfWeek(new Date(), { locale: ptBR }), "dd 'de' MMM", { locale: ptBR })} -{' '}
              {format(endOfWeek(new Date(), { locale: ptBR }), "dd 'de' MMM", { locale: ptBR })}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            Semana {format(new Date(), 'w', { locale: ptBR })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Workouts */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-transparent border">
            <div className="flex items-center justify-between mb-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              <workoutComp.icon className={`w-4 h-4 ${workoutComp.color}`} />
            </div>
            <div className="text-3xl font-bold mb-1">{thisWeek.workouts}</div>
            <div className="text-sm text-muted-foreground mb-2">Treinos completados</div>
            <Badge variant="secondary" className="text-xs">
              {lastWeek.workouts} na semana passada
            </Badge>
          </div>

          {/* Photos */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-chart-2/5 to-transparent border">
            <div className="flex items-center justify-between mb-2">
              <Camera className="w-5 h-5 text-chart-2" />
              <photoComp.icon className={`w-4 h-4 ${photoComp.color}`} />
            </div>
            <div className="text-3xl font-bold mb-1">{thisWeek.photos}</div>
            <div className="text-sm text-muted-foreground mb-2">Fotos registradas</div>
            <Badge variant="secondary" className="text-xs">
              {lastWeek.photos} na semana passada
            </Badge>
          </div>

          {/* Weight Change */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-chart-3/5 to-transparent border">
            <div className="flex items-center justify-between mb-2">
              <Scale className="w-5 h-5 text-chart-3" />
              {thisWeek.weightChange !== null && (
                thisWeek.weightChange > 0 ? (
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                ) : thisWeek.weightChange < 0 ? (
                  <TrendingDown className="w-4 h-4 text-green-600" />
                ) : (
                  <Minus className="w-4 h-4 text-muted-foreground" />
                )
              )}
            </div>
            <div className="text-3xl font-bold mb-1">
              {thisWeek.weightChange !== null ? (
                <>
                  {thisWeek.weightChange > 0 ? '+' : ''}
                  {thisWeek.weightChange.toFixed(1)}kg
                </>
              ) : (
                '--'
              )}
            </div>
            <div className="text-sm text-muted-foreground mb-2">Variação de peso</div>
            <Badge variant="secondary" className="text-xs">
              {thisWeek.measurements} medições esta semana
            </Badge>
          </div>
        </div>

        {/* Motivational message */}
        <div className="mt-4 p-4 rounded-lg bg-muted/50 text-center">
          {thisWeek.workouts >= 4 ? (
            <p className="text-sm font-medium text-primary">
              🎉 Excelente semana! Você está arrasando!
            </p>
          ) : thisWeek.workouts >= 2 ? (
            <p className="text-sm font-medium">
              💪 Boa semana! Continue assim!
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Vamos lá! Ainda dá tempo de treinar mais esta semana!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
