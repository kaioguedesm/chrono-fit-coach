import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/common/LoadingState";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Dumbbell, TrendingUp, Trophy, Calendar, Search, Flame, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  studentId: string;
}

interface LogRow {
  id: string;
  weight_used: number | null;
  reps_completed: string | null;
  sets_completed: number;
  completed_at: string;
  exercise_name: string;
  session_id: string;
}

interface ExerciseStats {
  name: string;
  logs: LogRow[];
  maxWeight: number;
  lastWeight: number | null;
  lastDate: string;
  totalSets: number;
  trend: "up" | "down" | "flat";
  progressPct: number;
}

export function StudentExerciseLogs({ studentId }: Props) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const { data: sessions, error: sErr } = await supabase
        .from("workout_sessions")
        .select("id, completed_at, started_at")
        .eq("user_id", studentId)
        .order("started_at", { ascending: false })
        .limit(200);
      if (sErr) throw sErr;

      const sessionIds = (sessions || []).map((s) => s.id);
      if (sessionIds.length === 0) {
        setLogs([]);
        return;
      }

      const sessionDateMap = new Map(
        (sessions || []).map((s) => [s.id, s.completed_at || s.started_at]),
      );

      const { data: exSessions, error: esErr } = await supabase
        .from("exercise_sessions")
        .select("id, exercise_id, weight_used, reps_completed, sets_completed, workout_session_id, completed_at")
        .in("workout_session_id", sessionIds)
        .order("completed_at", { ascending: false });
      if (esErr) throw esErr;

      const exerciseIds = Array.from(new Set((exSessions || []).map((e) => e.exercise_id)));
      const { data: exercises } = await supabase
        .from("exercises")
        .select("id, name")
        .in("id", exerciseIds);

      const nameMap = new Map((exercises || []).map((e) => [e.id, e.name]));

      const rows: LogRow[] = (exSessions || []).map((e) => ({
        id: e.id,
        weight_used: e.weight_used,
        reps_completed: e.reps_completed,
        sets_completed: e.sets_completed,
        completed_at: e.completed_at || sessionDateMap.get(e.workout_session_id) || new Date().toISOString(),
        exercise_name: nameMap.get(e.exercise_id) || "Exercício removido",
        session_id: e.workout_session_id,
      }));

      setLogs(rows);
    } catch (err) {
      console.error("Erro ao buscar cargas:", err);
      toast.error("Erro ao carregar cargas do aluno");
    } finally {
      setLoading(false);
    }
  };

  const stats: ExerciseStats[] = useMemo(() => {
    const grouped = new Map<string, LogRow[]>();
    for (const r of logs) {
      const arr = grouped.get(r.exercise_name) || [];
      arr.push(r);
      grouped.set(r.exercise_name, arr);
    }

    const result: ExerciseStats[] = [];
    grouped.forEach((arr, name) => {
      const sorted = [...arr].sort(
        (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
      );
      const weights = sorted.map((l) => Number(l.weight_used ?? 0));
      const maxWeight = Math.max(...weights, 0);
      const lastWeight = sorted[0]?.weight_used ?? null;
      const firstWeight = sorted[sorted.length - 1]?.weight_used ?? null;
      let trend: "up" | "down" | "flat" = "flat";
      let progressPct = 0;
      if (lastWeight && firstWeight && firstWeight > 0) {
        progressPct = ((Number(lastWeight) - Number(firstWeight)) / Number(firstWeight)) * 100;
        if (progressPct > 1) trend = "up";
        else if (progressPct < -1) trend = "down";
      }

      result.push({
        name,
        logs: sorted,
        maxWeight,
        lastWeight: lastWeight !== null ? Number(lastWeight) : null,
        lastDate: sorted[0]?.completed_at || "",
        totalSets: sorted.reduce((acc, l) => acc + (l.sets_completed || 0), 0),
        trend,
        progressPct,
      });
    });

    return result.sort(
      (a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime(),
    );
  }, [logs]);

  const filtered = stats.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalRecords = logs.length;
  const totalExercises = stats.length;
  const heaviestPR = stats.reduce(
    (acc, s) => (s.maxWeight > acc.weight ? { name: s.name, weight: s.maxWeight } : acc),
    { name: "", weight: 0 },
  );

  if (loading) return <LoadingState />;

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Este aluno ainda não registrou nenhuma carga.</p>
          <p className="text-xs mt-2">As cargas aparecem aqui assim que ele concluir um treino marcando os pesos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRecords}</p>
              <p className="text-xs text-muted-foreground">Cargas registradas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Dumbbell className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalExercises}</p>
              <p className="text-xs text-muted-foreground">Exercícios diferentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/15">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold">{heaviestPR.weight > 0 ? `${heaviestPR.weight}kg` : "—"}</p>
              <p className="text-xs text-muted-foreground truncate">PR: {heaviestPR.name || "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar exercício..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de exercícios */}
      <Accordion type="multiple" className="space-y-2">
        {filtered.map((s) => {
          const chartData = [...s.logs]
            .reverse()
            .map((l) => ({
              date: new Date(l.completed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
              kg: Number(l.weight_used ?? 0),
            }));

          const trendColor =
            s.trend === "up" ? "text-emerald-600" : s.trend === "down" ? "text-destructive" : "text-muted-foreground";

          return (
            <AccordionItem
              key={s.name}
              value={s.name}
              className="border rounded-lg bg-card px-3"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex-1 flex items-center justify-between gap-3 pr-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Dumbbell className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="font-semibold truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.logs.length} {s.logs.length === 1 ? "registro" : "registros"} •{" "}
                        {new Date(s.lastDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.maxWeight > 0 && (
                      <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-700 dark:text-amber-400">
                        <Trophy className="h-3 w-3" />
                        {s.maxWeight}kg
                      </Badge>
                    )}
                    {s.lastWeight !== null && (
                      <Badge variant="secondary" className={`gap-1 ${trendColor}`}>
                        <TrendingUp className={`h-3 w-3 ${s.trend === "down" ? "rotate-180" : ""}`} />
                        {s.lastWeight}kg
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                {/* Gráfico de evolução */}
                {chartData.length > 1 && (
                  <Card className="mb-3 bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Evolução de carga
                        {s.progressPct !== 0 && (
                          <span className={`text-xs font-bold ${trendColor}`}>
                            {s.progressPct > 0 ? "+" : ""}
                            {s.progressPct.toFixed(1)}%
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} unit="kg" />
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: 8,
                              }}
                              formatter={(v: number) => [`${v}kg`, "Carga"]}
                            />
                            <Line
                              type="monotone"
                              dataKey="kg"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: "hsl(var(--primary))" }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Histórico detalhado */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Histórico recente
                  </p>
                  <div className="grid gap-2">
                    {s.logs.slice(0, 12).map((log) => {
                      const isPR = Number(log.weight_used ?? 0) === s.maxWeight && s.maxWeight > 0;
                      return (
                        <div
                          key={log.id}
                          className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 ${
                            isPR ? "border-amber-500/40 bg-amber-500/5" : "bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate">
                              {new Date(log.completed_at).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            {isPR && (
                              <Badge className="bg-amber-500 hover:bg-amber-500 text-white gap-1 text-[10px] h-5">
                                <Flame className="h-3 w-3" />
                                PR
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm shrink-0">
                            <span className="font-bold text-primary">
                              {log.weight_used ? `${log.weight_used}kg` : "—"}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {log.sets_completed}x{log.reps_completed || "?"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground text-sm">
              Nenhum exercício encontrado para "{search}".
            </CardContent>
          </Card>
        )}
      </Accordion>
    </div>
  );
}
