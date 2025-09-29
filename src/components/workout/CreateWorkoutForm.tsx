import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ExerciseForm {
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  rest_time: number | null;
  notes: string;
}

interface CreateWorkoutFormProps {
  onSuccess: () => void;
}

export function CreateWorkoutForm({ onSuccess }: CreateWorkoutFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [planName, setPlanName] = useState('');
  const [planType, setPlanType] = useState('A');
  const [exercises, setExercises] = useState<ExerciseForm[]>([
    { name: '', sets: 3, reps: '10-12', weight: null, rest_time: 90, notes: '' }
  ]);
  const [loading, setLoading] = useState(false);

  const addExercise = () => {
    setExercises([
      ...exercises,
      { name: '', sets: 3, reps: '10-12', weight: null, rest_time: 90, notes: '' }
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof ExerciseForm, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Create workout plan
      const { data: plan, error: planError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user.id,
          name: planName,
          type: planType,
          created_by: 'user'
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create exercises
      const exercisesData = exercises
        .filter(ex => ex.name.trim() !== '')
        .map((ex, index) => ({
          workout_plan_id: plan.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          rest_time: ex.rest_time,
          notes: ex.notes || null,
          order_in_workout: index + 1
        }));

      const { error: exercisesError } = await supabase
        .from('exercises')
        .insert(exercisesData);

      if (exercisesError) throw exercisesError;

      toast({
        title: "Treino criado! 🎉",
        description: `${planName} foi adicionado aos seus treinos.`
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o treino.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Treino</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="plan-name">Nome do Treino *</Label>
            <Input
              id="plan-name"
              placeholder="Ex: Treino A - Peito e Tríceps"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="plan-type">Tipo de Treino</Label>
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger id="plan-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['A', 'B', 'C', 'D', 'E'].map(type => (
                  <SelectItem key={type} value={type}>Treino {type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Exercícios</CardTitle>
            <Badge variant="secondary">{exercises.length} exercícios</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {exercises.map((exercise, index) => (
            <Card key={index} className="bg-muted/50">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-2">
                  <GripVertical className="w-5 h-5 text-muted-foreground mt-2" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label>Nome do Exercício *</Label>
                      <Input
                        placeholder="Ex: Supino Reto"
                        value={exercise.name}
                        onChange={(e) => updateExercise(index, 'name', e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label>Séries</Label>
                        <Input
                          type="number"
                          min="1"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Reps</Label>
                        <Input
                          placeholder="10-12"
                          value={exercise.reps}
                          onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Peso (kg)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="0"
                          value={exercise.weight || ''}
                          onChange={(e) => updateExercise(index, 'weight', parseFloat(e.target.value) || null)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Descanso (segundos)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="15"
                        value={exercise.rest_time || ''}
                        onChange={(e) => updateExercise(index, 'rest_time', parseInt(e.target.value) || null)}
                      />
                    </div>

                    <div>
                      <Label>Observações</Label>
                      <Textarea
                        placeholder="Ex: Controlar a descida, foco na contração..."
                        value={exercise.notes}
                        onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                  
                  {exercises.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExercise(index)}
                      className="mt-6"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addExercise}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Exercício
          </Button>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? 'Criando...' : 'Criar Treino'}
      </Button>
    </form>
  );
}
