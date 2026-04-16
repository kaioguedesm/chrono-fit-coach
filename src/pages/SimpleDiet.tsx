import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Apple, Check, ChefHat, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { AINutritionGenerator } from "@/components/nutrition/AINutritionGenerator";
import { usePaywall } from "@/hooks/usePaywall";
import { PaywallModal } from "@/components/subscription/PaywallModal";
import { PremiumLockOverlay } from "@/components/subscription/PremiumLockOverlay";
import { cn } from "@/lib/utils";

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

interface NutritionPlan {
  id: string;
  title: string;
  description: string | null;
  meals: Meal[];
}

const mealTypeOrder = ["café da manhã", "lanche da manhã", "almoço", "lanche da tarde", "jantar", "ceia"];
const mealTypeLabels: Record<string, string> = {
  "café da manhã": "☀️ Café da Manhã",
  "lanche da manhã": "🍎 Lanche da Manhã",
  "almoço": "🍽️ Almoço",
  "lanche da tarde": "🥤 Lanche da Tarde",
  "jantar": "🌙 Jantar",
  "ceia": "😴 Ceia",
};

export default function SimpleDiet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPremium, paywallOpen, setPaywallOpen } = usePaywall();
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    if (user) loadPlan();
    else setLoading(false);
  }, [user]);

  // Load completed meals from localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem(`diet-completed-${today}`);
    if (saved) setCompletedMeals(new Set(JSON.parse(saved)));
  }, []);

  const loadPlan = async () => {
    if (!user) return;
    try {
      const { data: plans } = await supabase
        .from("nutrition_plans")
        .select("id, title, description, meals(*)")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (plans && plans.length > 0) {
        const p = plans[0];
        const sortedMeals = (p.meals || []).sort((a: Meal, b: Meal) => {
          const ai = mealTypeOrder.indexOf(a.meal_type.toLowerCase());
          const bi = mealTypeOrder.indexOf(b.meal_type.toLowerCase());
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
        setPlan({ ...p, meals: sortedMeals });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMealComplete = (mealId: string) => {
    const today = new Date().toDateString();
    const updated = new Set(completedMeals);
    if (updated.has(mealId)) {
      updated.delete(mealId);
    } else {
      updated.add(mealId);
    }
    setCompletedMeals(updated);
    localStorage.setItem(`diet-completed-${today}`, JSON.stringify([...updated]));
  };

  const completionPercent = plan
    ? Math.round((completedMeals.size / Math.max(plan.meals.length, 1)) * 100)
    : 0;

  const totalCalories = plan?.meals.reduce((sum, m) => sum + (m.calories || 0), 0) || 0;
  const totalProtein = plan?.meals.reduce((sum, m) => sum + (m.protein || 0), 0) || 0;

  if (loading) {
    return (
      <div className="pb-20">
        <Header title="Dieta" />
        <div className="container mx-auto px-4 pt-24 py-8 max-w-lg">
          <LoadingState type="list" count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <Header title="Dieta" />
      <main className="container mx-auto px-4 pt-24 py-6 space-y-5 max-w-lg">
        {!plan && !showGenerator ? (
          <div className="space-y-4">
            <EmptyState
              title="Sem plano alimentar"
              description="Gere um plano personalizado com IA baseado no seu objetivo."
              icon={Apple}
            />
            <div className="relative">
              {!isPremium && (
                <PremiumLockOverlay onUnlock={() => setPaywallOpen(true)} message="Gere seu plano alimentar" />
              )}
              <Button
                onClick={() => {
                  if (!isPremium) {
                    setPaywallOpen(true);
                    return;
                  }
                  setShowGenerator(true);
                }}
                className="w-full"
                size="lg"
              >
                <ChefHat className="w-5 h-5 mr-2" />
                Gerar Plano com IA
              </Button>
            </div>
          </div>
        ) : showGenerator && !plan ? (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setShowGenerator(false)} className="text-sm">
              ← Voltar
            </Button>
            <AINutritionGenerator onSuccess={() => { setShowGenerator(false); loadPlan(); }} />
          </div>
        ) : plan ? (
          <>
            {/* Daily progress */}
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Dieta de Hoje</h3>
                    <p className="text-xs text-muted-foreground">{plan.title}</p>
                  </div>
                  <div className={cn(
                    "text-lg font-bold",
                    completionPercent === 100 ? "text-green-500" : "text-foreground"
                  )}>
                    {completionPercent}%
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className={cn(
                      "h-2.5 rounded-full transition-all duration-500 ease-out",
                      completionPercent === 100 ? "bg-green-500" : "bg-primary"
                    )}
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{totalCalories} kcal</span>
                  <span>{totalProtein}g proteína</span>
                  <span>{completedMeals.size}/{plan.meals.length} refeições</span>
                </div>
              </CardContent>
            </Card>

            {/* Meals list */}
            <div className="space-y-3">
              {plan.meals.map((meal) => {
                const isCompleted = completedMeals.has(meal.id);
                const label = mealTypeLabels[meal.meal_type.toLowerCase()] || meal.meal_type;

                return (
                  <Card
                    key={meal.id}
                    className={cn(
                      "transition-all duration-200 cursor-pointer active:scale-[0.98]",
                      isCompleted && "opacity-60 border-green-500/30"
                    )}
                    onClick={() => toggleMealComplete(meal.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                          isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                        )}>
                          <Check className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                            {label}
                          </p>
                          <h4 className={cn(
                            "font-semibold text-sm mt-0.5",
                            isCompleted && "line-through text-muted-foreground"
                          )}>
                            {meal.name}
                          </h4>
                          {meal.ingredients && meal.ingredients.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {meal.ingredients.join(", ")}
                            </p>
                          )}
                          <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                            {meal.calories && <span>{meal.calories} kcal</span>}
                            {meal.protein && <span>{meal.protein}g P</span>}
                            {meal.carbs && <span>{meal.carbs}g C</span>}
                            {meal.fat && <span>{meal.fat}g G</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Generate new plan */}
            <Button
              variant="outline"
              onClick={() => setShowGenerator(true)}
              className="w-full text-sm"
              size="sm"
            >
              Gerar novo plano
            </Button>
          </>
        ) : null}
      </main>
      <PaywallModal open={paywallOpen} onOpenChange={setPaywallOpen} />
    </div>
  );
}
