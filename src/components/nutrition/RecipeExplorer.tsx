import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Flame, ChefHat, Beef, Loader2, RefreshCw, Sparkles, Lightbulb, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prep_time_minutes: number;
  difficulty: string;
  created_at: string;
}

interface AITip {
  id: string;
  title: string;
  description: string;
  category: string;
  tips: string[];
}

interface ActiveDiet {
  id: string;
  title: string;
  description: string | null;
  meals: Array<{
    name: string;
    meal_type: string;
    ingredients: string[];
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  }>;
}

const categories = [
  { key: "todas", label: "Todas" },
  { key: "cafe_da_manha", label: "Café da Manhã" },
  { key: "almoco", label: "Almoço" },
  { key: "jantar", label: "Jantar" },
  { key: "lanche", label: "Lanches" },
];

const difficultyMap: Record<string, string> = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};

const emojiMap: Record<string, string> = {
  cafe_da_manha: "🥞",
  almoco: "🍗",
  jantar: "🐟",
  lanche: "🥪",
};

export function RecipeExplorer() {
  const { profile, calculateIMC } = useProfile();
  const { user } = useAuth();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeCategory, setActiveCategory] = useState("todas");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiTips, setAiTips] = useState<AITip[]>([]);
  const [generatingTips, setGeneratingTips] = useState(false);
  const [activeDiet, setActiveDiet] = useState<ActiveDiet | null>(null);
  const [loadingDiet, setLoadingDiet] = useState(true);

  useEffect(() => {
    fetchRecipes();
    fetchActiveDiet();
  }, [user]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("recommended_recipes")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast.error("Erro ao carregar receitas", {
        description: "Não foi possível carregar as receitas recomendadas.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveDiet = async () => {
    if (!user?.id) {
      setLoadingDiet(false);
      return;
    }

    try {
      setLoadingDiet(true);
      const { data, error } = await supabase
        .from("nutrition_plans")
        .select(
          `
          id,
          title,
          description,
          meals (
            name,
            meal_type,
            ingredients,
            calories,
            protein,
            carbs,
            fat
          )
        `,
        )
        .eq("user_id", user.id)
        .eq("is_active", true)
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setActiveDiet({
          id: data.id,
          title: data.title,
          description: data.description,
          meals: data.meals || [],
        });
      } else {
        setActiveDiet(null);
      }
    } catch (error) {
      console.error("Error fetching active diet:", error);
      setActiveDiet(null);
    } finally {
      setLoadingDiet(false);
    }
  };

  const generateAITips = async () => {
    if (!activeDiet) {
      toast.error("Nenhuma dieta ativa", {
        description: "Você precisa ter uma dieta aprovada pelo personal para receber dicas personalizadas.",
      });
      return;
    }

    if (!profile) {
      toast.error("Complete seu perfil primeiro", {
        description: "Precisamos das suas informações para gerar dicas personalizadas.",
      });
      return;
    }

    try {
      setGeneratingTips(true);
      const imc = calculateIMC();

      // Chamar função do Supabase para gerar dicas baseadas na dieta ativa
      const { data: functionData, error: functionError } = await supabase.functions.invoke("generate-nutrition", {
        body: {
          mode: "tips", // Modo especial para gerar apenas dicas rápidas
          activeDiet: {
            title: activeDiet.title,
            description: activeDiet.description,
            meals: activeDiet.meals,
          },
          userProfile: {
            goal: profile.goal || "manutencao",
            dietary_preferences: profile.dietary_preferences || [],
            dietary_restrictions: profile.dietary_restrictions || [],
            weight: profile.weight,
            height: profile.height,
            age: profile.age,
            gender: profile.gender,
            imc: imc ? parseFloat(imc) : null,
            experience_level: profile.experience_level,
          },
        },
      });

      if (functionError) throw functionError;

      // Se a função retornar dicas diretamente
      if (functionData?.tips) {
        setAiTips(functionData.tips);
        toast.success("Dicas geradas!", {
          description: "Sugestões personalizadas baseadas na sua dieta ativa.",
        });
      } else {
        // Se não retornar dicas, criar dicas baseadas na dieta manualmente
        const tips = createTipsFromDiet(activeDiet, profile, imc);
        setAiTips(tips);
        toast.success("Dicas geradas!", {
          description: "Sugestões personalizadas baseadas na sua dieta ativa.",
        });
      }
    } catch (error: any) {
      console.error("Error generating tips:", error);
      // Fallback: criar dicas baseadas na dieta mesmo se a IA falhar
      const imc = calculateIMC();
      const tips = createTipsFromDiet(activeDiet, profile!, imc);
      setAiTips(tips);
      toast.success("Dicas geradas!", {
        description: "Sugestões baseadas na sua dieta ativa.",
      });
    } finally {
      setGeneratingTips(false);
    }
  };

  const createTipsFromDiet = (diet: ActiveDiet, profile: any, imc: string | null): AITip[] => {
    const tips: AITip[] = [];
    const restrictions = profile.dietary_restrictions || [];

    // Analisar ingredientes da dieta para sugerir variações e complementos
    const allIngredients = diet.meals.flatMap((meal) => meal.ingredients || []);
    const commonIngredients = allIngredients.filter((ing, idx, arr) => arr.indexOf(ing) !== idx);

    // Calcular macros médios da dieta
    const totalCalories = diet.meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const totalProtein = diet.meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    const totalCarbs = diet.meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
    const totalFat = diet.meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
    const avgCaloriesPerMeal = totalCalories / Math.max(diet.meals.length, 1);

    // Dicas baseadas na dieta ativa
    tips.push({
      id: "tip-diet",
      title: `Dicas para sua dieta: ${diet.title}`,
      description: "Sugestões baseadas nas refeições do seu plano nutricional",
      category: "dieta",
      tips: [
        `Sua dieta atual tem aproximadamente ${Math.round(totalCalories)} kcal/dia`,
        `Mantenha o consumo de proteína em ${Math.round(totalProtein)}g por dia`,
        `Varie os ingredientes: ${commonIngredients.slice(0, 3).join(", ")}`,
        "Siga os horários das refeições para melhor absorção dos nutrientes",
        "Combine os alimentos da dieta com exercícios para melhores resultados",
      ],
    });

    // Dicas de substituições baseadas nos ingredientes da dieta
    if (allIngredients.length > 0) {
      const substitutionTips: string[] = [];

      if (allIngredients.some((ing) => ing.toLowerCase().includes("frango"))) {
        substitutionTips.push("Varie o frango com peixe grelhado ou ovos para manter a proteína");
      }
      if (allIngredients.some((ing) => ing.toLowerCase().includes("arroz"))) {
        substitutionTips.push("Substitua o arroz ocasionalmente por quinoa ou batata doce");
      }
      if (allIngredients.some((ing) => ing.toLowerCase().includes("ovo"))) {
        substitutionTips.push("Os ovos podem ser preparados de várias formas: mexidos, pochê, cozidos");
      }

      if (substitutionTips.length > 0) {
        tips.push({
          id: "tip-substitutions",
          title: "Variações e Substituições",
          description: "Ideias para variar sua dieta sem sair do plano",
          category: "variacoes",
          tips: substitutionTips,
        });
      }
    }

    // Dicas baseadas em restrições
    if (restrictions.length > 0) {
      const restrictionTips: string[] = [];
      if (restrictions.includes("lactose")) {
        restrictionTips.push("Substitua leite por alternativas vegetais (amêndoa, coco, aveia)");
      }
      if (restrictions.includes("gluten")) {
        restrictionTips.push("Prefira grãos sem glúten: arroz, quinoa, batata doce");
      }
      if (restrictionTips.length > 0) {
        tips.push({
          id: "tip-restrictions",
          title: "Atenção às Restrições",
          description: "Alternativas para suas restrições alimentares",
          category: "restricoes",
          tips: restrictionTips,
        });
      }
    }

    // Dicas de preparo baseadas nas refeições
    const mealTypes = diet.meals.map((m) => m.meal_type);
    if (mealTypes.includes("cafe_da_manha")) {
      tips.push({
        id: "tip-breakfast",
        title: "Dicas para o Café da Manhã",
        description: "Como otimizar sua primeira refeição do dia",
        category: "cafe",
        tips: [
          "Consuma proteína no café da manhã para manter a saciedade",
          "Combine carboidratos complexos com proteínas",
          "Beba água ao acordar antes da primeira refeição",
          "Evite açúcares refinados pela manhã",
        ],
      });
    }

    return tips;
  };

  const filteredRecipes = activeCategory === "todas" ? recipes : recipes.filter((r) => r.category === activeCategory);

  if (loading || loadingDiet) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não houver dieta ativa, mostrar apenas mensagem
  if (!activeDiet) {
    return (
      <div className="space-y-4">
        {/* Card de Dicas Personalizadas com IA */}
        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Dicas Personalizadas com IA
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Você precisa ter uma dieta aprovada pelo personal para receber dicas personalizadas e receitas.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>Sem dieta ativa</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="text-center py-12">
          <ChefHat className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma receita disponível</h3>
          <p className="text-muted-foreground">
            Você precisa ter uma dieta aprovada pelo personal trainer para visualizar receitas personalizadas.
          </p>
        </div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="space-y-4">
        {/* Card de Dicas Personalizadas com IA */}
        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Dicas Personalizadas com IA
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Receba sugestões baseadas na sua dieta ativa: "{activeDiet.title}"
                </p>
              </div>
              <Button onClick={generateAITips} disabled={generatingTips || !profile} className="gap-2">
                {generatingTips ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4" />
                    Gerar Dicas
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {aiTips.length > 0 && (
            <CardContent className="space-y-4">
              {aiTips.map((tip) => (
                <div key={tip.id} className="p-4 bg-background rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ChefHat className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1">{tip.title}</h3>
                      <p className="text-sm text-muted-foreground">{tip.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-2 ml-2">
                    {tip.tips.map((tipText, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-muted-foreground">{tipText}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        <div className="text-center py-12">
          <ChefHat className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma receita disponível</h3>
          <p className="text-muted-foreground mb-4">As receitas serão atualizadas automaticamente todos os dias</p>
          <Button onClick={fetchRecipes} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recarregar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Card de Dicas Personalizadas com IA */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Dicas Personalizadas com IA
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {activeDiet
                  ? `Receba sugestões baseadas na sua dieta ativa: "${activeDiet.title}"`
                  : "Você precisa ter uma dieta aprovada pelo personal para receber dicas personalizadas."}
              </p>
            </div>
            {loadingDiet ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : activeDiet ? (
              <Button onClick={generateAITips} disabled={generatingTips || !profile} className="gap-2">
                {generatingTips ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4" />
                    Gerar Dicas
                  </>
                )}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>Sem dieta ativa</span>
              </div>
            )}
          </div>
        </CardHeader>
        {aiTips.length > 0 && (
          <CardContent className="space-y-4">
            {aiTips.map((tip) => (
              <div key={tip.id} className="p-4 bg-background rounded-lg border border-primary/20">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ChefHat className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                  </div>
                </div>
                <ul className="space-y-2 ml-2">
                  {tip.tips.map((tipText, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-muted-foreground">{tipText}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Receitas Fitness</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{filteredRecipes.length} receitas</Badge>
          <Button onClick={fetchRecipes} size="sm" variant="ghost">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {categories.map((cat) => (
            <TabsTrigger key={cat.key} value={cat.key}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.key} value={cat.key} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{emojiMap[recipe.category] || "🍽️"}</div>
                        <div>
                          <CardTitle className="text-base">{recipe.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {difficultyMap[recipe.difficulty] || recipe.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {recipe.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{recipe.prep_time_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary font-medium">
                        <Flame className="w-4 h-4" />
                        <span>{recipe.calories} kcal</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-blue-50 dark:bg-blue-950 rounded p-2 text-center">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">{recipe.protein}g</div>
                        <div className="text-muted-foreground">Proteína</div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-950 rounded p-2 text-center">
                        <div className="font-semibold text-orange-600 dark:text-orange-400">{recipe.carbs}g</div>
                        <div className="text-muted-foreground">Carbs</div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-950 rounded p-2 text-center">
                        <div className="font-semibold text-yellow-600 dark:text-yellow-400">{recipe.fat}g</div>
                        <div className="text-muted-foreground">Gordura</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="text-5xl">{emojiMap[selectedRecipe.category] || "🍽️"}</div>
                  <div>
                    <DialogTitle className="text-xl">{selectedRecipe.title}</DialogTitle>
                    <DialogDescription>{selectedRecipe.description}</DialogDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">
                        {difficultyMap[selectedRecipe.difficulty] || selectedRecipe.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {selectedRecipe.prep_time_minutes} minutos
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Macros */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <Flame className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <div className="font-bold text-lg">{selectedRecipe.calories}</div>
                    <div className="text-xs text-muted-foreground">kcal</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center">
                    <Beef className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <div className="font-bold text-lg text-blue-600">{selectedRecipe.protein}g</div>
                    <div className="text-xs text-muted-foreground">Proteína</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-3 text-center">
                    <div className="font-bold text-lg text-orange-600">{selectedRecipe.carbs}g</div>
                    <div className="text-xs text-muted-foreground">Carbs</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-3 text-center">
                    <div className="font-bold text-lg text-yellow-600">{selectedRecipe.fat}g</div>
                    <div className="text-xs text-muted-foreground">Gordura</div>
                  </div>
                </div>

                {/* Ingredientes */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <ChefHat className="w-5 h-5" />
                    Ingredientes
                  </h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Modo de Preparo */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Modo de Preparo</h3>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-line">{selectedRecipe.instructions}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
