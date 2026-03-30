import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  CheckCircle2,
  CreditCard,
  Loader2,
  LogOut,
} from 'lucide-react';

const benefits = [
  'Treinos personalizados com IA',
  'Planos nutricionais estruturados',
  'Acompanhamento de progresso',
  'Evolução de cargas e medidas',
  'Agenda de treinos',
  'Análise inteligente de refeições',
  'Sistema completo de evolução física',
];

export default function Paywall() {
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (!session?.access_token) {
      navigate('/auth');
      return;
    }

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-primary/20 overflow-hidden shadow-xl bg-card">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-6 py-5 flex items-center gap-3">
          <Crown className="w-6 h-6 text-primary-foreground" />
          <span className="text-lg font-bold text-primary-foreground tracking-wide uppercase">
            Plano NexFit
          </span>
        </div>

        {/* Content */}
        <div className="px-6 py-8 space-y-6">
          {/* Price */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-5xl font-extrabold text-foreground">R$29</span>
              <span className="text-2xl font-bold text-muted-foreground">,90</span>
              <span className="text-base text-muted-foreground ml-1">/mês</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Tenha treino, dieta e acompanhamento completo.
            </p>
          </div>

          {/* Benefits */}
          <ul className="space-y-4 py-2">
            {benefits.map((text) => (
              <li key={text} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{text}</span>
              </li>
            ))}
          </ul>

          {/* Separator + tagline */}
          <div className="border-t border-border pt-4">
            <p className="text-sm text-primary italic text-center">
              Menos que o preço de um lanche por semana.
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full h-14 text-lg font-bold rounded-xl"
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

          {/* Back to login */}
          <button
            onClick={() => navigate('/app')}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Voltar ao app
          </button>
        </div>
      </div>
    </div>
  );
}
