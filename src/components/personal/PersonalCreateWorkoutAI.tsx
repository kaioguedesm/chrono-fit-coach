import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Dumbbell, Save, Loader2, Sparkles, Target, Wand2 } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";

interface Student {
  user_id: string;
  name: string;
  avatar_url?: string;
}

interface PersonalCreateWorkoutAIProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedStudentId?: string;
  onSuccess?: () => void;
}

const muscleGroups = [
  { value: "peito", label: "💪 Peito", emoji: "💪", description: "Desenvolvimento peitoral completo" },
  { value: "costas", label: "🏋️ Costas", emoji: "🏋️", description: "Largura e espessura dorsal" },
  { value: "pernas", label: "🦵 Pernas", emoji: "🦵", description: "Quadríceps, posterior e glúteos" },
  { value: "ombros", label: "💪 Ombros", emoji: "💪", description: "Deltoides completos" },
  { value: "bracos", label: "💪 Braços", emoji: "💪", description: "Bíceps e tríceps" },
  { value: "abdomen", label: "🔥 Abdômen", emoji: "🔥", description: "Core e estabilidade" },
  { value: "corpo-inteiro", label: "⚡ Corpo Inteiro", emoji: "⚡", description: "Treino completo full-body" },
  { value: "superiores", label: "💪 Superiores", emoji: "💪", description: "Peito, costas, ombros e braços" },
  { value: "inferiores", label: "🦵 Inferiores", emoji: "🦵", description: "Pernas, glúteos e panturrilhas" },
];

export function PersonalCreateWorkoutAI({
  open,
  onOpenChange,
  preSelectedStudentId,
  onSuccess,
}: PersonalCreateWorkoutAIProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingStudentProfile, setLoadingStudentProfile] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(preSelectedStudentId || "");
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [muscleGroup, setMuscleGroup] = useState("peito");
  const [duration, setDuration] = useState("60");
  const [customDescription, setCustomDescription] = useState("");

  useEffect(() => {
    if (open) {
      fetchStudents();
      if (preSelectedStudentId) {
        setSelectedStudentId(preSelectedStudentId);
        fetchStudentProfile(preSelectedStudentId);
      }
    }
  }, [open, preSelectedStudentId]);

  useEffect(() => {
    if (selectedStudentId && selectedStudentId !== preSelectedStudentId) {
      fetchStudentProfile(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .order("name", { ascending: true });

      if (error) throw error;

      const studentsData = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id)
            .single();

          if (roleData?.role === "personal") {
            return null;
          }

          return profile as Student;
        }),
      );

      setStudents(studentsData.filter((s): s is Student => s !== null));
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Erro ao carregar alunos");
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchStudentProfile = async (studentId: string) => {
    try {
      setLoadingStudentProfile(true);
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", studentId).single();

      if (error) throw error;
      setStudentProfile(data);
    } catch (error) {
      console.error("Error fetching student profile:", error);
      toast.error("Erro ao carregar perfil do aluno");
    } finally {
      setLoadingStudentProfile(false);
    }
  };

  const generateWorkout = async () => {
    if (!selectedStudentId) {
      toast.error("Selecione um aluno");
      return;
    }

    if (!studentProfile) {
      toast.error("Carregue o perfil do aluno primeiro");
      return;
    }

    setGenerating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const selectedGroup = muscleGroups.find((g) => g.value === muscleGroup);
      const userGoal = studentProfile.goal || "hipertrofia";
      const userExperience = studentProfile.experience_level || "intermediário";

      const { data: functionData, error: functionError } = await supabase.functions.invoke("generate-workout", {
        body: {
          goal: userGoal,
          experience: userExperience,
          muscleGroup: selectedGroup?.label || "Peito",
          muscleGroupDescription: selectedGroup?.description || "",
          duration: parseInt(duration),
          equipment: "equipamentos de academia completa",
          userWeight: studentProfile.weight || null,
          userAge: studentProfile.age || null,
          customDescription: customDescription.trim() || null,
        },
      });

      if (functionError) throw functionError;

      if (!functionData || !functionData.workoutName || !functionData.exercises) {
        throw new Error("Resposta inválida da IA");
      }

      const { data: plan, error: planError } = await supabase
        .from("workout_plans")
        .insert({
          user_id: selectedStudentId,
          name: functionData.workoutName,
          type: muscleGroup,
          created_by: "ai",
          created_by_user_id: user.id,
          approval_status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (planError) throw planError;

      const exercisesData = functionData.exercises.map((ex: any, index: number) => ({
        workout_plan_id: plan.id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight || null,
        rest_time: ex.rest_time || null,
        notes: ex.notes || null,
        order_in_workout: index + 1,
      }));

      const { error: exercisesError } = await supabase.from("exercises").insert(exercisesData);

      if (exercisesError) throw exercisesError;

      toast.success("Treino criado com sucesso!", {
        description: `O treino "${functionData.workoutName}" foi atribuído ao aluno e já está ativo.`,
      });

      setMuscleGroup("peito");
      setDuration("60");
      setCustomDescription("");
      if (!preSelectedStudentId) {
        setSelectedStudentId("");
        setStudentProfile(null);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error generating workout:", error);
      toast.error("Erro ao criar treino", {
        description: error.message || "Tente novamente ou verifique se você é o personal do aluno.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const selectedMuscleGroup = muscleGroups.find((g) => g.value === muscleGroup);
  const userGoal = studentProfile?.goal || "hipertrofia";
  const userExperience = studentProfile?.experience_level || "intermediário";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto pb-24">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Criar Treino com IA
          </DialogTitle>
          <DialogDescription>Gere um treino personalizado com IA e atribua a um aluno específico</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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

          {loadingStudentProfile ? (
            <LoadingState />
          ) : studentProfile ? (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Perfil do Aluno</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {studentProfile.goal && (
                    <div>
                      <span className="text-muted-foreground">Objetivo: </span>
                      <span className="font-medium">{studentProfile.goal}</span>
                    </div>
                  )}
                  {studentProfile.experience_level && (
                    <div>
                      <span className="text-muted-foreground">Nível: </span>
                      <span className="font-medium">{studentProfile.experience_level}</span>
                    </div>
                  )}
                  {studentProfile.weight && (
                    <div>
                      <span className="text-muted-foreground">Peso: </span>
                      <span className="font-medium">{studentProfile.weight}kg</span>
                    </div>
                  )}
                  {studentProfile.age && (
                    <div>
                      <span className="text-muted-foreground">Idade: </span>
                      <span className="font-medium">{studentProfile.age} anos</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap mt-3">
                  <Badge variant="outline" className="gap-1">
                    <Target className="w-3 h-3" />
                    Objetivo: {userGoal}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Dumbbell className="w-3 h-3" />
                    Nível: {userExperience}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ) : selectedStudentId ? (
            <Card className="border-muted bg-muted/30">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Selecione um aluno para carregar o perfil e gerar o treino personalizado.
                </p>
              </CardContent>
            </Card>
          ) : null}

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
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-muted hover:border-primary/50 bg-background"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{group.emoji}</span>
                      <span className="font-medium text-sm">{group.label.replace(group.emoji, "").trim()}</span>
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
                Descreva o treino ideal para o aluno (opcional)
              </Label>
              <Textarea
                id="custom-description"
                placeholder="Ex: Focar em exercícios compostos, preferir halteres, incluir variações para dor no ombro, incluir drop sets..."
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                className="min-h-[100px] resize-none bg-background/50 border-primary/20 focus:border-primary/50 transition-colors"
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Seja específico! A IA vai personalizar ainda mais o treino.
                </p>
                <span className="text-xs text-muted-foreground">{customDescription.length}/500</span>
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

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
              Cancelar
            </Button>
            <Button onClick={generateWorkout} disabled={generating || !selectedStudentId || !studentProfile}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Gerar e Atribuir Treino
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
