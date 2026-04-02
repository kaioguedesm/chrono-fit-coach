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

    // Validate input
    const bodySchema = z.object({
      workoutText: z.string().trim().min(5, 'Texto do treino muito curto').max(5000, 'Texto do treino muito longo'),
    });

    const requestBody = await req.json();
    const parsed = bodySchema.safeParse(requestBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { workoutText } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const systemPrompt = `Você é um assistente especializado em organizar treinos de academia.
Sua tarefa é receber um texto livre de treino (como o personal trainer enviaria por WhatsApp) e convertê-lo em uma estrutura JSON organizada.

REGRAS IMPORTANTES:
- NÃO modifique a intenção do personal trainer
- NÃO remova exercícios
- Corrija pequenos erros de digitação nos nomes dos exercícios
- Padronize nomes (ex: "sup reto" → "Supino Reto")
- Se faltar séries/reps, sugira um padrão razoável (ex: 3x10)
- Identifique divisões de treino (A, B, C, etc.) se houver
- Mantenha a ordem original dos exercícios

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "workouts": [
    {
      "name": "Treino A - Descrição",
      "type": "hipertrofia",
      "exercises": [
        {
          "name": "Nome do Exercício",
          "sets": 4,
          "reps": "10-12",
          "rest_time": 60,
          "notes": "observação se houver"
        }
      ]
    }
  ]
}

Para o campo "type", escolha o mais adequado entre: hipertrofia, forca, resistencia, funcional, cardio, outro.
Para o campo "rest_time", informe o tempo de descanso em SEGUNDOS entre séries. Se o personal não especificar, sugira um valor adequado:
- Exercícios compostos pesados (agachamento, supino, terra): 90-120 segundos
- Exercícios compostos médios: 60-90 segundos
- Exercícios isolados: 45-60 segundos
- Abdominais e cardio: 30-45 segundos
Se houver apenas um treino sem divisão, use um único objeto no array.
RETORNE APENAS O JSON, sem texto adicional.`;

    const userPrompt = `Organize o seguinte treino em formato estruturado:\n\n${workoutText}`;

    console.log('Calling AI to parse workout text...');

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
        temperature: 0.3,
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

    let parsedWorkout;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedWorkout = JSON.parse(cleanContent);
    } catch {
      console.error('Failed to parse AI response:', content);
      throw new Error('Não foi possível interpretar o treino. Tente reformular o texto.');
    }

    return new Response(
      JSON.stringify(parsedWorkout),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-workout-text:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao processar treino' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
