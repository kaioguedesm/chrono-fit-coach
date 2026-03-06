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
    'Planos nutricionais completos',
    'Acompanhamento de progresso',
    'Agenda de treinos',
    'Análise de fotos de refeições',
    'Suporte ao personal trainer',
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Acesso Bloqueado
        </h2>
        <p className="text-muted-foreground">
          Assine o plano para desbloquear todas as funcionalidades do app.
        </p>
      </div>

      <Card className="border-primary/30 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-4">
          <div className="flex items-center gap-2 text-primary-foreground">
            <Crown className="w-5 h-5" />
            <span className="font-semibold text-sm uppercase tracking-wide">Plano NexFit</span>
          </div>
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">R$29</span>
            <span className="text-2xl font-bold text-muted-foreground">,90</span>
            <span className="text-muted-foreground text-sm font-normal">/mês</span>
          </CardTitle>
          <CardDescription>Acesso completo a todas as funcionalidades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

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
