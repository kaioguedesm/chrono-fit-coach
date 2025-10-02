import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, Dumbbell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AIWorkoutGeneratorProps {
  onSuccess: () => void;
}

export function AIWorkoutGenerator({ onSuccess }: AIWorkoutGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [goal, setGoal] = useState('hipertrofia');
  const [experience, setExperience] = useState('intermediário');
  const [workoutType, setWorkoutType] = useState('A');

  const generateWorkout = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-workout', {
        body: {
          goal,
          experience,
          workoutType: `Treino ${workoutType}`,
          equipment: 'equipamentos de academia completa'
        }
      });

      if (functionError) throw functionError;

      if (!functionData || !functionData.workoutName || !functionData.exercises) {
        throw new Error('Resposta inválida da IA');
      }

      // Create workout plan
      const { data: plan, error: planError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user.id,
          name: functionData.workoutName,
          type: workoutType,
          created_by: 'ai'
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create exercises
      const exercisesData = functionData.exercises.map((ex: any, index: number) => ({
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
        title: "Treino criado pela IA! 🤖✨",
        description: `${functionData.workoutName} foi gerado e adicionado aos seus treinos.`
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error generating workout:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar o treino.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          IA Personal Trainer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            🤖 Deixe a Inteligência Artificial criar um treino personalizado baseado no seu objetivo e nível!
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Objetivo</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hipertrofia">Hipertrofia (ganho de massa)</SelectItem>
                <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                <SelectItem value="resistência">Resistência</SelectItem>
                <SelectItem value="força">Força</SelectItem>
                <SelectItem value="mobilidade">Mobilidade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nível de Experiência</Label>
            <Select value={experience} onValueChange={setExperience}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="iniciante">Iniciante</SelectItem>
                <SelectItem value="intermediário">Intermediário</SelectItem>
                <SelectItem value="avançado">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tipo de Treino</Label>
            <Select value={workoutType} onValueChange={setWorkoutType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['A', 'B', 'C', 'D', 'E'].map(type => (
                  <SelectItem key={type} value={type}>Treino {type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={generateWorkout} 
          disabled={generating}
          className="w-full"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gerando treino...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Gerar Treino com IA
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
