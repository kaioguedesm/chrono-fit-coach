import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const insights = [
  {
    type: "success",
    icon: TrendingUp,
    text: "Você está 15% acima da meta semanal de treinos!",
    color: "text-green-600"
  },
  {
    type: "tip",
    icon: Lightbulb,
    text: "Treinar pela manhã pode aumentar seu metabolismo em até 20%",
    color: "text-yellow-600"
  },
  {
    type: "reminder",
    icon: AlertCircle,
    text: "Não esqueça de registrar suas medidas esta semana",
    color: "text-blue-600"
  }
];

export function InsightsCard() {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="w-4 h-4 text-primary" />
          Insights para Você
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-all hover-scale"
          >
            <insight.icon className={`w-5 h-5 mt-0.5 ${insight.color}`} />
            <div className="flex-1">
              <p className="text-sm text-foreground">{insight.text}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
