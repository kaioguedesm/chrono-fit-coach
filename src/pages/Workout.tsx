import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Play,
  Plus,
  Weight,
  RotateCcw,
  TrendingUp,
  Share2,
  Trash2,
  MoreVertical,
  Edit,
  Dumbbell,
  Lock,
} from "lucide-react";
import { ActiveWorkoutSession } from "@/components/workout/ActiveWorkoutSession";
import { WorkoutHistory } from "@/components/workout/WorkoutHistory";
import { CreateWorkoutForm } from "@/components/workout/CreateWorkoutForm";
import { AIWorkoutGenerator } from "@/components/workout/AIWorkoutGenerator";
import { ShareWorkoutModal } from "@/components/workout/ShareWorkoutModal";
import { EditWorkoutModal } from "@/components/workout/EditWorkoutModal";
import { WorkoutApprovalBadge } from "@/components/workout/WorkoutApprovalBadge";
import { WorkoutRefreshAlert } from "@/components/workout/WorkoutRefreshAlert";
import { WorkoutRefreshDialog } from "@/components/workout/WorkoutRefreshDialog";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";

interface WorkoutPlan {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  created_by: string;
  approval_status?: string;
  rejection_reason?: string;
  workouts_completed_count?: number;
  max_workouts_before_refresh?: number;
  needs_refresh?: boolean;
  exercises: Exercise[];
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  rest_time: number | null;
  order_in_workout: number;
  notes: string | null;
  group_muscle?: string;
}

export default function Workout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSignedTerms, setHasSignedTerms] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("plans");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedWorkoutToShare, setSelectedWorkoutToShare] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedWorkoutToEdit, setSelectedWorkoutToEdit] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    planName: string;
    exercises: Exercise[];
  } | null>(null);
  const [refreshDialogOpen, setRefreshDialogOpen] = useState(false);
  const [selectedWorkoutToRefresh, setSelectedWorkoutToRefresh] = useState<WorkoutPlan | null>(null);

  // Reset selected workout when modal closes
  useEffect(() => {
    if (!shareModalOpen) {
      setSelectedWorkoutToShare(null);
    }
  }, [shareModalOpen]);

  useEffect(() => {
    if (!editModalOpen) {
      setSelectedWorkoutToEdit(null);
    }
  }, [editModalOpen]);

  useEffect(() => {
    if (user) {
      fetchWorkoutPlans();
      checkSignedTerms();
    } else {
      // Se não houver usuário (modo demo), apenas seta loading como false
      setLoading(false);
    }
  }, [user]);

  const checkSignedTerms = async () => {
    if (!user) return;

    try {
      const { data: termsData } = await supabase
        .from("user_terms_acceptance")
        .select("signed_pdf_url, signed_pdf_base64")
        .eq("user_id", user.id)
        .maybeSingle();

      // Usar type assertion para evitar erros de TypeScript quando as colunas não existem
      const signatureData = termsData as any;
      setHasSignedTerms(!!(signatureData?.signed_pdf_url || signatureData?.signed_pdf_base64));
    } catch (error) {
      console.error("Erro ao verificar termo assinado:", error);
      setHasSignedTerms(false);
    }
  };

  const fetchWorkoutPlans = async () => {
    if (!user) return;

    try {
      const { data: plans, error } = await supabase
        .from("workout_plans")
        .select(
          `
          *,
          exercises (*)
        `,
        )
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setWorkoutPlans(plans || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os treinos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = async (plan: WorkoutPlan) => {
    if (!user) return;

    // Check if workout needs refresh
    if (plan.needs_refresh) {
      setSelectedWorkoutToRefresh(plan);
      setRefreshDialogOpen(true);
      return;
    }

    // Check if the workout is approved (for AI workouts)
    // Se o usuário tiver termo assinado, pode usar treinos não aprovados
    if (plan.created_by === "ai" && plan.approval_status !== "approved") {
      // Verificar se o usuário tem termo assinado
      const { data: termsData } = await supabase
        .from("user_terms_acceptance")
        .select("signed_pdf_url, signed_pdf_base64")
        .eq("user_id", user.id)
        .maybeSingle();

      // Usar type assertion para evitar erros de TypeScript quando as colunas não existem
      const signatureData = termsData as any;
      const hasSignedTerms = !!(signatureData?.signed_pdf_url || signatureData?.signed_pdf_base64);

      if (!hasSignedTerms) {
        toast({
          title: "Treino não aprovado",
          description: "Este treino ainda não foi aprovado pelo personal trainer.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: user.id,
          workout_plan_id: plan.id,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setActiveSession({
        sessionId: data.id,
        planName: plan.name,
        exercises: plan.exercises.sort((a, b) => a.order_in_workout - b.order_in_workout),
      });

      toast({
        title: "Treino iniciado!",
        description: "Boa sorte com seu treino 💪",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o treino.",
        variant: "destructive",
      });
    }
  };

  const handleWorkoutComplete = () => {
    setActiveSession(null);
    fetchWorkoutPlans();
    setActiveTab("history");
  };

  const handleWorkoutCancel = async () => {
    if (activeSession) {
      // Delete incomplete session
      await supabase.from("workout_sessions").delete().eq("id", activeSession.sessionId);
    }
    setActiveSession(null);
  };

  const handleDeletePlan = async () => {
    if (!planToDelete || !user) return;

    try {
      // Delete exercises first (due to foreign key constraints)
      const { error: exercisesError } = await supabase.from("exercises").delete().eq("workout_plan_id", planToDelete);

      if (exercisesError) throw exercisesError;

      // Then delete the workout plan
      const { error: planError } = await supabase.from("workout_plans").delete().eq("id", planToDelete);

      if (planError) throw planError;

      toast({
        title: "Treino excluído",
        description: "O treino foi removido com sucesso.",
      });

      // Update local state
      setWorkoutPlans(workoutPlans.filter((p) => p.id !== planToDelete));
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o treino.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const samplePlans: WorkoutPlan[] = [
    {
      id: "sample-1",
      name: "Treino A - Peito e Tríceps",
      type: "A",
      is_active: true,
      created_by: "ai",
      exercises: [
        {
          id: "1",
          name: "Supino Reto",
          sets: 4,
          reps: "8-12",
          weight: 60,
          rest_time: 120,
          order_in_workout: 1,
          notes: "Foco na execução",
          group_muscle: "peito",
        },
        {
          id: "2",
          name: "Supino Inclinado",
          sets: 3,
          reps: "10-12",
          weight: 45,
          rest_time: 90,
          order_in_workout: 2,
          notes: null,
          group_muscle: "peito",
        },
        {
          id: "3",
          name: "Crucifixo",
          sets: 3,
          reps: "12-15",
          weight: 15,
          rest_time: 60,
          order_in_workout: 3,
          notes: null,
          group_muscle: "peito",
        },
        {
          id: "4",
          name: "Tríceps Testa",
          sets: 3,
          reps: "10-12",
          weight: 20,
          rest_time: 60,
          order_in_workout: 4,
          notes: null,
          group_muscle: "tríceps",
        },
      ],
    },
    {
      id: "sample-2",
      name: "Treino B - Costas e Bíceps",
      type: "B",
      is_active: true,
      created_by: "ai",
      exercises: [
        {
          id: "5",
          name: "Puxada Frontal",
          sets: 4,
          reps: "8-12",
          weight: 50,
          rest_time: 120,
          order_in_workout: 1,
          notes: "Contrair bem as costas",
          group_muscle: "costas",
        },
        {
          id: "6",
          name: "Remada Sentado",
          sets: 3,
          reps: "10-12",
          weight: 45,
          rest_time: 90,
          order_in_workout: 2,
          notes: null,
          group_muscle: "costas",
        },
      ],
    },
  ];

  const displayPlans = workoutPlans.length > 0 ? workoutPlans : samplePlans;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Header title="Treinos" />
        <div className="container mx-auto px-4 pt-28 py-8 pb-20">
          <LoadingState type="grid" count={2} />
        </div>
      </div>
    );
  }

  // If there's an active session, show the workout interface
  if (activeSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Header title="Treino em Andamento" />
        <div className="container mx-auto px-4 pt-28 py-8 pb-20">
          <ActiveWorkoutSession
            sessionId={activeSession.sessionId}
            planName={activeSession.planName}
            exercises={activeSession.exercises}
            onComplete={handleWorkoutComplete}
            onCancel={handleWorkoutCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header title="Treinos" />

      <div className="container mx-auto px-4 pt-28 py-8 pb-20 space-y-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans">
              <Play className="w-4 h-4 mr-1" />
              Fichas
            </TabsTrigger>
            <TabsTrigger value="history">
              <TrendingUp className="w-4 h-4 mr-1" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="create">
              <Plus className="w-4 h-4 mr-1" />
              Criar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            {/* AI Workout Generator */}
            <AIWorkoutGenerator onSuccess={fetchWorkoutPlans} />

            {/* My Workouts Section */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Seus Treinos</h2>
                <p className="text-sm text-muted-foreground">Escolha um treino para começar</p>
              </div>
              <Button size="sm" onClick={() => setActiveTab("create")}>
                <Plus className="w-4 h-4 mr-2" />
                Novo
              </Button>
            </div>

            {displayPlans.length === 0 ? (
              <EmptyState
                icon={Dumbbell}
                title="Nenhum treino criado"
                description="Crie seu primeiro treino personalizado ou use a IA para gerar um plano completo adaptado aos seus objetivos."
                motivation="O primeiro passo é sempre o mais importante!"
                actionLabel="Criar Primeiro Treino"
                onAction={() => setActiveTab("create")}
              />
            ) : (
              <div className="space-y-4">
                {displayPlans.map((plan) => {
                  // Verificar se o treino está bloqueado (IA pendente e usuário sem termo assinado)
                  const isBlocked =
                    plan.created_by === "ai" && plan.approval_status === "pending" && hasSignedTerms === false;

                  return (
                    <Card
                      key={plan.id}
                      className={`hover:shadow-lg transition-shadow relative ${isBlocked ? "opacity-60" : ""}`}
                    >
                      {/* Overlay de bloqueio */}
                      {isBlocked && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
                          <div className="text-center p-6 space-y-3">
                            <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
                            <div>
                              <h3 className="font-semibold text-lg mb-1">Treino Aguardando Aprovação</h3>
                              <p className="text-sm text-muted-foreground max-w-sm">
                                Este treino foi gerado pela IA e está aguardando aprovação do seu personal trainer para
                                garantir sua segurança.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <CardTitle className="text-lg">{plan.name}</CardTitle>
                              <Badge variant={plan.created_by === "ai" ? "default" : "secondary"}>
                                {plan.created_by === "ai" ? "🤖 IA" : "👤 Custom"}
                              </Badge>
                              {plan.created_by === "ai" &&
                                plan.approval_status &&
                                !(hasSignedTerms && plan.approval_status === "pending") && (
                                  <WorkoutApprovalBadge
                                    status={plan.approval_status}
                                    rejectionReason={plan.rejection_reason}
                                    size="sm"
                                  />
                                )}
                            </div>
                            <Badge variant="outline">Treino {plan.type}</Badge>
                          </div>
                          {user && !isBlocked && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedWorkoutToEdit(plan.id);
                                    setEditModalOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Visualizar e Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedWorkoutToShare({ id: plan.id, name: plan.name });
                                    setShareModalOpen(true);
                                  }}
                                >
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Compartilhar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlanToDelete(plan.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir treino
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Workout refresh alert */}
                        {plan.workouts_completed_count && plan.workouts_completed_count > 0 && (
                          <WorkoutRefreshAlert
                            workoutName={plan.name}
                            completedWorkouts={plan.workouts_completed_count}
                            maxWorkouts={plan.max_workouts_before_refresh || 35}
                            needsRefresh={plan.needs_refresh || false}
                            onRefresh={() => {
                              setSelectedWorkoutToRefresh(plan);
                              setRefreshDialogOpen(true);
                            }}
                          />
                        )}

                        {!isBlocked ? (
                          <div className="space-y-2">
                            {plan.exercises.slice(0, 4).map((exercise) => (
                              <div
                                key={exercise.id}
                                className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded"
                              >
                                <span className="font-medium">{exercise.name}</span>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span>
                                    {exercise.sets}×{exercise.reps}
                                  </span>
                                  {exercise.weight && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Weight className="w-3 h-3 mr-1" />
                                      {exercise.weight}kg
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                            {plan.exercises.length > 4 && (
                              <div className="text-sm text-muted-foreground text-center">
                                +{plan.exercises.length - 4} exercícios
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2 opacity-50 pointer-events-none">
                            <div className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded blur-sm">
                              <span className="font-medium">Exercício bloqueado</span>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <span>---</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded blur-sm">
                              <span className="font-medium">Exercício bloqueado</span>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <span>---</span>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground text-center blur-sm">
                              +{plan.exercises.length - 2} exercícios bloqueados
                            </div>
                          </div>
                        )}

                        <Button
                          className="w-full"
                          size="lg"
                          onClick={() => startWorkout(plan)}
                          disabled={
                            plan.created_by === "ai" && plan.approval_status !== "approved" && hasSignedTerms === false
                          }
                        >
                          <Play className="w-5 h-5 mr-2" />
                          {plan.created_by === "ai" && plan.approval_status === "pending" && hasSignedTerms === false
                            ? "Aguardando Aprovação"
                            : "Iniciar Treino"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <WorkoutHistory />
          </TabsContent>

          <TabsContent value="create">
            <CreateWorkoutForm
              onSuccess={() => {
                fetchWorkoutPlans();
                setActiveTab("plans");
              }}
            />
          </TabsContent>
        </Tabs>

        {selectedWorkoutToShare && (
          <ShareWorkoutModal
            open={shareModalOpen}
            onOpenChange={setShareModalOpen}
            workoutPlanId={selectedWorkoutToShare.id}
            workoutName={selectedWorkoutToShare.name}
          />
        )}

        {selectedWorkoutToEdit && (
          <EditWorkoutModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            workoutPlanId={selectedWorkoutToEdit}
            onSuccess={fetchWorkoutPlans}
          />
        )}

        {selectedWorkoutToRefresh && (
          <WorkoutRefreshDialog
            open={refreshDialogOpen}
            onOpenChange={(open) => {
              setRefreshDialogOpen(open);
              if (!open) {
                setSelectedWorkoutToRefresh(null);
              }
            }}
            workoutPlanId={selectedWorkoutToRefresh.id}
            workoutName={selectedWorkoutToRefresh.name}
            completedWorkouts={selectedWorkoutToRefresh.workouts_completed_count || 0}
          />
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir treino?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O treino e todos os seus exercícios serão permanentemente excluídos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePlan}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
