import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Crown,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Dumbbell,
  Apple,
  TrendingUp,
  Rocket,
  Trophy,
  Users,
  Sparkles,
} from 'lucide-react';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaywallModal({ open, onOpenChange }: PaywallModalProps) {
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
        window.location.href = data.url;
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


  const benefits = [
    'Treinos personalizados com IA',
    'Planos nutricionais estruturados',
    'Acompanhamento de progresso',
    'Evolução de cargas e medidas',
    'Agenda de treinos',
    'Análise inteligente de refeições',
    'Sistema completo de evolução física',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-primary/20">
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center gap-3">
          <Crown className="w-6 h-6 text-primary-foreground" />
          <span className="text-lg font-bold text-primary-foreground tracking-wide">PLANO NEXFIT</span>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Price */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-extrabold text-foreground">R$29</span>
              <span className="text-2xl font-bold text-muted-foreground">,90</span>
              <span className="text-sm text-muted-foreground font-medium">/mês</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Tenha treino, dieta e acompanhamento completo.
            </p>
          </div>

          {/* Benefits */}
          <ul className="space-y-3">
            {benefits.map((text) => (
              <li key={text} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{text}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-border" />

          <p className="text-sm text-muted-foreground text-center italic">
            Menos que o preço de um lanche por semana.
          </p>

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
