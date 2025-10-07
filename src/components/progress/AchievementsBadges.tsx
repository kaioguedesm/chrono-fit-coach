import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Target, Calendar, Award, Star, Zap, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Achievement {
  id: string;
  achievement_type: string;
  title: string;
  description: string | null;
  icon: string;
  earned_at: string;
  metadata: any;
}

const ACHIEVEMENT_ICONS: Record<string, any> = {
  trophy: Trophy,
  flame: Flame,
  target: Target,
  calendar: Calendar,
  award: Award,
  star: Star,
  zap: Zap,
  trending: TrendingUp,
};

const ACHIEVEMENT_COLORS: Record<string, string> = {
  streak_7: 'hsl(var(--primary))',
  streak_30: 'hsl(var(--chart-2))',
  streak_90: 'hsl(var(--chart-3))',
  first_workout: 'hsl(var(--chart-4))',
  weight_goal: 'hsl(var(--chart-1))',
  measurements_10: 'hsl(var(--chart-5))',
  photos_5: 'hsl(var(--primary))',
};

export function AchievementsBadges() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAchievements();
      checkAndAwardAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (data) {
        setAchievements(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkAndAwardAchievements = async () => {
    if (!user) return;

    // Check for workout streak achievements
    const { data: workouts } = await supabase
      .from('workout_sessions')
      .select('completed_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(90);

    if (workouts && workouts.length >= 7) {
      await awardAchievement('streak_7', 'Sequência de 7 Dias! 🔥', 'Você treinou 7 dias seguidos!', 'flame');
    }
    if (workouts && workouts.length >= 30) {
      await awardAchievement('streak_30', 'Mestre da Consistência! 💪', '30 dias de treino consecutivos!', 'award');
    }

    // Check first workout
    if (workouts && workouts.length === 1) {
      await awardAchievement('first_workout', 'Primeiro Treino! 🎯', 'Você completou seu primeiro treino!', 'target');
    }

    // Check measurements
    const { data: measurements } = await supabase
      .from('body_measurements')
      .select('id')
      .eq('user_id', user.id);

    if (measurements && measurements.length >= 10) {
      await awardAchievement('measurements_10', 'Rastreador Dedicado! 📊', '10 medições corporais registradas!', 'trending');
    }

    // Check photos
    const { data: photos } = await supabase
      .from('progress_photos')
      .select('id')
      .eq('user_id', user.id);

    if (photos && photos.length >= 5) {
      await awardAchievement('photos_5', 'Fotógrafo do Progresso! 📸', '5 fotos de progresso enviadas!', 'star');
    }
  };

  const awardAchievement = async (
    type: string,
    title: string,
    description: string,
    icon: string
  ) => {
    if (!user) return;

    // Check if already awarded
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('achievement_type', type)
      .single();

    if (!existing) {
      await supabase.from('user_achievements').insert({
        user_id: user.id,
        achievement_type: type,
        title,
        description,
        icon,
      });
      fetchAchievements();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Carregando conquistas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Suas Conquistas
        </CardTitle>
        <CardDescription>
          {achievements.length} {achievements.length === 1 ? 'conquista desbloqueada' : 'conquistas desbloqueadas'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {achievements.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Continue treinando para desbloquear conquistas!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement) => {
              const IconComponent = ACHIEVEMENT_ICONS[achievement.icon] || Trophy;
              const color = ACHIEVEMENT_COLORS[achievement.achievement_type] || 'hsl(var(--primary))';
              
              return (
                <div
                  key={achievement.id}
                  className="group relative p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-200 hover:scale-105 hover:shadow-lg animate-fade-in"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-3 rounded-full"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <IconComponent
                        className="w-6 h-6"
                        style={{ color }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">
                        {achievement.title}
                      </h3>
                      {achievement.description && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(achievement.earned_at), "dd 'de' MMM", { locale: ptBR })}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
