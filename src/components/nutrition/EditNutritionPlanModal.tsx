import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Apple, Save } from "lucide-react";

interface EditableMeal {
  id: string;
  meal_type: string;
  name: string;
  ingredients: string[];
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  instructions: string | null;
  ingredientsText: string;
}

interface EditNutritionPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutritionPlanId: string;
  onSuccess: () => void;
}

const mealTypeLabels: Record<string, string> = {
  cafe_da_manha: "Café da Manhã",
  lanche_manha: "Lanche da Manhã",
  almoco: "Almoço",
  lanche_tarde: "Lanche da Tarde",
  jantar: "Jantar",
  ceia: "Ceia",
};

export function EditNutritionPlanModal({
  open,
  onOpenChange,
  nutritionPlanId,
  onSuccess,
}: EditNutritionPlanModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meals, setMeals] = useState<EditableMeal[]>([]);

  useEffect(() => {
    if (open && nutritionPlanId) {
      fetchNutritionDetails();
    }
  }, [open, nutritionPlanId]);

  const fetchNutritionDetails = async () => {
    setLoading(true);
    try {
      const { data: plan, error: planError } = await supabase
        .from("nutrition_plans")
        .select("title, description")
        .eq("id", nutritionPlanId)
        .maybeSingle();

      if (planError) throw planError;

      const { data: mealsData, error: mealsError } = await supabase
        .from("meals")
        .select("*")
        .eq("nutrition_plan_id", nutritionPlanId)
        .order("meal_type");

      if (mealsError) throw mealsError;

      setTitle(plan?.title || "");
      setDescription(plan?.description || "");

      setMeals(
        (mealsData || []).map((meal: any) => ({
          id: meal.id,
          meal_type: meal.meal_type,
          name: meal.name,
          ingredients: meal.ingredients || [],
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          instructions: meal.instructions,
          ingredientsText: Array.isArray(meal.ingredients) ? meal.ingredients.join(", ") : "",
        })),
      );
    } catch (error) {
      console.error("Erro ao carregar plano nutricional:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do plano nutricional.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMeal = (index: number, field: keyof EditableMeal, value: any) => {
    const updated = [...meals];
    (updated[index] as any)[field] = value;
    setMeals(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Atualizar plano
      const { error: planError } = await supabase
        .from("nutrition_plans")
        .update({
          title,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", nutritionPlanId);

      if (planError) throw planError;

      // Atualizar refeições
      for (const meal of meals) {
        const ingredientsArray =
          meal.ingredientsText
            .split(",")
            .map((i) => i.trim())
            .filter((i) => i.length > 0) || [];

        const { error: mealError } = await supabase
          .from("meals")
          .update({
            meal_type: meal.meal_type,
            name: meal.name,
            ingredients: ingredientsArray,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            instructions: meal.instructions,
          })
          .eq("id", meal.id);

        if (mealError) throw mealError;
      }

      toast({
        title: "Plano nutricional atualizado! ✅",
        description: "As alterações foram salvas com sucesso.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar plano nutricional:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Carregando plano nutricional</DialogTitle>
            <DialogDescription className="sr-only">
              Aguarde enquanto carregamos os dados do plano nutricional
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <Apple className="w-6 h-6 text-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Carregando plano nutricional...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Plano Nutricional</DialogTitle>
          <DialogDescription>
            Ajuste o título, descrição e detalhes das refeições antes de liberar para o aluno.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Informação do plano */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Plano</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Plano Emagrecimento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description || ""}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve resumo do objetivo e diretrizes do plano."
                  className="resize-none h-20"
                />
              </div>
            </div>

            <Separator />

            {/* Refeições */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Refeições ({meals.length})</h3>
              <div className="space-y-4">
                {meals.map((meal, index) => (
                  <Card key={meal.id}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase text-muted-foreground">
                            {mealTypeLabels[meal.meal_type] || meal.meal_type}
                          </span>
                          <span className="text-xs text-muted-foreground">#{index + 1}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Nome da Refeição</Label>
                        <Input
                          value={meal.name}
                          onChange={(e) => updateMeal(index, "name", e.target.value)}
                          placeholder="Ex: Frango grelhado com legumes"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Ingredientes (separados por vírgula)</Label>
                        <Textarea
                          value={meal.ingredientsText}
                          onChange={(e) => updateMeal(index, "ingredientsText", e.target.value)}
                          placeholder="Ex: 150g peito de frango, 100g brócolis, 80g batata doce..."
                          className="resize-none h-20"
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Calorias (kcal)</Label>
                          <Input
                            type="number"
                            value={meal.calories ?? ""}
                            onChange={(e) =>
                              updateMeal(index, "calories", e.target.value ? parseInt(e.target.value) : null)
                            }
                            placeholder="Ex: 450"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Proteínas (g)</Label>
                          <Input
                            type="number"
                            value={meal.protein ?? ""}
                            onChange={(e) =>
                              updateMeal(index, "protein", e.target.value ? parseInt(e.target.value) : null)
                            }
                            placeholder="Ex: 35"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Carboidratos (g)</Label>
                          <Input
                            type="number"
                            value={meal.carbs ?? ""}
                            onChange={(e) =>
                              updateMeal(index, "carbs", e.target.value ? parseInt(e.target.value) : null)
                            }
                            placeholder="Ex: 40"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Gorduras (g)</Label>
                          <Input
                            type="number"
                            value={meal.fat ?? ""}
                            onChange={(e) => updateMeal(index, "fat", e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Ex: 12"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Instruções / Modo de Preparo</Label>
                        <Textarea
                          value={meal.instructions || ""}
                          onChange={(e) => updateMeal(index, "instructions", e.target.value)}
                          placeholder="Ex: Grelhar o frango em fogo médio, cozinhar os legumes no vapor..."
                          className="resize-none h-20"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              "Salvando..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
