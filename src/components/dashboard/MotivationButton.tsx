import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HeartCrack, Sparkles, ArrowDown, RefreshCw, Target } from 'lucide-react';

const motivationalMessages = [
  {
    title: 'Todo mundo tem dias difíceis 💙',
    message: 'O importante não é nunca parar — é sempre recomeçar. Você já deu o primeiro passo ao abrir o app.',
    tips: ['Faça um treino leve de 15 min', 'Alongue-se por 10 min', 'Caminhe por 20 min'],
  },
  {
    title: 'Consistência > Perfeição 🔥',
    message: 'Não precisa ser perfeito todo dia. Precisa aparecer. E você está aqui.',
    tips: ['Reduza a intensidade hoje', 'Treine apenas os exercícios favoritos', 'Foque na hidratação'],
  },
  {
    title: 'Você já evoluiu muito! 💪',
    message: 'Compare quem você é hoje com quem era há 30 dias. A evolução é real, mesmo quando não parece.',
    tips: ['Reveja suas fotos de progresso', 'Confira suas conquistas', 'Relembre sua melhor sequência'],
  },
  {
    title: 'Descanse se precisar 🌙',
    message: 'Descanso é parte do treino. Seu corpo precisa recuperar para crescer.',
    tips: ['Faça um dia de recuperação ativa', 'Alongamento e mobilidade', 'Durma bem esta noite'],
  },
];

export function MotivationButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(motivationalMessages[0]);

  const handleClick = () => {
    const random = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    setMessage(random);
    setOpen(true);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleClick}
        className="w-full border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
      >
        <HeartCrack className="w-4 h-4 mr-2" />
        Estou desmotivado
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">{message.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">{message.message}</p>
            
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Sugestões para hoje:
              </p>
              {message.tips.map((tip, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/40 text-sm">
                  <Target className="w-3 h-3 text-primary shrink-0" />
                  {tip}
                </div>
              ))}
            </div>

            <Button onClick={() => setOpen(false)} className="w-full">
              Vou continuar! 💪
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
