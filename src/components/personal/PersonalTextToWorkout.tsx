import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Wand2, User, Dumbbell, Save, CheckCircle, Edit3, Trash2, Plus, 
  ArrowLeft, Loader2, FileText, Sparkles 
} from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";

interface ParsedExercise {
  name: string;
  sets: number;
  reps: string;
  rest_time?: number;
  notes?: string;
}

interface ParsedWorkout {
  name: string;
  type: string;
  exercises: ParsedExercise[];
}

interface Student {
  user_id: string;
  name: string;
}

interface PersonalTextToWorkoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedStudentId?: string;
  onSuccess?: () => void;
}

export function PersonalTextToWorkout({
  open,
  onOpenChange,
  preSelectedStudentId,
  onSuccess,
}: PersonalTextToWorkoutProps) {
  const [step, setStep] = useState<"input" | "preview">("input");
  const [workoutText, setWorkoutText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedWorkouts, setParsedWorkouts] = useState<ParsedWorkout[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState(preSelectedStudentId || "");

  useEffect(() => {
    if (open) {
      fetchStudents();
      if (preSelectedStudentId) setSelectedStudentId(preSelectedStudentId);
    } else {
      // Reset on close
      setStep("input");
      setWorkoutText("");
      setParsedWorkouts([]);
    }
  }, [open, preSelectedStudentId]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, name")
        .order("name", { ascending: true });
      if (error) throw error;

      const studentsData = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id)
            .single();
          if (roleData?.role === "personal") return null;
          return profile as Student;
        })
      );
      setStudents(studentsData.filter((s): s is Student => s !== null));
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Erro ao carregar alunos");
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleParse = async () => {
    if (!workoutText.trim() || workoutText.trim().length < 5) {
      toast.error("Cole o treino no campo de texto (mínimo 5 caracteres)");
      return;
    }

    try {
      setParsing(true);
      const { data, error } = await supabase.functions.invoke("parse-workout-text", {
        body: { workoutText: workoutText.trim() },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (!data?.workouts || data.workouts.length === 0) {
        toast.error("Não foi possível identificar treinos no texto. Tente reformular.");
        return;
      }

      setParsedWorkouts(data.workouts);
      setStep("preview");
      toast.success("Treino organizado com sucesso! Revise antes de salvar.");
    } catch (error: any) {
      console.error("Error parsing workout:", error);
      toast.error("Erro ao processar treino. Tente novamente.");
    } finally {
      setParsing(false);
    }
  };

  const updateExercise = (workoutIdx: number, exIdx: number, field: keyof ParsedExercise, value: any) => {
    setParsedWorkouts(prev => {
      const updated = [...prev];
      updated[workoutIdx] = {
        ...updated[workoutIdx],
        exercises: updated[workoutIdx].exercises.map((ex, i) =>
          i === exIdx ? { ...ex, [field]: value } : ex
        ),
      };
      return updated;
    });
  };

  const removeExercise = (workoutIdx: number, exIdx: number) => {
    setParsedWorkouts(prev => {
      const updated = [...prev];
      updated[workoutIdx] = {
        ...updated[workoutIdx],
        exercises: updated[workoutIdx].exercises.filter((_, i) => i !== exIdx),
      };
      return updated;
    });
  };

  const addExercise = (workoutIdx: number) => {
    setParsedWorkouts(prev => {
      const updated = [...prev];
      updated[workoutIdx] = {
        ...updated[workoutIdx],
        exercises: [...updated[workoutIdx].exercises, { name: "", sets: 3, reps: "10-12", rest_time: 60 }],
      };
      return updated;
    });
  };

  const updateWorkoutName = (workoutIdx: number, name: string) => {
    setParsedWorkouts(prev => {
      const updated = [...prev];
      updated[workoutIdx] = { ...updated[workoutIdx], name };
      return updated;
    });
  };

  const updateWorkoutType = (workoutIdx: number, type: string) => {
    setParsedWorkouts(prev => {
      const updated = [...prev];
      updated[workoutIdx] = { ...updated[workoutIdx], type };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedStudentId) {
      toast.error("Selecione um aluno");
      return;
    }

    const validWorkouts = parsedWorkouts.filter(w => w.exercises.some(e => e.name.trim()));
    if (validWorkouts.length === 0) {
      toast.error("Nenhum treino válido para salvar");
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");

      for (const workout of validWorkouts) {
        const validExercises = workout.exercises.filter(e => e.name.trim());
        if (validExercises.length === 0) continue;

        const { data: workoutPlan, error: planError } = await supabase
          .from("workout_plans")
          .insert({
            name: workout.name,
            type: workout.type || "hipertrofia",
            user_id: selectedStudentId,
            created_by: "personal",
            created_by_user_id: user.id,
            approval_status: "approved",
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            is_active: true,
          })
          .select()
          .single();

        if (planError) throw planError;

        const exercisesData = validExercises.map((ex, idx) => ({
          workout_plan_id: workoutPlan.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest_time: ex.rest_time || 60,
          notes: ex.notes || null,
          order_in_workout: idx,
        }));

        const { error: exError } = await supabase.from("exercises").insert(exercisesData);
        if (exError) throw exError;
      }

      toast.success(
        `${validWorkouts.length > 1 ? `${validWorkouts.length} treinos criados` : "Treino criado"} com sucesso!`,
        { description: "O aluno já pode visualizar e utilizar." }
      );

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving workouts:", error);
      toast.error("Erro ao salvar treino. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const exampleText = `Treino A:\nSupino reto 4x10\nCrucifixo 3x12\nTríceps corda 3x12\n\nTreino B:\nAgachamento 4x10\nLeg press 3x12\nCadeira extensora 3x15`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto pb-24">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Texto para Treino com IA
          </DialogTitle>
          <DialogDescription>
            Cole o treino como texto livre e a IA organiza automaticamente
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-5">
            {/* Student selection */}
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
                    {students.map((s) => (
                      <SelectItem key={s.user_id} value={s.user_id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {s.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Text input */}
            <div className="space-y-2">
              <Label>Cole aqui o treino do aluno *</Label>
              <Textarea
                placeholder={exampleText}
                value={workoutText}
                onChange={(e) => setWorkoutText(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                💡 Escreva como mandaria por WhatsApp. A IA identifica exercícios, séries e repetições automaticamente.
              </p>
            </div>

            {/* Example */}
            <Card className="bg-muted/50 border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Exemplo de entrada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{exampleText}</pre>
              </CardContent>
            </Card>

            <Button 
              onClick={handleParse} 
              disabled={parsing || !workoutText.trim()} 
              className="w-full gap-2"
              size="lg"
            >
              {parsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Organizando treino...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Gerar Treino
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Back button */}
            <Button variant="ghost" size="sm" onClick={() => setStep("input")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar e editar texto
            </Button>

            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-sm font-medium">
                {parsedWorkouts.length > 1
                  ? `${parsedWorkouts.length} treinos identificados! Revise e salve.`
                  : "Treino organizado! Revise e salve."}
              </p>
            </div>

            {parsedWorkouts.map((workout, wIdx) => (
              <Card key={wIdx}>
                <CardHeader className="pb-3">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        <Dumbbell className="h-3 w-3 mr-1" />
                        {wIdx + 1}
                      </Badge>
                      <Input
                        value={workout.name}
                        onChange={(e) => updateWorkoutName(wIdx, e.target.value)}
                        className="font-semibold"
                      />
                    </div>
                    <Select value={workout.type} onValueChange={(v) => updateWorkoutType(wIdx, v)}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
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
                </CardHeader>
                <CardContent className="space-y-3">
                  {workout.exercises.map((ex, eIdx) => (
                    <div key={eIdx} className="p-3 bg-muted/30 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex-shrink-0">{eIdx + 1}</Badge>
                        <Input
                          value={ex.name}
                          onChange={(e) => updateExercise(wIdx, eIdx, "name", e.target.value)}
                          placeholder="Nome do exercício"
                          className="text-sm flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 h-8 w-8"
                          onClick={() => removeExercise(wIdx, eIdx)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 pl-9">
                        <Input
                          type="number"
                          value={ex.sets}
                          onChange={(e) => updateExercise(wIdx, eIdx, "sets", parseInt(e.target.value) || 0)}
                          className="w-14 text-sm text-center"
                          min={1}
                        />
                        <span className="text-xs text-muted-foreground">x</span>
                        <Input
                          value={ex.reps}
                          onChange={(e) => updateExercise(wIdx, eIdx, "reps", e.target.value)}
                          className="w-20 text-sm text-center"
                          placeholder="reps"
                        />
                        <span className="text-xs text-muted-foreground mx-1">|</span>
                        <span className="text-xs text-muted-foreground">⏱</span>
                        <Input
                          type="number"
                          value={ex.rest_time || 60}
                          onChange={(e) => updateExercise(wIdx, eIdx, "rest_time", parseInt(e.target.value) || 0)}
                          className="w-14 text-sm text-center"
                          min={0}
                          title="Descanso (segundos)"
                        />
                        <span className="text-xs text-muted-foreground">seg</span>
                      </div>
                    </div>
                  ))}

                  <Button variant="ghost" size="sm" onClick={() => addExercise(wIdx)} className="w-full gap-1 text-muted-foreground">
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar exercício
                  </Button>
                </CardContent>
              </Card>
            ))}

            {/* Save */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar {parsedWorkouts.length > 1 ? `${parsedWorkouts.length} Treinos` : "Treino"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
