import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { WorkoutSession } from "./WorkoutHistory";

interface WorkoutSessionShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: WorkoutSession;
}

type ShareTemplate = "card" | "overlay";

export function WorkoutSessionShareDialog({ open, onOpenChange, session }: WorkoutSessionShareDialogProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [template, setTemplate] = useState<ShareTemplate>("card");

  const stats = useMemo(() => {
    const totalExercises = session.exercise_sessions.length;
    const totalSets = session.exercise_sessions.reduce((acc, ex) => acc + (ex.sets_completed || 0), 0);

    const weights = session.exercise_sessions
      .map((ex) => ex.weight_used)
      .filter((w): w is number => typeof w === "number");

    const avgWeight = weights.length > 0 ? Math.round(weights.reduce((a, b) => a + b, 0) / weights.length) : null;

    const completedAt = session.completed_at || session.started_at;
    const date = completedAt ? new Date(completedAt) : new Date();

    return {
      totalExercises,
      totalSets,
      avgWeight,
      date,
    };
  }, [session]);

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Dimensões do card interno (bem menor que o canvas)
    const cardWidth = width * 0.78;
    const cardHeight = height * 0.6;
    const cardX = (width - cardWidth) / 2;
    const cardY = height * 0.14;

    // Limpa tudo (transparente)
    ctx.clearRect(0, 0, width, height);

    if (template === "card") {
      // Fundo em gradiente ocupando o canvas inteiro
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0f172a"); // slate-900
      gradient.addColorStop(0.4, "#1e293b"); // slate-800
      gradient.addColorStop(1, "#22c55e"); // green-500
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Card interno bem menor
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      roundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 40);
      ctx.fill();
    }

    // Conteúdo textual (mais compacto)
    const primaryColor = "#22c55e";
    const textColor = "#e5e7eb";
    const mutedColor = "#9ca3af";

    ctx.textBaseline = "top";

    // Cabeçalho (posicionado dentro do card menor)
    const headerX = cardX + 56;
    const headerY = cardY + 48;

    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 44px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText("Treino concluído", headerX, headerY);

    ctx.fillStyle = textColor;
    ctx.font = 'bold 52px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(session.workout_plan.name, headerX, headerY + 60);

    ctx.fillStyle = mutedColor;
    ctx.font = '28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(format(stats.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), headerX, headerY + 120);

    // Bloco de métricas (menor)
    const metricsY = headerY + 200;
    const metricBoxWidth = 220;
    const metricBoxHeight = 150;
    const metricRadius = 24;
    const gap = 32;
    const startX = headerX;

    const metrics: Array<{ label: string; value: string }> = [
      {
        label: "Duração",
        value: session.duration_minutes ? `${session.duration_minutes} min` : "--",
      },
      {
        label: "Exercícios",
        value: `${stats.totalExercises}`,
      },
      {
        label: "Séries",
        value: `${stats.totalSets}`,
      },
    ];

    if (stats.avgWeight !== null) {
      metrics.push({
        label: "Peso médio",
        value: `${stats.avgWeight} kg`,
      });
    }

    metrics.slice(0, 3).forEach((metric, index) => {
      const x = startX + index * (metricBoxWidth + gap);
      roundedRect(ctx, x, metricsY, metricBoxWidth, metricBoxHeight, metricRadius);
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.fill();

      ctx.fillStyle = mutedColor;
      ctx.font = '24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(metric.label, x + 20, metricsY + 22);

      ctx.fillStyle = "#f9fafb";
      ctx.font = 'bold 36px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(metric.value, x + 20, metricsY + 70);
    });

    // Marca / logo no rodapé usando a logo Nex Fit
    const logoSize = 72;
    const logoX = cardX + 56;
    const logoY = cardY + cardHeight - 140;

    const drawFooter = () => {
      // Nome ao lado da logo
      ctx.fillStyle = primaryColor;
      ctx.font = 'bold 40px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText("Nex fit", logoX + logoSize + 24, logoY + logoSize / 2 - 10);

      ctx.fillStyle = mutedColor;
      ctx.font = '28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText("Compartilhado com o app Nex Fit", logoX, logoY + logoSize + 32);
    };

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
        drawFooter();
      };
      img.onerror = () => {
        drawFooter();
      };
      img.src = "/nexfit-icon-192.png";
    } catch {
      drawFooter();
    }
  }, [session, stats, template]);

  useEffect(() => {
    if (!open) return;
    drawImage();
  }, [open, drawImage]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    const dateString = format(stats.date, "yyyyMMdd");
    link.download = `treino-${dateString}.png`;
    link.click();
  };

  const handleCopyImage = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));

      if (!blob || !navigator.clipboard || !(window as any).ClipboardItem) {
        throw new Error("Clipboard API não suportada");
      }

      const item = new (window as any).ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);

      toast({
        title: "Imagem copiada",
        description: "Agora é só colar no Instagram ou em outro app.",
      });
    } catch {
      toast({
        title: "Não foi possível copiar a imagem",
        description: "Mas você ainda pode salvar o arquivo e enviar manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleCanvasRef = (node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
    if (node && open) {
      drawImage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-h-[calc(90vh-env(safe-area-inset-bottom))]">
        <DialogHeader>
          <DialogTitle>Compartilhar treino</DialogTitle>
          <DialogDescription>
            Gere uma imagem em estilo Strava para compartilhar seu treino nas redes sociais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{session.workout_plan.name}</p>
              <p className="text-sm text-muted-foreground">
                {format(stats.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} •{" "}
                {session.duration_minutes ? `${session.duration_minutes} min` : "Duração não registrada"}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={template === "card" ? "default" : "outline"}
                onClick={() => setTemplate("card")}
              >
                Card completo
              </Button>
              <Button
                size="sm"
                variant={template === "overlay" ? "default" : "outline"}
                onClick={() => setTemplate("overlay")}
              >
                Sobreposição transparente
              </Button>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 flex flex-col items-center gap-4">
            <canvas
              ref={handleCanvasRef}
              className="w-full max-w-[360px] rounded-xl shadow-lg"
              width={1080}
              height={1920}
            />
            <p className="text-xs text-muted-foreground text-center">
              Essa é a pré-visualização da imagem que será salva/compartilhada. O formato é otimizado para Stories do
              Instagram.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {stats.totalExercises} exercício{stats.totalExercises !== 1 && "s"}
              </Badge>
              <Badge variant="outline">
                {stats.totalSets} série{stats.totalSets !== 1 && "s"}
              </Badge>
              {stats.avgWeight !== null && <Badge variant="outline">Peso médio {stats.avgWeight} kg</Badge>}
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleCopyImage}>
                Copiar imagem
              </Button>
              <Button size="sm" onClick={handleDownload}>
                Salvar imagem
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
