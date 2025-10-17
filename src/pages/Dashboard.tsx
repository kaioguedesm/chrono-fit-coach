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
      
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
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

        <div className="space-y-2 md:space-y-4 w-full">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-relaxed break-words whitespace-normal overflow-visible w-full">
            Olá{user ? ', ' + userName : ''}! 👋
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">Vamos continuar sua jornada fitness hoje?</p>
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
            <CardTitle className="flex items-center gap-2 text-lg md:text-base">
              <Calendar className="w-5 h-5 md:w-4 md:h-4 text-primary" />
              Próximos Treinos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-2">
            {upcomingWorkouts.map((workout, index) => (
              <div key={index} className="flex items-center justify-between p-4 md:p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-4 md:gap-3">
                  <div className="flex flex-col items-center min-w-[70px] md:min-w-[60px]">
                    <span className="text-sm md:text-xs font-medium text-muted-foreground">{workout.day}</span>
                    <div className="flex items-center gap-1 text-sm md:text-xs font-semibold text-foreground">
                      <Clock className="w-4 h-4 md:w-3 md:h-3" />
                      {workout.time}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-base md:text-sm text-foreground">{workout.workout}</p>
                  </div>
                </div>
                <div>
                  {workout.status === "pending" ? (
                    <Badge variant="default" className="text-sm md:text-xs font-medium px-3 md:px-2 py-1">
                      Hoje
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-sm md:text-xs font-medium px-3 md:px-2 py-1">
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