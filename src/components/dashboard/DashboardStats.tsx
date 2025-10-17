import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Target, Flame, TrendingUp } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

export function DashboardStats() {
  const { profile, calculateIMC } = useProfile();

  const imc = calculateIMC();
  const currentWeight = profile?.weight || 0;
  const goalWeight = profile?.goal === 'emagrecimento' ? currentWeight - 5 : 
                     profile?.goal === 'hipertrofia' ? currentWeight + 3 : 
                     currentWeight;

  const stats = [
    {
      title: "Treinos esta semana",
      value: "4",
      target: "6",
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
      percentage: (4/6) * 100
    },
    {
      title: "Peso atual",
      value: currentWeight > 0 ? `${currentWeight}kg` : "--",
      target: goalWeight > 0 ? `${goalWeight}kg` : "--",
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      percentage: goalWeight > 0 ? (currentWeight/goalWeight) * 100 : 0
    },
    {
      title: "IMC",
      value: imc || "--",
      target: "24.9",
      icon: Flame,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      percentage: imc ? (parseFloat(imc) / 24.9) * 100 : 0
    },
    {
      title: "Progresso mensal",
      value: "85%",
      target: "100%",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      percentage: 85
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="pb-3 md:pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 md:p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 md:w-4 md:h-4 ${stat.color}`} />
                </div>
                <span className="text-sm md:text-xs text-muted-foreground">/{stat.target}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 md:space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-3xl md:text-2xl font-bold">{stat.value}</span>
                </div>
                <p className="text-sm md:text-xs text-muted-foreground line-clamp-2">{stat.title}</p>
                <div className="w-full bg-muted rounded-full h-2 md:h-1.5">
                  <div 
                    className="bg-primary h-2 md:h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}