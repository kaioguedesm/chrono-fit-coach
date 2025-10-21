import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting check
    const { data: rateLimitData } = await supabase.rpc('increment_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'analyze-diet-file',
      p_limit: 20
    });

    if (rateLimitData && !rateLimitData.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Limite de análises atingido. Tente novamente mais tarde.',
        reset_at: rateLimitData.reset_at 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate input
    const dietFileSchema = z.object({
      fileContent: z.string().min(10).max(50000),
      fileName: z.string().min(1).max(200),
      additionalNotes: z.string().max(1000).optional()
    });

    const requestBody = await req.json();
    const validatedData = dietFileSchema.parse(requestBody);

    // Get user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('weight, height, age, gender, goal, experience_level, dietary_restrictions')
      .eq('user_id', user.id)
      .single();

    const systemPrompt = `Você é um nutricionista especialista em análise de dietas. Analise o arquivo de dieta fornecido e gere insights personalizados.

IMPORTANTE: Retorne APENAS um objeto JSON válido, sem texto adicional antes ou depois.

Estrutura do JSON de resposta:
{
  "summary": "Resumo geral da dieta (2-3 frases)",
  "dailyCalories": número estimado de calorias diárias,
  "macros": {
    "protein": número estimado de proteínas em gramas,
    "carbs": número estimado de carboidratos em gramas,
    "fat": número estimado de gorduras em gramas
  },
  "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
  "improvements": ["melhoria sugerida 1", "melhoria sugerida 2", "melhoria sugerida 3"],
  "recommendations": ["recomendação 1", "recomendação 2", "recomendação 3"],
  "mealsIdentified": número de refeições identificadas,
  "adherenceScore": número de 1-10 indicando aderência aos objetivos,
  "personalizedInsight": "Insight personalizado baseado no perfil e objetivos do usuário (2-3 frases)"
}`;

    let userPrompt = `PERFIL DO USUÁRIO:
${profile ? `
- Peso: ${profile.weight || 'não informado'}kg
- Altura: ${profile.height || 'não informada'}cm
- Idade: ${profile.age || 'não informada'} anos
- Sexo: ${profile.gender || 'não informado'}
- Objetivo: ${profile.goal || 'não informado'}
- Nível: ${profile.experience_level || 'não informado'}
- Restrições: ${profile.dietary_restrictions?.join(', ') || 'nenhuma'}
` : '- Perfil não disponível'}

ARQUIVO DE DIETA (${validatedData.fileName}):
${validatedData.fileContent}`;

    if (validatedData.additionalNotes) {
      userPrompt += `\n\nNOTAS ADICIONAIS DO USUÁRIO:\n${validatedData.additionalNotes}`;
    }

    console.log('Calling Lovable AI Gateway for diet analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
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

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Muitas requisições. Aguarde um momento e tente novamente.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Créditos insuficientes. Por favor, adicione créditos ao seu workspace.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;

    console.log('AI Response:', analysisText);

    // Parse the JSON response
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(analysisText);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', analysisText);
      throw new Error('Failed to parse AI response');
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in analyze-diet-file:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Dados inválidos fornecidos',
        details: error.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: error.message || 'Erro ao analisar arquivo de dieta' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
