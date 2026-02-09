import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autorização necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation schema
    const nutritionSchema = z.object({
      dietType: z.string().trim().min(1).max(100),
      dietDescription: z.string().trim().max(500).optional(),
      mealsPerDay: z.number().int().min(1).max(10),
      restrictions: z.array(z.string().trim().max(100)).max(20).optional(),
      userProfile: z.object({
        weight: z.number().min(20).max(500).nullish(),
        height: z.number().min(50).max(300).nullish(),
        age: z.number().int().min(13).max(120).nullish(),
        gender: z.string().trim().max(20).nullish(),
        goal: z.string().trim().max(200).nullish(),
        activityLevel: z.string().trim().max(50).nullish(),
        imc: z.union([z.string(), z.number()]).nullish(),
        dietaryPreferences: z.array(z.string()).nullish(),
        dietaryRestrictions: z.array(z.string()).nullish(),
      }).optional(),
      userPreferences: z.object({
        foodPreferences: z.string().trim().max(1000).nullish(),
        favoritesFoods: z.string().trim().max(1000).nullish(),
        dislikedFoods: z.string().trim().max(1000).nullish(),
        mealTiming: z.string().trim().max(500).nullish(),
        preparationTime: z.string().trim().max(100).nullish(),
        specialNotes: z.string().trim().max(1000).nullish()
      }).optional()
    });

    const requestBody = await req.json();

    // Handle "tips" mode separately - it doesn't need dietType/mealsPerDay
    if (requestBody.mode === 'tips') {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      const tipsPrompt = `Você é um nutricionista experiente. Com base na dieta ativa e perfil do usuário abaixo, gere 3-5 dicas rápidas e práticas de nutrição personalizadas.

Dieta ativa: ${JSON.stringify(requestBody.activeDiet || {})}
Perfil: ${JSON.stringify(requestBody.userProfile || {})}

Retorne APENAS um JSON válido: {"tips": ["dica 1", "dica 2", "dica 3"]}`;

      const tipsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: tipsPrompt }],
        }),
      });

      if (!tipsResponse.ok) {
        throw new Error(`AI Gateway error: ${tipsResponse.status}`);
      }

      const tipsData = await tipsResponse.json();
      const tipsContent = tipsData.choices?.[0]?.message?.content || '';
      const cleanTips = tipsContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedTips = JSON.parse(cleanTips);

      return new Response(
        JSON.stringify(parsedTips),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validated = nutritionSchema.parse(requestBody);

    const {
      dietType,
      dietDescription,
      mealsPerDay,
      restrictions,
      userProfile,
      userPreferences
    } = validated;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Calculate recommended calories based on profile
    let recommendedCalories = 2000; // Default
    if (userProfile.weight && userProfile.height && userProfile.age) {
      // Harris-Benedict equation for BMR
      let bmr;
      if (userProfile.gender === 'masculino') {
        bmr = 88.362 + (13.397 * userProfile.weight) + (4.799 * userProfile.height) - (5.677 * userProfile.age);
      } else {
        bmr = 447.593 + (9.247 * userProfile.weight) + (3.098 * userProfile.height) - (4.330 * userProfile.age);
      }
      
      // Apply activity factor (moderate activity)
      let tdee = bmr * 1.55;
      
      // Adjust based on goal
      if (dietType === 'emagrecimento') {
        recommendedCalories = Math.round(tdee * 0.8); // 20% deficit
      } else if (dietType === 'hipertrofia') {
        recommendedCalories = Math.round(tdee * 1.15); // 15% surplus
      } else if (dietType === 'definicao') {
        recommendedCalories = Math.round(tdee * 0.9); // 10% deficit
      } else {
        recommendedCalories = Math.round(tdee);
      }
    }

    const systemPrompt = `Você é um nutricionista experiente e certificado, especializado em criar planos alimentares personalizados e cientificamente embasados.

CRÍTICO: Retorne APENAS um objeto JSON válido com a estrutura exata abaixo, sem nenhum texto adicional:

{
  "planName": "Nome criativo e motivador do plano alimentar",
  "description": "Breve descrição do plano e seus benefícios",
  "meals": [
    {
      "meal_type": "tipo_refeicao",
      "name": "Nome da refeição",
      "ingredients": ["ingrediente 1", "ingrediente 2"],
      "calories": calorias_totais,
      "protein": gramas_proteina,
      "carbs": gramas_carboidratos,
      "fat": gramas_gordura,
      "instructions": "modo de preparo detalhado"
    }
  ]
}

TIPOS DE REFEIÇÃO permitidos (use exatamente estes):
- "cafe_da_manha" (Café da Manhã)
- "lanche_manha" (Lanche da Manhã)
- "almoco" (Almoço)
- "lanche_tarde" (Lanche da Tarde)
- "jantar" (Jantar)
- "ceia" (Ceia)

DIRETRIZES NUTRICIONAIS:
- Distribua as calorias de forma equilibrada ao longo do dia
- Café da manhã: 25-30% das calorias diárias
- Almoço: 30-35% das calorias diárias
- Jantar: 25-30% das calorias diárias
- Lanches: 10-15% das calorias diárias cada

MACRONUTRIENTES:
- Emagrecimento: 30% proteína, 40% carbo, 30% gordura
- Hipertrofia: 30% proteína, 45% carbo, 25% gordura
- Definição: 35% proteína, 35% carbo, 30% gordura
- Low-carb: 30% proteína, 15% carbo, 55% gordura
- Manutenção: 25% proteína, 45% carbo, 30% gordura

QUALIDADES DO PLANO:
- Refeições práticas e saborosas
- Ingredientes acessíveis e de fácil preparo
- Variedade de alimentos para evitar monotonia
- Respeite todas as restrições alimentares
- Inclua timing de nutrientes adequado
- Hidratação e suplementação quando necessário`;

    const userPrompt = `Crie um plano alimentar COMPLETO e PERSONALIZADO:

👤 PERFIL DO USUÁRIO:
${userProfile.weight ? `- Peso: ${userProfile.weight}kg` : ''}
${userProfile.height ? `- Altura: ${userProfile.height}cm` : ''}
${userProfile.age ? `- Idade: ${userProfile.age} anos` : ''}
${userProfile.gender ? `- Gênero: ${userProfile.gender}` : ''}
${userProfile.imc ? `- IMC: ${userProfile.imc}` : ''}
${userProfile.goal ? `- Objetivo fitness: ${userProfile.goal}` : ''}

🎯 ESPECIFICAÇÕES DO PLANO:
- Tipo de dieta: ${dietType}
- Descrição: ${dietDescription}
- Meta calórica diária: aproximadamente ${recommendedCalories} kcal
- Número de refeições: ${mealsPerDay}
${restrictions.length > 0 ? `- Restrições: ${restrictions.join(', ')}` : ''}
${userProfile.dietaryPreferences?.length > 0 ? `- Preferências do perfil: ${userProfile.dietaryPreferences.join(', ')}` : ''}
${userProfile.dietaryRestrictions?.length > 0 ? `- Restrições do perfil: ${userProfile.dietaryRestrictions.join(', ')}` : ''}

💚 PREFERÊNCIAS PESSOAIS DO ALUNO:
${userPreferences?.favoritesFoods ? `- ❤️ ALIMENTOS FAVORITOS (INCLUA O MÁXIMO POSSÍVEL): ${userPreferences.favoritesFoods}` : ''}
${userPreferences?.dislikedFoods ? `- 🚫 ALIMENTOS QUE NÃO GOSTA (EVITE TOTALMENTE): ${userPreferences.dislikedFoods}` : ''}
${userPreferences?.mealTiming ? `- ⏰ Horários preferidos: ${userPreferences.mealTiming}` : ''}
${userPreferences?.preparationTime ? `- ⚡ Tempo de preparo: ${userPreferences.preparationTime === 'rapido' ? 'Refeições rápidas (até 15 min)' : userPreferences.preparationTime === 'moderado' ? 'Tempo moderado (15-30 min)' : 'Pode ser elaborado (30+ min)'}` : ''}
${userPreferences?.specialNotes ? `- 📝 Observações especiais: ${userPreferences.specialNotes}` : ''}

📋 REQUISITOS CRÍTICOS:
- Crie exatamente ${mealsPerDay} refeições distribuídas ao longo do dia
- Total de calorias deve somar aproximadamente ${recommendedCalories} kcal
- Calcule macros precisos para cada refeição
- Respeite TODAS as restrições alimentares mencionadas
- IMPORTANTE: Priorize os alimentos favoritos do aluno nas refeições
- IMPORTANTE: NUNCA inclua alimentos que o aluno não gosta
- Ajuste o tempo de preparo conforme a preferência
- Inclua instruções claras e práticas de preparo
- Seja criativo mas prático
- Varie fontes de proteína e carboidratos
- Inclua vegetais e fibras em várias refeições
- Torne o plano agradável e sustentável a longo prazo

LEMBRE-SE: Retorne APENAS o JSON, sem texto adicional antes ou depois!`;

    console.log('Calling AI Gateway for nutrition plan...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao seu workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response received');
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response from AI
    let nutritionPlan;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      nutritionPlan = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the response structure
    if (!nutritionPlan.planName || !nutritionPlan.meals || !Array.isArray(nutritionPlan.meals)) {
      throw new Error('Invalid nutrition plan structure');
    }

    return new Response(
      JSON.stringify(nutritionPlan),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-nutrition function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar plano nutricional'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});