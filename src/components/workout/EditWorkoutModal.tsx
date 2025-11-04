import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Trash2, Plus, GripVertical, Save, Weight, Clock } from 'lucide-react';

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

interface EditWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutPlanId: string;
  onSuccess: () => void;
}

export function EditWorkoutModal({ open, onOpenChange, workoutPlanId, onSuccess }: EditWorkoutModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutType, setWorkoutType] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (open && workoutPlanId) {
      fetchWorkoutDetails();
    }
  }, [open, workoutPlanId]);

  const fetchWorkoutDetails = async () => {
    setLoading(true);
    try {
      const { data: plan, error: planError } = await supabase
        .from('workout_plans')
        .select('name, type')
        .eq('id', workoutPlanId)
        .maybeSingle();

      if (planError) throw planError;

      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('workout_plan_id', workoutPlanId)
        .order('order_in_workout');

      if (exercisesError) throw exercisesError;

      setWorkoutName(plan.name);
      setWorkoutType(plan.type);
      setExercises(exercisesData || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do treino.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update workout plan
      const { error: planError } = await supabase
        .from('workout_plans')
        .update({
          name: workoutName,
          type: workoutType,
          updated_at: new Date().toISOString()
        })
        .eq('id', workoutPlanId);

      if (planError) throw planError;

      // Update each exercise
      for (const exercise of exercises) {
        const { error: exerciseError } = await supabase
          .from('exercises')
          .update({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            rest_time: exercise.rest_time,
            order_in_workout: exercise.order_in_workout,
            notes: exercise.notes
          })
          .eq('id', exercise.id);

        if (exerciseError) throw exerciseError;
      }

      toast({
        title: "Treino atualizado! ✅",
        description: "Suas alterações foram salvas com sucesso."
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const removeExercise = async (index: number) => {
    const exercise = exercises[index];
    
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exercise.id);

      if (error) throw error;

      const updated = exercises.filter((_, i) => i !== index);
      setExercises(updated);

      toast({
        title: "Exercício removido",
        description: "O exercício foi excluído com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o exercício.",
        variant: "destructive"
      });
    }
  };

  const addExercise = async () => {
    if (!user) return;

    try {
      const newOrder = exercises.length + 1;
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          workout_plan_id: workoutPlanId,
          name: 'Novo Exercício',
          sets: 3,
          reps: '10-12',
          weight: null,
          rest_time: 60,
          order_in_workout: newOrder,
          notes: null
        })
        .select()
        .single();

      if (error) throw error;

      setExercises([...exercises, data]);

      toast({
        title: "Exercício adicionado",
        description: "Novo exercício criado. Edite os detalhes."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o exercício.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Carregando treino</DialogTitle>
            <DialogDescription className="sr-only">
              Aguarde enquanto carregamos os dados do treino
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">Carregando...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Treino</DialogTitle>
          <DialogDescription>
            Edite os detalhes e exercícios do seu treino
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Workout Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Treino</Label>
                <Input
                  id="name"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="Ex: Treino A - Peito e Tríceps"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Input
                  id="type"
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value)}
                  placeholder="Ex: A, B, C"
                />
              </div>
            </div>

            <Separator />

            {/* Exercises */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Exercícios ({exercises.length})</h3>
                <Button onClick={addExercise} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Exercício
                </Button>
              </div>

              <div className="space-y-4">
                {exercises.map((exercise, index) => (
                  <Card key={exercise.id}>
                    <CardContent className="pt-4">
                      <div className="flex gap-2 items-start">
                        <GripVertical className="w-5 h-5 text-muted-foreground mt-2 flex-shrink-0" />
                        
                        <div className="flex-1 space-y-3">
                          {/* Exercise Name */}
                          <div className="flex gap-2 items-center">
                            <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                              {index + 1}
                            </Badge>
                            <Input
                              value={exercise.name}
                              onChange={(e) => updateExercise(index, 'name', e.target.value)}
                              placeholder="Nome do exercício"
                              className="font-medium"
                            />
                          </div>

                          {/* Exercise Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Séries</Label>
                              <Input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                                min="1"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Repetições</Label>
                              <Input
                                value={exercise.reps}
                                onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                                placeholder="8-12"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <Weight className="w-3 h-3" />
                                Peso (kg)
                              </Label>
                              <Input
                                type="number"
                                value={exercise.weight || ''}
                                onChange={(e) => updateExercise(index, 'weight', e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Descanso (s)
                              </Label>
                              <Input
                                type="number"
                                value={exercise.rest_time || ''}
                                onChange={(e) => updateExercise(index, 'rest_time', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="60"
                              />
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Observações</Label>
                            <Textarea
                              value={exercise.notes || ''}
                              onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                              placeholder="Dicas ou observações sobre o exercício..."
                              className="resize-none h-16"
                            />
                          </div>
                        </div>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExercise(index)}
                          className="text-destructive hover:text-destructive flex-shrink-0 mt-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              "Salvando..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
