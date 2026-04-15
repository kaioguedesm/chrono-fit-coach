import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, AlertCircle, Droplets, Dumbbell } from "lucide-react";

interface InsightsCardProps {
  currentStreak: number;
  todayCheckin: any;
  motivationLevel?: number | null;
}

export function InsightsCard({ currentStreak, todayCheckin, motivationLevel }: InsightsCardProps) {
  const insights = [];

  if (currentStreak >= 7) {
    insights.push({
      icon: TrendingUp,
      text: `Incrível! Você está com ${currentStreak} dias consecutivos! Continue assim! 🔥`,
      color: "text-green-600",
    });
  } else if (currentStreak >= 3) {
    insights.push({
      icon: TrendingUp,
      text: `Boa sequência! ${currentStreak} dias seguidos. Meta: 7 dias!`,
      color: "text-green-600",
    });
  }

  if (!todayCheckin) {
    insights.push({
      icon: AlertCircle,
      text: "Você ainda não fez o check-in de hoje. Registre seu dia!",
      color: "text-blue-600",
    });
  }

  if (todayCheckin && todayCheckin.water_ml < 2000) {
    insights.push({
      icon: Droplets,
      text: "Sua hidratação está abaixo do ideal. Beba mais água! 💧",
      color: "text-blue-600",
    });
  }

  if (motivationLevel && motivationLevel <= 2) {
    insights.push({
      icon: AlertCircle,
      text: "Sua motivação está baixa. Que tal um treino leve para reativar?",
      color: "text-orange-600",
    });
  }

  if (currentStreak === 0) {
    insights.push({
      icon: Dumbbell,
      text: "Comece sua sequência hoje! Faça check-in e ganhe XP.",
      color: "text-primary",
    });
  }

  // Always show a tip
  insights.push({
    icon: Lightbulb,
    text: "Treinar pela manhã pode aumentar seu metabolismo em até 20%",
    color: "text-yellow-600",
  });

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="w-4 h-4 text-primary" />
          Insights para Você
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.slice(0, 3).map((insight, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-all"
          >
            <insight.icon className={`w-5 h-5 mt-0.5 ${insight.color}`} />
            <p className="text-sm text-foreground">{insight.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
