import { Header } from "@/components/layout/Header";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";

const upcomingWorkouts = [
  {
    day: "Hoje",
    time: "18:00",
    workout: "Treino A - Peito/Tríceps",
    status: "pending"
  },
  {
    day: "Amanhã", 
    time: "07:00",
    workout: "Treino B - Costas/Bíceps",
    status: "scheduled"
  },
  {
    day: "Quinta",
    time: "18:00", 
    workout: "Treino C - Pernas",
    status: "scheduled"
  },
];

interface DashboardProps {
  onActionClick: (action: string) => void;
}

export function Dashboard({ onActionClick }: DashboardProps) {
  return (
    <div className="pb-20">
      <Header title="Meta Fit" />
      
      <main className="container px-4 py-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Olá, João! 👋</h2>
          <p className="text-muted-foreground">Vamos continuar sua jornada fitness hoje?</p>
        </div>

        <DashboardStats />
        
        <QuickActions onActionClick={onActionClick} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Próximos Treinos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingWorkouts.map((workout, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-medium text-muted-foreground">{workout.day}</span>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-3 h-3" />
                      {workout.time}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{workout.workout}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {workout.status === "pending" ? (
                    <Badge variant="default" className="text-xs">
                      Hoje
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Agendado
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}