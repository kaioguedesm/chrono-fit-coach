import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      mood, 
      moodIntensity,
      workoutName,
      exerciseCount,
      type,
      userName
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Você é um personal trainer empático e motivador que adapta mensagens de acordo com o estado emocional do aluno.
Suas mensagens são curtas, pessoais e humanas - NUNCA técnicas ou robóticas.
Use uma linguagem próxima, acolhedora e motivadora.
IMPORTANTE: Retorne APENAS texto puro, sem formatação JSON ou markdown.`;

    let userPrompt = '';
    
    if (type === 'pre-workout') {
      const moodMessages = {
        'energized': 'O aluno está SUPER animado e cheio de energia! Crie uma mensagem que canalize essa energia positiva.',
        'good': 'O aluno está bem e motivado. Reforce essa motivação de forma leve.',
        'neutral': 'O aluno está ok, nem muito animado nem desmotivado. Dê um empurrãozinho amigável.',
        'tired': 'O aluno está cansado. Seja empático, mas encoraje com gentileza.',
        'unmotivated': 'O aluno está desmotivado. Seja MUITO empático e mostre que você entende. Foque no quanto ele é forte por estar aqui.'
      };

      userPrompt = `${moodMessages[mood as keyof typeof moodMessages]}

Contexto:
- Nome: ${userName || 'Atleta'}
- Treino: ${workoutName}
- Tem ${exerciseCount} exercícios
- Intensidade do humor: ${moodIntensity}/5

Crie uma mensagem de 2-3 linhas MÁXIMO que:
1. Reconheça como ele está se sentindo
2. ${mood === 'energized' ? 'Celebre a energia dele e sugira aproveitar ao máximo' : 
    mood === 'tired' || mood === 'unmotivated' ? 'Seja empático e diga que está tudo bem não estar 100%, mas que você adaptou o treino' :
    'Incentive de forma leve e positiva'}
3. Termine com algo motivador mas não clichê

Lembre-se: seja HUMANO, não técnico. Fale como um amigo que é personal trainer.`;
    } else {
      userPrompt = `O aluno ${userName || 'Atleta'} acabou de completar o treino "${workoutName}".

Estado inicial: ${mood} (intensidade ${moodIntensity}/5)

Crie uma mensagem pós-treino de 2-3 linhas que:
1. Parabenize de forma genuína
2. ${moodIntensity <= 2 ? 'Reconheça que ele superou um dia difícil e isso é incrível' :
    moodIntensity >= 4 ? 'Celebre o ótimo desempenho e a energia' :
    'Valorize o esforço e consistência'}
3. Dê uma dica inteligente sobre recuperação ou próximo treino (seja específico ao humor dele)

Tom: Amigável, pessoal, motivador mas autêntico.`;
    }

    console.log('Calling AI Gateway for motivation...');
    
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
        temperature: 0.8,
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
          JSON.stringify({ error: 'Créditos insuficientes.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response received');
    
    const message = data.choices?.[0]?.message?.content;
    if (!message) {
      throw new Error('No content in AI response');
    }

    return new Response(
      JSON.stringify({ message: message.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-workout-motivation function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar mensagem motivacional'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
