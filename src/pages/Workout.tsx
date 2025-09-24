import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Plus, Clock, Weight, RotateCcw } from 'lucide-react';

interface WorkoutPlan {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  created_by: string;
  exercises: Exercise[];
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  rest_time: number | null;
  order_in_workout: number;
  notes: string | null;
}

export default function Workout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');

  useEffect(() => {
    if (user) {
      fetchWorkoutPlans();
    }
  }, [user]);

  const fetchWorkoutPlans = async () => {
    if (!user) return;

    try {
      const { data: plans, error } = await supabase
        .from('workout_plans')
        .select(`
          *,
          exercises (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWorkoutPlans(plans || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os treinos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = async (planId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          workout_plan_id: planId,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Treino iniciado!",
        description: "Boa sorte com seu treino 💪"
      });
      
      // TODO: Navigate to workout execution screen
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o treino.",
        variant: "destructive"
      });
    }
  };

  const samplePlans: WorkoutPlan[] = [
    {
      id: 'sample-1',
      name: 'Treino A - Peito e Tríceps',
      type: 'A',
      is_active: true,
      created_by: 'ai',
      exercises: [
        {
          id: '1',
          name: 'Supino Reto',
          sets: 4,
          reps: '8-12',
          weight: 60,
          rest_time: 120,
          order_in_workout: 1,
          notes: 'Foco na execução'
        },
        {
          id: '2',
          name: 'Supino Inclinado',
          sets: 3,
          reps: '10-12',
          weight: 45,
          rest_time: 90,
          order_in_workout: 2,
          notes: null
        },
        {
          id: '3',
          name: 'Crucifixo',
          sets: 3,
          reps: '12-15',
          weight: 15,
          rest_time: 60,
          order_in_workout: 3,
          notes: null
        },
        {
          id: '4',
          name: 'Tríceps Testa',
          sets: 3,
          reps: '10-12',
          weight: 20,
          rest_time: 60,
          order_in_workout: 4,
          notes: null
        }
      ]
    },
    {
      id: 'sample-2',
      name: 'Treino B - Costas e Bíceps',
      type: 'B',
      is_active: true,
      created_by: 'ai',
      exercises: [
        {
          id: '5',
          name: 'Puxada Frontal',
          sets: 4,
          reps: '8-12',
          weight: 50,
          rest_time: 120,
          order_in_workout: 1,
          notes: 'Contrair bem as costas'
        },
        {
          id: '6',
          name: 'Remada Sentado',
          sets: 3,
          reps: '10-12',
          weight: 45,
          rest_time: 90,
          order_in_workout: 2,
          notes: null
        }
      ]
    }
  ];

  const displayPlans = workoutPlans.length > 0 ? workoutPlans : samplePlans;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Header title="Treinos" />
        <div className="container mx-auto px-4 py-6 pb-20">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header title="Treinos" />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans">Fichas</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="create">Criar</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Seus Treinos</h2>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Treino
              </Button>
            </div>

            <div className="space-y-4">
              {displayPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <Badge variant={plan.created_by === 'ai' ? 'default' : 'secondary'}>
                          {plan.created_by === 'ai' ? 'IA' : 'Personalizado'}
                        </Badge>
                      </div>
                      <Badge variant="outline">Treino {plan.type}</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {plan.exercises.slice(0, 3).map((exercise) => (
                        <div key={exercise.id} className="flex justify-between items-center text-sm">
                          <span>{exercise.name}</span>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{exercise.sets}x{exercise.reps}</span>
                            {exercise.weight && (
                              <span className="flex items-center gap-1">
                                <Weight className="w-3 h-3" />
                                {exercise.weight}kg
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {plan.exercises.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          +{plan.exercises.length - 3} exercícios
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1"
                        onClick={() => startWorkout(plan.id)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Iniciar Treino
                      </Button>
                      <Button variant="outline" size="icon">
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Histórico de Treinos</h3>
              <p className="text-muted-foreground mb-4">
                Seus treinos concluídos aparecerão aqui
              </p>
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Criar Novo Treino</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Treino Personalizado
                </Button>
                <Button className="w-full">
                  🤖 Gerar com IA Personal Trainer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}