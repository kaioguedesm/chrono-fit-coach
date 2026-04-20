import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { UserLevelCard } from "@/components/dashboard/UserLevelCard";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { StreakCounter } from "@/components/dashboard/StreakCounter";
import { WeeklyMissionsCard } from "@/components/dashboard/WeeklyMissionsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { InsightsCard } from "@/components/dashboard/InsightsCard";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";
import { MeasurementModal } from "@/components/dashboard/MeasurementModal";
import { PhotoUploadModal } from "@/components/dashboard/PhotoUploadModal";
import { RestTimerModal } from "@/components/dashboard/RestTimerModal";
import { ActiveWorkoutSession } from "@/components/workout/ActiveWorkoutSession";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useQuickStartWorkout } from "@/hooks/useQuickStartWorkout";
import { useEngagement } from "@/hooks/useEngagement";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

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
    totalWorkouts,
    totalAchievements,
    levelLabel,
    getLevelProgress,
    getNextLevelXp,
  } = useEngagement();

  const [measureOpen, setMeasureOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    planName: string;
    exercises: any[];
  } | null>(null);

  const userName = profile?.name || user?.user_metadata?.name || 'Atleta';

  const handleQuickAction = async (action: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    switch (action) {
      case 'start-workout': {
        const session = await quickStartWorkout();
        if (session) setActiveSession(session);
        else onNavigateToTab?.('workout');
        break;
      }
      case 'add-measurements':
        setMeasureOpen(true);
        break;
      case 'take-photo':
        setPhotoOpen(true);
        break;
      case 'rest-timer':
        setTimerOpen(true);
        break;
    }
  };

  const handleWorkoutComplete = () => setActiveSession(null);
  const handleWorkoutCancel = async () => {
    if (activeSession) {
      await supabase.from('workout_sessions').delete().eq('id', activeSession.sessionId);
    }
    setActiveSession(null);
  };

  if (activeSession) {
    return (
      <div className="pb-20">
        <Header title="Treino em Andamento" />
        <main className="container mx-auto px-4 pt-20 py-6 space-y-6 max-w-lg">
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
      <Header title="Nex Fit" />

      <main className="container mx-auto px-4 pt-24 py-6 space-y-6 max-w-lg">
        {!user && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Faça login para começar!</h3>
                  <p className="text-xs text-muted-foreground">Sua evolução começa aqui</p>
                </div>
                <Button onClick={() => navigate('/auth')} size="sm">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Entrar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Greeting */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground leading-tight">
            Olá{user ? `, ${userName}` : ''} <span className="inline-block">👋</span>
          </h2>
          <p className="text-base text-muted-foreground">
            Vamos continuar sua jornada fitness hoje?
          </p>
        </div>

        {/* User Level */}
        {user && (
          <UserLevelCard
            levelLabel={levelLabel}
            totalXp={userLevel?.total_xp || 0}
            levelProgress={getLevelProgress()}
            nextLevelXp={getNextLevelXp()}
          />
        )}

        {/* Stats Grid 2x2 */}
        {user && <DashboardStats />}

        {/* Streak */}
        {user && (
          <StreakCounter
            currentStreak={userLevel?.current_streak || 0}
            totalWorkouts={totalWorkouts}
            totalAchievements={totalAchievements}
          />
        )}

        {/* Weekly missions */}
        {user && weeklyMissions && weeklyMissions.length > 0 && (
          <WeeklyMissionsCard missions={weeklyMissions} />
        )}

        {/* Quick actions */}
        <QuickActions onActionClick={handleQuickAction} isStartingWorkout={isStarting} />

        {/* Insights */}
        {user && (
          <InsightsCard
            currentStreak={userLevel?.current_streak || 0}
            todayCheckin={todayCheckin}
            motivationLevel={todayCheckin?.motivation_level}
          />
        )}

        {/* Upgrade */}
        <UpgradePrompt />
      </main>

      <MeasurementModal open={measureOpen} onOpenChange={setMeasureOpen} />
      <PhotoUploadModal open={photoOpen} onOpenChange={setPhotoOpen} />
      <RestTimerModal open={timerOpen} onOpenChange={setTimerOpen} />
    </div>
  );
}
