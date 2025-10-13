import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { Calendar, Clock, Dumbbell, ChevronDown, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkoutSession {
  id: string;
  started_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
  workout_plan: {
    name: string;
    type: string;
  };
  exercise_sessions: Array<{
    exercise: {
      name: string;
    };
    sets_completed: number;
    reps_completed: string;
    weight_used: number | null;
  }>;
}

export function WorkoutHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          workout_plan:workout_plans!inner (
            name,
            type
          ),
          exercise_sessions (
            sets_completed,
            reps_completed,
            weight_used,
            exercise:exercises (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete || !user) return;

    try {
      // Delete exercise sessions first (due to foreign key constraints)
      const { error: exerciseError } = await supabase
        .from('exercise_sessions')
        .delete()
        .eq('workout_session_id', sessionToDelete);

      if (exerciseError) throw exerciseError;

      // Then delete the workout session
      const { error: sessionError } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', sessionToDelete);

      if (sessionError) throw sessionError;

      toast({
        title: "Treino excluído",
        description: "O treino foi removido do histórico."
      });

      // Update local state
      setSessions(sessions.filter(s => s.id !== sessionToDelete));
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o treino.",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando histórico...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum treino concluído</h3>
        <p className="text-muted-foreground">
          Complete seu primeiro treino para ver o histórico aqui
        </p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="space-y-3">
          {sessions.map((session) => (
            <Collapsible key={session.id}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="text-left flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Dumbbell className="w-4 h-4" />
                          {session.workout_plan.name}
                        </CardTitle>
                        <div className="flex gap-2 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(session.completed_at!), "dd 'de' MMM", { locale: ptBR })}
                          </span>
                          {session.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {session.duration_minutes} min
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Treino {session.workout_plan.type}</Badge>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-3">
                    <div className="space-y-2 border-t pt-3">
                      {session.exercise_sessions.map((ex, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded">
                          <span className="font-medium">{ex.exercise.name}</span>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{ex.sets_completed} séries</span>
                            {ex.weight_used && (
                              <Badge variant="secondary" className="text-xs">
                                {ex.weight_used}kg
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSessionToDelete(session.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir Treino
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir treino do histórico?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O treino será permanentemente removido do seu histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
