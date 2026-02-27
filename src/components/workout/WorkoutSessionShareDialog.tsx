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
    const cardX = (width - cardWidth) / 2;
    const cardY = height * 0.14;
    const paddingX = 56;
    const paddingTop = 48;
    const paddingBottom = 48;
    const rightPadding = 56;

    // Conteúdo textual
    const primaryColor = "#22c55e";
    const textColor = "#e5e7eb";
    const mutedColor = "#9ca3af";

    ctx.textBaseline = "top";

    // Layout base (calculamos o tamanho do card a partir do conteúdo)
    const headerX = cardX + paddingX;
    const headerY = cardY + paddingTop;

    const headerFont = 'bold 44px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const titleFont = 'bold 52px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const titleLineHeight = 58;
    const titleY = headerY + 60;
    const maxTitleWidth = cardWidth - paddingX - rightPadding;

    ctx.font = titleFont;
    const titleLines = wrapTextLines(ctx, session.workout_plan.name, maxTitleWidth, 2);

    const dateFont = '28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const dateY = titleY + titleLines.length * titleLineHeight + 10;

    // Bloco de métricas (menor)
    const metricsY = dateY + 70;
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

    // Marca / logo (logo abaixo do conteúdo)
    const logoSize = 72;
    const logoX = cardX + paddingX;
    const metricsBottomY = metricsY + metricBoxHeight;
    const logoY = metricsBottomY + 40;

    // Altura do card calculada para "abraçar" o conteúdo (remove espaço vazio embaixo)
    const footerTextY = logoY + logoSize + 18;
    const footerLineHeight = 32;
    const cardHeight = footerTextY + footerLineHeight + paddingBottom - cardY;

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

      // Card interno com altura dinâmica (sem espaço vazio)
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      roundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 40);
      ctx.fill();
    }

    // Desenha conteúdo (após o fundo)
    ctx.fillStyle = primaryColor;
    ctx.font = headerFont;
    ctx.fillText("Treino concluído", headerX, headerY);

    ctx.fillStyle = textColor;
    ctx.font = titleFont;
    titleLines.forEach((line, idx) => {
      ctx.fillText(line, headerX, titleY + idx * titleLineHeight);
    });

    ctx.fillStyle = mutedColor;
    ctx.font = dateFont;
    ctx.fillText(format(stats.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), headerX, dateY);

    // Re-desenha métricas por cima (já com o fundo pronto)
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

    const drawFooter = () => {
      // Nome ao lado da logo
      ctx.fillStyle = primaryColor;
      ctx.font = 'bold 40px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText("Nex fit", logoX + logoSize + 24, logoY + logoSize / 2 - 10);

      ctx.fillStyle = mutedColor;
      ctx.font = '28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText("Compartilhado com o app Nex Fit", logoX, footerTextY);
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

    const dateString = format(stats.date, "yyyyMMdd");
    const filename = `treino-${dateString}.png`;

    // iOS/Safari/WebView: "download" pode não funcionar; abre a imagem em outra aba
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);

    if (isIOS) {
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        // Melhor fluxo no iPhone: abrir o share sheet com o arquivo e escolher "Salvar imagem"
        try {
          const file = new File([blob], filename, { type: "image/png" });
          const canShareFiles =
            typeof navigator.share === "function" &&
            (typeof (navigator as any).canShare !== "function" || (navigator as any).canShare({ files: [file] }));

          if (canShareFiles) {
            await navigator.share({
              files: [file],
              title: "Treino",
            });
            toast({
              title: "Salvar no iPhone",
              description: "No menu que abriu, toque em “Salvar imagem” para salvar no Fotos.",
            });
            return;
          }
        } catch {
          // se falhar, cai no fallback abaixo
        }

        // Fallback: abre a imagem em outra tela (o jeito mais compatível)
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
        toast({
          title: "Salvar no iPhone",
          description: "Abri a imagem em outra tela. Toque e segure na imagem e selecione “Salvar em Fotos”.",
        });
      }, "image/png");
      return;
    }

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    toast({
      title: "Imagem salva",
      description: "Agora é só compartilhar pelo Instagram/WhatsApp a partir da galeria.",
    });
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

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];

  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
    } else {
      // Palavra gigantesca: corta para caber
      lines.push(ellipsize(ctx, word, maxWidth));
      current = "";
    }

    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  // Se excedeu, ajusta última linha com reticências
  if (lines.length > maxLines) {
    lines.length = maxLines;
  }

  if (lines.length === maxLines) {
    const joined = words.join(" ");
    const rendered = lines.join(" ");
    if (rendered.length < joined.length) {
      lines[maxLines - 1] = ellipsize(ctx, lines[maxLines - 1], maxWidth);
    } else if (ctx.measureText(lines[maxLines - 1]).width > maxWidth) {
      lines[maxLines - 1] = ellipsize(ctx, lines[maxLines - 1], maxWidth);
    }
  }

  return lines;
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const ellipsis = "…";
  if (ctx.measureText(text).width <= maxWidth) return text;

  let t = text;
  while (t.length > 1 && ctx.measureText(t + ellipsis).width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + ellipsis;
}
