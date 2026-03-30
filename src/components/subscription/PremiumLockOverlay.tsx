import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PremiumLockOverlayProps {
  onUnlock: () => void;
  message?: string;
}

export function PremiumLockOverlay({ onUnlock, message = "Desbloqueie para acessar" }: PremiumLockOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
      <div className="flex flex-col items-center gap-3 p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">{message}</p>
        <Button size="sm" onClick={onUnlock} className="gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          Desbloquear
        </Button>
      </div>
    </div>
  );
}
