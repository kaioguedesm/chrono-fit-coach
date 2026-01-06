import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  User,
  Search,
  Dumbbell,
  Apple,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Plus,
  UserMinus,
  Loader2,
} from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StudentProfile {
  user_id: string;
  name: string;
  avatar_url?: string;
  goal?: string;
  experience_level?: string;
  weight?: number;
  height?: number;
  age?: number;
  created_at: string;
  gender?: string;
  id: string;
  updated_at: string;
  dietary_preferences?: string[];
  dietary_restrictions?: string[];
  stats?: {
    totalWorkouts: number;
    pendingWorkouts: number;
    approvedWorkouts: number;
    rejectedWorkouts: number;
    totalNutrition: number;
    pendingNutrition: number;
  };
}

export default function PersonalStudents() {
  const navigate = useNavigate();
  const { isPersonal, loading: roleLoading } = useUserRole();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<StudentProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loadingAvailableStudents, setLoadingAvailableStudents] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<StudentProfile | null>(null);
  const [removingStudent, setRemovingStudent] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isPersonal) {
      toast.error("Acesso negado", {
        description: "Você não tem permissão para acessar esta área.",
      });
      navigate("/dashboard");
    }
  }, [isPersonal, roleLoading, navigate]);

  useEffect(() => {
    if (isPersonal) {
      fetchStudents();
    }
  }, [isPersonal]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStudents(
        students.filter(
          (student) =>
            student.name.toLowerCase().includes(query) ||
            student.goal?.toLowerCase().includes(query) ||
            student.experience_level?.toLowerCase().includes(query),
        ),
      );
    }
  }, [searchQuery, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      // Buscar o ID do personal trainer logado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar alunos vinculados na tabela personal_students
      const { data: linkedStudents, error: linkedError } = await supabase
        .from("personal_students")
        .select("student_id, created_at, notes, is_active")
        .eq("personal_id", user.id)
        .eq("is_active", true);

      if (linkedError) throw linkedError;

      if (!linkedStudents || linkedStudents.length === 0) {
        setStudents([]);
        setFilteredStudents([]);
        return;
      }

      // Buscar perfis dos alunos vinculados
      const studentIds = linkedStudents.map((ls) => ls.student_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", studentIds);

      if (profilesError) throw profilesError;

      // Para cada perfil, buscar estatísticas de treinos e dietas
      const studentsWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Buscar estatísticas de treinos
          const { data: workouts } = await supabase
            .from("workout_plans")
            .select("approval_status")
            .eq("user_id", profile.user_id)
            .eq("created_by", "ai");

          // Buscar estatísticas de nutrição
          const { data: nutrition } = await supabase
            .from("nutrition_plans")
            .select("approval_status")
            .eq("user_id", profile.user_id)
            .eq("created_by", "ai");

          const workoutStats = {
            totalWorkouts: workouts?.length || 0,
            pendingWorkouts: workouts?.filter((w) => w.approval_status === "pending").length || 0,
            approvedWorkouts: workouts?.filter((w) => w.approval_status === "approved").length || 0,
            rejectedWorkouts: workouts?.filter((w) => w.approval_status === "rejected").length || 0,
            totalNutrition: nutrition?.length || 0,
            pendingNutrition: nutrition?.filter((n) => n.approval_status === "pending").length || 0,
          };

          return {
            ...profile,
            stats: workoutStats,
          };
        }),
      );

      // Ordenar por pendências
      const sortedStudents = studentsWithStats.sort((a, b) => {
        const aPending = (a.stats?.pendingWorkouts || 0) + (a.stats?.pendingNutrition || 0);
        const bPending = (b.stats?.pendingWorkouts || 0) + (b.stats?.pendingNutrition || 0);
        return bPending - aPending;
      });

      setStudents(sortedStudents as StudentProfile[]);
      setFilteredStudents(sortedStudents as StudentProfile[]);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      setLoadingAvailableStudents(true);

      // Buscar o ID do personal trainer logado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      console.log("🔍 [fetchAvailableStudents] Personal trainer ID:", user.id);

      // Buscar alunos já vinculados
      const { data: linkedStudents, error: linkedError } = await supabase
        .from("personal_students")
        .select("student_id")
        .eq("personal_id", user.id)
        .eq("is_active", true);

      if (linkedError) {
        console.error("❌ Erro ao buscar alunos vinculados:", linkedError);
      }

      const linkedStudentIds = linkedStudents?.map((ls) => ls.student_id) || [];
      console.log("📋 Alunos já vinculados:", linkedStudentIds);

      // Buscar todos os perfis de usuários (exceto personal trainers)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url, goal, experience_level")
        .order("name", { ascending: true });

      if (profilesError) {
        console.error("❌ Erro ao buscar perfis:", profilesError);
        throw profilesError;
      }

      console.log("👥 Total de perfis encontrados:", profiles?.length || 0);

      // Filtrar apenas alunos não vinculados e que não sejam personal trainers
      const available = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Verificar se não é personal trainer (usar maybeSingle porque usuários comuns não têm registro)
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id)
            .maybeSingle();

          if (roleError) {
            console.warn("⚠️ Erro ao buscar role para", profile.user_id, ":", roleError);
          }

          console.log(`👤 Perfil: ${profile.name} (${profile.user_id}) - Role:`, roleData?.role || "sem role");

          // Se tiver role 'personal', não é aluno
          if (roleData?.role === "personal") {
            console.log(`  ❌ É personal trainer, ignorando`);
            return null;
          }

          // Verificar se já está vinculado
          if (linkedStudentIds.includes(profile.user_id)) {
            console.log(`  ❌ Já está vinculado, ignorando`);
            return null;
          }

          // Usuário comum sem role ou com role 'user' = pode ser aluno
          console.log(`  ✅ Disponível para vincular`);
          return profile as StudentProfile;
        }),
      );

      const filtered = available.filter((s): s is NonNullable<typeof s> => s !== null);
      console.log("✅ Alunos disponíveis para vincular:", filtered.length);
      console.log(
        "📝 Lista:",
        filtered.map((s) => ({ name: s.name, user_id: s.user_id })),
      );

      setAvailableStudents(filtered);
    } catch (error) {
      console.error("❌ Error fetching available students:", error);
      toast.error("Erro ao carregar alunos disponíveis");
    } finally {
      setLoadingAvailableStudents(false);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedStudentId) {
      toast.error("Selecione um aluno");
      return;
    }

    try {
      setAddingStudent(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("personal_students").insert({
        personal_id: user.id,
        student_id: selectedStudentId,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Aluno vinculado com sucesso!");
      setShowAddStudentDialog(false);
      setSelectedStudentId("");
      fetchStudents();
    } catch (error: any) {
      console.error("Error adding student:", error);
      if (error.code === "23505") {
        toast.error("Este aluno já está vinculado");
      } else {
        toast.error("Erro ao vincular aluno");
      }
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!studentToRemove) return;

    try {
      setRemovingStudent(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("personal_students")
        .update({ is_active: false })
        .eq("personal_id", user.id)
        .eq("student_id", studentToRemove.user_id);

      if (error) throw error;

      toast.success("Aluno desvinculado com sucesso!");
      setStudentToRemove(null);
      fetchStudents();
    } catch (error) {
      console.error("Error removing student:", error);
      toast.error("Erro ao desvincular aluno");
    } finally {
      setRemovingStudent(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Header title="Meus Alunos" />
        <div className="container mx-auto px-4 pt-28 py-8 pb-20">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (!isPersonal) {
    return null;
  }

  const totalPending = students.reduce(
    (sum, s) => sum + (s.stats?.pendingWorkouts || 0) + (s.stats?.pendingNutrition || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header title="Meus Alunos" />

      <div className="container mx-auto px-4 pt-28 py-8 pb-20 max-w-7xl space-y-6">
        {/* Header com estatísticas */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Alunos</h1>
            <p className="text-muted-foreground">
              {students.length} aluno{students.length !== 1 ? "s" : ""} cadastrado{students.length !== 1 ? "s" : ""}
              {totalPending > 0 && ` • ${totalPending} pendência${totalPending !== 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1 text-orange-600 border-orange-500/50">
              <Clock className="h-3 w-3" />
              {totalPending} Pendentes
            </Badge>
            <Button
              onClick={() => {
                setShowAddStudentDialog(true);
                fetchAvailableStudents();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Aluno
            </Button>
          </div>
        </div>

        {/* Barra de pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno por nome, objetivo ou nível..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de alunos */}
        {loading ? (
          <LoadingState />
        ) : filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {searchQuery ? "Nenhum aluno encontrado com esse critério de busca." : "Nenhum aluno cadastrado ainda."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => {
              const hasPending = (student.stats?.pendingWorkouts || 0) + (student.stats?.pendingNutrition || 0) > 0;

              return (
                <Card
                  key={student.user_id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    hasPending ? "border-orange-500/50 bg-orange-500/5" : ""
                  }`}
                  onClick={() => navigate(`/personal-students/${student.user_id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={student.avatar_url} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{student.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">
                            Desde {new Date(student.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </CardDescription>
                      </div>
                      {hasPending && (
                        <Badge variant="outline" className="gap-1 text-orange-600 border-orange-500/50 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          {(student.stats?.pendingWorkouts || 0) + (student.stats?.pendingNutrition || 0)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Informações do perfil */}
                    <div className="flex flex-wrap gap-2">
                      {student.goal && (
                        <Badge variant="secondary" className="text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {student.goal}
                        </Badge>
                      )}
                      {student.experience_level && (
                        <Badge variant="secondary" className="text-xs">
                          {student.experience_level}
                        </Badge>
                      )}
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Dumbbell className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-semibold">{student.stats?.totalWorkouts || 0}</p>
                          <p className="text-xs text-muted-foreground">Treinos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Apple className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-semibold">{student.stats?.totalNutrition || 0}</p>
                          <p className="text-xs text-muted-foreground">Dietas</p>
                        </div>
                      </div>
                    </div>

                    {/* Status de aprovações */}
                    {student.stats && (student.stats.totalWorkouts > 0 || student.stats.totalNutrition > 0) && (
                      <div className="flex gap-2 text-xs pt-2">
                        {student.stats.pendingWorkouts > 0 && (
                          <Badge variant="outline" className="gap-1 text-orange-600 border-orange-500/50">
                            <Clock className="h-3 w-3" />
                            {student.stats.pendingWorkouts} pendente{student.stats.pendingWorkouts !== 1 ? "s" : ""}
                          </Badge>
                        )}
                        {student.stats.approvedWorkouts > 0 && (
                          <Badge variant="outline" className="gap-1 text-green-600 border-green-500/50">
                            <CheckCircle className="h-3 w-3" />
                            {student.stats.approvedWorkouts}
                          </Badge>
                        )}
                        {student.stats.rejectedWorkouts > 0 && (
                          <Badge variant="outline" className="gap-1 text-red-600 border-red-500/50">
                            <XCircle className="h-3 w-3" />
                            {student.stats.rejectedWorkouts}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/personal-students/${student.user_id}`);
                        }}
                      >
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStudentToRemove(student);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog para adicionar aluno */}
      <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Aluno</DialogTitle>
            <DialogDescription>Selecione um aluno para vincular à sua lista</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {loadingAvailableStudents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum aluno disponível para vincular</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Aluno</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStudents.map((student) => (
                        <SelectItem key={student.user_id} value={student.user_id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={student.avatar_url} />
                              <AvatarFallback>
                                <User className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                            <span>{student.name}</span>
                            {student.goal && (
                              <Badge variant="secondary" className="text-xs">
                                {student.goal}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddStudentDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddStudent} disabled={addingStudent || !selectedStudentId}>
                    {addingStudent ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Vinculando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Vincular
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para remover aluno */}
      <AlertDialog open={!!studentToRemove} onOpenChange={(open) => !open && setStudentToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular Aluno</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desvincular <strong>{studentToRemove?.name}</strong>? Você não poderá mais criar
              treinos para este aluno.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingStudent}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveStudent}
              disabled={removingStudent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removingStudent ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Desvincular"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
