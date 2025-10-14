import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { MeasurementModal } from "@/components/dashboard/MeasurementModal";
import { RestTimerModal } from "@/components/dashboard/RestTimerModal";
import { PhotoUploadModal } from "@/components/dashboard/PhotoUploadModal";
import { WorkoutStartModal } from "@/components/dashboard/WorkoutStartModal";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { StreakCounter } from "@/components/dashboard/StreakCounter";
import { InsightsCard } from "@/components/dashboard/InsightsCard";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

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
  onActionClick?: (action: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export function Dashboard({ onActionClick, onNavigateToTab }: DashboardProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);

  const userName = profile?.name || user?.user_metadata?.name || 'Atleta';

  const handleActionClick = (action: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    switch (action) {
      case 'start-workout':
        setWorkoutModalOpen(true);
        break;
      case 'add-measurements':
        setMeasurementModalOpen(true);
        break;
      case 'take-photo':
        setPhotoModalOpen(true);
        break;
      case 'rest-timer':
        setTimerModalOpen(true);
        break;
      default:
        break;
    }

    onActionClick?.(action);
  };

  return (
    <div className="pb-20">
      <OnboardingTour />
      <Header title="Meta Fit" />
      
      <main className="container px-4 py-6 space-y-6">
        {!user && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Faça login para acessar todos os recursos!</h3>
                  <p className="text-xs text-muted-foreground">
                    Crie sua conta e personalize seu treino
                  </p>
                </div>
                <Button onClick={() => navigate('/auth')} size="sm">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Entrar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-1.5 animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground">
            Olá{user ? ', ' + userName : ''}! 👋
          </h2>
          <p className="text-sm text-muted-foreground">Vamos continuar sua jornada fitness hoje?</p>
        </div>

        <DashboardStats />
        
        <StreakCounter />
        
        <QuickActions onActionClick={handleActionClick} />

        <ProgressChart />
        
        <InsightsCard />

        <MeasurementModal 
          open={measurementModalOpen} 
          onOpenChange={setMeasurementModalOpen} 
        />
        
        <RestTimerModal 
          open={timerModalOpen} 
          onOpenChange={setTimerModalOpen} 
        />
        
        <PhotoUploadModal 
          open={photoModalOpen} 
          onOpenChange={setPhotoModalOpen} 
        />
        
        <WorkoutStartModal 
          open={workoutModalOpen} 
          onOpenChange={setWorkoutModalOpen}
          onNavigateToSchedule={() => {
            setWorkoutModalOpen(false);
            onNavigateToTab?.('schedule');
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-primary" />
              Próximos Treinos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingWorkouts.map((workout, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center min-w-[60px]">
                    <span className="text-xs font-medium text-muted-foreground">{workout.day}</span>
                    <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                      <Clock className="w-3 h-3" />
                      {workout.time}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{workout.workout}</p>
                  </div>
                </div>
                <div>
                  {workout.status === "pending" ? (
                    <Badge variant="default" className="text-xs font-medium">
                      Hoje
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs font-medium">
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