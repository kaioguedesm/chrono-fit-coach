import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Apple, ChefHat, Target, Utensils, Heart, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface AINutritionGeneratorProps {
  onSuccess: () => void;
}

const dietTypes = [
  { value: "emagrecimento", label: "🔥 Emagrecimento", description: "Déficit calórico para perda de peso" },
  { value: "hipertrofia", label: "💪 Hipertrofia", description: "Superávit para ganho de massa" },
  { value: "definicao", label: "⚡ Definição", description: "Manutenção com alta proteína" },
  { value: "manutencao", label: "🎯 Manutenção", description: "Equilíbrio calórico" },
  { value: "low-carb", label: "🥑 Low Carb", description: "Baixo carboidrato, alto gordura" },
  { value: "vegetariana", label: "🥗 Vegetariana", description: "Sem carnes" },
  { value: "vegana", label: "🌱 Vegana", description: "Sem produtos animais" },
];

const mealsOptions = [
  { value: "3", label: "3 refeições", description: "Café, almoço e jantar" },
  { value: "4", label: "4 refeições", description: "+ 1 lanche" },
  { value: "5", label: "5 refeições", description: "+ 2 lanches" },
  { value: "6", label: "6 refeições", description: "Completo com ceia" },
];

const commonRestrictions = [
  { id: "lactose", label: "Sem Lactose" },
  { id: "gluten", label: "Sem Glúten" },
  { id: "nuts", label: "Sem Oleaginosas" },
  { id: "seafood", label: "Sem Frutos do Mar" },
];

export function AINutritionGenerator({ onSuccess }: AINutritionGeneratorProps) {
  const { user } = useAuth();
  const { profile, calculateIMC } = useProfile();
  const { toast } = useToast();
  const { isPersonal } = useUserRole();
  const [generating, setGenerating] = useState(false);
  const [dietType, setDietType] = useState("emagrecimento");
  const [mealsPerDay, setMealsPerDay] = useState("5");
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [favoritesFoods, setFavoritesFoods] = useState("");
  const [dislikedFoods, setDislikedFoods] = useState("");
  const [mealTiming, setMealTiming] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [preparationTime, setPreparationTime] = useState("moderado");

  const handleRestrictionToggle = (restrictionId: string) => {
    setRestrictions((prev) =>
      prev.includes(restrictionId) ? prev.filter((r) => r !== restrictionId) : [...prev, restrictionId],
    );
  };

  const generateNutritionPlan = async () => {
    if (!user) return;

    if (!isPersonal) {
      toast({
        title: "Acesso restrito",
        description: "Somente o personal pode gerar planos nutricionais com a IA.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const imc = calculateIMC();
      const selectedDiet = dietTypes.find((d) => d.value === dietType);

      const { data: functionData, error: functionError } = await supabase.functions.invoke("generate-nutrition", {
        body: {
          dietType,
          dietDescription: selectedDiet?.description,
          mealsPerDay: parseInt(mealsPerDay),
          restrictions: restrictions.length > 0 ? restrictions : [],
          userPreferences: {
            favoritesFoods: favoritesFoods.trim(),
            dislikedFoods: dislikedFoods.trim(),
            mealTiming: mealTiming.trim(),
            specialNotes: specialNotes.trim(),
            preparationTime,
          },
          userProfile: {
            weight: profile?.weight,
            height: profile?.height,
            age: profile?.age,
            gender: profile?.gender,
            goal: profile?.goal,
            imc: imc ? parseFloat(imc) : null,
            dietaryPreferences: profile?.dietary_preferences || [],
            dietaryRestrictions: profile?.dietary_restrictions || [],
          },
        },
      });

      if (functionError) throw functionError;

      if (!functionData || !functionData.planName || !functionData.meals) {
        throw new Error("Resposta inválida da IA");
      }

      // Create nutrition plan
      const { data: plan, error: planError } = await supabase
        .from("nutrition_plans")
        .insert({
          user_id: user.id,
          title: functionData.planName,
          description: functionData.description,
          created_by: "ai",
          approval_status: "pending",
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create meals
      const mealsData = functionData.meals.map((meal: any) => ({
        nutrition_plan_id: plan.id,
        meal_type: meal.meal_type,
        name: meal.name,
        ingredients: meal.ingredients,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        instructions: meal.instructions || null,
      }));

      const { error: mealsError } = await supabase.from("meals").insert(mealsData);

      if (mealsError) throw mealsError;

      toast({
        title: "Plano nutricional criado! 🥗✨",
        description: `${functionData.planName} foi gerado e aguarda aprovação do profissional da academia.`,
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error generating nutrition plan:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar o plano nutricional.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const selectedDiet = dietTypes.find((d) => d.value === dietType);
  const selectedMeals = mealsOptions.find((m) => m.value === mealsPerDay);

  return (
    <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            IA Nutricional
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <ChefHat className="w-3 h-3" />
            Personalizado
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Nutrição Inteligente</p>
              <p className="text-xs text-muted-foreground">
                Plano alimentar personalizado baseado no seu perfil, objetivo e preferências!
              </p>
            </div>
          </div>
        </div>

        {profile && (
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Apple className="w-3 h-3" />
              {profile.goal || "Objetivo não definido"}
            </Badge>
            {profile.weight && (
              <Badge variant="outline" className="gap-1">
                <Target className="w-3 h-3" />
                {profile.weight}kg
              </Badge>
            )}
            {calculateIMC() && (
              <Badge variant="outline" className="gap-1">
                IMC: {calculateIMC()}
              </Badge>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold mb-3 block">Tipo de Dieta</Label>
            <div className="grid grid-cols-1 gap-2">
              {dietTypes.map((diet) => (
                <button
                  key={diet.value}
                  onClick={() => setDietType(diet.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    dietType === diet.value
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-muted hover:border-primary/50 bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{diet.label}</div>
                      <p className="text-xs text-muted-foreground mt-0.5">{diet.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="meals">Número de Refeições por Dia</Label>
            <Select value={mealsPerDay} onValueChange={setMealsPerDay}>
              <SelectTrigger id="meals">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mealsOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Restrições Alimentares</Label>
            <div className="space-y-2">
              {commonRestrictions.map((restriction) => (
                <div key={restriction.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={restriction.id}
                    checked={restrictions.includes(restriction.id)}
                    onCheckedChange={() => handleRestrictionToggle(restriction.id)}
                  />
                  <Label htmlFor={restriction.id} className="text-sm font-normal cursor-pointer">
                    {restriction.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Personalize Sua Dieta
            </Label>
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-muted">
              <div>
                <Label htmlFor="favorites" className="text-sm flex items-center gap-2">
                  😋 Alimentos que você adora
                </Label>
                <Textarea
                  id="favorites"
                  placeholder="Ex: Frango grelhado, batata doce, abacate, ovos..."
                  value={favoritesFoods}
                  onChange={(e) => setFavoritesFoods(e.target.value)}
                  className="mt-1 min-h-[60px]"
                />
              </div>

              <div>
                <Label htmlFor="dislikes" className="text-sm flex items-center gap-2">
                  🚫 Alimentos que você não gosta
                </Label>
                <Textarea
                  id="dislikes"
                  placeholder="Ex: Brócolis, couve-flor, salmão..."
                  value={dislikedFoods}
                  onChange={(e) => setDislikedFoods(e.target.value)}
                  className="mt-1 min-h-[60px]"
                />
              </div>

              <div>
                <Label htmlFor="timing" className="text-sm flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Horários preferidos para refeições
                </Label>
                <Input
                  id="timing"
                  placeholder="Ex: Café 7h, Almoço 12h, Jantar 19h"
                  value={mealTiming}
                  onChange={(e) => setMealTiming(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="preparation">Tempo de preparo preferido</Label>
                <Select value={preparationTime} onValueChange={setPreparationTime}>
                  <SelectTrigger id="preparation" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rapido">⚡ Rápido (até 15 min)</SelectItem>
                    <SelectItem value="moderado">🍳 Moderado (15-30 min)</SelectItem>
                    <SelectItem value="elaborado">👨‍🍳 Elaborado (30+ min)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm flex items-center gap-2">
                  📝 Observações especiais
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Ex: Prefiro alimentos com baixo índice glicêmico, gosto de variedade, quero receitas fáceis de preparar..."
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="mt-1 min-h-[70px]"
                />
              </div>
            </div>
          </div>

          {(selectedDiet || selectedMeals) && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-1">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">📋 Resumo:</span>
              </p>
              <p className="text-xs text-muted-foreground">• Tipo: {selectedDiet?.label}</p>
              <p className="text-xs text-muted-foreground">• {selectedMeals?.label}</p>
              {restrictions.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  • Restrições:{" "}
                  {restrictions.map((r) => commonRestrictions.find((cr) => cr.id === r)?.label).join(", ")}
                </p>
              )}
              {favoritesFoods && <p className="text-xs text-muted-foreground">• Com alimentos favoritos incluídos</p>}
              {preparationTime && (
                <p className="text-xs text-muted-foreground">
                  • Preparo:{" "}
                  {preparationTime === "rapido" ? "Rápido" : preparationTime === "moderado" ? "Moderado" : "Elaborado"}
                </p>
              )}
            </div>
          )}
        </div>

        <Button onClick={generateNutritionPlan} disabled={generating} className="w-full" size="lg">
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gerando plano nutricional...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Gerar Dieta com IA
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
