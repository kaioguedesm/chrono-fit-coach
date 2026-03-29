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
    { icon: Dumbbell, text: 'Treinos personalizados com IA' },
    { icon: Apple, text: 'Plano alimentar completo' },
    { icon: TrendingUp, text: 'Acompanhamento de evolução' },
    { icon: Rocket, text: 'Projetos de 30/60/90 dias' },
    { icon: Trophy, text: 'Sistema de recompensas e conquistas' },
    { icon: Sparkles, text: 'Análise inteligente de refeições' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-primary/20">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-6 py-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/20 mb-4">
              <Crown className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold text-primary-foreground mb-2">
              Desbloqueie seu plano completo
            </h2>
            <p className="text-primary-foreground/80 text-sm">
              Seu treino está pronto. Falta só um passo para começar! 🚀
            </p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* Benefits */}
          <ul className="space-y-3">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{text}</span>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">+500 pessoas</span> já estão transformando seus corpos
            </p>
          </div>

          {/* Price */}
          <div className="text-center border border-primary/20 rounded-xl p-4 bg-primary/5">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-extrabold text-foreground">R$29</span>
              <span className="text-xl font-bold text-muted-foreground">,90</span>
              <span className="text-sm text-muted-foreground font-medium">/mês</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Menos que o preço de um lanche por semana
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

          <p className="text-[11px] text-muted-foreground text-center">
            Pagamento seguro via Stripe. Cancele a qualquer momento.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
