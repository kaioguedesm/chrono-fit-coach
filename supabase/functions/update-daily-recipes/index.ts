import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Recipe {
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
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting daily recipes update...');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Desativar receitas antigas
    console.log('Deactivating old recipes...');
    const { error: deactivateError } = await supabase
      .from('recommended_recipes')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) {
      console.error('Error deactivating old recipes:', deactivateError);
      throw deactivateError;
    }

    // Gerar novas receitas para cada categoria
    const categories = [
      { name: 'cafe_da_manha', label: 'Café da Manhã' },
      { name: 'almoco', label: 'Almoço' },
      { name: 'jantar', label: 'Jantar' },
      { name: 'lanche', label: 'Lanche' }
    ];

    const allRecipes: Recipe[] = [];

    for (const category of categories) {
      console.log(`Generating recipes for ${category.label}...`);

      const prompt = `Gere 3 receitas saudáveis e deliciosas para ${category.label}. 
As receitas devem ser:
- Nutritivas e balanceadas
- Fáceis de preparar
- Com ingredientes acessíveis
- Variadas em sabores e texturas

Para cada receita, forneça:
- Título atraente
- Descrição breve (2-3 linhas)
- Lista de ingredientes (com quantidades)
- Modo de preparo detalhado
- Informações nutricionais (calorias, proteínas, carboidratos, gorduras)
- Tempo de preparo em minutos
- Nível de dificuldade (fácil, médio ou difícil)`;

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'Você é um chef especialista em nutrição. Retorne APENAS um array JSON válido de receitas, sem texto adicional.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'generate_recipes',
                description: 'Generate recipe recommendations',
                parameters: {
                  type: 'object',
                  properties: {
                    recipes: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          title: { type: 'string' },
                          description: { type: 'string' },
                          ingredients: {
                            type: 'array',
                            items: { type: 'string' }
                          },
                          instructions: { type: 'string' },
                          calories: { type: 'number' },
                          protein: { type: 'number' },
                          carbs: { type: 'number' },
                          fat: { type: 'number' },
                          prep_time_minutes: { type: 'number' },
                          difficulty: {
                            type: 'string',
                            enum: ['facil', 'medio', 'dificil']
                          }
                        },
                        required: ['title', 'description', 'ingredients', 'instructions', 'calories', 'protein', 'carbs', 'fat', 'prep_time_minutes', 'difficulty']
                      }
                    }
                  },
                  required: ['recipes']
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'generate_recipes' } }
          }),
        });

        if (response.status === 429) {
          console.error('Rate limit exceeded');
          throw new Error('Rate limit exceeded for AI API');
        }

        if (response.status === 402) {
          console.error('Payment required');
          throw new Error('Payment required for AI API');
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI API error:', response.status, errorText);
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('AI response received for', category.label);

        // Extrair receitas do tool call
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall && toolCall.function.name === 'generate_recipes') {
          const recipesData = JSON.parse(toolCall.function.arguments);
          const recipes = recipesData.recipes.map((recipe: any) => ({
            ...recipe,
            category: category.name
          }));
          allRecipes.push(...recipes);
          console.log(`Generated ${recipes.length} recipes for ${category.label}`);
        }
      } catch (error) {
        console.error(`Error generating recipes for ${category.label}:`, error);
        // Continue para a próxima categoria mesmo se houver erro
        continue;
      }

      // Pequeno delay entre requisições para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (allRecipes.length === 0) {
      throw new Error('No recipes were generated');
    }

    // Inserir novas receitas
    console.log(`Inserting ${allRecipes.length} new recipes...`);
    const { error: insertError } = await supabase
      .from('recommended_recipes')
      .insert(allRecipes);

    if (insertError) {
      console.error('Error inserting recipes:', insertError);
      throw insertError;
    }

    console.log('Daily recipes update completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully generated ${allRecipes.length} new recipes`,
        recipes_count: allRecipes.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in update-daily-recipes:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
