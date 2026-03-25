import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, PartyPopper, RotateCcw } from "lucide-react";
import { TransformationProject } from "@/hooks/useTransformationProject";

interface ProjectCompletionProps {
  project: TransformationProject;
  completedDays: number;
  onStartNew: () => void;
}

export function ProjectCompletion({ project, completedDays, onStartNew }: ProjectCompletionProps) {
  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto text-center">
      {/* Celebration */}
      <div className="space-y-3 py-6">
        <div className="flex items-center justify-center gap-2 text-4xl">
          <PartyPopper className="w-10 h-10 text-chart-4" />
          <Trophy className="w-12 h-12 text-primary" />
          <PartyPopper className="w-10 h-10 text-chart-4" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          🎉 Parabéns!
        </h1>
        <p className="text-lg text-muted-foreground">
          Você concluiu o <span className="text-primary font-semibold">Projeto {project.duration_days} Dias</span>!
        </p>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-primary">{completedDays}</p>
              <p className="text-xs text-muted-foreground">Dias completados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-chart-5">{project.max_streak}</p>
              <p className="text-xs text-muted-foreground">Melhor sequência 🔥</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motivational Message */}
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-foreground leading-relaxed">
            Você provou que é capaz de manter a consistência e superar desafios.
            Cada dia marcado foi uma vitória. Sua transformação é real! 💪
          </p>
        </CardContent>
      </Card>

      {/* Start New */}
      <Button onClick={onStartNew} size="lg" className="w-full h-12">
        <RotateCcw className="w-4 h-4 mr-2" />
        Iniciar novo projeto
      </Button>
    </div>
  );
}
