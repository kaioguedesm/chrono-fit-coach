import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, User, Dumbbell, Save } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  rest_time?: number;
  notes?: string;
  order_in_workout: number;
}

interface Student {
  user_id: string;
  name: string;
  avatar_url?: string;
}

interface PersonalCreateWorkoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedStudentId?: string;
  onSuccess?: () => void;
}

export function PersonalCreateWorkout({
  open,
  onOpenChange,
  preSelectedStudentId,
  onSuccess,
}: PersonalCreateWorkoutProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(preSelectedStudentId || "");
  const [workoutName, setWorkoutName] = useState("");
  const [workoutType, setWorkoutType] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: "", sets: 3, reps: "10-12", weight: undefined, rest_time: 60, notes: "", order_in_workout: 0 },
  ]);

  useEffect(() => {
    if (open) {
      fetchStudents();
      if (preSelectedStudentId) {
        setSelectedStudentId(preSelectedStudentId);
      }
    }
  }, [open, preSelectedStudentId]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);

      // Buscar o ID do personal trainer logado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar apenas alunos vinculados na tabela personal_students
      const { data: linkedStudents, error: linkedError } = await supabase
        .from("personal_students")
        .select("student_id")
        .eq("personal_id", user.id)
        .eq("is_active", true);

      if (linkedError) throw linkedError;

      if (!linkedStudents || linkedStudents.length === 0) {
        setStudents([]);
        return;
      }

      // Buscar perfis dos alunos vinculados
      const studentIds = linkedStudents.map((ls) => ls.student_id);
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", studentIds)
        .order("name", { ascending: true });

      if (error) throw error;

      setStudents((profiles || []) as Student[]);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Erro ao carregar alunos");
    } finally {
      setLoadingStudents(false);
    }
  };

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        name: "",
        sets: 3,
        reps: "10-12",
        weight: undefined,
        rest_time: 60,
        notes: "",
        order_in_workout: exercises.length,
      },
    ]);
  };

  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = async () => {
    if (!selectedStudentId) {
      toast.error("Selecione um aluno");
      return;
    }

    if (!workoutName.trim()) {
      toast.error("Digite o nome do treino");
      return;
    }

    if (!workoutType) {
      toast.error("Selecione o tipo do treino");
      return;
    }

    const validExercises = exercises.filter((e) => e.name.trim());
    if (validExercises.length === 0) {
      toast.error("Adicione pelo menos um exercício");
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Criar o plano de treino
      const { data: workoutPlan, error: planError } = await supabase
        .from("workout_plans")
        .insert({
          name: workoutName,
          type: workoutType,
          user_id: selectedStudentId,
          created_by: "personal",
          created_by_user_id: user.id,
          approval_status: "approved", // Treinos criados pelo personal já são aprovados
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Criar os exercícios
      const exercisesData = validExercises.map((exercise, index) => ({
        workout_plan_id: workoutPlan.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight || null,
        rest_time: exercise.rest_time || null,
        notes: exercise.notes || null,
        order_in_workout: index,
      }));

      const { error: exercisesError } = await supabase.from("exercises").insert(exercisesData);

      if (exercisesError) throw exercisesError;

      toast.success("Treino criado com sucesso!", {
        description: "O aluno já pode visualizar e utilizar este treino.",
      });

      // Resetar formulário
      setWorkoutName("");
      setWorkoutType("");
      setExercises([
        {
          name: "",
          sets: 3,
          reps: "10-12",
          weight: undefined,
          rest_time: 60,
          notes: "",
          order_in_workout: 0,
        },
      ]);
      if (!preSelectedStudentId) {
        setSelectedStudentId("");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating workout:", error);
      toast.error("Erro ao criar treino", {
        description: "Tente novamente ou verifique se você é o personal do aluno.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Criar Treino Personalizado
          </DialogTitle>
          <DialogDescription>Crie um treino personalizado e envie para seu aluno</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de Aluno */}
          <div className="space-y-2">
            <Label>Aluno *</Label>
            {loadingStudents ? (
              <LoadingState />
            ) : (
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={!!preSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.user_id} value={student.user_id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {student.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Informações do Treino */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Treino *</Label>
              <Input
                placeholder="Ex: Treino A - Peito e Tríceps"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Treino *</Label>
              <Select value={workoutType} onValueChange={setWorkoutType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                  <SelectItem value="forca">Força</SelectItem>
                  <SelectItem value="resistencia">Resistência</SelectItem>
                  <SelectItem value="funcional">Funcional</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exercícios */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-lg">Exercícios</Label>
              <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        Exercício
                      </CardTitle>
                      {exercises.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeExercise(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <Label className="text-xs">Nome do Exercício *</Label>
                        <Input
                          placeholder="Ex: Supino reto com barra"
                          value={exercise.name}
                          onChange={(e) => updateExercise(index, "name", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Séries *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(index, "sets", parseInt(e.target.value))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Repetições *</Label>
                        <Input
                          placeholder="Ex: 10-12"
                          value={exercise.reps}
                          onChange={(e) => updateExercise(index, "reps", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Carga (kg)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="Opcional"
                          value={exercise.weight || ""}
                          onChange={(e) =>
                            updateExercise(index, "weight", e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Descanso (seg)</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Ex: 60"
                          value={exercise.rest_time || ""}
                          onChange={(e) =>
                            updateExercise(index, "rest_time", e.target.value ? parseInt(e.target.value) : undefined)
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-xs">Observações</Label>
                        <Input
                          placeholder="Ex: Descer até 90 graus, manter costas no banco"
                          value={exercise.notes || ""}
                          onChange={(e) => updateExercise(index, "notes", e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                "Criando..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Criar Treino
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
