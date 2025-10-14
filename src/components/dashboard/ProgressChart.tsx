import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp } from "lucide-react";

const mockData = [
  { date: "Seg", weight: 78, calories: 2200 },
  { date: "Ter", weight: 77.8, calories: 2150 },
  { date: "Qua", weight: 77.5, calories: 2100 },
  { date: "Qui", weight: 77.3, calories: 2250 },
  { date: "Sex", weight: 77, calories: 2180 },
  { date: "Sáb", weight: 76.8, calories: 2300 },
  { date: "Dom", weight: 76.5, calories: 2000 },
];

export function ProgressChart() {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4 text-primary" />
          Progresso da Semana
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Peso (kg)</p>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={mockData}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[76, 78.5]}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#weightGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Calorias (kcal)</p>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={mockData}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[1900, 2400]}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-2))', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
