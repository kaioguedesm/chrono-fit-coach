import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Flame, Loader2, X } from "lucide-react";
import { TransformationProject, TransformationCheckin } from "@/hooks/useTransformationProject";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProjectTrackingProps {
  project: TransformationProject;
  checkins: TransformationCheckin[];
  completedDays: number;
  totalDays: number;
  progressPercent: number;
  remainingDays: number;
  checkingIn: boolean;
  onCheckIn: () => void;
  onAbandon: () => void;
}

export function ProjectTracking({
  project,
  checkins,
  completedDays,
  totalDays,
  progressPercent,
  remainingDays,
  checkingIn,
  onCheckIn,
  onAbandon,
}: ProjectTrackingProps) {
  const checkedDaysSet = new Set(checkins.map((c) => c.day_number));
  const nextDay = completedDays + 1;

  // Check if user already checked in today
  const today = new Date().toISOString().split("T")[0];
  const lastCheckin = checkins[checkins.length - 1];
  const alreadyCheckedToday = lastCheckin
    ? new Date(lastCheckin.checked_at).toISOString().split("T")[0] === today
    : false;

  return (
    <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold text-foreground">
          Projeto {totalDays} Dias
        </h1>
        <p className="text-2xl font-bold text-primary">
          Dia {Math.min(nextDay, totalDays)}/{totalDays}
        </p>
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold text-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>✅ {completedDays} concluídos</span>
            <span>📅 {remainingDays} restantes</span>
          </div>
        </CardContent>
      </Card>

      {/* Streak */}
      {project.current_streak > 0 && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Flame className="w-5 h-5 text-chart-5" />
          <span className="font-semibold text-foreground">
            {project.current_streak} {project.current_streak === 1 ? "dia seguido" : "dias seguidos"} 🔥
          </span>
        </div>
      )}

      {/* Check-in Button */}
      <Button
        onClick={onCheckIn}
        disabled={checkingIn || alreadyCheckedToday}
        className="w-full h-14 text-lg font-semibold"
        size="lg"
      >
        {checkingIn ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Registrando...
          </>
        ) : alreadyCheckedToday ? (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Dia concluído! Volte amanhã
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Marcar dia {nextDay} como concluído
          </>
        )}
      </Button>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-3 text-sm">Calendário do Projeto</h3>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: totalDays }, (_, i) => {
              const dayNum = i + 1;
              const isChecked = checkedDaysSet.has(dayNum);
              const isCurrent = dayNum === nextDay && !alreadyCheckedToday;
              const isFuture = dayNum > nextDay || (dayNum === nextDay && alreadyCheckedToday);

              return (
                <div
                  key={dayNum}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all
                    ${isChecked
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  {isChecked ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    dayNum
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-primary">{completedDays}</p>
            <p className="text-[10px] text-muted-foreground">Completos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-foreground">{remainingDays}</p>
            <p className="text-[10px] text-muted-foreground">Restantes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-chart-5">{project.max_streak}</p>
            <p className="text-[10px] text-muted-foreground">Melhor Sequência</p>
          </CardContent>
        </Card>
      </div>

      {/* Abandon */}
      <div className="text-center pt-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
              <X className="w-3 h-3 mr-1" />
              Encerrar projeto
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Encerrar projeto?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja encerrar este projeto? Seu progresso será salvo, mas o projeto será marcado como abandonado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onAbandon}>Encerrar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
