import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  User,
  Dumbbell,
  Apple,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Calendar,
  Weight,
  Ruler,
  Target,
  Plus,
  ClipboardCheck,
} from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { WorkoutApprovalBadge } from "@/components/workout/WorkoutApprovalBadge";
import { NutritionApprovalBadge } from "@/components/nutrition/NutritionApprovalBadge";
import { PersonalCreateWorkout } from "@/components/personal/PersonalCreateWorkout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StudentData {
  user_id: string;
  name: string;
  avatar_url?: string;
  goal?: string;
  experience_level?: string;
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
  dietary_preferences?: string[] | null;
  dietary_restrictions?: string[] | null;
  created_at: string;
}

interface WorkoutPlan {
  id: string;
  name: string;
  type: string;
  created_at: string;
  created_by?: string;
  approval_status: string;
  rejection_reason?: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
  }>;
}

interface NutritionPlan {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  approval_status: string;
  rejection_reason?: string;
  meals: Array<{
    name: string;
    meal_type: string;
  }>;
}

export default function PersonalStudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { isPersonal, loading: roleLoading } = useUserRole();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: "workout" | "nutrition" } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCreateWorkout, setShowCreateWorkout] = useState(false);
  const [evaluationNotes, setEvaluationNotes] = useState("");
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [savingEvaluation, setSavingEvaluation] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isPersonal) {
      toast.error("Acesso negado");
      navigate("/dashboard");
    }
  }, [isPersonal, roleLoading, navigate]);

  useEffect(() => {
    if (isPersonal && studentId) {
      fetchStudentData();
    }
  }, [isPersonal, studentId]);

  const fetchStudentData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate("/auth");
        return;
      }

      // Buscar dados do aluno
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", studentId)
        .single();

      if (profileError) throw profileError;
      setStudent(profile);

      // Buscar avaliação/observações do personal para esse aluno
      const { data: evaluationRow, error: evaluationError } = await supabase
        .from("personal_students")
        .select("id, notes")
        .eq("personal_id", user.id)
        .eq("student_id", studentId)
        .maybeSingle();

      // Se a tabela estiver com RLS mais restritiva, não derruba a página
      if (evaluationError) {
        console.warn("Error fetching evaluation notes:", evaluationError);
        setEvaluationId(null);
        setEvaluationNotes("");
      } else {
        setEvaluationId(evaluationRow?.id ?? null);
        setEvaluationNotes(evaluationRow?.notes ?? "");
      }

      // Buscar treinos (incluindo os criados pelo personal)
      const { data: workoutsData, error: workoutsError } = await supabase
        .from("workout_plans")
        .select(
          `
          *,
          exercises (name, sets, reps)
        `,
        )
        .eq("user_id", studentId)
        .order("created_at", { ascending: false });

      if (workoutsError) throw workoutsError;
      setWorkouts(workoutsData || []);

      // Buscar planos nutricionais
      const { data: nutritionData, error: nutritionError } = await supabase
        .from("nutrition_plans")
        .select(
          `
          *,
          meals (name, meal_type)
        `,
        )
        .eq("user_id", studentId)
        .eq("created_by", "ai")
        .order("created_at", { ascending: false });

      if (nutritionError) throw nutritionError;
      setNutritionPlans(nutritionData || []);
    } catch (error) {
      console.error("Error fetching student data:", error);
      toast.error("Erro ao carregar dados do aluno");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!studentId) return;

    try {
      setSavingEvaluation(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("Sessão expirada");

      if (evaluationId) {
        const { error } = await supabase
          .from("personal_students")
          .update({
            notes: evaluationNotes,
            is_active: true,
          })
          .eq("id", evaluationId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("personal_students")
          .insert({
            personal_id: user.id,
            student_id: studentId,
            notes: evaluationNotes,
            is_active: true,
          })
          .select("id")
          .single();

        if (error) throw error;
        setEvaluationId(data?.id ?? null);
      }

      toast.success("Avaliação salva e disponível para o aluno.");
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast.error("Erro ao salvar avaliação");
    } finally {
      setSavingEvaluation(false);
    }
  };

  const handleApprove = async (id: string, type: "workout" | "nutrition") => {
    try {
      const table = type === "workout" ? "workout_plans" : "nutrition_plans";
      const { error } = await supabase
        .from(table)
        .update({
          approval_status: "approved",
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success(`${type === "workout" ? "Treino" : "Plano nutricional"} aprovado!`);
      fetchStudentData();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Erro ao aprovar");
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !rejectionReason.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }

    try {
      const table = selectedItem.type === "workout" ? "workout_plans" : "nutrition_plans";
      const { error } = await supabase
        .from(table)
        .update({
          approval_status: "rejected",
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", selectedItem.id);

      if (error) throw error;

      toast.success("Rejeitado com feedback");
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedItem(null);
      fetchStudentData();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("Erro ao rejeitar");
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Header title="Detalhes do Aluno" />
        <div className="container mx-auto px-4 pt-28 py-8 pb-20">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (!isPersonal || !student) {
    return null;
  }

  const pendingWorkouts = workouts.filter((w) => w.approval_status === "pending").length;
  const pendingNutrition = nutritionPlans.filter((n) => n.approval_status === "pending").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header title="Detalhes do Aluno" />

      <div className="container mx-auto px-4 pt-28 py-8 pb-20 max-w-7xl space-y-6">
        {/* Botão voltar */}
        <Button variant="ghost" onClick={() => navigate("/personal-students")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para lista
        </Button>

        {/* Card do perfil do aluno */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={student.avatar_url} />
                <AvatarFallback>
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{student.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <Calendar className="h-4 w-4" />
                  Aluno desde {new Date(student.created_at).toLocaleDateString("pt-BR")}
                </CardDescription>

                <div className="flex flex-wrap gap-2 mt-3">
                  {student.goal && (
                    <Badge variant="secondary" className="gap-1">
                      <Target className="h-3 w-3" />
                      {student.goal}
                    </Badge>
                  )}
                  {student.experience_level && <Badge variant="secondary">{student.experience_level}</Badge>}
                  {pendingWorkouts + pendingNutrition > 0 && (
                    <Badge variant="outline" className="gap-1 text-orange-600 border-orange-500/50">
                      <Clock className="h-3 w-3" />
                      {pendingWorkouts + pendingNutrition} pendente{pendingWorkouts + pendingNutrition !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {student.weight && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Weight className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">{student.weight}kg</p>
                      <p className="text-xs text-muted-foreground">Peso</p>
                    </div>
                  </div>
                )}
                {student.height && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Ruler className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">{student.height}cm</p>
                      <p className="text-xs text-muted-foreground">Altura</p>
                    </div>
                  </div>
                )}
                {student.age && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">{student.age} anos</p>
                      <p className="text-xs text-muted-foreground">Idade</p>
                    </div>
                  </div>
                )}
                {student.gender && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold capitalize">{student.gender}</p>
                      <p className="text-xs text-muted-foreground">Gênero</p>
                    </div>
                  </div>
                )}
              </div>

              {(student.dietary_preferences?.length || 0) > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Preferências Alimentares</p>
                  <div className="flex flex-wrap gap-2">
                    {student.dietary_preferences?.map((pref) => (
                      <Badge key={pref} variant="outline" className="text-xs">
                        {pref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(student.dietary_restrictions?.length || 0) > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Restrições Alimentares</p>
                  <div className="flex flex-wrap gap-2">
                    {student.dietary_restrictions?.map((restriction) => (
                      <Badge key={restriction} variant="destructive" className="text-xs">
                        {restriction}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ação rápida: Criar Treino */}
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateWorkout(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Treino para {student.name}
          </Button>
        </div>

        {/* Tabs de treinos e nutrição */}
        <Tabs defaultValue="workouts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="workouts" className="gap-2">
              <Dumbbell className="h-4 w-4" />
              Treinos ({workouts.length})
              {pendingWorkouts > 0 && (
                <Badge variant="outline" className="ml-1 text-orange-600 border-orange-500/50">
                  {pendingWorkouts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="gap-2">
              <Apple className="h-4 w-4" />
              Nutrição ({nutritionPlans.length})
              {pendingNutrition > 0 && (
                <Badge variant="outline" className="ml-1 text-orange-600 border-orange-500/50">
                  {pendingNutrition}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Avaliação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workouts" className="space-y-4 mt-6">
            {workouts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum treino criado ainda</p>
                </CardContent>
              </Card>
            ) : (
              workouts.map((workout) => (
                <Card key={workout.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{workout.name}</CardTitle>
                          {workout.created_by === "personal" && (
                            <Badge variant="default" className="text-xs gap-1">
                              <User className="h-3 w-3" />
                              Criado por você
                            </Badge>
                          )}
                          {workout.created_by === "ai" && (
                            <Badge variant="outline" className="text-xs">
                              Gerado por IA
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {new Date(workout.created_at).toLocaleDateString("pt-BR")} • {workout.type}
                        </CardDescription>
                      </div>
                      <WorkoutApprovalBadge
                        status={workout.approval_status}
                        rejectionReason={workout.rejection_reason}
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-2">Exercícios ({workout.exercises?.length || 0}):</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        {workout.exercises?.slice(0, 3).map((ex, idx) => (
                          <li key={idx}>
                            {ex.name} - {ex.sets}x{ex.reps}
                          </li>
                        ))}
                        {workout.exercises?.length > 3 && (
                          <li className="italic">+ {workout.exercises.length - 3} exercícios...</li>
                        )}
                      </ul>
                    </div>

                    {workout.rejection_reason && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <p className="text-sm font-medium text-destructive mb-1">Motivo da Rejeição:</p>
                        <p className="text-sm text-muted-foreground">{workout.rejection_reason}</p>
                      </div>
                    )}

                    {workout.approval_status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button onClick={() => handleApprove(workout.id, "workout")} className="flex-1">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedItem({ id: workout.id, type: "workout" });
                            setShowRejectDialog(true);
                          }}
                          className="flex-1"
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-4 mt-6">
            {nutritionPlans.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Apple className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum plano nutricional criado ainda</p>
                </CardContent>
              </Card>
            ) : (
              nutritionPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(plan.created_at).toLocaleDateString("pt-BR")}
                          {plan.description && ` • ${plan.description}`}
                        </CardDescription>
                      </div>
                      <NutritionApprovalBadge status={plan.approval_status} rejectionReason={plan.rejection_reason} />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-2">Refeições ({plan.meals?.length || 0}):</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        {plan.meals?.slice(0, 3).map((meal, idx) => (
                          <li key={idx}>
                            {meal.name} ({meal.meal_type})
                          </li>
                        ))}
                        {plan.meals?.length > 3 && <li className="italic">+ {plan.meals.length - 3} refeições...</li>}
                      </ul>
                    </div>

                    {plan.rejection_reason && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <p className="text-sm font-medium text-destructive mb-1">Motivo da Rejeição:</p>
                        <p className="text-sm text-muted-foreground">{plan.rejection_reason}</p>
                      </div>
                    )}

                    {plan.approval_status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button onClick={() => handleApprove(plan.id, "nutrition")} className="flex-1">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedItem({ id: plan.id, type: "nutrition" });
                            setShowRejectDialog(true);
                          }}
                          className="flex-1"
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="evaluation" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Avaliação do Aluno</CardTitle>
                <CardDescription>
                  Escreva sua avaliação/observações. O aluno verá esse conteúdo no perfil dele.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Ex: Pontos fortes, pontos de atenção, orientações, próximos passos..."
                  value={evaluationNotes}
                  onChange={(e) => setEvaluationNotes(e.target.value)}
                  className="min-h-[160px]"
                />
                <div className="flex justify-end">
                  <Button onClick={handleSaveEvaluation} disabled={savingEvaluation}>
                    {savingEvaluation ? "Salvando..." : "Salvar Avaliação"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Criação de Treino */}
      <PersonalCreateWorkout
        open={showCreateWorkout}
        onOpenChange={setShowCreateWorkout}
        preSelectedStudentId={studentId}
        onSuccess={fetchStudentData}
      />

      {/* Dialog de rejeição */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Rejeitar {selectedItem?.type === "workout" ? "Treino" : "Plano Nutricional"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da rejeição para que o aluno possa entender.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Ex: Exercícios inadequados para o nível do aluno..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive hover:bg-destructive/90">
              Confirmar Rejeição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
