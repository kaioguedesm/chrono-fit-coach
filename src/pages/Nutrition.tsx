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
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Apple, Upload, Trash2, Pencil } from "lucide-react";
import { AINutritionGenerator } from "@/components/nutrition/AINutritionGenerator";
import { MealPhotoAnalyzer } from "@/components/nutrition/MealPhotoAnalyzer";
import { DietUploader } from "@/components/nutrition/DietUploader";
import { RecipeExplorer } from "@/components/nutrition/RecipeExplorer";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { NutritionApprovalBadge } from "@/components/nutrition/NutritionApprovalBadge";
import { EditNutritionPlanModal } from "@/components/nutrition/EditNutritionPlanModal";
import { useUserRole } from "@/hooks/useUserRole";
import { useCanCreateWithoutPersonal } from "@/hooks/useCanCreateWithoutPersonal";

interface NutritionPlan {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  created_by: string;
  is_active: boolean;
  approval_status?: string;
  rejection_reason?: string;
  meals: Meal[];
}

interface Meal {
  id: string;
  meal_type: string;
  name: string;
  ingredients: string[];
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  instructions: string | null;
}

const mealTypes = [
  { key: "cafe_da_manha", label: "Café da Manhã" },
  { key: "lanche_manha", label: "Lanche da Manhã" },
  { key: "almoco", label: "Almoço" },
  { key: "lanche_tarde", label: "Lanche da Tarde" },
  { key: "jantar", label: "Jantar" },
  { key: "ceia", label: "Ceia" },
];

export default function Nutrition() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPersonal, loading: roleLoading } = useUserRole();
  const { canCreateWithoutPersonal } = useCanCreateWithoutPersonal();
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("plans");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchNutritionPlans();
    }
  }, [user]);

  const fetchNutritionPlans = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("nutrition_plans")
        .select(`*, meals (*)`)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setNutritionPlans(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos nutricionais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMealsByType = (meals: Meal[], type: string) => {
    return meals.filter((meal) => meal.meal_type === type);
  };

  const calculateTotalMacros = (meals: Meal[]) => {
    return meals.reduce(
      (total, meal) => ({
        calories: total.calories + (meal.calories || 0),
        protein: total.protein + (meal.protein || 0),
        carbs: total.carbs + (meal.carbs || 0),
        fat: total.fat + (meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  };

  const confirmDeletePlan = (planId: string) => {
    setPlanToDelete(planId);
    setDeleteDialogOpen(true);
  };

  const handleDeletePlan = async () => {
    if (!user || !planToDelete) return;

    try {
      const { error } = await supabase
        .from("nutrition_plans")
        .update({ is_active: false })
        .eq("id", planToDelete)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Dieta excluída ✅",
        description: "Seu plano nutricional foi removido com sucesso.",
      });

      fetchNutritionPlans();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o plano nutricional.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleEditPlan = (planId: string) => {
    setPlanToEdit(planId);
    setEditModalOpen(true);
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Header title="Nutrição" />
        <div className="container mx-auto px-4 pt-28 py-8 pb-20 max-w-7xl">
          <LoadingState type="card" count={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header title="Nutrição" />

      <div className="container mx-auto px-4 pt-28 py-8 pb-20 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="photo">Foto IA</TabsTrigger>
            <TabsTrigger value="recipes">Receitas</TabsTrigger>
            <TabsTrigger value="create">Criar</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            <h2 className="text-lg font-semibold">Seus Planos Nutricionais</h2>

            {loading ? (
              <LoadingState type="card" count={2} />
            ) : nutritionPlans.length === 0 ? (
              <EmptyState
                icon={Apple}
                title="Nenhum plano nutricional"
                description="Comece criando um plano personalizado ou use a IA para gerar um plano alimentar completo adaptado aos seus objetivos."
                motivation="Alimentação é 70% do sucesso!"
                actionLabel="Criar Plano com IA"
                onAction={() => setActiveTab("create")}
              />
            ) : (
              <div className="space-y-4">
                {nutritionPlans.map((plan) => (
                  <Card key={plan.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="flex items-center gap-2">
                          <Apple className="w-5 h-5" />
                          {plan.title}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          {plan.approval_status && plan.created_by === "ai" && (
                            <NutritionApprovalBadge
                              status={plan.approval_status}
                              rejectionReason={plan.rejection_reason}
                            />
                          )}
                          {(!plan.approval_status || plan.approval_status === "approved") && (
                            <Badge variant={plan.created_by === "ai" ? "default" : "secondary"}>
                              {plan.created_by === "ai" ? "IA Nutricional" : "Personalizado"}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPlan(plan.id)}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Editar dieta"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDeletePlan(plan.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Excluir dieta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                      {plan.rejection_reason && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-2">
                          <p className="text-sm font-medium text-destructive mb-1">Motivo da Rejeição:</p>
                          <p className="text-xs text-muted-foreground">{plan.rejection_reason}</p>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {plan.meals.length > 0 && (
                        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                          {(() => {
                            const totals = calculateTotalMacros(plan.meals);
                            return (
                              <>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-primary">{totals.calories}</div>
                                  <div className="text-xs text-muted-foreground">kcal</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-blue-600">
                                    {totals.protein.toFixed(0)}g
                                  </div>
                                  <div className="text-xs text-muted-foreground">Proteína</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-orange-600">
                                    {totals.carbs.toFixed(0)}g
                                  </div>
                                  <div className="text-xs text-muted-foreground">Carbo</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-yellow-600">{totals.fat.toFixed(0)}g</div>
                                  <div className="text-xs text-muted-foreground">Gordura</div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}

                      <div className="space-y-3">
                        {mealTypes.map((mealType) => {
                          const mealsOfType = getMealsByType(plan.meals, mealType.key);
                          if (mealsOfType.length === 0) return null;

                          return (
                            <div key={mealType.key} className="border-l-4 border-primary pl-4">
                              <h4 className="font-medium text-sm text-primary mb-2">{mealType.label}</h4>
                              {mealsOfType.map((meal) => (
                                <div key={meal.id} className="text-sm">
                                  <div className="font-medium">{meal.name}</div>
                                  <div className="text-muted-foreground text-xs">{meal.ingredients.join(", ")}</div>
                                  {meal.calories && (
                                    <div className="text-xs text-muted-foreground">{meal.calories} kcal</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>

                      {plan.file_url && (
                        <Button variant="outline" className="w-full">
                          <Upload className="w-4 h-4 mr-2" />
                          Ver Dieta Completa
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="photo" className="space-y-4">
            <MealPhotoAnalyzer />
          </TabsContent>

          <TabsContent value="recipes" className="space-y-4">
            <RecipeExplorer />
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            {canCreateWithoutPersonal ? (
              <>
                <AINutritionGenerator onSuccess={fetchNutritionPlans} />
                <DietUploader />
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Somente para profissionais</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    A criação de dietas com IA é exclusiva para o personal/profissional. Fale com seu treinador para
                    receber um plano aprovado por ele.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano nutricional?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta dieta? Essa ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Nutrition Plan Modal */}
      {planToEdit && (
        <EditNutritionPlanModal
          open={editModalOpen}
          onOpenChange={(open) => {
            setEditModalOpen(open);
            if (!open) setPlanToEdit(null);
          }}
          nutritionPlanId={planToEdit}
          onSuccess={fetchNutritionPlans}
        />
      )}
    </div>
  );
}
