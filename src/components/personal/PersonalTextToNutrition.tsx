import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Wand2, User, Save, CheckCircle, Trash2, Plus,
  ArrowLeft, Loader2, Sparkles, AlertTriangle,
} from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";

interface ParsedMeal {
  meal_type: string;
  name: string;
  ingredients: string[];
  instructions: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface ParsedDiet {
  plan_title: string;
  description: string;
  total_daily: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  suggestions: string | null;
  meals: ParsedMeal[];
}

interface Student {
  user_id: string;
  name: string;
}

interface PersonalTextToNutritionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedStudentId?: string;
  onSuccess?: () => void;
}

const mealTypeLabels: Record<string, string> = {
  cafe_da_manha: "Café da Manhã",
  lanche_manha: "Lanche da Manhã",
  almoco: "Almoço",
  lanche_tarde: "Lanche da Tarde",
  jantar: "Jantar",
  ceia: "Ceia",
};

export function PersonalTextToNutrition({
  open,
  onOpenChange,
  preSelectedStudentId,
  onSuccess,
}: PersonalTextToNutritionProps) {
  const [step, setStep] = useState<"input" | "preview">("input");
  const [foodsText, setFoodsText] = useState("");
  const [goal, setGoal] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState("4");
  const [restrictions, setRestrictions] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedDiet, setParsedDiet] = useState<ParsedDiet | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState(preSelectedStudentId || "");
  const [refinementText, setRefinementText] = useState("");
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    if (open) {
      fetchStudents();
      if (preSelectedStudentId) setSelectedStudentId(preSelectedStudentId);
    } else {
      resetForm();
    }
  }, [open, preSelectedStudentId]);

  // Auto-fill student data when selected
  useEffect(() => {
    if (selectedStudentId && open) {
      loadStudentProfile(selectedStudentId);
    }
  }, [selectedStudentId, open]);

  const resetForm = () => {
    setStep("input");
    setFoodsText("");
    setGoal("");
    setWeight("");
    setHeight("");
    setAge("");
    setActivityLevel("");
    setMealsPerDay("4");
    setRestrictions("");
    setParsedDiet(null);
    setRefinementText("");
  };

  const loadStudentProfile = async (studentId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("weight, height, age, goal, dietary_restrictions")
        .eq("user_id", studentId)
        .single();

      if (profile) {
        if (profile.weight) setWeight(String(profile.weight));
        if (profile.height) setHeight(String(profile.height));
        if (profile.age) setAge(String(profile.age));
        if (profile.goal) {
          const goalMap: Record<string, string> = {
            emagrecimento: "emagrecimento",
            hipertrofia: "ganho_de_massa",
            resistencia: "manutencao",
            mobilidade: "manutencao",
          };
          setGoal(goalMap[profile.goal] || "");
        }
        if (profile.dietary_restrictions?.length) {
          setRestrictions(profile.dietary_restrictions.join(", "));
        }
      }
    } catch (err) {
      console.warn("Could not load student profile:", err);
    }
  };

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
    if (!foodsText.trim() || foodsText.trim().length < 3) {
      toast.error("Descreva os alimentos da dieta");
      return;
    }
    if (!goal) { toast.error("Selecione o objetivo"); return; }
    if (!weight || Number(weight) < 20) { toast.error("Informe o peso do aluno"); return; }
    if (!height || Number(height) < 50) { toast.error("Informe a altura do aluno"); return; }
    if (!age || Number(age) < 10) { toast.error("Informe a idade do aluno"); return; }
    if (!activityLevel) { toast.error("Selecione o nível de atividade"); return; }

    try {
      setParsing(true);
      const { data, error } = await supabase.functions.invoke("parse-diet-text", {
        body: {
          foodsText: foodsText.trim(),
          goal,
          weight: Number(weight),
          height: Number(height),
          age: Number(age),
          activityLevel,
          mealsPerDay: Number(mealsPerDay),
          restrictions: restrictions.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(typeof data.error === "string" ? data.error : "Erro ao processar dieta");
        return;
      }

      if (!data?.meals || data.meals.length === 0) {
        toast.error("Não foi possível gerar a dieta. Tente reformular.");
        return;
      }

      setParsedDiet(data);
      setStep("preview");
      toast.success("Dieta gerada com sucesso! Revise antes de salvar.");
    } catch (error: any) {
      console.error("Error parsing diet:", error);
      toast.error("Erro ao processar dieta. Tente novamente.");
    } finally {
      setParsing(false);
    }
  };

  const updateMeal = (idx: number, field: keyof ParsedMeal, value: any) => {
    if (!parsedDiet) return;
    setParsedDiet({
      ...parsedDiet,
      meals: parsedDiet.meals.map((m, i) => i === idx ? { ...m, [field]: value } : m),
    });
  };

  const removeMeal = (idx: number) => {
    if (!parsedDiet) return;
    setParsedDiet({
      ...parsedDiet,
      meals: parsedDiet.meals.filter((_, i) => i !== idx),
    });
  };

  const updateIngredient = (mealIdx: number, ingIdx: number, value: string) => {
    if (!parsedDiet) return;
    const meals = [...parsedDiet.meals];
    const ingredients = [...meals[mealIdx].ingredients];
    ingredients[ingIdx] = value;
    meals[mealIdx] = { ...meals[mealIdx], ingredients };
    setParsedDiet({ ...parsedDiet, meals });
  };

  const removeIngredient = (mealIdx: number, ingIdx: number) => {
    if (!parsedDiet) return;
    const meals = [...parsedDiet.meals];
    meals[mealIdx] = {
      ...meals[mealIdx],
      ingredients: meals[mealIdx].ingredients.filter((_, i) => i !== ingIdx),
    };
    setParsedDiet({ ...parsedDiet, meals });
  };

  const addIngredient = (mealIdx: number) => {
    if (!parsedDiet) return;
    const meals = [...parsedDiet.meals];
    meals[mealIdx] = {
      ...meals[mealIdx],
      ingredients: [...meals[mealIdx].ingredients, ""],
    };
    setParsedDiet({ ...parsedDiet, meals });
  };

  const handleSave = async () => {
    if (!selectedStudentId) { toast.error("Selecione um aluno"); return; }
    if (!parsedDiet || parsedDiet.meals.length === 0) { toast.error("Nenhuma refeição para salvar"); return; }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");

      // Create nutrition plan
      const { data: plan, error: planError } = await supabase
        .from("nutrition_plans")
        .insert({
          title: parsedDiet.plan_title || "Plano Alimentar",
          description: parsedDiet.description || null,
          user_id: selectedStudentId,
          created_by: "personal",
          approval_status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create meals
      const mealsData = parsedDiet.meals
        .filter(m => m.name.trim() && m.ingredients.length > 0)
        .map(m => ({
          nutrition_plan_id: plan.id,
          meal_type: m.meal_type,
          name: m.name,
          ingredients: m.ingredients.filter(i => i.trim()),
          instructions: m.instructions || null,
          calories: m.calories || null,
          protein: m.protein || null,
          carbs: m.carbs || null,
          fat: m.fat || null,
        }));

      if (mealsData.length > 0) {
        const { error: mealsError } = await supabase.from("meals").insert(mealsData);
        if (mealsError) throw mealsError;
      }

      toast.success("Dieta criada e enviada para o aluno!", {
        description: "O aluno já pode visualizar no app.",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving diet:", error);
      toast.error("Erro ao salvar dieta. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto pb-24">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Texto para Dieta com IA
          </DialogTitle>
          <DialogDescription>
            Descreva os alimentos e a IA monta uma dieta completa e calculada
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4">
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

            {/* Student data fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Objetivo *</Label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                    <SelectItem value="ganho_de_massa">Ganho de Massa</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nível de Atividade *</Label>
                <Select value={activityLevel} onValueChange={setActivityLevel}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixo">Baixo</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Peso (kg) *</Label>
                <Input type="number" placeholder="75" value={weight} onChange={e => setWeight(e.target.value)} min={20} max={500} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Altura (cm) *</Label>
                <Input type="number" placeholder="175" value={height} onChange={e => setHeight(e.target.value)} min={50} max={300} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Idade *</Label>
                <Input type="number" placeholder="25" value={age} onChange={e => setAge(e.target.value)} min={10} max={120} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Refeições/dia *</Label>
                <Select value={mealsPerDay} onValueChange={setMealsPerDay}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 refeições</SelectItem>
                    <SelectItem value="4">4 refeições</SelectItem>
                    <SelectItem value="5">5 refeições</SelectItem>
                    <SelectItem value="6">6 refeições</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Restrições alimentares</Label>
              <Input placeholder="Ex: intolerância à lactose, vegetariano..." value={restrictions} onChange={e => setRestrictions(e.target.value)} />
            </div>

            {/* Foods text */}
            <div className="space-y-2">
              <Label>Descreva os alimentos da dieta *</Label>
              <Textarea
                placeholder="Ex: pão, ovo, banana, arroz, feijão, frango, carne, salada, batata doce, aveia..."
                value={foodsText}
                onChange={(e) => setFoodsText(e.target.value)}
                rows={4}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                💡 Escreva os alimentos de forma simples. A IA organiza em refeições e calcula os macros automaticamente.
              </p>
            </div>

            <Button
              onClick={handleParse}
              disabled={parsing || !foodsText.trim()}
              className="w-full gap-2"
              size="lg"
            >
              {parsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando dieta...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Gerar Dieta
                </>
              )}
            </Button>
          </div>
        ) : parsedDiet ? (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep("input")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar e editar
            </Button>

            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-sm font-medium">Dieta gerada! Revise e salve.</p>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <Label className="text-xs">Título do plano</Label>
              <Input
                value={parsedDiet.plan_title}
                onChange={e => setParsedDiet({ ...parsedDiet, plan_title: e.target.value })}
              />
            </div>

            {/* Total daily macros */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Totais Diários Estimados</p>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-primary">{parsedDiet.total_daily.calories}</div>
                    <div className="text-xs text-muted-foreground">kcal</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{parsedDiet.total_daily.protein}g</div>
                    <div className="text-xs text-muted-foreground">Proteína</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">{parsedDiet.total_daily.carbs}g</div>
                    <div className="text-xs text-muted-foreground">Carbo</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-600">{parsedDiet.total_daily.fat}g</div>
                    <div className="text-xs text-muted-foreground">Gordura</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suggestions */}
            {parsedDiet.suggestions && (
              <div className="flex gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">{parsedDiet.suggestions}</p>
              </div>
            )}

            {/* Meals */}
            {parsedDiet.meals.map((meal, mIdx) => (
              <Card key={mIdx}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {mealTypeLabels[meal.meal_type] || meal.meal_type}
                      </Badge>
                      <Input
                        value={meal.name}
                        onChange={e => updateMeal(mIdx, "name", e.target.value)}
                        className="text-sm font-medium"
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeMeal(mIdx)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  {/* Meal macros */}
                  <div className="flex gap-3 text-xs text-muted-foreground pt-1">
                    <span>{meal.calories || 0} kcal</span>
                    <span>P: {meal.protein || 0}g</span>
                    <span>C: {meal.carbs || 0}g</span>
                    <span>G: {meal.fat || 0}g</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {meal.ingredients.map((ing, iIdx) => (
                    <div key={iIdx} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{iIdx + 1}</span>
                      <Input
                        value={ing}
                        onChange={e => updateIngredient(mIdx, iIdx, e.target.value)}
                        className="text-sm flex-1"
                        placeholder="Alimento + quantidade"
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeIngredient(mIdx, iIdx)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => addIngredient(mIdx)} className="w-full gap-1 text-xs text-muted-foreground">
                    <Plus className="h-3 w-3" />
                    Adicionar ingrediente
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
                    Salvar Dieta
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
