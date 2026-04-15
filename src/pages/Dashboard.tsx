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
import { UserLevelCard } from "@/components/dashboard/UserLevelCard";
import { WeeklyMissionsCard } from "@/components/dashboard/WeeklyMissionsCard";
import { DailyCheckinModal } from "@/components/dashboard/DailyCheckinModal";
import { MotivationButton } from "@/components/dashboard/MotivationButton";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { ActiveWorkoutSession } from "@/components/workout/ActiveWorkoutSession";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useQuickStartWorkout } from "@/hooks/useQuickStartWorkout";
import { useEngagement } from "@/hooks/useEngagement";

interface DashboardProps {
  onNavigateToTab?: (tab: string) => void;
}

export function Dashboard({ onNavigateToTab }: DashboardProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { quickStartWorkout, isStarting } = useQuickStartWorkout();
  const {
    todayCheckin,
    userLevel,
    weeklyMissions,
    submitCheckin,
    totalWorkouts,
    totalAchievements,
    getLevelProgress,
    getNextLevelXp,
    levelLabel,
  } = useEngagement();
  
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    planName: string;
    exercises: any[];
  } | null>(null);

  const userName = profile?.name || user?.user_metadata?.name || 'Atleta';

  const handleActionClick = async (action: string) => {
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
  };

  const handleWorkoutComplete = () => setActiveSession(null);

  const handleWorkoutCancel = async () => {
    if (activeSession) {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.from('workout_sessions').delete().eq('id', activeSession.sessionId);
    }
    setActiveSession(null);
  };

  if (activeSession) {
    return (
      <div className="pb-20">
        <Header title="Treino em Andamento" />
        <main className="container mx-auto px-4 pt-20 py-6 space-y-6 max-w-7xl">
          <ActiveWorkoutSession
            sessionId={activeSession.sessionId}
            planName={activeSession.planName}
            exercises={activeSession.exercises}
            onComplete={handleWorkoutComplete}
            onCancel={handleWorkoutCancel}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <OnboardingTour />
      <Header title="Nex Fit" />
      
      <main className="container mx-auto px-4 pt-28 py-8 space-y-6 max-w-7xl">
        {!user && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Faça login para acessar todos os recursos!</h3>
                  <p className="text-xs text-muted-foreground">Crie sua conta e personalize seu treino</p>
                </div>
                <Button onClick={() => navigate('/auth')} size="sm">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Entrar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3 w-full pt-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-relaxed break-words whitespace-normal overflow-visible w-full">
            Olá{user ? ', ' + userName : ''}! 👋
          </h2>
          <p className="text-base text-muted-foreground">Vamos continuar sua jornada fitness hoje?</p>
        </div>

        {/* Nível do Usuário */}
        {user && userLevel && (
          <UserLevelCard
            levelLabel={levelLabel}
            totalXp={userLevel.total_xp}
            levelProgress={getLevelProgress()}
            nextLevelXp={getNextLevelXp()}
          />
        )}

        <DashboardStats />
        
        <StreakCounter
          currentStreak={userLevel?.current_streak || 0}
          totalWorkouts={totalWorkouts}
          totalAchievements={totalAchievements}
        />

        {/* Check-in diário */}
        {user && (
          <Button
            onClick={() => setCheckinModalOpen(true)}
            className="w-full"
            variant={todayCheckin ? "outline" : "default"}
            size="lg"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {todayCheckin ? '✅ Check-in feito! Editar' : 'Fazer Check-in Diário'}
          </Button>
        )}
        
        <QuickActions onActionClick={handleActionClick} isStartingWorkout={isStarting} />

        {/* Missões Semanais */}
        {user && weeklyMissions.length > 0 && (
          <WeeklyMissionsCard missions={weeklyMissions} />
        )}

        <ProgressChart />
        
        <InsightsCard
          currentStreak={userLevel?.current_streak || 0}
          todayCheckin={todayCheckin}
          motivationLevel={todayCheckin?.motivation_level}
        />

        {/* Botão de motivação */}
        {user && <MotivationButton />}

        {/* Upgrade prompt */}
        <UpgradePrompt />

        <DailyCheckinModal
          open={checkinModalOpen}
          onOpenChange={setCheckinModalOpen}
          onSubmit={submitCheckin}
          existingCheckin={todayCheckin}
        />

        <MeasurementModal open={measurementModalOpen} onOpenChange={setMeasurementModalOpen} />
        <RestTimerModal open={timerModalOpen} onOpenChange={setTimerModalOpen} />
        <PhotoUploadModal open={photoModalOpen} onOpenChange={setPhotoModalOpen} />
        
        <WorkoutStartModal 
          open={workoutModalOpen} 
          onOpenChange={setWorkoutModalOpen}
          onWorkoutStarted={setActiveSession}
          onNavigateToSchedule={() => { setWorkoutModalOpen(false); onNavigateToTab?.('schedule'); }}
          onNavigateToWorkout={() => { setWorkoutModalOpen(false); onNavigateToTab?.('workout'); }}
        />
      </main>
    </div>
  );
}
