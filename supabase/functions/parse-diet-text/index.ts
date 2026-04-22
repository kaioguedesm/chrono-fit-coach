import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autorização necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bodySchema = z.object({
      foodsText: z.string().trim().min(3, 'Lista de alimentos muito curta').max(5000, 'Texto muito longo'),
      goal: z.enum(['emagrecimento', 'ganho_de_massa', 'manutencao']),
      weight: z.number().min(20).max(500),
      height: z.number().min(50).max(300),
      age: z.number().int().min(10).max(120),
      activityLevel: z.enum(['baixo', 'moderado', 'alto']),
      mealsPerDay: z.number().int().min(3).max(6),
      restrictions: z.string().max(500).optional(),
    });

    const requestBody = await req.json();
    const parsed = bodySchema.safeParse(requestBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { foodsText, goal, weight, height, age, activityLevel, mealsPerDay, restrictions } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const goalLabels: Record<string, string> = {
      emagrecimento: 'Emagrecimento (déficit calórico)',
      ganho_de_massa: 'Ganho de massa muscular (superávit calórico)',
      manutencao: 'Manutenção de peso',
    };

    const activityLabels: Record<string, string> = {
      baixo: 'Sedentário / Baixo',
      moderado: 'Moderado (3-4x por semana)',
      alto: 'Alto (5-7x por semana)',
    };

    const mealTypesByCount: Record<number, string[]> = {
      3: ['cafe_da_manha', 'almoco', 'jantar'],
      4: ['cafe_da_manha', 'almoco', 'lanche_tarde', 'jantar'],
      5: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'],
      6: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia'],
    };

    const mealLabels: Record<string, string> = {
      cafe_da_manha: 'Café da Manhã',
      lanche_manha: 'Lanche da Manhã',
      almoco: 'Almoço',
      lanche_tarde: 'Lanche da Tarde',
      jantar: 'Jantar',
      ceia: 'Ceia',
    };

    const mealTypes = mealTypesByCount[mealsPerDay] || mealTypesByCount[4];
    const mealTypesStr = mealTypes.map(t => `"${t}" (${mealLabels[t]})`).join(', ');

    const systemPrompt = `Você é um nutricionista esportivo especialista em montar dietas personalizadas.
Sua tarefa é receber uma lista de alimentos que o personal trainer deseja usar e criar um plano alimentar completo, estruturado e com valores nutricionais calculados.

DADOS DO ALUNO:
- Peso: ${weight}kg
- Altura: ${height}cm
- Idade: ${age} anos
- Nível de atividade: ${activityLabels[activityLevel]}
- Objetivo: ${goalLabels[goal]}
${restrictions ? `- Restrições alimentares: ${restrictions}` : ''}

REGRAS IMPORTANTES:
- Use APENAS os alimentos fornecidos pelo personal como base
- Se faltar algum nutriente, SUGIRA adições mas NÃO altere completamente a ideia do personal
- Calcule as calorias totais diárias baseadas no TMB (Harris-Benedict) + nível de atividade + objetivo
- Distribua os macronutrientes de forma adequada ao objetivo
- Especifique QUANTIDADES exatas para cada alimento (em gramas, unidades, colheres, etc.)
- Respeite restrições alimentares
- O plano deve ter exatamente ${mealsPerDay} refeições: ${mealTypesStr}

HORÁRIOS DAS REFEIÇÕES (MUITO IMPORTANTE):
- Se o personal indicar horários no texto (ex: "café às 7h", "almoço de 12 às 13h", "jantar 19:30"), EXTRAIA exatamente esses horários e devolva no campo "meal_time" de cada refeição.
- O formato OBRIGATÓRIO de "meal_time" é uma faixa "HH:MM - HH:MM" (24h). Ex: "07:00 - 08:00", "12:00 - 13:00", "19:30 - 20:00".
- Se o personal informar apenas um horário pontual (ex: "café às 7h"), gere uma faixa de 1 hora a partir dele (ex: "07:00 - 08:00").
- Se o personal NÃO mencionar horário para alguma refeição, sugira uma faixa razoável baseada no tipo da refeição (café 06:30-08:00, lanche manhã 09:30-10:30, almoço 12:00-13:30, lanche tarde 15:30-16:30, jantar 19:00-20:30, ceia 21:30-22:30).
- NUNCA invente horários conflitantes com o que o personal escreveu. Respeite literalmente o que ele pediu.

CÁLCULO DE HIDRATAÇÃO:
Calcule a ingestão diária de água recomendada usando:
- Base: 35ml por kg de peso corporal
- Se atividade moderada: +500ml
- Se atividade alta: +1000ml
- Se objetivo emagrecimento: +300ml
Sugira uma distribuição ao longo do dia (manhã, treino, tarde, noite).

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "plan_title": "Plano Alimentar - [Objetivo]",
  "description": "Breve descrição do plano",
  "total_daily": {
    "calories": 2200,
    "protein": 150,
    "carbs": 250,
    "fat": 60
  },
  "hydration": {
    "total_ml": 3000,
    "total_liters": "3,0",
    "distribution": [
      { "period": "Manhã (ao acordar)", "amount_ml": 500 },
      { "period": "Durante o treino", "amount_ml": 500 },
      { "period": "Tarde", "amount_ml": 1000 },
      { "period": "Noite", "amount_ml": 1000 }
    ],
    "tip": "Distribua a água ao longo do dia para manter a hidratação constante."
  },
  "suggestions": "Texto com sugestões de melhoria se necessário, ou null",
  "meals": [
    {
      "meal_type": "cafe_da_manha",
      "name": "Café da Manhã Energético",
      "meal_time": "07:00 - 08:00",
      "ingredients": ["2 ovos mexidos", "1 banana", "1 fatia de pão integral"],
      "instructions": "Preparar os ovos mexidos...",
      "calories": 400,
      "protein": 25,
      "carbs": 45,
      "fat": 15
    }
  ]
}

Use apenas estes meal_type: ${mealTypes.join(', ')}
RETORNE APENAS O JSON, sem texto adicional.`;

    const userPrompt = `Monte uma dieta completa usando estes alimentos como base:\n\n${foodsText}`;

    console.log('Calling AI to parse diet text...');

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
        temperature: 0.4,
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
      throw new Error(`Erro no gateway de IA: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Resposta vazia da IA');
    }

    let parsedDiet;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedDiet = JSON.parse(cleanContent);
    } catch {
      console.error('Failed to parse AI response:', content);
      throw new Error('Não foi possível interpretar a dieta. Tente reformular o texto.');
    }

    return new Response(
      JSON.stringify(parsedDiet),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-diet-text:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao processar dieta' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
