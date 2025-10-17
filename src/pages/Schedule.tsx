import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CalendarDays, 
  Check, 
  Plus, 
  TrendingUp, 
  Flame, 
  Target, 
  Award,
  Calendar as CalendarIcon,
  BarChart3,
  Activity
} from 'lucide-react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isSameDay,
  differenceInDays,
  eachDayOfInterval,
  isWithinInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FrequencyReport } from '@/components/schedule/FrequencyReport';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';

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

interface FrequencyStats {
  week: { completed: number; total: number; percentage: number };
  month: { completed: number; total: number; percentage: number };
  year: { completed: number; total: number; percentage: number };
  currentStreak: number;
  longestStreak: number;
}

export default function Schedule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStats, setWeekStats] = useState({ completed: 0, total: 0 });
  const [frequencyStats, setFrequencyStats] = useState<FrequencyStats>({
    week: { completed: 0, total: 0, percentage: 0 },
    month: { completed: 0, total: 0, percentage: 0 },
    year: { completed: 0, total: 0, percentage: 0 },
    currentStreak: 0,
    longestStreak: 0
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('schedule');

  useEffect(() => {
    if (user) {
      fetchScheduledWorkouts();
      fetchWeekStats();
      fetchFrequencyStats();
      fetchMonthlyData();
      fetchCompletedDates();
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

  const fetchFrequencyStats = async () => {
    if (!user) return;

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    try {
      // Fetch all workout sessions for calculations
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('completed_at')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true });

      if (error) throw error;

      // Week stats
      const weekSessions = sessions?.filter(s => 
        isWithinInterval(new Date(s.completed_at!), { start: weekStart, end: weekEnd })
      ) || [];

      // Month stats
      const monthSessions = sessions?.filter(s => 
        isWithinInterval(new Date(s.completed_at!), { start: monthStart, end: monthEnd })
      ) || [];

      // Year stats
      const yearSessions = sessions?.filter(s => 
        isWithinInterval(new Date(s.completed_at!), { start: yearStart, end: yearEnd })
      ) || [];

      // Calculate streaks
      const completedDates = sessions?.map(s => format(new Date(s.completed_at!), 'yyyy-MM-dd')) || [];
      const uniqueDates = [...new Set(completedDates)].sort();
      
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      const today = format(now, 'yyyy-MM-dd');
      let checkDate = now;
      
      // Calculate current streak
      while (uniqueDates.includes(format(checkDate, 'yyyy-MM-dd'))) {
        currentStreak++;
        checkDate = new Date(checkDate.setDate(checkDate.getDate() - 1));
      }

      // Calculate longest streak
      for (let i = 0; i < uniqueDates.length; i++) {
        if (i === 0 || differenceInDays(new Date(uniqueDates[i]), new Date(uniqueDates[i - 1])) === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }

      setFrequencyStats({
        week: {
          completed: weekSessions.length,
          total: 7,
          percentage: Math.round((weekSessions.length / 7) * 100)
        },
        month: {
          completed: monthSessions.length,
          total: eachDayOfInterval({ start: monthStart, end: monthEnd }).length,
          percentage: Math.round((monthSessions.length / eachDayOfInterval({ start: monthStart, end: monthEnd }).length) * 100)
        },
        year: {
          completed: yearSessions.length,
          total: differenceInDays(yearEnd, yearStart) + 1,
          percentage: Math.round((yearSessions.length / (differenceInDays(yearEnd, yearStart) + 1)) * 100)
        },
        currentStreak,
        longestStreak
      });
    } catch (error) {
      console.error('Error fetching frequency stats:', error);
    }
  };

  const fetchMonthlyData = async () => {
    if (!user) return;

    const now = new Date();
    const yearStart = startOfYear(now);
    
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('completed_at')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .gte('completed_at', yearStart.toISOString());

      if (error) throw error;

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthlyCount = Array(12).fill(0);

      data?.forEach(session => {
        const month = new Date(session.completed_at!).getMonth();
        monthlyCount[month]++;
      });

      const chartData = monthNames.map((name, index) => ({
        month: name,
        workouts: monthlyCount[index]
      }));

      setMonthlyData(chartData);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    }
  };

  const fetchCompletedDates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('completed_at')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);

      if (error) throw error;

      const dates = data?.map(s => format(new Date(s.completed_at!), 'yyyy-MM-dd')) || [];
      setCompletedDates(dates);
    } catch (error) {
      console.error('Error fetching completed dates:', error);
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
      fetchFrequencyStats();
      fetchMonthlyData();
      fetchCompletedDates();
      setRefreshKey(prev => prev + 1);
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

  // Custom day modifier for calendar
  const modifiers = {
    completed: (date: Date) => completedDates.includes(format(date, 'yyyy-MM-dd'))
  };

  const modifiersStyles = {
    completed: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      fontWeight: 'bold',
      borderRadius: '50%'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header title="Agenda" />
      
      <div className="container mx-auto px-4 py-6 pb-20 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6 mt-6">
            {/* Frequency Report */}
            <FrequencyReport key={refreshKey} />

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
                <CardTitle>Calendário de Treinos</CardTitle>
                <CardDescription>Dias com treinos concluídos estão destacados</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                  className="rounded-md border-0"
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
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
          </TabsContent>

          <TabsContent value="stats" className="space-y-6 mt-6">
            {/* Main Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Semana</span>
                  </div>
                  <div className="text-2xl font-bold">{frequencyStats.week.completed}</div>
                  <div className="text-xs text-muted-foreground">de {frequencyStats.week.total} dias</div>
                  <div className="mt-2 text-sm font-semibold text-primary">
                    {frequencyStats.week.percentage}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-muted-foreground">Mês</span>
                  </div>
                  <div className="text-2xl font-bold">{frequencyStats.month.completed}</div>
                  <div className="text-xs text-muted-foreground">de {frequencyStats.month.total} dias</div>
                  <div className="mt-2 text-sm font-semibold text-blue-600">
                    {frequencyStats.month.percentage}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-muted-foreground">Ano</span>
                  </div>
                  <div className="text-2xl font-bold">{frequencyStats.year.completed}</div>
                  <div className="text-xs text-muted-foreground">de {frequencyStats.year.total} dias</div>
                  <div className="mt-2 text-sm font-semibold text-green-600">
                    {frequencyStats.year.percentage}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-orange-600" />
                    <span className="text-xs text-muted-foreground">Sequência</span>
                  </div>
                  <div className="text-2xl font-bold">{frequencyStats.currentStreak}</div>
                  <div className="text-xs text-muted-foreground">dias consecutivos</div>
                  <div className="mt-2 text-sm font-semibold text-orange-600">
                    Máx: {frequencyStats.longestStreak}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Visão Detalhada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Esta Semana</div>
                      <div className="text-sm text-muted-foreground">
                        {frequencyStats.week.completed} treinos completados
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default">{frequencyStats.week.percentage}%</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        Meta: 70%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Este Mês</div>
                      <div className="text-sm text-muted-foreground">
                        {frequencyStats.month.completed} treinos completados
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default">{frequencyStats.month.percentage}%</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {frequencyStats.month.completed >= 20 ? '🔥 Excelente!' : 'Continue assim!'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Este Ano</div>
                      <div className="text-sm text-muted-foreground">
                        {frequencyStats.year.completed} treinos completados
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default">{frequencyStats.year.percentage}%</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        Média: {(frequencyStats.year.completed / 12).toFixed(1)}/mês
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Treinos por Mês (Ano Atual)</CardTitle>
                <CardDescription>
                  Visualize sua frequência mensal de treinos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      label={{ value: 'Treinos', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="workouts" radius={[8, 8, 0, 0]}>
                      {monthlyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.workouts >= 15 ? 'hsl(var(--primary))' : 'hsl(220, 70%, 50%)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Conquistas de Frequência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-4 rounded-lg border ${frequencyStats.currentStreak >= 7 ? 'bg-primary/10 border-primary' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className={`w-5 h-5 ${frequencyStats.currentStreak >= 7 ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-semibold">7 Dias</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {frequencyStats.currentStreak >= 7 ? '✓ Conquistado!' : 'Continue firme!'}
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${frequencyStats.month.completed >= 20 ? 'bg-primary/10 border-primary' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className={`w-5 h-5 ${frequencyStats.month.completed >= 20 ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-semibold">20 Treinos/Mês</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {frequencyStats.month.completed >= 20 ? '✓ Conquistado!' : `${20 - frequencyStats.month.completed} restantes`}
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${frequencyStats.longestStreak >= 30 ? 'bg-primary/10 border-primary' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Award className={`w-5 h-5 ${frequencyStats.longestStreak >= 30 ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-semibold">30 Dias Seguidos</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {frequencyStats.longestStreak >= 30 ? '✓ Conquistado!' : `Máx: ${frequencyStats.longestStreak}`}
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${frequencyStats.year.completed >= 200 ? 'bg-primary/10 border-primary' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className={`w-5 h-5 ${frequencyStats.year.completed >= 200 ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-semibold">200 Treinos/Ano</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {frequencyStats.year.completed >= 200 ? '✓ Conquistado!' : `${frequencyStats.year.completed}/200`}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}