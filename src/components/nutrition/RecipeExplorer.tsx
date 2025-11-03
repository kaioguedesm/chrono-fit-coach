import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Flame, ChefHat, Beef } from 'lucide-react';

interface Recipe {
  id: string;
  name: string;
  category: string;
  prepTime: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  ingredients: string[];
  instructions: string[];
  image: string;
  tags: string[];
}

const recipes: Recipe[] = [
  {
    id: '1',
    name: 'Panqueca de Banana e Aveia',
    category: 'cafe_da_manha',
    prepTime: 15,
    calories: 320,
    protein: 18,
    carbs: 42,
    fat: 8,
    difficulty: 'Fácil',
    ingredients: [
      '1 banana madura',
      '2 ovos',
      '40g de aveia em flocos',
      '1 colher de chá de canela',
      'Mel a gosto (opcional)'
    ],
    instructions: [
      'Amasse a banana em um recipiente',
      'Adicione os ovos e misture bem',
      'Acrescente a aveia e a canela',
      'Aqueça uma frigideira antiaderente',
      'Despeje porções da massa e cozinhe por 2-3 minutos de cada lado',
      'Sirva com mel se desejar'
    ],
    image: '🥞',
    tags: ['Proteico', 'Sem Açúcar', 'Pré-Treino']
  },
  {
    id: '2',
    name: 'Bowl de Iogurte Proteico',
    category: 'cafe_da_manha',
    prepTime: 5,
    calories: 280,
    protein: 25,
    carbs: 35,
    fat: 6,
    difficulty: 'Fácil',
    ingredients: [
      '200g de iogurte grego natural',
      '1 scoop de whey protein',
      '30g de granola',
      '100g de frutas vermelhas',
      '1 colher de sopa de mel'
    ],
    instructions: [
      'Misture o iogurte com o whey protein',
      'Coloque em uma tigela',
      'Adicione a granola por cima',
      'Decore com as frutas vermelhas',
      'Regue com mel'
    ],
    image: '🥣',
    tags: ['Alto Proteína', 'Rápido', 'Pós-Treino']
  },
  {
    id: '3',
    name: 'Frango Grelhado com Batata Doce',
    category: 'almoco',
    prepTime: 30,
    calories: 480,
    protein: 45,
    carbs: 48,
    fat: 10,
    difficulty: 'Médio',
    ingredients: [
      '200g de peito de frango',
      '150g de batata doce',
      '100g de brócolis',
      'Temperos: alho, sal, pimenta, limão',
      '1 colher de sopa de azeite'
    ],
    instructions: [
      'Tempere o frango com alho, sal, pimenta e limão',
      'Deixe marinar por 15 minutos',
      'Corte a batata doce em cubos e cozinhe no vapor',
      'Grelhe o frango em fogo médio por 6-8 minutos de cada lado',
      'Cozinhe o brócolis no vapor por 5 minutos',
      'Monte o prato e regue com azeite'
    ],
    image: '🍗',
    tags: ['Alto Proteína', 'Baixo Carbo', 'Hipertrofia']
  },
  {
    id: '4',
    name: 'Salmão com Quinoa e Aspargos',
    category: 'jantar',
    prepTime: 25,
    calories: 520,
    protein: 38,
    carbs: 42,
    fat: 22,
    difficulty: 'Médio',
    ingredients: [
      '180g de filé de salmão',
      '80g de quinoa',
      '150g de aspargos',
      'Limão',
      'Azeite',
      'Sal e pimenta'
    ],
    instructions: [
      'Cozinhe a quinoa conforme instruções da embalagem',
      'Tempere o salmão com sal, pimenta e limão',
      'Grelhe o salmão por 4-5 minutos de cada lado',
      'Cozinhe os aspargos no vapor por 5 minutos',
      'Monte o prato e regue com azeite'
    ],
    image: '🐟',
    tags: ['Ômega 3', 'Anti-inflamatório', 'Gourmet']
  },
  {
    id: '5',
    name: 'Wrap de Frango Light',
    category: 'lanche',
    prepTime: 20,
    calories: 350,
    protein: 32,
    carbs: 38,
    fat: 8,
    difficulty: 'Fácil',
    ingredients: [
      '1 tortilha integral',
      '120g de frango desfiado',
      'Alface',
      'Tomate',
      '2 colheres de iogurte grego',
      'Temperos a gosto'
    ],
    instructions: [
      'Aqueça a tortilha',
      'Misture o frango com o iogurte grego',
      'Adicione os temperos',
      'Monte o wrap com alface, tomate e frango',
      'Enrole e corte ao meio'
    ],
    image: '🌯',
    tags: ['Rápido', 'Portátil', 'Baixa Caloria']
  },
  {
    id: '6',
    name: 'Omelete de Claras com Espinafre',
    category: 'cafe_da_manha',
    prepTime: 10,
    calories: 180,
    protein: 24,
    carbs: 8,
    fat: 6,
    difficulty: 'Fácil',
    ingredients: [
      '4 claras de ovo',
      '1 ovo inteiro',
      '50g de espinafre',
      'Tomate cereja',
      'Queijo cottage',
      'Sal e pimenta'
    ],
    instructions: [
      'Bata as claras com o ovo inteiro',
      'Tempere com sal e pimenta',
      'Refogue o espinafre rapidamente',
      'Despeje os ovos em uma frigideira antiaderente',
      'Adicione o espinafre e os tomates',
      'Dobre ao meio quando estiver firme'
    ],
    image: '🍳',
    tags: ['Alto Proteína', 'Baixo Carbo', 'Cutting']
  },
  {
    id: '7',
    name: 'Smoothie Verde Proteico',
    category: 'lanche',
    prepTime: 5,
    calories: 240,
    protein: 28,
    carbs: 28,
    fat: 4,
    difficulty: 'Fácil',
    ingredients: [
      '1 scoop de whey protein',
      '1 banana congelada',
      '50g de espinafre',
      '200ml de leite de amêndoas',
      '1 colher de pasta de amendoim',
      'Gelo'
    ],
    instructions: [
      'Adicione todos os ingredientes no liquidificador',
      'Bata até ficar homogêneo',
      'Adicione gelo se desejar mais consistência',
      'Sirva imediatamente'
    ],
    image: '🥤',
    tags: ['Rápido', 'Pós-Treino', 'Detox']
  },
  {
    id: '8',
    name: 'Carne Moída com Legumes',
    category: 'almoco',
    prepTime: 25,
    calories: 420,
    protein: 40,
    carbs: 35,
    fat: 14,
    difficulty: 'Fácil',
    ingredients: [
      '200g de carne moída magra',
      '100g de abobrinha',
      '100g de cenoura',
      '80g de arroz integral',
      'Cebola e alho',
      'Tomate'
    ],
    instructions: [
      'Refogue a cebola e o alho',
      'Adicione a carne moída e deixe dourar',
      'Acrescente os legumes picados',
      'Adicione tomate e temperos',
      'Cozinhe o arroz integral',
      'Sirva a carne sobre o arroz'
    ],
    image: '🥘',
    tags: ['Rico em Ferro', 'Completo', 'Econômico']
  },
  {
    id: '9',
    name: 'Salada de Atum com Grão de Bico',
    category: 'jantar',
    prepTime: 15,
    calories: 380,
    protein: 35,
    carbs: 32,
    fat: 12,
    difficulty: 'Fácil',
    ingredients: [
      '1 lata de atum em água',
      '100g de grão de bico cozido',
      'Alface, rúcula e tomate',
      'Pepino',
      'Azeite e limão',
      'Sal e ervas'
    ],
    instructions: [
      'Escorra o atum',
      'Lave e corte os vegetais',
      'Misture todos os ingredientes',
      'Tempere com azeite, limão, sal e ervas',
      'Sirva gelado'
    ],
    image: '🥗',
    tags: ['Leve', 'Ômega 3', 'Sem Cozimento']
  },
  {
    id: '10',
    name: 'Tapioca Recheada Fitness',
    category: 'lanche',
    prepTime: 10,
    calories: 280,
    protein: 22,
    carbs: 36,
    fat: 6,
    difficulty: 'Fácil',
    ingredients: [
      '3 colheres de goma de tapioca',
      '2 ovos mexidos',
      '30g de queijo cottage',
      'Tomate',
      'Orégano'
    ],
    instructions: [
      'Hidrate a tapioca em uma frigideira quente',
      'Prepare os ovos mexidos',
      'Recheie a tapioca com ovos, queijo e tomate',
      'Polvilhe orégano',
      'Dobre ao meio e sirva'
    ],
    image: '🫓',
    tags: ['Sem Glúten', 'Brasileiro', 'Versátil']
  },
  {
    id: '11',
    name: 'Peito de Peru com Abacate',
    category: 'lanche',
    prepTime: 5,
    calories: 220,
    protein: 26,
    carbs: 12,
    fat: 8,
    difficulty: 'Fácil',
    ingredients: [
      '100g de peito de peru',
      '1/2 abacate',
      '2 fatias de pão integral',
      'Alface',
      'Tomate'
    ],
    instructions: [
      'Torre o pão integral',
      'Amasse o abacate com uma pitada de sal',
      'Monte o sanduíche com todos os ingredientes',
      'Corte ao meio e sirva'
    ],
    image: '🥪',
    tags: ['Rápido', 'Portátil', 'Gordura Boa']
  },
  {
    id: '12',
    name: 'Tilápia ao Forno com Legumes',
    category: 'jantar',
    prepTime: 30,
    calories: 340,
    protein: 42,
    carbs: 22,
    fat: 8,
    difficulty: 'Médio',
    ingredients: [
      '200g de filé de tilápia',
      '100g de abobrinha',
      '100g de tomate',
      'Limão',
      'Alho e ervas',
      'Azeite'
    ],
    instructions: [
      'Tempere o peixe com limão, alho e ervas',
      'Corte os legumes em fatias',
      'Disponha tudo em uma forma',
      'Regue com azeite',
      'Asse a 180°C por 20-25 minutos'
    ],
    image: '🐠',
    tags: ['Baixa Caloria', 'Ao Forno', 'Leve']
  }
];

const categories = [
  { key: 'todas', label: 'Todas' },
  { key: 'cafe_da_manha', label: 'Café da Manhã' },
  { key: 'almoco', label: 'Almoço' },
  { key: 'jantar', label: 'Jantar' },
  { key: 'lanche', label: 'Lanches' }
];

export function RecipeExplorer() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeCategory, setActiveCategory] = useState('todas');

  const filteredRecipes = activeCategory === 'todas' 
    ? recipes 
    : recipes.filter(r => r.category === activeCategory);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Receitas Fitness</h2>
        <Badge variant="outline">{filteredRecipes.length} receitas</Badge>
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
                        <div className="text-4xl">{recipe.image}</div>
                        <div>
                          <CardTitle className="text-base">{recipe.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {recipe.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{recipe.prepTime} min</span>
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

                    <div className="flex flex-wrap gap-1">
                      {recipe.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
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
                  <div className="text-5xl">{selectedRecipe.image}</div>
                  <div>
                    <DialogTitle className="text-xl">{selectedRecipe.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{selectedRecipe.difficulty}</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {selectedRecipe.prepTime} minutos
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
                    <div className="text-xs text-muted-foreground">Carbos</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-3 text-center">
                    <div className="font-bold text-lg text-yellow-600">
                      {selectedRecipe.fat}g
                    </div>
                    <div className="text-xs text-muted-foreground">Gordura</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {selectedRecipe.tags.map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>

                {/* Ingredients */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <ChefHat className="w-5 h-5" />
                    Ingredientes
                  </h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Modo de Preparo</h3>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions.map((instruction, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                          {idx + 1}
                        </span>
                        <span className="text-sm pt-0.5">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}