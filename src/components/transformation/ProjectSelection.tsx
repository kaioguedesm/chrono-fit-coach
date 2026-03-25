import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Target, Trophy, Zap } from "lucide-react";

interface ProjectOption {
  days: number;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const projects: ProjectOption[] = [
  {
    days: 30,
    title: "Projeto 30 Dias",
    description: "Transforme seu corpo em 30 dias com consistência e foco. Ideal para iniciantes.",
    icon: Zap,
    color: "text-chart-4",
  },
  {
    days: 45,
    title: "Projeto 45 Dias",
    description: "Um desafio intermediário para quem já tem disciplina e quer ir além.",
    icon: Flame,
    color: "text-chart-5",
  },
  {
    days: 60,
    title: "Projeto 60 Dias",
    description: "Dois meses de dedicação para resultados visíveis e duradouros.",
    icon: Target,
    color: "text-primary",
  },
  {
    days: 90,
    title: "Projeto 90 Dias",
    description: "O desafio definitivo. 3 meses de transformação completa. Para guerreiros!",
    icon: Trophy,
    color: "text-destructive",
  },
];

interface ProjectSelectionProps {
  onSelectProject: (days: number) => void;
}

export function ProjectSelection({ onSelectProject }: ProjectSelectionProps) {
  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">🏋️ Escolha seu Projeto</h1>
        <p className="text-muted-foreground text-sm">
          Selecione a duração do seu projeto de transformação e comece sua jornada!
        </p>
      </div>

      <div className="space-y-3">
        {projects.map((project) => {
          const Icon = project.icon;
          return (
            <Card
              key={project.days}
              className="cursor-pointer hover:border-primary/50 transition-all duration-200 active:scale-[0.98]"
              onClick={() => onSelectProject(project.days)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-muted ${project.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{project.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {project.description}
                  </p>
                </div>
                <Button size="sm" variant="default" className="shrink-0">
                  Iniciar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          💡 Dica: comece com 30 dias e vá aumentando conforme sua evolução!
        </p>
      </div>
    </div>
  );
}
