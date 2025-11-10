import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Flame, ChefHat, Beef, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const categories = [
  { key: 'todas', label: 'Todas' },
  { key: 'cafe_da_manha', label: 'Café da Manhã' },
  { key: 'almoco', label: 'Almoço' },
  { key: 'jantar', label: 'Jantar' },
  { key: 'lanche', label: 'Lanches' }
];

const difficultyMap: Record<string, string> = {
  'facil': 'Fácil',
  'medio': 'Médio',
  'dificil': 'Difícil'
};

const emojiMap: Record<string, string> = {
  'cafe_da_manha': '🥞',
  'almoco': '🍗',
  'jantar': '🐟',
  'lanche': '🥪'
};

export function RecipeExplorer() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeCategory, setActiveCategory] = useState('todas');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recommended_recipes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error('Erro ao carregar receitas', {
        description: 'Não foi possível carregar as receitas recomendadas.'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = activeCategory === 'todas' 
    ? recipes 
    : recipes.filter(r => r.category === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <ChefHat className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma receita disponível</h3>
        <p className="text-muted-foreground mb-4">
          As receitas serão atualizadas automaticamente todos os dias
        </p>
        <Button onClick={fetchRecipes} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Recarregar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          {categories.map(cat => (
            <TabsTrigger key={cat.key} value={cat.key}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat.key} value={cat.key} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecipes.map(recipe => (
                <Card 
                  key={recipe.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{emojiMap[recipe.category] || '🍽️'}</div>
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
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {recipe.description}
                      </p>
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
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {recipe.protein}g
                        </div>
                        <div className="text-muted-foreground">Proteína</div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-950 rounded p-2 text-center">
                        <div className="font-semibold text-orange-600 dark:text-orange-400">
                          {recipe.carbs}g
                        </div>
                        <div className="text-muted-foreground">Carbs</div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-950 rounded p-2 text-center">
                        <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                          {recipe.fat}g
                        </div>
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
                  <div className="text-5xl">{emojiMap[selectedRecipe.category] || '🍽️'}</div>
                  <div>
                    <DialogTitle className="text-xl">{selectedRecipe.title}</DialogTitle>
                    <DialogDescription>
                      {selectedRecipe.description}
                    </DialogDescription>
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
                    <div className="font-bold text-lg text-blue-600">
                      {selectedRecipe.protein}g
                    </div>
                    <div className="text-xs text-muted-foreground">Proteína</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-3 text-center">
                    <div className="font-bold text-lg text-orange-600">
                      {selectedRecipe.carbs}g
                    </div>
                    <div className="text-xs text-muted-foreground">Carbs</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-3 text-center">
                    <div className="font-bold text-lg text-yellow-600">
                      {selectedRecipe.fat}g
                    </div>
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
