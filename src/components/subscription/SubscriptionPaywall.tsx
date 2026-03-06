import { useState } from 'react';
import { Lock, CreditCard, CheckCircle2, Loader2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function SubscriptionPaywall() {
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!session?.access_token) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o checkout. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Treinos personalizados com IA',
    'Planos nutricionais estruturados',
    'Acompanhamento de progresso',
    'Evolução de cargas e medidas',
    'Agenda de treinos',
    'Análise inteligente de refeições',
    'Sistema completo de evolução física',
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-md animate-fade-in">
      <Card className="border-primary/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/70 px-6 py-4 flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary-foreground" />
          <span className="font-bold text-sm uppercase tracking-widest text-primary-foreground">
            Plano NexFit
          </span>
        </div>

        <CardContent className="px-6 py-8 space-y-6">
          {/* Price */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-extrabold text-foreground">R$29</span>
              <span className="text-2xl font-bold text-muted-foreground">,90</span>
              <span className="text-sm text-muted-foreground font-medium">/mês</span>
            </div>
            <p className="text-muted-foreground text-sm mt-2">
              Tenha treino, dieta e acompanhamento completo.
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {/* Separator + motivational text */}
          <div className="border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground italic">
              Menos que o preço de um lanche por semana.
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <CreditCard className="w-5 h-5 mr-2" />
            )}
            {loading ? 'Redirecionando...' : 'Assinar Agora'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Pagamento seguro via Stripe. Cancele a qualquer momento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
