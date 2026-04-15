import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp } from 'lucide-react';

interface UserLevelCardProps {
  levelLabel: string;
  totalXp: number;
  levelProgress: number;
  nextLevelXp: number;
}

const LEVEL_COLORS: Record<string, string> = {
  Iniciante: 'bg-green-500/10 text-green-600',
  Intermediário: 'bg-blue-500/10 text-blue-600',
  Avançado: 'bg-purple-500/10 text-purple-600',
  Elite: 'bg-yellow-500/10 text-yellow-600',
};

const LEVEL_ICONS: Record<string, string> = {
  Iniciante: '🌱',
  Intermediário: '💪',
  Avançado: '🔥',
  Elite: '⭐',
};

export function UserLevelCard({ levelLabel, totalXp, levelProgress, nextLevelXp }: UserLevelCardProps) {
  const colorClass = LEVEL_COLORS[levelLabel] || LEVEL_COLORS.Iniciante;
  const icon = LEVEL_ICONS[levelLabel] || '🌱';

  return (
    <Card className="overflow-hidden animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <Badge className={colorClass}>{levelLabel}</Badge>
              <p className="text-xs text-muted-foreground mt-1">{totalXp} XP total</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>Próximo: {nextLevelXp} XP</span>
            </div>
          </div>
        </div>
        <Progress value={levelProgress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {Math.round(levelProgress)}% para o próximo nível
        </p>
      </CardContent>
    </Card>
  );
}
