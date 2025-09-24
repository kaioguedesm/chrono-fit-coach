import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays, Check, Plus, TrendingUp } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScheduledWorkout {
  id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  completed: boolean;
  completed_at: string | null;
  workout_plan: {
    name: string;
    type: string;
  };
}

export default function Schedule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStats, setWeekStats] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    if (user) {
      fetchScheduledWorkouts();
      fetchWeekStats();
    }
  }, [user, selectedDate]);

  const fetchScheduledWorkouts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workout_schedule')
        .select(`
          *,
          workout_plan:workout_plans (name, type)
        `)
        .eq('user_id', user.id)
        .eq('scheduled_date', format(selectedDate, 'yyyy-MM-dd'))
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      setScheduledWorkouts(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar a agenda.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekStats = async () => {
    if (!user) return;

    const weekStart = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    try {
      const { data, error } = await supabase
        .from('workout_schedule')
        .select('completed')
        .eq('user_id', user.id)
        .gte('scheduled_date', weekStart)
        .lte('scheduled_date', weekEnd);

      if (error) throw error;

      const total = data?.length || 0;
      const completed = data?.filter(w => w.completed).length || 0;
      
      setWeekStats({ completed, total });
    } catch (error) {
      console.error('Error fetching week stats:', error);
    }
  };

  const markAsCompleted = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('workout_schedule')
        .update({ 
          completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq('id', workoutId);

      if (error) throw error;

      toast({
        title: "Treino concluído!",
        description: "Parabéns pela dedicação! 🎉"
      });

      fetchScheduledWorkouts();
      fetchWeekStats();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível marcar como concluído.",
        variant: "destructive"
      });
    }
  };

  // Sample data for demonstration
  const sampleWorkouts: ScheduledWorkout[] = [
    {
      id: 'sample-1',
      scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
      scheduled_time: '07:00',
      completed: false,
      completed_at: null,
      workout_plan: {
        name: 'Treino A - Peito e Tríceps',
        type: 'A'
      }
    },
    {
      id: 'sample-2',
      scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
      scheduled_time: '18:30',
      completed: false,
      completed_at: null,
      workout_plan: {
        name: 'Cardio Intervalado',
        type: 'Cardio'
      }
    }
  ];

  const displayWorkouts = scheduledWorkouts.length > 0 ? scheduledWorkouts : 
    (isSameDay(selectedDate, new Date()) ? sampleWorkouts : []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header title="Agenda" />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="space-y-6">
          {/* Week Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Frequência da Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {weekStats.completed}/{weekStats.total}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Treinos concluídos
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {weekStats.total > 0 ? Math.round((weekStats.completed / weekStats.total) * 100) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Taxa de conclusão
                  </p>
                </div>
              </div>
              <div className="mt-4 w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${weekStats.total > 0 ? (weekStats.completed / weekStats.total) * 100 : 0}%` 
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Calendário</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                className="rounded-md border-0"
              />
            </CardContent>
          </Card>

          {/* Scheduled Workouts */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Agendar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {displayWorkouts.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum treino agendado para este dia
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className={`p-4 rounded-lg border ${
                        workout.completed ? 'bg-primary/5 border-primary/20' : 'bg-card'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{workout.workout_plan.name}</h4>
                            <Badge variant="outline">
                              {workout.workout_plan.type}
                            </Badge>
                            {workout.completed && (
                              <Badge variant="default">
                                <Check className="w-3 h-3 mr-1" />
                                Concluído
                              </Badge>
                            )}
                          </div>
                          {workout.scheduled_time && (
                            <p className="text-sm text-muted-foreground">
                              {workout.scheduled_time}
                            </p>
                          )}
                        </div>
                        
                        {!workout.completed && (
                          <Button
                            size="sm"
                            onClick={() => markAsCompleted(workout.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}