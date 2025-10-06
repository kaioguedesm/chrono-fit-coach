import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      goal, 
      experience, 
      equipment, 
      muscleGroup, 
      muscleGroupDescription,
      duration,
      userWeight,
      userAge
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Você é um personal trainer experiente e certificado, especializado em criar treinos personalizados e eficientes.
Sua missão é desenvolver treinos cientificamente embasados que consideram o perfil completo do aluno.

IMPORTANTE: Retorne APENAS um objeto JSON válido com a estrutura exata abaixo, sem nenhum texto adicional antes ou depois:

{
  "workoutName": "Nome criativo e motivador do treino",
  "exercises": [
    {
      "name": "Nome completo do exercício",
      "sets": número_de_séries,
      "reps": "faixa_de_repetições (ex: 8-12, 12-15)",
      "weight": peso_sugerido_em_kg_ou_null,
      "rest_time": tempo_descanso_em_segundos,
      "notes": "técnica correta, músculos trabalhados e dicas importantes"
    }
  ]
}

Diretrizes para criação do treino:
- Inclua aquecimento específico quando apropriado
- Varie ângulos e tipos de exercícios (compostos e isolados)
- Progressão lógica de exercícios (mais complexos primeiro)
- Considere fadiga muscular acumulada
- Inclua dicas de técnica para prevenir lesões`;

    const userPrompt = `Crie um treino COMPLETO e PERSONALIZADO com as seguintes características:

📋 PERFIL DO ALUNO:
- Objetivo principal: ${goal}
- Nível de experiência: ${experience}
${userWeight ? `- Peso atual: ${userWeight}kg` : ''}
${userAge ? `- Idade: ${userAge} anos` : ''}

🎯 ESPECIFICAÇÕES DO TREINO:
- Grupo muscular foco: ${muscleGroup}
- Descrição do foco: ${muscleGroupDescription}
- Duração aproximada: ${duration} minutos
- Equipamentos disponíveis: ${equipment || 'equipamentos completos de academia'}

📝 REQUISITOS:
- Inclua ${duration < 45 ? '4-5' : duration < 75 ? '6-7' : '8-10'} exercícios apropriados
- Exercícios progressivos (compostos → isolados)
- Variação de ângulos e pegadas
- Séries e repetições adequadas ao objetivo e nível
- Tempo de descanso otimizado
- Dicas técnicas e de segurança para cada exercício
- Nome do treino criativo e motivador

LEMBRE-SE: Retorne APENAS o JSON, sem texto adicional!`;

    console.log('Calling AI Gateway...');
    
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
        temperature: 0.7,
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
    let workoutPlan;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      workoutPlan = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    return new Response(
      JSON.stringify(workoutPlan),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-workout function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar treino'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
