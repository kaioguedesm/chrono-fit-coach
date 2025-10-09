import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing meal photo with AI...');

    const systemPrompt = `Você é um nutricionista especialista em análise nutricional de alimentos através de imagens.

Sua tarefa é analisar a foto da refeição e fornecer uma estimativa PRECISA e DETALHADA dos valores nutricionais.

INSTRUÇÕES IMPORTANTES:
1. Identifique TODOS os alimentos visíveis na imagem
2. Estime o tamanho das porções com a maior precisão possível (use referências visuais como talheres, pratos, etc.)
3. Para cada alimento, calcule: calorias, proteínas (g), carboidratos (g), gorduras (g)
4. Some todos os valores para obter os totais
5. Seja conservador nas estimativas - é melhor subestimar levemente do que superestimar
6. Se houver incerteza sobre um alimento, mencione isso na análise

FORMATO DE RESPOSTA (JSON):
{
  "mealName": "Nome descritivo da refeição",
  "foodItems": [
    {
      "name": "Nome do alimento",
      "portion": "Tamanho estimado da porção",
      "calories": número_de_calorias,
      "protein": gramas_de_proteína,
      "carbs": gramas_de_carboidratos,
      "fat": gramas_de_gordura
    }
  ],
  "totals": {
    "calories": total_de_calorias,
    "protein": total_de_proteína,
    "carbs": total_de_carboidratos,
    "fat": total_de_gordura
  },
  "analysis": "Análise detalhada explicando como você chegou aos valores, mencionando possíveis variações e incertezas",
  "confidence": "alta|média|baixa - seu nível de confiança na análise"
}`;

    const userPrompt = `Analise esta foto de refeição e forneça uma contagem nutricional completa e precisa. 
    
Seja específico sobre os alimentos identificados e o tamanho das porções. Use seu conhecimento nutricional para fornecer estimativas baseadas em bancos de dados nutricionais confiáveis (TACO, USDA, etc.).

Retorne APENAS o JSON, sem texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Por favor, adicione créditos ao seu workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Erro ao processar a imagem' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response received');

    let nutritionData;
    try {
      const content = data.choices[0].message.content;
      
      // Clean the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      nutritionData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar a resposta da IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate the response structure
    if (!nutritionData.totals || !nutritionData.foodItems) {
      console.error('Invalid nutrition data structure:', nutritionData);
      return new Response(
        JSON.stringify({ error: 'Resposta da IA em formato inválido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify(nutritionData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-meal-photo function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
