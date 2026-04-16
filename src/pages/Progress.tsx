import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus, Dumbbell, Camera, BarChart3, Loader2 } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid,
} from "recharts";
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PhotoUpload } from "@/components/progress/PhotoUpload";
import { PhotoGallery } from "@/components/progress/PhotoGallery";
import { PhotoComparison } from "@/components/progress/PhotoComparison";
import { useAntiStagnation } from "@/hooks/useAntiStagnation";
import { cn } from "@/lib/utils";

interface ExerciseLoadData {
  exerciseName: string;
  data: { date: string; weight: number; label: string }[];
  currentWeight: number;
  previousWeight: number;
  changePercent: number;
}

interface WeeklyComparison {
  metric: string;
  thisWeek: number;
  lastWeek: number;
  change: number;
  unit: string;
}

export default function Progress() {
  const { user } = useAuth();
  const { toast } = useToast();
  const antiStagnation = useAntiStagnation();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [exerciseLoads, setExerciseLoads] = useState<ExerciseLoadData[]>([]);
  const [weeklyComparison, setWeeklyComparison] = useState<WeeklyComparison[]>([]);
  const [volumeByGroup, setVolumeByGroup] = useState<{ group: string; sets: number }[]>([]);
  const [refreshPhotos, setRefreshPhotos] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<{ day: string; count: number }[]>([]);

  useEffect(() => {
    if (user) loadEvolutionData();
    else setLoading(false);
  }, [user]);

  const loadEvolutionData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const lastWeekStart = subDays(thisWeekStart, 7);
      const lastWeekEnd = subDays(thisWeekStart, 1);

      // Fetch sessions
      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("id, completed_at, workout_plan_id")
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .gte("completed_at", thirtyDaysAgo.toISOString())
        .order("completed_at", { ascending: true });

      if (!sessions || sessions.length === 0) {
        setLoading(false);
        return;
      }

      // Weekly workouts chart
      const dayMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = subDays(new Date(), i);
        dayMap[format(d, "EEE", { locale: ptBR })] = 0;
      }
      sessions.forEach((s) => {
        const d = new Date(s.completed_at!);
        const dayDiff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff < 7) {
          const key = format(d, "EEE", { locale: ptBR });
          if (key in dayMap) dayMap[key]++;
        }
      });
      setWeeklyWorkouts(Object.entries(dayMap).map(([day, count]) => ({ day, count })));

      // Weekly comparison
      const thisWeekSessions = sessions.filter(
        (s) => new Date(s.completed_at!) >= thisWeekStart
      ).length;
      const lastWeekSessions = sessions.filter(
        (s) => {
          const d = new Date(s.completed_at!);
          return d >= lastWeekStart && d <= lastWeekEnd;
        }
      ).length;

      // Fetch exercise sessions
      const sessionIds = sessions.map((s) => s.id);
      const { data: exerciseSessions } = await supabase
        .from("exercise_sessions")
        .select("exercise_id, weight_used, sets_completed, reps_completed, completed_at, workout_session_id")
        .in("workout_session_id", sessionIds)
        .order("completed_at", { ascending: true });

      // Get exercise names
      const exerciseIds = [...new Set(exerciseSessions?.map((es) => es.exercise_id) || [])];
      const { data: exercises } = await supabase
        .from("exercises")
        .select("id, name")
        .in("id", exerciseIds);

      const nameMap = new Map(exercises?.map((e) => [e.id, e.name]) || []);

      // Build exercise load evolution
      const grouped = new Map<string, { date: string; weight: number }[]>();
      const groupVolume = new Map<string, number>();

      for (const es of exerciseSessions || []) {
        const name = nameMap.get(es.exercise_id) || "Desconhecido";
        if (!grouped.has(name)) grouped.set(name, []);
        grouped.get(name)!.push({
          date: es.completed_at,
          weight: es.weight_used || 0,
        });

        // Volume counting (sets)
        const current = groupVolume.get(name) || 0;
        groupVolume.set(name, current + es.sets_completed);
      }

      const loads: ExerciseLoadData[] = [];
      for (const [name, entries] of grouped) {
        if (entries.length < 2) continue;
        const firstWeight = entries[0].weight;
        const lastWeight = entries[entries.length - 1].weight;
        const changePercent = firstWeight > 0
          ? Math.round(((lastWeight - firstWeight) / firstWeight) * 100)
          : 0;

        loads.push({
          exerciseName: name,
          data: entries.map((e) => ({
            date: e.date,
            weight: e.weight,
            label: format(new Date(e.date), "dd/MM"),
          })),
          currentWeight: lastWeight,
          previousWeight: firstWeight,
          changePercent,
        });
      }

      // Sort by most data points
      loads.sort((a, b) => b.data.length - a.data.length);
      setExerciseLoads(loads.slice(0, 8));

      // Volume by group (top exercises by sets)
      const volumeArr = Array.from(groupVolume.entries())
        .map(([group, sets]) => ({ group, sets }))
        .sort((a, b) => b.sets - a.sets)
        .slice(0, 6);
      setVolumeByGroup(volumeArr);

      // This week vs last week sets
      const thisWeekExSessions = (exerciseSessions || []).filter((es) => {
        const session = sessions.find((s) => s.id === es.workout_session_id);
        return session && new Date(session.completed_at!) >= thisWeekStart;
      });
      const lastWeekExSessions = (exerciseSessions || []).filter((es) => {
        const session = sessions.find((s) => s.id === es.workout_session_id);
        if (!session) return false;
        const d = new Date(session.completed_at!);
        return d >= lastWeekStart && d <= lastWeekEnd;
      });

      setWeeklyComparison([
        {
          metric: "Treinos",
          thisWeek: thisWeekSessions,
          lastWeek: lastWeekSessions,
          change: lastWeekSessions > 0
            ? Math.round(((thisWeekSessions - lastWeekSessions) / lastWeekSessions) * 100)
            : thisWeekSessions > 0 ? 100 : 0,
          unit: "",
        },
        {
          metric: "Séries totais",
          thisWeek: thisWeekExSessions.reduce((sum, es) => sum + es.sets_completed, 0),
          lastWeek: lastWeekExSessions.reduce((sum, es) => sum + es.sets_completed, 0),
          change: 0,
          unit: "",
        },
      ]);

      // Recalculate change for series
      setWeeklyComparison((prev) => {
        const updated = [...prev];
        if (updated[1] && updated[1].lastWeek > 0) {
          updated[1].change = Math.round(
            ((updated[1].thisWeek - updated[1].lastWeek) / updated[1].lastWeek) * 100
          );
        }
        return updated;
      });
    } catch (error) {
      console.error("Error loading evolution:", error);
    } finally {
      setLoading(false);
    }
  };

  const overallChangePercent = useMemo(() => {
    if (exerciseLoads.length === 0) return 0;
    const avg = exerciseLoads.reduce((sum, e) => sum + e.changePercent, 0) / exerciseLoads.length;
    return Math.round(avg);
  }, [exerciseLoads]);

  if (loading) {
    return (
      <div className="pb-20">
        <Header title="Evolução" />
        <div className="container mx-auto px-4 pt-24 py-8 max-w-lg">
          <LoadingState type="grid" count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <Header title="Evolução" />
      <main className="container mx-auto px-4 pt-24 py-6 space-y-5 max-w-lg">
        {/* Overall Evolution Badge */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Sua Evolução</h2>
            <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold",
            overallChangePercent > 0
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : overallChangePercent < 0
                ? "bg-red-500/10 text-red-500"
                : "bg-muted text-muted-foreground"
          )}>
            {overallChangePercent > 0 ? (
              <ArrowUp className="w-4 h-4" />
            ) : overallChangePercent < 0 ? (
              <ArrowDown className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
            {overallChangePercent > 0 ? "+" : ""}{overallChangePercent}%
          </div>
        </div>

        {/* Smart feedback */}
        {antiStagnation.overallStatus !== "new" && (
          <Card className={cn(
            "border",
            antiStagnation.overallStatus === "progressing"
              ? "border-green-500/20 bg-green-500/5"
              : antiStagnation.overallStatus === "stagnated"
                ? "border-amber-500/20 bg-amber-500/5"
                : "border-red-500/20 bg-red-500/5"
          )}>
            <CardContent className="p-3">
              <p className="text-sm text-foreground font-medium">
                {antiStagnation.overallStatus === "progressing" && "🔥 Você está evoluindo — continue assim!"}
                {antiStagnation.overallStatus === "stagnated" && "⚡ Detectamos estagnação — ajustes sugeridos abaixo"}
                {antiStagnation.overallStatus === "declining" && "⚠️ Hora de ajustar seu treino para retomar a evolução"}
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="text-xs">
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="loads" className="text-xs">
              <Dumbbell className="w-3.5 h-3.5 mr-1" />
              Cargas
            </TabsTrigger>
            <TabsTrigger value="photos" className="text-xs">
              <Camera className="w-3.5 h-3.5 mr-1" />
              Fotos
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Weekly comparison */}
            {weeklyComparison.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {weeklyComparison.map((item) => (
                  <Card key={item.metric}>
                    <CardContent className="p-4 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">{item.metric}</p>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-foreground">{item.thisWeek}</span>
                        <span className="text-xs text-muted-foreground mb-1">vs {item.lastWeek}</span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 text-xs font-semibold",
                        item.change > 0 ? "text-green-500" : item.change < 0 ? "text-red-500" : "text-muted-foreground"
                      )}>
                        {item.change > 0 ? <ArrowUp className="w-3 h-3" /> : item.change < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {item.change > 0 ? "+" : ""}{item.change}% vs semana passada
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Weekly workouts chart */}
            {weeklyWorkouts.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Treinos esta semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={weeklyWorkouts}>
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Bar
                        dataKey="count"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Volume by exercise */}
            {volumeByGroup.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Volume por exercício (séries)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {volumeByGroup.map((item) => {
                    const max = volumeByGroup[0].sets;
                    const pct = max > 0 ? (item.sets / max) * 100 : 0;
                    return (
                      <div key={item.group} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-foreground truncate mr-2">{item.group}</span>
                          <span className="text-muted-foreground flex-shrink-0">{item.sets} séries</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {exerciseLoads.length === 0 && weeklyComparison.length === 0 && (
              <EmptyState
                title="Sem dados ainda"
                description="Complete treinos para ver sua evolução aqui."
                icon={<TrendingUp className="w-12 h-12 text-muted-foreground" />}
              />
            )}
          </TabsContent>

          {/* LOADS TAB */}
          <TabsContent value="loads" className="space-y-4 mt-4">
            {exerciseLoads.length > 0 ? (
              exerciseLoads.map((exercise) => (
                <Card key={exercise.exerciseName}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm truncate mr-2">{exercise.exerciseName}</CardTitle>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] flex-shrink-0",
                          exercise.changePercent > 0
                            ? "text-green-500 border-green-500/30"
                            : exercise.changePercent < 0
                              ? "text-red-500 border-red-500/30"
                              : "text-muted-foreground"
                        )}
                      >
                        {exercise.changePercent > 0 ? "+" : ""}{exercise.changePercent}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {exercise.previousWeight}kg → {exercise.currentWeight}kg
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={100}>
                      <AreaChart data={exercise.data}>
                        <defs>
                          <linearGradient id={`grad-${exercise.exerciseName}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                          formatter={(value: number) => [`${value}kg`, "Carga"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="weight"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill={`url(#grad-${exercise.exerciseName})`}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState
                title="Sem dados de carga"
                description="Registre cargas nos seus treinos para acompanhar a evolução."
                icon={<Dumbbell className="w-12 h-12 text-muted-foreground" />}
              />
            )}

            {/* Stagnation suggestions */}
            {antiStagnation.exerciseProgress.filter((e) => e.trend === "stagnated").length > 0 && (
              <Card className="border-amber-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-amber-600 dark:text-amber-400">
                    ⚡ Sugestões de ajuste
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {antiStagnation.exerciseProgress
                    .filter((e) => e.trend === "stagnated" && e.suggestedWeight)
                    .slice(0, 4)
                    .map((e) => (
                      <div key={e.exerciseName} className="flex items-center justify-between py-1.5 px-2 bg-muted/50 rounded-lg">
                        <span className="text-xs font-medium truncate mr-2">{e.exerciseName}</span>
                        <span className="text-xs font-semibold text-primary flex-shrink-0">
                          {e.lastWeight}kg → {e.suggestedWeight}kg
                        </span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* PHOTOS TAB */}
          <TabsContent value="photos" className="space-y-4 mt-4">
            {user && (
              <>
                <PhotoUpload
                  userId={user.id}
                  onPhotoUploaded={() => setRefreshPhotos((p) => p + 1)}
                />
                <PhotoComparison userId={user.id} />
                <PhotoGallery
                  userId={user.id}
                  refreshTrigger={refreshPhotos}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
