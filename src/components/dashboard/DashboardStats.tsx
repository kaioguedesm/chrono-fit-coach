import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Target, Flame, TrendingUp } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { dashboardService, DashboardData } from "@/services/dashboardService";

export function DashboardStats() {
  const { profile, calculateIMC } = useProfile();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    weeklyCount: 0,
    weeklyTarget: 4,
    progress: 0
  });
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      
      // Subscrever a atualizações em tempo real
      const unsubscribe = dashboardService.subscribe((data) => {
        setIsAnimating(true);
        setDashboardData(data);
        setTimeout(() => setIsAnimating(false), 600);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    const data = await dashboardService.fetchDashboardData(user.id);
    setDashboardData(data);
  };

  const imc = calculateIMC();
  const currentWeight = profile?.weight || 0;
  const goalWeight = profile?.goal === 'emagrecimento' ? currentWeight - 5 : 
                     profile?.goal === 'hipertrofia' ? currentWeight + 3 : 
                     currentWeight;

  const stats = [
    {
      title: "Treinos esta semana",
      value: dashboardData.weeklyCount.toString(),
      target: dashboardData.weeklyTarget.toString(),
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
      percentage: dashboardData.progress,
      animate: true
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
      title: "Progresso semanal",
      value: `${dashboardData.progress}%`,
      target: "100%",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      percentage: dashboardData.progress,
      animate: true
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const shouldAnimate = isAnimating && stat.animate;
        
        return (
          <Card 
            key={index} 
            className={`relative overflow-hidden transition-all duration-300 ${
              shouldAnimate ? 'ring-2 ring-primary ring-offset-2' : ''
            }`}
          >
            <CardHeader className="pb-3 md:pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 md:p-2 rounded-lg ${stat.bgColor} transition-transform ${
                  shouldAnimate ? 'scale-110' : 'scale-100'
                }`}>
                  <Icon className={`w-5 h-5 md:w-4 md:h-4 ${stat.color}`} />
                </div>
                <span className="text-sm md:text-xs text-muted-foreground">/{stat.target}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 md:space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-3xl md:text-2xl font-bold transition-all duration-500 ${
                    shouldAnimate ? 'scale-110 text-primary' : 'scale-100'
                  }`}>
                    {stat.value}
                  </span>
                </div>
                <p className="text-sm md:text-xs text-muted-foreground line-clamp-2">{stat.title}</p>
                <div className="w-full bg-muted rounded-full h-2 md:h-1.5 overflow-hidden">
                  <div 
                    className={`bg-primary h-2 md:h-1.5 rounded-full transition-all ${
                      shouldAnimate ? 'duration-700' : 'duration-300'
                    }`}
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