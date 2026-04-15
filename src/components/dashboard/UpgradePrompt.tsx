import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, UserCheck, Stethoscope } from 'lucide-react';
import { usePaywall } from '@/hooks/usePaywall';

export function UpgradePrompt() {
  const { isPremium, setPaywallOpen } = usePaywall();

  if (isPremium) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 animate-fade-in">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Evolua mais rápido com acompanhamento</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Com um profissional, você pode evoluir até 3x mais rápido com treinos e dietas personalizados.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="default" className="flex-1 text-xs" onClick={() => setPaywallOpen(true)}>
            <UserCheck className="w-3 h-3 mr-1" />
            Ver Planos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
