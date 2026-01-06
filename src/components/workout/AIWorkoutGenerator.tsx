import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, Dumbbell, Target, Zap, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { Badge } from '@/components/ui/badge';

interface AIWorkoutGeneratorProps {
  onSuccess: () => void;
}

const muscleGroups = [
  { value: 'peito', label: '💪 Peito', emoji: '💪', description: 'Desenvolvimento peitoral completo' },
  { value: 'costas', label: '🏋️ Costas', emoji: '🏋️', description: 'Largura e espessura dorsal' },
  { value: 'pernas', label: '🦵 Pernas', emoji: '🦵', description: 'Quadríceps, posterior e glúteos' },
  { value: 'ombros', label: '💪 Ombros', emoji: '💪', description: 'Deltoides completos' },
  { value: 'bracos', label: '💪 Braços', emoji: '💪', description: 'Bíceps e tríceps' },
  { value: 'abdomen', label: '🔥 Abdômen', emoji: '🔥', description: 'Core e estabilidade' },
  { value: 'corpo-inteiro', label: '⚡ Corpo Inteiro', emoji: '⚡', description: 'Treino completo full-body' },
  { value: 'superiores', label: '💪 Superiores', emoji: '💪', description: 'Peito, costas, ombros e braços' },
  { value: 'inferiores', label: '🦵 Inferiores', emoji: '🦵', description: 'Pernas, glúteos e panturrilhas' },
];

export function AIWorkoutGenerator({ onSuccess }: AIWorkoutGeneratorProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [muscleGroup, setMuscleGroup] = useState('peito');
  const [duration, setDuration] = useState('60');
  const [customDescription, setCustomDescription] = useState('');

  // Pegar objetivo e experiência do perfil do usuário
  const userGoal = profile?.goal || 'hipertrofia';
  const userExperience = profile?.experience_level || 'intermediário';

  const generateWorkout = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      const selectedGroup = muscleGroups.find(g => g.value === muscleGroup);
      
      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-workout', {
        body: {
          goal: userGoal,
          experience: userExperience,
          muscleGroup: selectedGroup?.label || 'Peito',
          muscleGroupDescription: selectedGroup?.description || '',
          duration: parseInt(duration),
          equipment: 'equipamentos de academia completa',
          userWeight: profile?.weight || null,
          userAge: profile?.age || null,
          customDescription: customDescription.trim() || null
        }
      });

      if (functionError) throw functionError;

      if (!functionData || !functionData.workoutName || !functionData.exercises) {
        throw new Error('Resposta inválida da IA');
      }

      // Create workout plan with pending approval status
      const { data: plan, error: planError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user.id,
          name: functionData.workoutName,
          type: muscleGroup,
          created_by: 'ai',
          approval_status: 'pending'
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
        description: "Aguardando aprovação do personal trainer para liberar o treino."
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

  const selectedMuscleGroup = muscleGroups.find(g => g.value === muscleGroup);

  return (
    <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            IA Personal Trainer
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Zap className="w-3 h-3" />
            Personalizado
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Treino Inteligente Personalizado</p>
              <p className="text-xs text-muted-foreground">
                A IA usa suas informações de perfil ({userGoal}, nível {userExperience}) para criar o treino perfeito!
              </p>
            </div>
          </div>
        </div>

        {profile && (
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Target className="w-3 h-3" />
              Objetivo: {userGoal}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Dumbbell className="w-3 h-3" />
              Nível: {userExperience}
            </Badge>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold mb-3 block">Qual grupo muscular você quer treinar?</Label>
            <div className="grid grid-cols-2 gap-2">
              {muscleGroups.map((group) => (
                <button
                  key={group.value}
                  onClick={() => setMuscleGroup(group.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    muscleGroup === group.value
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-muted hover:border-primary/50 bg-background'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{group.emoji}</span>
                    <span className="font-medium text-sm">{group.label.replace(group.emoji, '').trim()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="duration">Duração do Treino</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos (Rápido)</SelectItem>
                <SelectItem value="45">45 minutos (Moderado)</SelectItem>
                <SelectItem value="60">60 minutos (Completo)</SelectItem>
                <SelectItem value="90">90 minutos (Intensivo)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-description" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" />
              Descreva seu treino ideal (opcional)
            </Label>
            <Textarea
              id="custom-description"
              placeholder="Ex: Quero focar em exercícios compostos, prefiro usar halteres, preciso de variações para dor no ombro, quero incluir drop sets..."
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              className="min-h-[100px] resize-none bg-background/50 border-primary/20 focus:border-primary/50 transition-colors"
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Seja específico! A IA vai personalizar ainda mais seu treino.
              </p>
              <span className="text-xs text-muted-foreground">
                {customDescription.length}/500
              </span>
            </div>
          </div>

          {selectedMuscleGroup && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Foco selecionado:</span> {selectedMuscleGroup.description}
              </p>
            </div>
          )}
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
