import { Card, CardContent } from "@/components/ui/card";
import { Play, Plus, Camera, Timer } from "lucide-react";

const quickActions = [
  {
    title: "Iniciar Treino",
    subtitle: "Treino A - Peito/Tríceps",
    icon: Play,
    action: "start-workout",
    color: "primary"
  },
  {
    title: "Registrar Medidas",
    subtitle: "Última: há 7 dias",
    icon: Plus,
    action: "add-measurements",
    color: "secondary"
  },
  {
    title: "Foto Progresso",
    subtitle: "Capture sua evolução",
    icon: Camera,
    action: "take-photo",
    color: "accent"
  },
  {
    title: "Timer Descanso",
    subtitle: "Entre séries",
    icon: Timer,
    action: "rest-timer",
    color: "chart-4"
  },
];

interface QuickActionsProps {
  onActionClick: (action: string) => void;
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  return (
    <div className="space-y-5 md:space-y-4">
      <h3 className="text-lg md:text-base font-semibold text-foreground">
        Ações Rápidas
      </h3>
      <div className="grid grid-cols-2 gap-4 md:gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <Card
              key={index}
              onClick={() => onActionClick(action.action)}
              className="cursor-pointer hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group"
            >
              <CardContent className="p-5 md:p-4 flex flex-col items-start gap-4 md:gap-3">
                <div className="w-12 h-12 md:w-11 md:h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-6 h-6 md:w-5 md:h-5 text-primary" strokeWidth={2} />
                </div>
                <div className="space-y-1 md:space-y-0.5">
                  <p className="font-semibold text-base md:text-sm text-foreground leading-tight">{action.title}</p>
                  <p className="text-sm md:text-xs text-muted-foreground">{action.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
