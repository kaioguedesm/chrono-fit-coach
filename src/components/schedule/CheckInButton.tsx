import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CheckInButtonProps {
  scheduleId: string;
  isCompleted: boolean;
  onSuccess: () => void;
}

export function CheckInButton({ scheduleId, isCompleted, onSuccess }: CheckInButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('workout_schedule')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Check-in realizado! ✅",
        description: "Treino marcado como concluído."
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível fazer check-in.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <Button variant="outline" disabled size="sm">
        <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
        Concluído
      </Button>
    );
  }

  return (
    <Button onClick={handleCheckIn} disabled={loading} size="sm">
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Salvando...
        </>
      ) : (
        <>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Check-in
        </>
      )}
    </Button>
  );
}
