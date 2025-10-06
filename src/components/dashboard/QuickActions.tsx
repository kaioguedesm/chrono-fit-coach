import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Plus, Camera, Timer } from "lucide-react";

const quickActions = [
  {
    title: "Iniciar Treino",
    subtitle: "Treino A - Peito/Tríceps",
    icon: Play,
    action: "start-workout",
    gradient: "from-primary via-primary/90 to-primary/70",
    iconBg: "bg-primary-foreground/20"
  },
  {
    title: "Registrar Medidas",
    subtitle: "Última: há 7 dias",
    icon: Plus,
    action: "add-measurements",
    gradient: "from-secondary via-secondary/90 to-secondary/70",
    iconBg: "bg-secondary-foreground/20"
  },
  {
    title: "Foto Progresso",
    subtitle: "Capture sua evolução",
    icon: Camera,
    action: "take-photo",
    gradient: "from-accent via-accent/90 to-accent/70",
    iconBg: "bg-accent-foreground/20"
  },
  {
    title: "Timer Descanso",
    subtitle: "Entre séries",
    icon: Timer,
    action: "rest-timer",
    gradient: "from-chart-4 via-chart-4/90 to-chart-4/70",
    iconBg: "bg-white/20"
  },
];

interface QuickActionsProps {
  onActionClick: (action: string) => void;
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Ações Rápidas
        </h3>
        <div className="h-1 flex-1 bg-gradient-to-r from-primary/30 via-secondary/30 to-transparent rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <div
              key={index}
              onClick={() => onActionClick(action.action)}
              className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <CardContent className="relative p-5 flex flex-col items-center gap-3 text-white">
                <div className={`w-14 h-14 ${action.iconBg} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-sm leading-tight">{action.title}</p>
                  <p className="text-xs opacity-90 font-medium">{action.subtitle}</p>
                </div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-white/40 rounded-full group-hover:scale-150 transition-transform" />
                <div className="absolute bottom-2 left-2 w-3 h-3 bg-white/30 rounded-full group-hover:scale-150 transition-transform" />
              </CardContent>
            </div>
          );
        })}
      </div>
    </div>
  );
}