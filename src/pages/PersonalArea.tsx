import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Dumbbell,
  Shield,
  AlertCircle,
  Apple,
  Info,
  CheckSquare,
  TrendingUp
} from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface WorkoutPlan {
  id: string;
  name: string;
  type: string;
  created_at: string;
  approval_status: string;
  rejection_reason?: string;
  user_id: string;
  profiles: {
    name: string;
    avatar_url?: string;
  };
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
  }>;
}

interface NutritionPlan {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  approval_status: string;
  rejection_reason?: string;
  user_id: string;
  profiles: {
    name: string;
    avatar_url?: string;
  };
  meals: Array<{
    name: string;
    meal_type: string;
    calories?: number;
  }>;
}

export default function PersonalArea() {
  const navigate = useNavigate();
  const { isPersonal, loading: roleLoading } = useUserRole();
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutPlan | null>(null);
  const [selectedNutrition, setSelectedNutrition] = useState<NutritionPlan | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [contentType, setContentType] = useState<'workout' | 'nutrition'>('workout');

  useEffect(() => {
    if (!roleLoading && !isPersonal) {
      toast.error('Acesso negado', {
        description: 'Você não tem permissão para acessar esta área.'
      });
      navigate('/dashboard');
    }
  }, [isPersonal, roleLoading, navigate]);

  useEffect(() => {
    if (isPersonal) {
      if (contentType === 'workout') {
        fetchWorkouts();
      } else {
        fetchNutritionPlans();
      }
    }
  }, [isPersonal, activeTab, contentType]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workout_plans')
        .select(`
          *,
          exercises (name, sets, reps)
        `)
        .eq('created_by', 'ai')
        .eq('approval_status', activeTab)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const workoutsWithProfiles = await Promise.all(
        (data || []).map(async (workout) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('user_id', workout.user_id)
            .single();
          
          return {
            ...workout,
            profiles: profile || { name: 'Usuário', avatar_url: undefined }
          };
        })
      );

      setWorkouts(workoutsWithProfiles as WorkoutPlan[]);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      toast.error('Erro ao carregar treinos');
    } finally {
      setLoading(false);
    }
  };

  const fetchNutritionPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select(`
          *,
          meals (name, meal_type, calories)
        `)
        .eq('created_by', 'ai')
        .eq('approval_status', activeTab)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const plansWithProfiles = await Promise.all(
        (data || []).map(async (plan) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('user_id', plan.user_id)
            .single();
          
          return {
            ...plan,
            profiles: profile || { name: 'Usuário', avatar_url: undefined }
          };
        })
      );

      setNutritionPlans(plansWithProfiles as NutritionPlan[]);
    } catch (error) {
      console.error('Error fetching nutrition plans:', error);
      toast.error('Erro ao carregar planos nutricionais');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, type: 'workout' | 'nutrition') => {
    try {
      const table = type === 'workout' ? 'workout_plans' : 'nutrition_plans';
      const { error } = await supabase
        .from(table)
        .update({
          approval_status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`${type === 'workout' ? 'Treino' : 'Plano nutricional'} aprovado com sucesso!`);
      if (type === 'workout') {
        fetchWorkouts();
      } else {
        fetchNutritionPlans();
      }
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('Erro ao aprovar');
    }
  };

  const handleReject = async () => {
    const hasWorkout = !!selectedWorkout;
    const hasNutrition = !!selectedNutrition;
    
    if (!rejectionReason.trim()) {
      toast.error('Por favor, informe o motivo da rejeição');
      return;
    }

    try {
      if (hasWorkout) {
        const { error } = await supabase
          .from('workout_plans')
          .update({
            approval_status: 'rejected',
            approved_by: (await supabase.auth.getUser()).data.user?.id,
            approved_at: new Date().toISOString(),
            rejection_reason: rejectionReason
          })
          .eq('id', selectedWorkout!.id);

        if (error) throw error;
        toast.success('Treino rejeitado');
        fetchWorkouts();
      } else if (hasNutrition) {
        const { error } = await supabase
          .from('nutrition_plans')
          .update({
            approval_status: 'rejected',
            approved_by: (await supabase.auth.getUser()).data.user?.id,
            approved_at: new Date().toISOString(),
            rejection_reason: rejectionReason
          })
          .eq('id', selectedNutrition!.id);

        if (error) throw error;
        toast.success('Plano nutricional rejeitado');
        fetchNutritionPlans();
      }

      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedWorkout(null);
      setSelectedNutrition(null);
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Erro ao rejeitar');
    }
  };

  const openRejectDialog = (item: WorkoutPlan | NutritionPlan, type: 'workout' | 'nutrition') => {
    if (type === 'workout') {
      setSelectedWorkout(item as WorkoutPlan);
      setSelectedNutrition(null);
    } else {
      setSelectedNutrition(item as NutritionPlan);
      setSelectedWorkout(null);
    }
    setShowRejectDialog(true);
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Header title="Área do Personal" />
        <div className="container mx-auto px-4 pt-28 py-8 pb-20">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (!isPersonal) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejeitado</Badge>;
      default:
        return null;
    }
  };

  const currentData = contentType === 'workout' ? workouts : nutritionPlans;
  
  const stats = {
    pending: currentData.filter(w => w.approval_status === 'pending').length,
    approved: currentData.filter(w => w.approval_status === 'approved').length,
    rejected: currentData.filter(w => w.approval_status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header title="Área do Personal" />
      
      <div className="container mx-auto px-4 pt-28 py-8 pb-20 max-w-7xl space-y-8">
        {/* Header com badge de personal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Área do Personal Trainer</h1>
              <p className="text-muted-foreground">Gerencie e aprove conteúdos gerados pela IA</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/personal-students')}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              Meus Alunos
            </Button>
            <Select value={contentType} onValueChange={(value) => setContentType(value as 'workout' | 'nutrition')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workout">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    Treinos
                  </div>
                </SelectItem>
                <SelectItem value="nutrition">
                  <div className="flex items-center gap-2">
                    <Apple className="h-4 w-4" />
                    Nutrição
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Guia Rápido */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-primary" />
              Como Funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Como personal trainer, você é responsável por revisar e aprovar conteúdos gerados pela IA para seus alunos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">1. Revise Pendentes</h4>
                  <p className="text-xs text-muted-foreground">
                    Verifique treinos e planos nutricionais aguardando sua aprovação
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">2. Aprove ou Rejeite</h4>
                  <p className="text-xs text-muted-foreground">
                    Avalie se o conteúdo está adequado para o aluno
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">3. Acompanhe Resultados</h4>
                  <p className="text-xs text-muted-foreground">
                    Monitore a evolução dos seus alunos
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span className="text-3xl font-bold">{stats.pending}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-3xl font-bold">{stats.approved}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejeitados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-3xl font-bold">{stats.rejected}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de treinos */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pendentes {stats.pending > 0 && `(${stats.pending})`}
            </TabsTrigger>
            <TabsTrigger value="approved">Aprovados</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {loading ? (
              <LoadingState />
            ) : currentData.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum {contentType === 'workout' ? 'treino' : 'plano nutricional'} {activeTab === 'pending' ? 'pendente' : activeTab === 'approved' ? 'aprovado' : 'rejeitado'}</p>
                </CardContent>
              </Card>
            ) : contentType === 'workout' ? (
              workouts.map((workout) => (
                <Card key={workout.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={workout.profiles?.avatar_url} />
                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{workout.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <span>Aluno: {workout.profiles?.name || 'Usuário'}</span>
                  <span>•</span>
                  <span>{new Date(workout.created_at).toLocaleDateString('pt-BR')}</span>
                </CardDescription>
              </div>
            </div>
                      </div>
                      {getStatusBadge(workout.approval_status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Dumbbell className="h-4 w-4" />
                        Tipo: {workout.type}
                      </p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="font-medium">Exercícios ({workout.exercises?.length || 0}):</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          {workout.exercises?.slice(0, 5).map((ex, idx) => (
                            <li key={idx}>{ex.name} - {ex.sets}x{ex.reps}</li>
                          ))}
                          {workout.exercises?.length > 5 && (
                            <li className="text-muted-foreground italic">
                              + {workout.exercises.length - 5} exercícios...
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {workout.rejection_reason && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <p className="text-sm font-medium text-destructive mb-1">Motivo da Rejeição:</p>
                        <p className="text-sm text-muted-foreground">{workout.rejection_reason}</p>
                      </div>
                    )}

                    {workout.approval_status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={() => handleApprove(workout.id, 'workout')}
                          className="flex-1"
                          variant="default"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar Treino
                        </Button>
                        <Button 
                          onClick={() => openRejectDialog(workout, 'workout')}
                          className="flex-1"
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              nutritionPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={plan.profiles?.avatar_url} />
                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-xl">{plan.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <span>Aluno: {plan.profiles?.name || 'Usuário'}</span>
                              <span>•</span>
                              <span>{new Date(plan.created_at).toLocaleDateString('pt-BR')}</span>
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(plan.approval_status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                      )}
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="font-medium flex items-center gap-2">
                          <Apple className="h-4 w-4" />
                          Refeições ({plan.meals?.length || 0}):
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          {plan.meals?.slice(0, 5).map((meal, idx) => (
                            <li key={idx}>
                              {meal.name} ({meal.meal_type})
                              {meal.calories && ` - ${meal.calories} kcal`}
                            </li>
                          ))}
                          {plan.meals?.length > 5 && (
                            <li className="text-muted-foreground italic">
                              + {plan.meals.length - 5} refeições...
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {plan.rejection_reason && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <p className="text-sm font-medium text-destructive mb-1">Motivo da Rejeição:</p>
                        <p className="text-sm text-muted-foreground">{plan.rejection_reason}</p>
                      </div>
                    )}

                    {plan.approval_status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={() => handleApprove(plan.id, 'nutrition')}
                          className="flex-1"
                          variant="default"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar Plano
                        </Button>
                        <Button 
                          onClick={() => openRejectDialog(plan, 'nutrition')}
                          className="flex-1"
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Rejeitar {selectedWorkout ? 'Treino' : 'Plano Nutricional'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Por favor, informe o motivo da rejeição para que o aluno possa entender e gerar um novo plano.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder={selectedWorkout 
              ? "Ex: Exercícios muito avançados para o nível do aluno..."
              : "Ex: Plano não adequado às restrições alimentares do aluno..."
            }
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject}
              className="bg-destructive hover:bg-destructive/90"
            >
              Confirmar Rejeição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
