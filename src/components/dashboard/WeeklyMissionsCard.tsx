import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle2 } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  completed: boolean;
  reward_badge: string | null;
}

interface WeeklyMissionsCardProps {
  missions: Mission[];
}

export function WeeklyMissionsCard({ missions }: WeeklyMissionsCardProps) {
  const completed = missions.filter(m => m.completed).length;

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Missões da Semana
          </div>
          <Badge variant="outline" className="text-xs">
            {completed}/{missions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {missions.map(mission => {
          const progress = Math.min(100, (mission.current_value / mission.target_value) * 100);
          return (
            <div key={mission.id} className={`p-3 rounded-lg border transition-all ${mission.completed ? 'bg-primary/5 border-primary/20' : 'bg-muted/40'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {mission.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <span className="text-sm">{mission.reward_badge}</span>
                  )}
                  <span className="text-sm font-medium">{mission.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {mission.current_value}/{mission.target_value}
                </span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          );
        })}
        {missions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Carregando missões...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
