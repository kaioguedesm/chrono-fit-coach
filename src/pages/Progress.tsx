import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Scale, Ruler, Plus, Activity, Target, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Area,
  AreaChart,
  ComposedChart,
  Bar,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PhotoUpload } from '@/components/progress/PhotoUpload';
import { PhotoGallery } from '@/components/progress/PhotoGallery';
import { PhotoComparison } from '@/components/progress/PhotoComparison';
import { AchievementsBadges } from '@/components/progress/AchievementsBadges';
import { WeeklySummary } from '@/components/progress/WeeklySummary';
import { useGoals } from '@/hooks/useGoals';

interface BodyMeasurement {
  id: string;
  weight: number | null;
  body_fat_percentage: number | null;
  muscle_mass: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arm: number | null;
  thigh: number | null;
  measured_at: string;
}

interface NewMeasurement {
  weight: string;
  bodyFat: string;
  muscleMass: string;
  chest: string;
  waist: string;
  hips: string;
  arm: string;
  thigh: string;
}

export default function Progress() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { goals } = useGoals();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshPhotos, setRefreshPhotos] = useState(0);
  const [newMeasurement, setNewMeasurement] = useState<NewMeasurement>({
    weight: '',
    bodyFat: '',
    muscleMass: '',
    chest: '',
    waist: '',
    hips: '',
    arm: '',
    thigh: ''
  });

  useEffect(() => {
    if (user) {
      fetchMeasurements();
    }
  }, [user]);

  const fetchMeasurements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('measured_at', { ascending: false });

      if (error) throw error;

      setMeasurements(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as medidas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMeasurement = async () => {
    if (!user) return;

    const hasData = Object.values(newMeasurement).some(value => value.trim() !== '');
    if (!hasData) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos uma medida.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('body_measurements')
        .insert({
          user_id: user.id,
          weight: newMeasurement.weight ? parseFloat(newMeasurement.weight) : null,
          body_fat_percentage: newMeasurement.bodyFat ? parseFloat(newMeasurement.bodyFat) : null,
          muscle_mass: newMeasurement.muscleMass ? parseFloat(newMeasurement.muscleMass) : null,
          chest: newMeasurement.chest ? parseFloat(newMeasurement.chest) : null,
          waist: newMeasurement.waist ? parseFloat(newMeasurement.waist) : null,
          hips: newMeasurement.hips ? parseFloat(newMeasurement.hips) : null,
          arm: newMeasurement.arm ? parseFloat(newMeasurement.arm) : null,
          thigh: newMeasurement.thigh ? parseFloat(newMeasurement.thigh) : null,
          measured_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Medidas salvas!",
        description: "Suas medidas foram registradas com sucesso."
      });

      setNewMeasurement({
        weight: '',
        bodyFat: '',
        muscleMass: '',
        chest: '',
        waist: '',
        hips: '',
        arm: '',
        thigh: ''
      });

      fetchMeasurements();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as medidas.",
        variant: "destructive"
      });
    }
  };

  const latestMeasurement = measurements[0];
  const previousMeasurement = measurements[1];

  // Calculate changes
  const calculateChange = (current: number | null | undefined, previous: number | null | undefined) => {
    if (!current || !previous) return null;
    const change = current - previous;
    const percentage = ((change / previous) * 100).toFixed(1);
    return { change: change.toFixed(1), percentage, isPositive: change > 0, isNegative: change < 0 };
  };

  const weightChange = calculateChange(latestMeasurement?.weight, previousMeasurement?.weight);
  const bodyFatChange = calculateChange(latestMeasurement?.body_fat_percentage, previousMeasurement?.body_fat_percentage);
  const muscleMassChange = calculateChange(latestMeasurement?.muscle_mass, previousMeasurement?.muscle_mass);

  // Sample data for demonstration
  const sampleData = [
    { date: '2024-01-01', weight: 80, bodyFat: 18, muscleMass: 62, chest: 100, waist: 85, arm: 34 },
    { date: '2024-01-15', weight: 79.5, bodyFat: 17.5, muscleMass: 62.5, chest: 101, waist: 84, arm: 34.5 },
    { date: '2024-02-01', weight: 79, bodyFat: 17, muscleMass: 63, chest: 102, waist: 83, arm: 35 },
    { date: '2024-02-15', weight: 78.5, bodyFat: 16.5, muscleMass: 63.5, chest: 103, waist: 82, arm: 35.5 },
    { date: '2024-03-01', weight: 78, bodyFat: 16, muscleMass: 64, chest: 104, waist: 81, arm: 36 }
  ];

  const chartData = measurements.length > 0 
    ? measurements.reverse().map(m => ({
        date: format(new Date(m.measured_at), 'dd/MM'),
        fullDate: format(new Date(m.measured_at), "dd 'de' MMM", { locale: ptBR }),
        weight: m.weight,
        bodyFat: m.body_fat_percentage,
        muscleMass: m.muscle_mass,
        chest: m.chest,
        waist: m.waist,
        hips: m.hips,
        arm: m.arm,
        thigh: m.thigh
      }))
    : sampleData.map(d => ({
        date: format(new Date(d.date), 'dd/MM'),
        fullDate: format(new Date(d.date), "dd 'de' MMM", { locale: ptBR }),
        weight: d.weight,
        bodyFat: d.bodyFat,
        muscleMass: d.muscleMass,
        chest: d.chest,
        waist: d.waist,
        arm: d.arm
      }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{payload[0]?.payload?.fullDate}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}{entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header title="Progresso" />
      
      <div className="container mx-auto px-4 pt-28 py-8 pb-20 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="measurements">Medidas</TabsTrigger>
            <TabsTrigger value="photos">Fotos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 animate-fade-in">
            <WeeklySummary />
            
            <div className="grid gap-4 md:grid-cols-2">
              <AchievementsBadges />
              <PhotoComparison refreshTrigger={refreshPhotos} />
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-4 animate-fade-in">
            {loading ? (
              <LoadingState type="stats" />
            ) : measurements.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="Nenhuma medida registrada"
                description="Comece registrando suas medidas corporais para acompanhar seu progresso ao longo do tempo."
                motivation="Meça para gerenciar!"
                actionLabel="Registrar Primeira Medida"
                onAction={() => setActiveTab('measurements')}
              />
            ) : (
              <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="hover-scale">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Scale className="w-5 h-5 text-primary" />
                    {weightChange && (
                      <Badge variant={weightChange.isNegative ? "default" : "secondary"} className="text-xs">
                        {weightChange.isNegative ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                        {Math.abs(parseFloat(weightChange.change))}kg
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold">
                    {latestMeasurement?.weight || 78}kg
                  </div>
                  <div className="text-sm text-muted-foreground">Peso atual</div>
                  {weightChange && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {weightChange.percentage}% vs anterior
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="hover-scale">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingDown className="w-5 h-5 text-blue-600" />
                    {bodyFatChange && (
                      <Badge variant={bodyFatChange.isNegative ? "default" : "secondary"} className="text-xs">
                        {bodyFatChange.isNegative ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                        {Math.abs(parseFloat(bodyFatChange.change))}%
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold">
                    {latestMeasurement?.body_fat_percentage || 16}%
                  </div>
                  <div className="text-sm text-muted-foreground">% Gordura</div>
                  {bodyFatChange && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {bodyFatChange.percentage}% vs anterior
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="hover-scale">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    {muscleMassChange && (
                      <Badge variant={muscleMassChange.isPositive ? "default" : "secondary"} className="text-xs">
                        {muscleMassChange.isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(parseFloat(muscleMassChange.change))}kg
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold">
                    {latestMeasurement?.muscle_mass || 65}kg
                  </div>
                  <div className="text-sm text-muted-foreground">Massa muscular</div>
                  {muscleMassChange && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {muscleMassChange.percentage}% vs anterior
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="hover-scale">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold">
                    {latestMeasurement?.weight 
                      ? ((latestMeasurement.weight / Math.pow((latestMeasurement as any).height || 175 / 100, 2))).toFixed(1) 
                      : '24.2'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">IMC</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Faixa ideal: 18.5-24.9
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Combined Chart - Weight and Body Composition */}
            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle>Evolução da Composição Corporal</CardTitle>
                <CardDescription>
                  Acompanhe seu peso, gordura corporal e massa muscular ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={{ stroke: 'hsl(var(--muted))' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={{ stroke: 'hsl(var(--muted))' }}
                      label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={{ stroke: 'hsl(var(--muted))' }}
                      label={{ value: '% / kg', angle: 90, position: 'insideRight', fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="weight"
                      name="Peso (kg)"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fill="url(#colorWeight)"
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="bodyFat"
                      name="Gordura (%)"
                      stroke="hsl(220, 70%, 50%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(220, 70%, 50%)', r: 4 }}
                      unit="%"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="muscleMass"
                      name="Massa Muscular (kg)"
                      stroke="hsl(142, 76%, 36%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(142, 76%, 36%)', r: 4 }}
                      unit="kg"
                    />
                    {/* Goal Lines */}
                    {goals.find(g => g.goal_type === 'weight' && g.is_active) && (
                      <ReferenceLine
                        yAxisId="left"
                        y={goals.find(g => g.goal_type === 'weight')?.target_value}
                        stroke="hsl(var(--primary))"
                        strokeDasharray="5 5"
                        label={{
                          value: 'Meta',
                          fill: 'hsl(var(--primary))',
                          fontSize: 12,
                        }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Body Measurements Chart */}
            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle>Medidas Corporais (Circunferências)</CardTitle>
                <CardDescription>
                  Evolução das principais circunferências do seu corpo em centímetros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="date"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      label={{ value: 'cm', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" />
                    <Line
                      type="monotone"
                      dataKey="chest"
                      name="Peito"
                      stroke="hsl(262, 83%, 58%)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      unit="cm"
                    />
                    <Line
                      type="monotone"
                      dataKey="waist"
                      name="Cintura"
                      stroke="hsl(24, 95%, 53%)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      unit="cm"
                    />
                    <Line
                      type="monotone"
                      dataKey="arm"
                      name="Braço"
                      stroke="hsl(197, 71%, 52%)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      unit="cm"
                    />
                    <Line
                      type="monotone"
                      dataKey="thigh"
                      name="Coxa"
                      stroke="hsl(47, 95%, 53%)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      unit="cm"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Progress Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Progresso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {measurements.length >= 2 ? (
                    <>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">Mudança de Peso</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {weightChange && (
                            <>
                              <span className={`text-sm font-bold ${weightChange.isNegative ? 'text-green-600' : 'text-orange-600'}`}>
                                {weightChange.change}kg ({weightChange.percentage}%)
                              </span>
                              {weightChange.isNegative ? 
                                <TrendingDown className="w-4 h-4 text-green-600" /> : 
                                <TrendingUp className="w-4 h-4 text-orange-600" />
                              }
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Mudança de Gordura</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {bodyFatChange && (
                            <>
                              <span className={`text-sm font-bold ${bodyFatChange.isNegative ? 'text-green-600' : 'text-orange-600'}`}>
                                {bodyFatChange.change}% ({bodyFatChange.percentage}%)
                              </span>
                              {bodyFatChange.isNegative ? 
                                <TrendingDown className="w-4 h-4 text-green-600" /> : 
                                <TrendingUp className="w-4 h-4 text-orange-600" />
                              }
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Mudança de Massa Muscular</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {muscleMassChange && (
                            <>
                              <span className={`text-sm font-bold ${muscleMassChange.isPositive ? 'text-green-600' : 'text-orange-600'}`}>
                                {muscleMassChange.change}kg ({muscleMassChange.percentage}%)
                              </span>
                              {muscleMassChange.isPositive ? 
                                <TrendingUp className="w-4 h-4 text-green-600" /> : 
                                <TrendingDown className="w-4 h-4 text-orange-600" />
                              }
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Adicione mais medidas para ver seu progresso comparativo</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </>
            )}
          </TabsContent>

          <TabsContent value="measurements" className="space-y-4 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Novas Medidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="75.5"
                      value={newMeasurement.weight}
                      onChange={(e) => setNewMeasurement({...newMeasurement, weight: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>% Gordura</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="15.5"
                      value={newMeasurement.bodyFat}
                      onChange={(e) => setNewMeasurement({...newMeasurement, bodyFat: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Massa muscular (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="65.0"
                      value={newMeasurement.muscleMass}
                      onChange={(e) => setNewMeasurement({...newMeasurement, muscleMass: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Peito (cm)</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={newMeasurement.chest}
                      onChange={(e) => setNewMeasurement({...newMeasurement, chest: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cintura (cm)</Label>
                    <Input
                      type="number"
                      placeholder="80"
                      value={newMeasurement.waist}
                      onChange={(e) => setNewMeasurement({...newMeasurement, waist: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quadril (cm)</Label>
                    <Input
                      type="number"
                      placeholder="95"
                      value={newMeasurement.hips}
                      onChange={(e) => setNewMeasurement({...newMeasurement, hips: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Braço (cm)</Label>
                    <Input
                      type="number"
                      placeholder="35"
                      value={newMeasurement.arm}
                      onChange={(e) => setNewMeasurement({...newMeasurement, arm: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Coxa (cm)</Label>
                    <Input
                      type="number"
                      placeholder="55"
                      value={newMeasurement.thigh}
                      onChange={(e) => setNewMeasurement({...newMeasurement, thigh: e.target.value})}
                    />
                  </div>
                </div>

                <Button onClick={saveMeasurement} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Salvar Medidas
                </Button>
              </CardContent>
            </Card>

            {/* Measurements History */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Medidas</CardTitle>
              </CardHeader>
              <CardContent>
                {measurements.length === 0 ? (
                  <div className="text-center py-8">
                    <Ruler className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma medida registrada ainda
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {measurements.slice(0, 5).map((measurement) => (
                      <div key={measurement.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">
                            {format(new Date(measurement.measured_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {measurement.weight && `Peso: ${measurement.weight}kg`}
                            {measurement.body_fat_percentage && ` • Gordura: ${measurement.body_fat_percentage}%`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="space-y-4 animate-fade-in">
            <PhotoUpload onSuccess={() => setRefreshPhotos(prev => prev + 1)} />
            <div key={refreshPhotos}>
              <PhotoGallery />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}