import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Apple, Upload, Bot, BookOpen, Plus, Trash2 } from 'lucide-react';
import { AINutritionGenerator } from '@/components/nutrition/AINutritionGenerator';
import { MealPhotoAnalyzer } from '@/components/nutrition/MealPhotoAnalyzer';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';

interface NutritionPlan {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  created_by: string;
  is_active: boolean;
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
  { key: 'cafe_da_manha', label: 'Café da Manhã' },
  { key: 'lanche_manha', label: 'Lanche da Manhã' },
  { key: 'almoco', label: 'Almoço' },
  { key: 'lanche_tarde', label: 'Lanche da Tarde' },
  { key: 'jantar', label: 'Jantar' },
  { key: 'ceia', label: 'Ceia' }
];

export default function Nutrition() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');

  useEffect(() => {
    if (user) {
      fetchNutritionPlans();
    }
  }, [user]);

  const fetchNutritionPlans = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select(`
          *,
          meals (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNutritionPlans(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos nutricionais.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Sample data for demonstration
  const samplePlans: NutritionPlan[] = [
    {
      id: 'sample-1',
      title: 'Plano Emagrecimento',
      description: 'Dieta hipocalórica para perda de peso',
      file_url: null,
      created_by: 'ai',
      is_active: true,
      meals: [
        {
          id: '1',
          meal_type: 'cafe_da_manha',
          name: 'Café da Manhã Proteico',
          ingredients: ['2 ovos', '1 fatia pão integral', '1 xícara café', 'Azeite de oliva'],
          calories: 350,
          protein: 25,
          carbs: 30,
          fat: 15,
          instructions: 'Prepare os ovos mexidos com pouco azeite'
        },
        {
          id: '2',
          meal_type: 'almoco',
          name: 'Frango Grelhado com Legumes',
          ingredients: ['150g peito de frango', '100g brócolis', '80g batata doce', '1 colher azeite'],
          calories: 480,
          protein: 40,
          carbs: 35,
          fat: 12,
          instructions: 'Grelhe o frango e refogue os legumes'
        }
      ]
    }
  ];

  const displayPlans = nutritionPlans.length > 0 ? nutritionPlans : samplePlans;

  const getMealsByType = (meals: Meal[], type: string) => {
    return meals.filter(meal => meal.meal_type === type);
  };

  const calculateTotalMacros = (meals: Meal[]) => {
    return meals.reduce((total, meal) => ({
      calories: total.calories + (meal.calories || 0),
      protein: total.protein + (meal.protein || 0),
      carbs: total.carbs + (meal.carbs || 0),
      fat: total.fat + (meal.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const handleDeletePlan = async (planId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('nutrition_plans')
        .update({ is_active: false })
        .eq('id', planId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano nutricional excluído com sucesso.",
      });

      fetchNutritionPlans();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o plano nutricional.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header title="Nutrição" />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="photo">Foto IA</TabsTrigger>
            <TabsTrigger value="recipes">Receitas</TabsTrigger>
            <TabsTrigger value="create">Criar</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Seus Planos Nutricionais</h2>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Plano
              </Button>
            </div>

            {loading ? (
              <LoadingState type="card" count={2} />
            ) : displayPlans.length === 0 ? (
              <EmptyState
                icon={Apple}
                title="Nenhum plano nutricional"
                description="Comece criando um plano personalizado ou use a IA para gerar um plano alimentar completo adaptado aos seus objetivos."
                motivation="Alimentação é 70% do sucesso!"
                actionLabel="Criar Plano com IA"
                onAction={() => setActiveTab('create')}
              />
            ) : (
              <div className="space-y-4">
                {displayPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Apple className="w-5 h-5" />
                        {plan.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={plan.created_by === 'ai' ? 'default' : 'secondary'}>
                          {plan.created_by === 'ai' ? 'IA Nutricional' : 'Personalizado'}
                        </Badge>
                        {plan.id !== 'sample-1' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePlan(plan.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Daily Macros Summary */}
                    {plan.meals.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                        {(() => {
                          const totals = calculateTotalMacros(plan.meals);
                          return (
                            <>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-primary">
                                  {totals.calories}
                                </div>
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
                                <div className="text-lg font-semibold text-yellow-600">
                                  {totals.fat.toFixed(0)}g
                                </div>
                                <div className="text-xs text-muted-foreground">Gordura</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {/* Meals by Type */}
                    <div className="space-y-3">
                      {mealTypes.map((mealType) => {
                        const mealsOfType = getMealsByType(plan.meals, mealType.key);
                        if (mealsOfType.length === 0) return null;
                        
                        return (
                          <div key={mealType.key} className="border-l-4 border-primary pl-4">
                            <h4 className="font-medium text-sm text-primary mb-2">
                              {mealType.label}
                            </h4>
                            {mealsOfType.map((meal) => (
                              <div key={meal.id} className="text-sm">
                                <div className="font-medium">{meal.name}</div>
                                <div className="text-muted-foreground text-xs">
                                  {meal.ingredients.join(', ')}
                                </div>
                                {meal.calories && (
                                  <div className="text-xs text-muted-foreground">
                                    {meal.calories} kcal
                                  </div>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Banco de Receitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Receitas Saudáveis</h3>
                  <p className="text-muted-foreground mb-4">
                    Descobra receitas rápidas e nutritivas
                  </p>
                  <Button>
                    Explorar Receitas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <AINutritionGenerator onSuccess={fetchNutritionPlans} />
            
            <Card>
              <CardHeader>
                <CardTitle>Upload de Dieta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Clique para fazer upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX até 10MB
                  </p>
                </div>
                <Button className="w-full" variant="outline">
                  Selecionar Arquivo
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}