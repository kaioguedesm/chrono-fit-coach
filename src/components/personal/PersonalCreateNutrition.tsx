import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Apple, Save, Loader2, Sparkles } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";

interface Student {
  user_id: string;
  name: string;
  avatar_url?: string;
}

interface PersonalCreateNutritionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedStudentId?: string;
  onSuccess?: () => void;
}

const dietTypes = [
  { value: "emagrecimento", label: "🔥 Emagrecimento", description: "Déficit calórico para perda de peso" },
  { value: "hipertrofia", label: "💪 Hipertrofia", description: "Superávit para ganho de massa" },
  { value: "definicao", label: "⚡ Definição", description: "Manutenção com alta proteína" },
  { value: "manutencao", label: "🎯 Manutenção", description: "Equilíbrio calórico" },
  { value: "low-carb", label: "🥑 Low Carb", description: "Baixo carboidrato, alto gordura" },
  { value: "vegetariana", label: "🥗 Vegetariana", description: "Sem carnes" },
  { value: "vegana", label: "🌱 Vegana", description: "Sem produtos animais" },
];

const mealsOptions = [
  { value: "3", label: "3 refeições", description: "Café, almoço e jantar" },
  { value: "4", label: "4 refeições", description: "+ 1 lanche" },
  { value: "5", label: "5 refeições", description: "+ 2 lanches" },
  { value: "6", label: "6 refeições", description: "Completo com ceia" },
];

const commonRestrictions = [
  { id: "lactose", label: "Sem Lactose" },
  { id: "gluten", label: "Sem Glúten" },
  { id: "nuts", label: "Sem Oleaginosas" },
  { id: "seafood", label: "Sem Frutos do Mar" },
];

export function PersonalCreateNutrition({
  open,
  onOpenChange,
  preSelectedStudentId,
  onSuccess,
}: PersonalCreateNutritionProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingStudentProfile, setLoadingStudentProfile] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(preSelectedStudentId || "");
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [dietType, setDietType] = useState("emagrecimento");
  const [mealsPerDay, setMealsPerDay] = useState("5");
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [favoritesFoods, setFavoritesFoods] = useState("");
  const [dislikedFoods, setDislikedFoods] = useState("");
  const [mealTiming, setMealTiming] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [preparationTime, setPreparationTime] = useState("moderado");

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

      // Filtrar apenas alunos (não personal trainers)
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

      // Preencher restrições do aluno automaticamente
      if (data.dietary_restrictions && Array.isArray(data.dietary_restrictions)) {
        setRestrictions(data.dietary_restrictions);
      }
    } catch (error) {
      console.error("Error fetching student profile:", error);
      toast.error("Erro ao carregar perfil do aluno");
    } finally {
      setLoadingStudentProfile(false);
    }
  };

  const handleRestrictionToggle = (restrictionId: string) => {
    setRestrictions((prev) =>
      prev.includes(restrictionId) ? prev.filter((r) => r !== restrictionId) : [...prev, restrictionId],
    );
  };

  const calculateIMC = () => {
    if (studentProfile?.weight && studentProfile?.height) {
      const heightInM = studentProfile.height / 100;
      return (studentProfile.weight / (heightInM * heightInM)).toFixed(1);
    }
    return null;
  };

  const generateNutritionPlan = async () => {
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

      const imc = calculateIMC();
      const selectedDiet = dietTypes.find((d) => d.value === dietType);

      const { data: functionData, error: functionError } = await supabase.functions.invoke("generate-nutrition", {
        body: {
          dietType,
          dietDescription: selectedDiet?.description,
          mealsPerDay: parseInt(mealsPerDay),
          restrictions: restrictions.length > 0 ? restrictions : [],
          userPreferences: {
            favoritesFoods: favoritesFoods.trim(),
            dislikedFoods: dislikedFoods.trim(),
            mealTiming: mealTiming.trim(),
            specialNotes: specialNotes.trim(),
            preparationTime,
          },
          userProfile: {
            weight: studentProfile.weight,
            height: studentProfile.height,
            age: studentProfile.age,
            gender: studentProfile.gender,
            goal: studentProfile.goal,
            imc: imc ? parseFloat(imc) : null,
            dietaryPreferences: studentProfile.dietary_preferences || [],
            dietaryRestrictions: studentProfile.dietary_restrictions || [],
          },
        },
      });

      if (functionError) throw functionError;

      if (!functionData || !functionData.planName || !functionData.meals) {
        throw new Error("Resposta inválida da IA");
      }

      // Criar plano nutricional para o aluno selecionado
      const { data: plan, error: planError } = await supabase
        .from("nutrition_plans")
        .insert({
          user_id: selectedStudentId, // Atribuir ao aluno selecionado
          title: functionData.planName,
          description: functionData.description,
          created_by: "ai",
          approval_status: "approved", // Já aprovado pois foi criado pelo personal
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Criar refeições
      const mealsData = functionData.meals.map((meal: any) => ({
        nutrition_plan_id: plan.id,
        meal_type: meal.meal_type,
        name: meal.name,
        ingredients: meal.ingredients,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        instructions: meal.instructions || null,
      }));

      const { error: mealsError } = await supabase.from("meals").insert(mealsData);

      if (mealsError) throw mealsError;

      toast.success("Plano nutricional criado com sucesso!", {
        description: `A dieta "${functionData.planName}" foi atribuída ao aluno e já está ativa.`,
      });

      // Resetar formulário
      setDietType("emagrecimento");
      setMealsPerDay("5");
      setRestrictions([]);
      setFavoritesFoods("");
      setDislikedFoods("");
      setMealTiming("");
      setSpecialNotes("");
      setPreparationTime("moderado");
      if (!preSelectedStudentId) {
        setSelectedStudentId("");
        setStudentProfile(null);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error generating nutrition plan:", error);
      toast.error("Erro ao criar plano nutricional", {
        description: error.message || "Tente novamente ou verifique se você é o personal do aluno.",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-primary" />
            Criar Plano Nutricional com IA
          </DialogTitle>
          <DialogDescription>Gere uma dieta personalizada com IA e atribua a um aluno específico</DialogDescription>
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

          {/* Informações do Aluno */}
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
                  {studentProfile.weight && (
                    <div>
                      <span className="text-muted-foreground">Peso: </span>
                      <span className="font-medium">{studentProfile.weight}kg</span>
                    </div>
                  )}
                  {studentProfile.height && (
                    <div>
                      <span className="text-muted-foreground">Altura: </span>
                      <span className="font-medium">{studentProfile.height}cm</span>
                    </div>
                  )}
                  {studentProfile.age && (
                    <div>
                      <span className="text-muted-foreground">Idade: </span>
                      <span className="font-medium">{studentProfile.age} anos</span>
                    </div>
                  )}
                </div>
                {studentProfile.dietary_restrictions && studentProfile.dietary_restrictions.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm text-muted-foreground">Restrições: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {studentProfile.dietary_restrictions.map((r: string) => (
                        <Badge key={r} variant="outline" className="text-xs">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : selectedStudentId ? (
            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Selecione um aluno para carregar o perfil e gerar a dieta personalizada.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* Configurações da Dieta */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">Tipo de Dieta</Label>
              <div className="grid grid-cols-1 gap-2">
                {dietTypes.map((diet) => (
                  <button
                    key={diet.value}
                    onClick={() => setDietType(diet.value)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      dietType === diet.value
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-muted hover:border-primary/50 bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{diet.label}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{diet.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="meals">Número de Refeições por Dia</Label>
              <Select value={mealsPerDay} onValueChange={setMealsPerDay}>
                <SelectTrigger id="meals">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mealsOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">Restrições Alimentares</Label>
              <div className="space-y-2">
                {commonRestrictions.map((restriction) => (
                  <div key={restriction.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={restriction.id}
                      checked={restrictions.includes(restriction.id)}
                      onCheckedChange={() => handleRestrictionToggle(restriction.id)}
                    />
                    <Label htmlFor={restriction.id} className="text-sm font-normal cursor-pointer">
                      {restriction.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Personalizações Adicionais (Opcional)
              </Label>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-muted">
                <div>
                  <Label htmlFor="favorites" className="text-sm">
                    Alimentos favoritos
                  </Label>
                  <Textarea
                    id="favorites"
                    placeholder="Ex: Frango grelhado, batata doce, abacate..."
                    value={favoritesFoods}
                    onChange={(e) => setFavoritesFoods(e.target.value)}
                    className="mt-1 min-h-[60px]"
                  />
                </div>

                <div>
                  <Label htmlFor="dislikes" className="text-sm">
                    Alimentos que não gosta
                  </Label>
                  <Textarea
                    id="dislikes"
                    placeholder="Ex: Brócolis, couve-flor..."
                    value={dislikedFoods}
                    onChange={(e) => setDislikedFoods(e.target.value)}
                    className="mt-1 min-h-[60px]"
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm">
                    Observações especiais
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Ex: Prefere receitas rápidas, gosta de variedade..."
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    className="mt-1 min-h-[70px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
              Cancelar
            </Button>
            <Button onClick={generateNutritionPlan} disabled={generating || !selectedStudentId || !studentProfile}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Gerar e Atribuir Dieta
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
