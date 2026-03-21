import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Não autorizado");

    const { nutritionPlanId, userMessage } = await req.json();
    if (!nutritionPlanId || !userMessage) {
      throw new Error("Dados incompletos");
    }

    // Fetch the plan and its meals
    const { data: plan, error: planError } = await supabase
      .from("nutrition_plans")
      .select("*, meals(*)")
      .eq("id", nutritionPlanId)
      .eq("user_id", user.id)
      .single();

    if (planError || !plan) throw new Error("Plano não encontrado");

    // Build current diet description for AI
    const mealTypeLabels: Record<string, string> = {
      cafe_da_manha: "Café da Manhã",
      lanche_manha: "Lanche da Manhã",
      almoco: "Almoço",
      lanche_tarde: "Lanche da Tarde",
      jantar: "Jantar",
      ceia: "Ceia",
    };

    const mealsDescription = plan.meals
      .map((m: any) => {
        const label = mealTypeLabels[m.meal_type] || m.meal_type;
        return `[${label}] ${m.name}: ${(m.ingredients || []).join(", ")} | ${m.calories || 0} kcal, P:${m.protein || 0}g, C:${m.carbs || 0}g, G:${m.fat || 0}g`;
      })
      .join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = `Você é um nutricionista especialista brasileiro. O usuário tem uma dieta atual e quer trocar alguns alimentos por outros que sejam acessíveis, mais baratos ou de sua preferência, mas que mantenham valores nutricionais similares.

REGRAS IMPORTANTES:
1. Mantenha os valores calóricos e de macronutrientes o mais próximo possível do original
2. Sugira alimentos comuns e acessíveis no Brasil
3. Explique brevemente por que cada troca é equivalente
4. Retorne APENAS um JSON válido (sem markdown, sem texto extra)

O JSON deve ter este formato:
{
  "swaps": [
    {
      "meal_id": "id-da-refeição-original",
      "new_name": "Nome da nova refeição",
      "new_ingredients": ["ingrediente1", "ingrediente2"],
      "new_calories": 350,
      "new_protein": 25,
      "new_carbs": 40,
      "new_fat": 10,
      "new_instructions": "Instruções de preparo",
      "reason": "Motivo da troca"
    }
  ],
  "summary": "Resumo das trocas realizadas"
}

Se o alimento mencionado pelo usuário não existir na dieta, ignore-o e não inclua no array de swaps.`;

    const userPrompt = `DIETA ATUAL:
${mealsDescription}

IDs das refeições para referência:
${plan.meals.map((m: any) => `- ${m.name}: ${m.id}`).join("\n")}

PEDIDO DO USUÁRIO:
${userMessage}

Analise a dieta e faça as trocas solicitadas mantendo os valores nutricionais equivalentes.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Erro na IA");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    
    // Clean markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Resposta da IA inválida");
    }

    // Apply swaps to database
    const appliedSwaps = [];
    for (const swap of parsed.swaps || []) {
      const { error: updateError } = await supabase
        .from("meals")
        .update({
          name: swap.new_name,
          ingredients: swap.new_ingredients,
          calories: swap.new_calories,
          protein: swap.new_protein,
          carbs: swap.new_carbs,
          fat: swap.new_fat,
          instructions: swap.new_instructions || null,
        })
        .eq("id", swap.meal_id)
        .eq("nutrition_plan_id", nutritionPlanId);

      if (!updateError) {
        appliedSwaps.push({
          meal_id: swap.meal_id,
          new_name: swap.new_name,
          reason: swap.reason,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        swaps: appliedSwaps,
        summary: parsed.summary || "Trocas realizadas com sucesso!",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("swap-food error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
