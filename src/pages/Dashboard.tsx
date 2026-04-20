import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { TodayWorkoutCard } from "@/components/dashboard/TodayWorkoutCard";
import { AntiStagnationCard } from "@/components/dashboard/AntiStagnationCard";
import { StreakCounter } from "@/components/dashboard/StreakCounter";
import { InsightsCard } from "@/components/dashboard/InsightsCard";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";
import { UserLevelCard } from "@/components/dashboard/UserLevelCard";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ActiveWorkoutSession } from "@/components/workout/ActiveWorkoutSession";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useQuickStartWorkout } from "@/hooks/useQuickStartWorkout";
import { useEngagement } from "@/hooks/useEngagement";
import { useAntiStagnation } from "@/hooks/useAntiStagnation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, Loader2 } from "lucide-react";

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
    totalWorkouts,
    totalAchievements,
    levelLabel,
    getLevelProgress,
    getNextLevelXp,
  } = useEngagement();
  const antiStagnation = useAntiStagnation();

  const [nextPlan, setNextPlan] = useState<{ name: string; exerciseCount: number; id: string } | null>(null);
  const [hasPlans, setHasPlans] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    planName: string;
    exercises: any[];
  } | null>(null);

  const userName = profile?.name || user?.user_metadata?.name || 'Atleta';

  // Load next workout plan
  useEffect(() => {
    if (!user) {
      setLoadingPlan(false);
      return;
    }
    
    const loadNextPlan = async () => {
      try {
        const { data: plans } = await supabase
          .from('workout_plans')
          .select('id, name, exercises(id)')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (plans && plans.length > 0) {
          setNextPlan({
            name: plans[0].name,
            exerciseCount: plans[0].exercises?.length || 0,
            id: plans[0].id,
          });
          setHasPlans(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPlan(false);
      }
    };
    loadNextPlan();
  }, [user]);

  const handleStartWorkout = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    const session = await quickStartWorkout();
    if (session) {
      setActiveSession(session);
    } else if (!hasPlans) {
      onNavigateToTab?.('workout');
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

      <main className="container mx-auto px-4 pt-24 py-6 space-y-5 max-w-lg">
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

        {/* Greeting - compact */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">
            Olá{user ? `, ${userName}` : ''} 👋
          </h2>
          <p className="text-sm text-muted-foreground">
            {antiStagnation.loading
              ? 'Analisando sua evolução...'
              : antiStagnation.overallStatus === 'progressing'
                ? 'Você está evoluindo. Continue assim!'
                : antiStagnation.overallStatus === 'stagnated'
                  ? 'Ajustes sugeridos para retomar sua evolução'
                  : 'Vamos treinar hoje?'}
          </p>
        </div>

        {/* Streak - compact */}
        {user && (
          <StreakCounter
            currentStreak={userLevel?.current_streak || 0}
            totalWorkouts={totalWorkouts}
            totalAchievements={totalAchievements}
          />
        )}

        {/* TODAY'S WORKOUT - Main CTA */}
        {loadingPlan ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <TodayWorkoutCard
            planName={nextPlan?.name || null}
            exerciseCount={nextPlan?.exerciseCount || 0}
            isStarting={isStarting}
            onStart={handleStartWorkout}
            hasPlans={hasPlans}
            onCreatePlan={() => onNavigateToTab?.('workout')}
          />
        )}

        {/* Anti-Stagnation System */}
        {user && !antiStagnation.loading && antiStagnation.overallStatus !== 'new' && (
          <AntiStagnationCard
            overallStatus={antiStagnation.overallStatus}
            message={antiStagnation.message}
            exerciseProgress={antiStagnation.exerciseProgress}
            averageFrequency={antiStagnation.averageFrequency}
            totalSessions={antiStagnation.totalSessionsLast30Days}
          />
        )}

        {/* Smart Insight */}
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
    </div>
  );
}
