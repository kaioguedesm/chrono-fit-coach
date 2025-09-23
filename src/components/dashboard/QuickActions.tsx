import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Plus, Camera, Timer } from "lucide-react";

const quickActions = [
  {
    title: "Iniciar Treino",
    subtitle: "Treino A - Peito/Tríceps",
    icon: Play,
    action: "start-workout",
    bgGradient: "bg-gradient-to-br from-primary to-primary/70",
    textColor: "text-primary-foreground"
  },
  {
    title: "Registrar Medidas",
    subtitle: "Última: há 7 dias",
    icon: Plus,
    action: "add-measurements",
    bgGradient: "bg-gradient-to-br from-blue-500 to-blue-600",
    textColor: "text-white"
  },
  {
    title: "Foto Progresso",
    subtitle: "Capture sua evolução",
    icon: Camera,
    action: "take-photo",
    bgGradient: "bg-gradient-to-br from-purple-500 to-purple-600",
    textColor: "text-white"
  },
  {
    title: "Timer Descanso",
    subtitle: "Entre séries",
    icon: Timer,
    action: "rest-timer",
    bgGradient: "bg-gradient-to-br from-orange-500 to-orange-600",
    textColor: "text-white"
  },
];

interface QuickActionsProps {
  onActionClick: (action: string) => void;
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Ações Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <Card key={index} className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200">
              <CardContent className="p-0">
                <Button
                  variant="ghost"
                  className={`w-full h-auto p-4 ${action.bgGradient} hover:opacity-90 ${action.textColor} flex flex-col items-center gap-2 rounded-lg border-0`}
                  onClick={() => onActionClick(action.action)}
                >
                  <Icon className="w-6 h-6" />
                  <div className="text-center">
                    <p className="font-semibold text-sm">{action.title}</p>
                    <p className="text-xs opacity-90">{action.subtitle}</p>
                  </div>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}