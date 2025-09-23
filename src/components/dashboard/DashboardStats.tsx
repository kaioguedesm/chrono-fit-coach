import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Target, Flame, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Treinos esta semana",
    value: "4",
    target: "6",
    icon: Activity,
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    title: "Meta de peso",
    value: "72kg",
    target: "75kg",
    icon: Target,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    title: "Calorias queimadas",
    value: "1,240",
    target: "1,500",
    icon: Flame,
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  {
    title: "Progresso mensal",
    value: "85%",
    target: "100%",
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const percentage = stat.value === "85%" ? 85 : 
          stat.title === "Treinos esta semana" ? (4/6) * 100 :
          stat.title === "Meta de peso" ? (72/75) * 100 :
          (1240/1500) * 100;
        
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className="text-xs text-muted-foreground">/{stat.target}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{stat.title}</p>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(percentage, 100)}%` }}
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