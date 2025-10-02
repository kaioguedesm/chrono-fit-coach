import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Scale, Ruler, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PhotoUpload } from '@/components/progress/PhotoUpload';
import { PhotoGallery } from '@/components/progress/PhotoGallery';

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
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('charts');
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

  // Sample data for demonstration
  const sampleData = [
    { date: '2024-01-01', weight: 80, bodyFat: 18 },
    { date: '2024-01-15', weight: 79.5, bodyFat: 17.5 },
    { date: '2024-02-01', weight: 79, bodyFat: 17 },
    { date: '2024-02-15', weight: 78.5, bodyFat: 16.5 },
    { date: '2024-03-01', weight: 78, bodyFat: 16 }
  ];

  const chartData = measurements.length > 0 
    ? measurements.reverse().map(m => ({
        date: format(new Date(m.measured_at), 'dd/MM'),
        weight: m.weight,
        bodyFat: m.body_fat_percentage
      }))
    : sampleData.map(d => ({
        date: format(new Date(d.date), 'dd/MM'),
        weight: d.weight,
        bodyFat: d.bodyFat
      }));

  const latestMeasurement = measurements[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header title="Progresso" />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="measurements">Medidas</TabsTrigger>
            <TabsTrigger value="photos">Fotos</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-4">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Scale className="w-6 h-6 mx-auto text-primary mb-2" />
                  <div className="text-2xl font-bold">
                    {latestMeasurement?.weight || 78}kg
                  </div>
                  <div className="text-sm text-muted-foreground">Peso atual</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                  <div className="text-2xl font-bold">
                    {latestMeasurement?.body_fat_percentage || 16}%
                  </div>
                  <div className="text-sm text-muted-foreground">Gordura</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Ruler className="w-6 h-6 mx-auto text-green-600 mb-2" />
                  <div className="text-2xl font-bold">
                    {latestMeasurement?.muscle_mass || 65}kg
                  </div>
                  <div className="text-sm text-muted-foreground">Massa muscular</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                  <div className="text-2xl font-bold">24.2</div>
                  <div className="text-sm text-muted-foreground">IMC</div>
                </CardContent>
              </Card>
            </div>

            {/* Weight Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução do Peso</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Body Fat Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Percentual de Gordura</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="bodyFat" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--secondary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="measurements" className="space-y-4">
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

          <TabsContent value="photos" className="space-y-4">
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